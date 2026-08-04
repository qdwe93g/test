# Exit 8 Mockup: Second Review and Required Fix Request

> Primary audience: Qwen Coder implementing the next revision
> Reviewed revision: `c1f3fdf` on `main`
> Review date: 2026-08-04
> Application root: `exit8/`
> Previous specification: `QWEN_CODER_REVIEW_GUIDE.md`

## 1. Purpose

This document is the second implementation review. It evaluates the work completed after the first review and defines the remaining mandatory fixes.

The first blocking defect has been repaired: correct anomaly judgments now advance, and a legitimate eight-round victory was verified in a browser. The new anomaly registry, ES modules, neutral status message, CSS extraction, focus styling, and `aria-live` region are useful improvements.

However, the implementation is not complete. Several requirements from the first review were skipped or reinterpreted, and new documentation claims are stronger than the available evidence. Do not add another “all tasks completed” document. Implement and verify the requirements below first.

## 2. Verified current status

### Confirmed improvements

- The application loads without initial JavaScript console errors.
- Correct normal and correct anomaly judgments can both advance the round.
- A complete round 1 through round 8 success path reaches the victory screen.
- Eight anomaly IDs are defined in a central registry.
- The renderer reads anomaly definitions from that registry.
- The anomaly catalog is generated from registry data.
- Browser ES modules are used from `js/main.js`.
- Status text no longer directly identifies the anomalous object.
- `aria-live`, `:focus-visible`, and a reduced-motion rule were added.
- Most anomaly presentation moved from JavaScript into CSS classes.
- Syntax checks pass for the current JavaScript files.

### Confirmed remaining failures

- A second choice is accepted during the 1.5-second transition.
- The second choice can judge an encounter that the player has not seen yet.
- All choice buttons remain enabled during transitions.
- Pressing Enter on a focused **Anomaly** button submits **Normal** instead.
- `runTests()` is unavailable on the loaded application page.
- There is no `package.json` or repeatable `npm test` command.
- Forced execution of `game.test.js` reports 9 passing tests and 1 failing test.
- The failing victory test accesses missing DOM state through `updateStatus()`.
- The `375x667` and `390x844` layouts overflow horizontally.
- At `375x667`, the game view measured 520px wide and the corridor measured 480px wide.
- Normal corridors still lack stable reference objects that anomalies can mutate.
- Documentation contradicts itself about whether five or eight anomalies are implemented.
- `.gitignore` contains literal Markdown code fences.
- Duplicate animation/class definitions remain despite documentation claiming cleanup is complete.

## 3. Mandatory remediation work

Implement the following work in order. Complete and verify one stage before beginning the next.

### Stage A: Core state, input safety, and real tests

#### A1. Extract a DOM-free game engine

Create `exit8/js/game-engine.js`. It must own progression rules but must not access:

- `document`;
- `window`;
- DOM elements;
- `setTimeout` or `setInterval`;
- CSS classes or animations.

Use an explicit state shape similar to:

```js
{
  phase: 'menu', // menu | observing | transitioning | victory
  progress: 0,
  targetProgress: 8,
  encounter: null,
  previousAnomalyId: null,
  runId: 0
}
```

An encounter should be represented by one object:

```js
{
  id: 'encounter-4',
  anomalyId: null // null means normal; otherwise use a registry ID
}
```

Do not keep both `hasAnomaly` and `anomalyId`; that creates contradictory state.

#### A2. Apply the specified game rules exactly

These rules are mandatory for this revision:

1. Progress starts at `0`.
2. The target is `8` consecutive correct choices.
3. **Go Forward** means the player believes the corridor is normal.
4. **Turn Back** means the player detected an anomaly.
5. Either correct direction increments progress by exactly one.
6. A wrong direction resets progress to `0` and begins a new encounter.
7. Victory occurs when either kind of correct choice raises progress from `7` to `8`.
8. One encounter may change progress at most once.
9. A choice is accepted only while `phase === 'observing'`.
10. Progress is independent of anomaly type and encounter sequence.

Do not restore fixed “round 1 normal” or “round 8 always anomalous” rules. Those rules make progress reveal information and are not part of this requested design.

#### A3. Replace the four-action UI with two meaningful actions

The current UI still separates movement buttons from judgment buttons. Remove the separate **No anomaly** and **Anomaly** controls.

Keep only:

- **Go Forward**: animate forward, then submit the normal decision;
- **Turn Back**: animate backward, then submit the anomaly decision.

Pointer, touch, and keyboard input must call the same two controller methods. Do not maintain parallel input paths with different rules.

#### A4. Implement a real transition lock

Before starting any animation or timer:

1. Change the phase from `observing` to `transitioning` synchronously.
2. Disable both direction buttons using the real `disabled` property.
3. Ignore any additional pointer or keyboard actions.
4. Complete the state transition once.
5. Render the next encounter.
6. Re-enable input only after the new encounter is visible and phase returns to `observing`.

Do not use `playerJudgment = null` as an input lock. The current implementation resets it too early.

#### A5. Own and cancel timers

The controller must keep all timer IDs that it creates. Add one cleanup method and call it when:

- a new run starts;
- the player returns to the menu;
- the game is reset;
- a screen is abandoned;
- the controller is destroyed or reinitialized.

Old callbacks must not update status, progress, buttons, or screens in a new run. Consider using a monotonically increasing `runId` in addition to timer cancellation.

#### A6. Inject randomness

Do not call `Math.random()` directly from engine rules. Pass an RNG or encounter factory into the engine.

Required encounter constraints:

- normal and anomalous encounters are both possible at any progress value;
- the exact same anomaly cannot appear in consecutive encounters;
- tests can supply a deterministic sequence;
- tests never depend on two random results being different.

#### A7. Replace the current test harness

The current `game.test.js` is not an automated test suite. Replace it with dependency-free Node tests.

Recommended structure:

```text
exit8/
  package.json
  js/
    game-engine.js
    game-controller.js
    anomaly-registry.js
    renderer.js
    main.js
  tests/
    game-engine.test.js
```

Use Node's built-in test runner:

```json
{
  "name": "exit8-browser-mockup",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

`cd exit8 && npm test` must execute without opening a browser and must return a nonzero exit code on failure.

Required automated cases:

- normal encounter plus forward is correct;
- normal encounter plus back is wrong;
- anomaly encounter plus back is correct;
- anomaly encounter plus forward is wrong;
- either correct action increments once;
- an action during `transitioning` is ignored;
- ten rapid actions affect progress once;
- a wrong action resets progress to zero;
- progress 7 plus correct normal reaches victory;
- progress 7 plus correct anomaly reaches victory;
- restarting invalidates old callbacks/state;
- deterministic encounter generation follows the supplied sequence;
- consecutive identical anomalies are prevented.

Remove any test that asserts two uncontrolled random runs must differ.

### Stage B: Keyboard correctness, accessibility, and responsive layout

#### B1. Preserve native button keyboard behavior

The document-level key handler must not reinterpret Enter or Space when focus is on a button, link, input, select, textarea, or editable element.

Mandatory behavior:

- Enter on focused **Go Forward** activates forward.
- Enter on focused **Turn Back** activates back.
- Space on a focused button activates that button only once.
- Global shortcuts are ignored when an interactive/editable element owns focus.
- Handled arrow/A/D shortcuts call the same direction methods as pointer input.
- `preventDefault()` is used only for a shortcut that the application actually handles.

Add automated pure-controller tests where practical and include these cases in the browser smoke checklist.

#### B2. Manage focus and inactive screens

- Move focus to the primary heading when switching screens, or use another documented focus target.
- Ensure inactive screens are not exposed as interactive content.
- Keep status announcements concise in the polite live region.
- Keep visible `:focus-visible` styles.
- Do not use `aria-label` text that conflicts with the visible button meaning.

#### B3. Repair the mobile layout

The current game screen inherits centered cross-axis sizing from `.screen.active`, causing intrinsic content width to exceed the viewport.

At minimum, evaluate and apply appropriate equivalents of:

```css
#game-screen {
  align-items: stretch;
}

.game-header,
.game-view,
.game-controls {
  width: 100%;
  min-width: 0;
}

.corridor {
  width: min(100%, 800px);
  height: auto;
  aspect-ratio: 8 / 5;
}
```

Remove the mobile `height: 300px` override that conflicts with the corridor aspect ratio. Scale fixed child geometry so it cannot force the flex item beyond the viewport.

Required viewport assertions at `375x667` and `390x844`:

- no game element has `left < 0` or `right > viewport width`, except intentional visual effects clipped inside the corridor;
- the corridor width is no greater than the viewport width minus intended padding;
- direction controls remain fully visible and usable;
- header text does not overlap or clip;
- the normal page does not require horizontal scrolling;
- short-height content can scroll vertically instead of being hidden by global `overflow: hidden`.

#### B4. Make reduced motion effective

`anomaly-renders.css` currently uses `animation: ... !important`, which can override the earlier reduced-motion longhand declarations.

- Remove unnecessary `!important` declarations.
- Put a final reduced-motion override after all animation styles, or use sufficient specificity.
- Verify that flicker, eye glow, continuous shadow motion, and corridor movement stop or reduce appropriately.

#### B5. Remove duplicate CSS definitions

The following remain duplicated:

- `.fade-in`;
- `@keyframes flicker`;
- `@keyframes glow`.

Define every utility class and keyframe once. Do not mark this item complete based only on a text search for `.hidden`.

### Stage C: Observation design, repository cleanup, and accurate documentation

#### C1. Build a stable normal scene

The anomaly registry contains `normalDescription`, but those descriptions are not represented by visible normal objects.

Create stable baseline objects that appear on every encounter, for example:

- an EXIT 8 sign pointing right;
- one normal advertisement poster;
- a closed maintenance door;
- a fixed ceiling-light arrangement;
- a consistent tile pattern;
- an empty corridor endpoint.

Each anomaly must mutate or augment one known baseline. Avoid presenting anomalies only as unrelated new overlays in an otherwise empty corridor.

The renderer should receive an encounter and render the same baseline first, then apply one anomaly mutation by ID.

#### C2. Reconcile the anomaly registry and documentation

The current registry contains eight renderable anomaly entries, while README sections claim both five and eight.

- Determine the actual implemented count from the registry and renderer.
- Verify every registry entry visually before calling it implemented.
- Generate the catalog from the same registry.
- State one consistent implemented count in both README files.
- Do not describe unverified or planned content as implemented.

#### C3. Repair `.gitignore`

Remove the literal opening and closing Markdown code fences from `.gitignore`. Restore useful ignore patterns that were unintentionally removed unless there is a documented reason to remove them.

The file must contain ignore patterns only, not a fenced Markdown snippet.

#### C4. Correct completion documents

Update or remove `exit8/todo_list.md` so it reflects evidence rather than declarations.

Do not use “All Tasks Completed” while any required automated test, viewport assertion, keyboard scenario, or core rule is failing. A manual checklist with unchecked boxes is not proof of completion.

Update the READMEs only after validation. The documentation must include:

- exact two-direction game rules;
- the real implemented anomaly count;
- `cd exit8 && npm test`;
- a local HTTP serve command;
- keyboard behavior;
- known limitations;
- a checked smoke-test record with date and tested commit, if completion is claimed.

## 4. Required validation procedure

Run all of the following after implementation.

### Static and automated checks

```powershell
git diff --check
node --check exit8/js/game-engine.js
node --check exit8/js/game-controller.js
node --check exit8/js/anomaly-registry.js
node --check exit8/js/renderer.js
node --check exit8/js/main.js
Set-Location exit8
npm test
```

Adjust filenames only if the final architecture has an equally clear separation. Do not omit the engine/controller split without explaining and obtaining approval first.

### Browser smoke scenarios

1. Load the menu and confirm there are no console errors.
2. Start a run and verify progress begins at `0 / 8`.
3. Complete a correct normal-forward encounter.
4. Complete a correct anomaly-back encounter.
5. Rapidly click or press a direction ten times; progress must change once.
6. Make a wrong choice; progress must reset to `0` without stale callbacks.
7. Restart during or immediately after a transition; the new run must remain stable.
8. Reach victory with a normal eighth correct encounter.
9. Reach victory with an anomalous eighth correct encounter.
10. Focus each direction button and activate it with Enter and Space.
11. Verify no horizontal overflow at `375x667` and `390x844`.
12. Enable reduced motion and verify continuous animations are removed or reduced.
13. Open the anomaly catalog and verify it matches the registry and rendered content.

## 5. Definition of done

The work is complete only when all statements below are supported by command output or observed browser state:

- `npm test` exists, runs, and passes.
- The engine tests do not require DOM mocks.
- A transition accepts one decision only.
- Buttons are disabled during transition.
- Old timers cannot mutate a new run.
- Only two direction actions are shown.
- Keyboard behavior matches focused button meaning.
- Progress begins at zero and wrong input resets it to zero.
- Either kind of eighth correct action can win.
- Randomness is injectable and tests are deterministic.
- Normal reference objects exist and anomalies change those references.
- Mobile layouts fit the specified viewports.
- Reduced-motion behavior works despite CSS cascade order.
- CSS definitions are not duplicated.
- `.gitignore` contains no Markdown fences.
- README and TODO claims match the tested implementation.
- The browser console stays free of errors through success, reset, restart, and catalog paths.

## 6. Work discipline for Qwen Coder

1. Read this entire file and `QWEN_CODER_REVIEW_GUIDE.md` before editing.
2. Inspect the actual current files; do not rely on TODO completion claims.
3. Run `git status --short` and preserve unrelated changes.
4. Write a short stage plan before changing code.
5. Implement Stage A first and provide test output before Stage B.
6. Do not combine architectural changes, visual redesign, and documentation rewriting in one unreviewed patch.
7. Do not add new anomaly types until the baseline scene and current types are correct.
8. Do not claim visual verification unless the specified viewport and interaction were actually checked.
9. Do not create another completion checklist filled from assumptions.
10. Do not commit, push, merge, or change deployment configuration unless explicitly instructed.

## 7. Required final report from Qwen Coder

At the end of each stage, report:

1. Files changed and the reason for each file.
2. Rules or invariants implemented.
3. Exact commands executed.
4. Complete test summary, including counts.
5. Browser scenarios actually performed.
6. Viewport dimensions actually tested.
7. Any remaining failures, skipped work, or uncertainty.
8. The current `git status --short` output.

If any required check fails, report the work as incomplete. Do not convert a failure into a “known limitation” merely to mark the stage complete.

## 8. Recommended implementation prompt

Use the Korean operator guide in `QWEN_CODER_TASK_GUIDE_KO.md` to issue staged prompts. Do not ask Qwen Coder to complete all three stages in a single unreviewed turn. The next task should be Stage A only.
