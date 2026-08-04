# Stage A Implementation Report: Core State, Input Safety, and Real Tests

## Executive Summary

This report documents the completion of **Stage A** of the Exit 8 game refactor. The implementation establishes a DOM-free game engine, enforces input safety rules, and provides a comprehensive native Node.js test suite. All 22 automated tests pass, validating the core game logic independent of browser APIs.

---

## 1. Current Defects Identified

Before implementation, the following critical defects were identified in the existing codebase:

| # | Defect | Impact |
|---|--------|--------|
| 1 | **No DOM-free game engine** | `game.js` directly manipulates DOM, preventing unit testing and separating concerns |
| 2 | **Four-button UI architecture** | Separate movement (`Back`/`Forward`) and judgment (`No anomaly`/`Anomaly`) buttons violate game rules |
| 3 | **No transition lock** | Input accepted during transitions; `playerJudgment` reset prematurely causing race conditions |
| 4 | **No timer ownership/cancellation** | Timers not tracked or cancelled on restart, causing memory leaks and erratic behavior |
| 5 | **Uncontrolled randomness** | Direct `Math.random()` calls from game logic prevent deterministic testing |
| 6 | **No real automated tests** | Existing `game.test.js` requires browser environment, cannot run via `npm test` |
| 7 | **Fixed round rules** | Round 1 forced normal, Round 8 forced anomalous—reveals game state to players |
| 8 | **Progression bug** | Wrong choice triggers immediate game over instead of resetting progress to 0 |

---

## 2. Implementation Plan (Stage A Only)

### Files Created

| File | Purpose |
|------|---------|
| `exit8/js/game-engine.js` | DOM-free state machine implementing all core game rules |
| `exit8/tests/game-engine.test.js` | Native Node.js test suite (22 tests) |
| `exit8/package.json` | Enables `npm test` with Node's built-in test runner |

### Files Modified

| File | Changes |
|------|---------|
| `exit8/js/anomaly-registry.js` | Added `createEncounterFactory()` with injectable RNG and deterministic sequence support |

### Files Deleted

| File | Reason |
|------|--------|
| `exit8/js/game.test.js` | Browser-dependent; incompatible with `npm test` |

---

## 3. Game Engine Architecture

### 3.1 Core Design Principles

- **DOM Independence**: Zero references to `document`, `window`, `setTimeout`, `setInterval`, CSS, or animations
- **Explicit Phases**: `menu` → `observing` → `transitioning` → `victory` (or reset)
- **Injectable Dependencies**: RNG and encounter factory injected externally for testability
- **Single Source of Truth**: `anomalyId` represents encounter state (`null` = normal, string ID = anomaly)

### 3.2 State Machine

```
[menu] 
   ↓ startGame()
[observing] ←─┐
   ↓ handleInput() │ (wrong choice)
[transitioning] ──┘ (reset to 0)
   ↓ (correct × 8)
[victory]
```

### 3.3 Key Rules Implemented

| Rule | Implementation |
|------|----------------|
| Progress starts at 0 | `this.progress = 0` in `startGame()` |
| Victory requires 8 consecutive correct choices | `if (this.progress >= 8) → victory` |
| Correct choice increments by exactly 1 | `this.progress++` only on valid input |
| Wrong choice resets to 0 | `this.progress = 0` + new encounter |
| Input only in `observing` phase | `if (this.phase !== 'observing') return false` |
| No separate `hasAnomaly` flag | `anomalyId !== null` determines anomaly presence |
| Prevents info leakage | Random anomaly generation; no fixed round rules |
| One progress change per encounter | Transition phase blocks additional input |

---

## 4. Test Suite Results

### 4.1 Execution Command

```bash
cd exit8 && npm test
```

### 4.2 Test Output

```
✔ Game Engine (22.779257ms)
ℹ tests 22
ℹ suites 9
ℹ pass 22
ℹ fail 0
```

### 4.3 Test Coverage

| Suite | Tests Covered |
|-------|---------------|
| Initialization | Progress=0, phase=menu, anomalyId=null |
| Start Game | Phase→observing, progress=0, encounter generated |
| Input Validation | Rejects input in menu/transitioning/victory phases |
| Normal Encounter | Forward=correct (+1), Back=wrong (reset) |
| Anomaly Encounter | Back=correct (+1), Forward=wrong (reset) |
| Victory Condition | 8 correct choices → victory phase |
| Reset on Wrong | Wrong choice resets progress to 0, new encounter |
| Deterministic Sequences | Injected RNG produces repeatable results |
| No Consecutive Anomalies | Factory prevents identical anomaly IDs |

---

## 5. Mandatory Game Rules Compliance

| Rule | Status | Evidence |
|------|--------|----------|
| Progress starts at 0 | ✅ | `testInitialization()` |
| Victory requires 8 consecutive correct | ✅ | `testVictoryAfterEightCorrect()` |
| `Go Forward` = believes normal | ✅ | Engine evaluates based on `anomalyId` |
| `Turn Back` = detected anomaly | ✅ | Engine evaluates based on `anomalyId` |
| Correct choice increments by 1 | ✅ | `testNormalEncounter_ForwardCorrect()`, `testAnomalyEncounter_BackCorrect()` |
| Wrong choice resets to 0 | ✅ | `testWrongChoice_ResetsProgress()` |
| Either path can produce victory | ✅ | `testVictoryViaNormalPath()`, `testVictoryViaAnomalyPath()` |
| One progress change per encounter | ✅ | Transition phase blocks input |
| Input only in `observing` | ✅ | `testInputRejectedInMenuPhase()`, `testInputRejectedInTransitioningPhase()` |
| No info leakage from progress | ✅ | Random anomaly generation, no fixed rounds |
| Round 1 not forced normal | ✅ | Factory allows anomaly on any round |
| Round 8 not forced anomalous | ✅ | Victory possible with 8 normal encounters |

---

## 6. Required Architecture Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Create `exit8/js/game-engine.js` | ✅ | 280 lines, fully DOM-free |
| Engine independent of DOM | ✅ | No `document`, `window`, timers, CSS |
| Represent encounter with `anomalyId` | ✅ | `null` = normal, string = anomaly |
| No separate `hasAnomaly` flag | ✅ | Derived from `anomalyId` |
| Explicit phases | ✅ | `menu`, `observing`, `transitioning`, `victory` |
| Separate rules from DOM/events | ✅ | Engine has zero DOM references |
| Inject RNG/factory | ✅ | Constructor accepts `encounterFactory` |
| No uncontrolled `Math.random()` | ✅ | All randomness injected |

---

## 7. Input Changes Status

| Change | Status | Notes |
|--------|--------|-------|
| Remove `No anomaly` / `Anomaly` buttons | ⏸️ **Stage B** | UI changes deferred to next stage |
| Keep only `Go Forward` / `Turn Back` | ⏸️ **Stage B** | HTML/controller updates deferred |
| Pointer/touch/keyboard support | ⏸️ **Stage B** | Event handling deferred |

**Note:** Stage A focuses exclusively on the **engine logic**. UI button restructuring will be completed in Stage B when the controller and renderer are updated to consume the new engine API.

---

## 8. Files Changed Summary

### Created
- `exit8/js/game-engine.js` (280 lines)
- `exit8/tests/game-engine.test.js` (312 lines)
- `exit8/package.json` (25 lines)

### Modified
- `exit8/js/anomaly-registry.js` (+48 lines for factory)

### Deleted
- `exit8/js/game.test.js` (browser-dependent)

---

## 9. Next Steps (Stage B)

Stage B will address:
1. **UI Button Restructuring**: Replace 4 buttons with 2 (`Go Forward`, `Turn Back`)
2. **Game Controller Integration**: Connect engine to DOM events
3. **Timer Ownership**: Track and cancel timers properly
4. **Transition Lock**: Visual feedback during transitioning phase
5. **Renderer Updates**: Display progress without revealing anomaly state

---

## 10. Conclusion

Stage A is **complete and verified**. The game engine:
- ✅ Is completely DOM-free
- ✅ Implements all mandatory game rules
- ✅ Passes 22/22 automated tests
- ✅ Supports deterministic testing via injected RNG
- ✅ Prevents information leakage
- ✅ Enforces input safety via phase locking

The foundation is now ready for Stage B integration with the DOM layer.
