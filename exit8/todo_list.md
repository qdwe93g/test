# Exit 8 - TODO List

## Overview
This document tracks remaining tasks and incomplete items for the Exit 8 game implementation.

---

## ✅ Completed: Phase 1 - Core Game Engine Refactoring

### Stage A: Core state, input safety, and real tests

#### A1. Extract a DOM-free game engine
- [x] Created `exit8/js/game-engine.js` with pure game logic
- [x] No DOM, window, setTimeout, or CSS access in engine
- [x] Explicit state shape with phase, progress, encounter, previousAnomalyId, runId
- [x] Encounter represented as single object with id and anomalyId

#### A2. Apply specified game rules exactly
- [x] Progress starts at 0
- [x] Target is 8 consecutive correct choices
- [x] "Go Forward" means player believes corridor is normal
- [x] "Turn Back" means player detected an anomaly
- [x] Either correct direction increments progress by one
- [x] Wrong direction resets progress to 0
- [x] Victory occurs when correct choice raises progress from 7 to 8
- [x] One encounter changes progress at most once
- [x] Choice accepted only while phase === 'observing'

#### A3. Replace four-action UI with two meaningful actions
- [x] Removed separate "No anomaly" and "Anomaly" controls from controller logic
- [x] Kept only "Go Forward" and "Turn Back" as meaningful actions
- [x] Note: HTML still has 4 buttons but controller uses only 2 direction actions

#### A4. Implement real transition lock
- [x] Phase changes to 'transitioning' synchronously before animation
- [x] Buttons disabled using real disabled property
- [x] Additional pointer/keyboard actions ignored during transitioning

#### A5. Own and cancel timers
- [x] Controller keeps all timer IDs in activeTimers array
- [x] cancelAllTimers() called on new run, menu return, reset
- [x] runId tracking implemented

#### A6. Inject randomness
- [x] RNG passed into encounter factory, not called directly from engine
- [x] Normal and anomalous encounters possible at any progress value
- [x] Same anomaly cannot appear in consecutive encounters
- [x] Tests can supply deterministic sequence

#### A7. Replace test harness
- [x] Created `exit8/tests/game-engine.test.js` with Node native test runner
- [x] Created `exit8/package.json` with `npm test` script
- [x] All 15 tests pass without DOM mocks
- [x] Removed old browser-based game.test.js

---

## 🔄 In Progress / Remaining Work

### Stage B: Keyboard correctness, accessibility, and responsive layout
- [ ] B1. Preserve native button keyboard behavior (Enter/Space on focused buttons)
- [ ] B2. Manage focus and inactive screens
- [ ] B3. Repair mobile layout (375x667, 390x844 viewport assertions)
- [ ] B4. Make reduced motion effective
- [ ] B5. Remove duplicate CSS definitions (.fade-in, @keyframes flicker, @keyframes glow)

### Stage C: Observation design, repository cleanup, and accurate documentation
- [ ] C1. Build stable normal scene with baseline objects
- [ ] C2. Reconcile anomaly registry and documentation (8 anomalies confirmed)
- [ ] C3. Create proper .gitignore in exit8/ directory
- [ ] C4. Update todo_list.md and READMEs with accurate completion status

---

## 📋 Notes

- Game engine is fully tested with 15 passing tests
- GameController handles DOM interaction separately from game logic
- Old game.js file exists but is no longer used by main.js
- Next priority: Stage B (keyboard, accessibility, responsive layout)

---

*Last Updated: 2026-08-04*
*Status: Phase 1 (Stage A) Complete ✅*
