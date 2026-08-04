# Exit 8 Mockup: Code Review and Qwen Coder Implementation Guide

> Audience: Qwen Coder or another coding agent working in this repository
> Reviewed revision: `f676545` on `main`
> Review date: 2026-08-04
> Application root: `exit8/`

## 1. Executive summary

The repository contains a visually working static HTML/CSS/JavaScript prototype, but it is not yet a complete playable game. The menu loads, the corridor renders, and the buttons respond. However, the current progression rules make a legitimate victory impossible.

The highest-priority defect is in `exit8/js/game.js`: round 2 always contains the `poster` anomaly, and a correct anomaly judgment reloads the same round with the same anomaly. The player therefore remains in round 2 forever. The same structural problem would also prevent victory in round 8, because victory is only checked after a correct normal judgment while round 8 is always anomalous.

The best path is to preserve the current visual prototype while replacing the game loop with a small, testable state machine. Do not start by adding more anomaly graphics. First make the core loop coherent, deterministic under test, and safe from repeated input.

## 2. Current project map

| Path | Current responsibility | Review note |
| --- | --- | --- |
| `exit8/index.html` | Four screens and all game controls | Loads and is valid, but presents two competing control models. |
| `exit8/css/style.css` | Layout, colors, corridor, responsive rules | Reasonable prototype styling; fixed dimensions and missing accessibility states need work. |
| `exit8/css/animations.css` | Movement and effect animations | Contains useful effects, but duplicates some keyframe/class definitions from `style.css`. |
| `exit8/js/main.js` | Creates and initializes `Game` | Small and acceptable, but relies on globals and script ordering. |
| `exit8/js/game.js` | DOM wiring, state, rules, timers, anomaly catalog | Too many responsibilities; contains the blocking progression and input-race defects. |
| `exit8/js/renderer.js` | Corridor and anomaly rendering | Duplicates round/anomaly configuration and uses many inline styles. |
| `exit8/README.md` | User-facing project documentation | Describes features and rules more completely than the implementation supports. |
| `exit8/plan.md` | Original development plan | Useful as historical intent, but its fixed-round rule is internally incompatible with the current implementation. |
| `readme.md` | Repository landing page | Placeholder-quality and does not describe development or verification. |

There is currently no package manifest, automated test suite, linter, formatter configuration, or repeatable smoke-test command.

## 3. Verified baseline

The following observations were verified against the current checkout rather than inferred only from comments:

- `node --check` passes for all three JavaScript files.
- The game loads in a local browser without initial console errors.
- The menu, anomaly list, and game screen are reachable.
- A correct normal judgment advances from round 1 to round 2.
- Round 2 renders one poster anomaly.
- A correct anomaly judgment in round 2 leaves the player in round 2 and renders the same poster again.
- There are no automated tests capable of detecting this regression.

Minimal reproduction:

1. Serve `exit8/` over HTTP.
2. Click **Game Start**.
3. In round 1, choose **No anomaly**.
4. In round 2, choose **Anomaly**.
5. Observe that the game reloads round 2 with the same poster and never advances.

## 4. Findings and required changes

### P0-1: The game cannot be won through correct play

Evidence:

- `exit8/js/game.js:32-36` makes round 2 permanently anomalous.
- `exit8/js/game.js:336-342` reloads the current round after a correct anomaly judgment.
- Only the normal branch increments `currentRound` at `exit8/js/game.js:343-355`.
- Victory is only checked in that normal branch, while round 8 is permanently anomalous.

Required change:

Replace the fixed round-to-answer mapping with an encounter model. A correct choice must always advance progress, regardless of whether the encounter was normal or anomalous. A new encounter must then be generated.

Use this rule set for the first reliable version:

1. Progress starts at `0` and the target is `8` consecutive correct choices.
2. Every encounter is either normal or contains exactly one implemented anomaly.
3. **Go forward** means the player believes the corridor is normal.
4. **Turn back** means the player detected an anomaly.
5. Either correct choice increments progress by exactly one and generates a new encounter.
6. A wrong choice resets progress to `0` and generates a new encounter. If the product owner prefers a one-mistake game-over screen, make that a named rule option rather than mixing both behaviors.
7. Reaching progress `8` produces victory after either kind of correct choice.

### P0-2: Repeated input can corrupt state and schedule conflicting transitions

Evidence:

- `playerJudgment` is set back to `null` immediately at `exit8/js/game.js:365`, before the 1.5 second transition finishes.
- Buttons and keyboard input remain enabled during the transition.
- Multiple `setTimeout` callbacks can therefore act on state that has already changed.
- Movement methods also create timers without cancellation.

Impact:

Rapid clicking can skip encounters, produce incorrect judgments against stale `hasAnomaly` state, overwrite messages, or switch screens after a restart.

Required change:

- Add an explicit phase such as `menu`, `observing`, `transitioning`, and `result`.
- Accept a choice only in the `observing` phase.
- Enter `transitioning` synchronously before starting an animation or timer.
- Disable both choice buttons during a transition and expose `aria-disabled`/`disabled` correctly.
- Keep all timer IDs in one owned collection and cancel them in `startGame`, `showMenu`, and `reset`.
- Do not unlock input until the new encounter is fully loaded.

### P1-1: The UI exposes two contradictory action models

The instructions tell the player to go forward when the corridor is normal and turn back when it is anomalous. The screen then provides four buttons:

- **Back** and **Forward** only play animations; they do not affect game state.
- **No anomaly** and **Anomaly** make the actual decision.

Keyboard controls have the same split: arrow/A/D keys animate movement, while Enter/Space and Escape/X submit judgments.

Required change:

Use only two primary actions in the game screen: **Go forward** and **Turn back**. Each action should animate and then submit its corresponding decision through the same code path. Remove the separate judgment controls. This is simpler, matches the displayed rules, and avoids divergent mouse and keyboard behavior.

### P1-2: Game data is duplicated and can drift

`Game.initializeRoundConfig()` stores `hasAnomaly` and `anomalyType`, while `Renderer.getRoundConfig()` separately maps rounds to anomaly types. The catalog in `Game.initAnomalyList()` is a third data source.

Required change:

Create one anomaly registry. Each implemented anomaly should have at least:

```js
{
  id: 'poster-exit-number',
  name: 'Changed poster exit number',
  description: 'The poster says EXIT 9 instead of EXIT 8.',
  difficulty: 1,
  renderKey: 'posterExitNumber'
}
```

The game engine selects an anomaly ID, the renderer renders that ID, and the catalog reads from the same registry. Never infer anomaly type from a progress number.

### P1-3: Encounters are predictable and status text reveals the answer

The same rounds always contain the same anomalies. Messages such as “Look carefully at the poster” disclose exactly where to inspect. In addition, `Renderer.applyRoundVariation()` changes the corridor hue on every round, even when the corridor is supposed to be normal.

Required change:

- Generate encounters independently from progress.
- Use a controlled anomaly probability, such as 50%, while preventing long all-normal or all-anomaly streaks.
- Prevent the exact same anomaly from appearing twice in a row.
- Inject or seed randomness so tests can reproduce a sequence.
- Keep in-game status text neutral, for example: “Observe the corridor and choose a direction.”
- Keep the normal corridor visually invariant. Difficulty should come from anomaly design, not unexplained per-round hue changes.

### P1-4: Most anomalies have no normal reference object

The normal corridor is mostly empty. On anomalous rounds, a poster, sign, stain, or silhouette simply appears. A player does not compare a changed object with a remembered baseline; they only notice that a new object exists. This removes the central observation mechanic.

Required change:

Build a stable normal scene first. It should always contain the same identifiable objects, for example:

- an EXIT 8 sign pointing right;
- a blue advertisement poster;
- three ceiling lights with stable spacing;
- a consistent tile pattern;
- a closed maintenance door;
- one wall clock showing a baseline time.

An anomaly should mutate one normal object, not create an unrelated decoration. Examples: EXIT 8 becomes EXIT 9, one arrow reverses, a light disappears, one tile rotates, the clock hands move backward, or the maintenance door opens.

### P1-5: The anomaly catalog promises content that is not implemented

The catalog lists ten anomaly types, but the renderer implements only five: `poster`, `light`, `floor`, `sign`, and `shadow`. Some catalog descriptions do not precisely match the rendered anomaly.

Required change:

Generate the catalog from the implemented anomaly registry. Either hide unimplemented entries or label them explicitly as planned. A better game design is to show only discovered anomalies so the catalog does not spoil every answer before play.

### P1-6: Rendering and game rules are tightly coupled to DOM globals

The current classes use `window.game`, `window.renderer`, duplicated `DOMContentLoaded` listeners, and implicit script ordering. This makes logic testing unnecessarily difficult.

Required change:

Separate pure rules from browser control:

```text
exit8/
  index.html
  js/
    main.js             # Composition root and startup only
    game-engine.js      # Pure state transitions; no DOM access
    game-controller.js  # Events, timers, screen updates
    anomaly-data.js     # Single anomaly registry
    renderer.js         # Scene rendering only
  tests/
    game-engine.test.js
```

Use browser ES modules and explicit imports. Avoid adding a framework for this small prototype unless requirements grow substantially.

### P2-1: Accessibility and keyboard behavior need a defined contract

Required change:

- Add a visible `:focus-visible` style to every interactive control.
- Put status updates in an `aria-live="polite"` region.
- Move focus to the primary heading when screens change.
- Prevent default browser behavior for handled Space and arrow keys.
- Ignore gameplay shortcuts when focus is inside an interactive or editable element.
- Add `aria-hidden="true"` to decorative emoji where appropriate, or provide meaningful labels.
- Respect `prefers-reduced-motion` by disabling nonessential animations.
- Verify readable contrast, especially gray status text and gradient text.

### P2-2: Layout and styling need consolidation

Required change:

- Replace the fixed `800px × 500px` corridor with an aspect-ratio-based container bounded by viewport width and available height.
- Test at desktop and at approximately `390px × 844px` mobile size.
- Allow vertical scrolling on short screens instead of globally forcing `body { overflow: hidden; }` everywhere.
- Move anomaly inline styles from JavaScript into named CSS classes.
- Define each keyframe only once; `fadeIn` and `slideIn` currently exist in more than one stylesheet.
- Add a reduced-motion media query.

### P2-3: Documentation overstates completeness

The project README claims eight anomalies, complete mobile support, smooth performance, and a playable eight-round loop. Those claims are not supported by the current implementation. The root README is also only a placeholder.

Required change:

After behavior is fixed, update documentation to include:

- the exact game rules;
- implemented anomaly count;
- supported input methods;
- local serve command;
- automated test command;
- GitHub Pages deployment path;
- known limitations;
- a short architecture overview.

Keep all files UTF-8 and preserve the Korean user-facing copy unless a product change explicitly requests another language.

## 5. Target game-engine contract

Keep the engine independent of the DOM. A suitable minimal state shape is:

```js
{
  phase: 'menu', // menu | observing | transitioning | victory
  progress: 0,
  targetProgress: 8,
  encounter: null, // { id, anomalyId: null | string }
  previousAnomalyId: null,
  runId: 0
}
```

Recommended pure operations:

```js
createInitialState()
startRun(state, encounterFactory)
evaluateChoice(encounter, direction)
applyChoice(state, direction)
completeTransition(state, nextEncounter)
```

Important invariants:

- `0 <= progress <= targetProgress`.
- A choice changes progress at most once.
- A choice is accepted only in `observing`.
- `encounter.anomalyId === null` means normal; no parallel `hasAnomaly` flag is needed.
- Victory depends only on reaching the target, not on whether the last encounter was normal.
- The renderer receives an encounter object and never decides game rules.
- The engine never calls `document`, `window`, `setTimeout`, or animation APIs.

## 6. Implementation sequence

Do not combine all phases into one large rewrite. Finish and verify each phase before starting the next.

### Phase 1: Repair and test the core loop

Deliverables:

1. Extract pure progression logic into `game-engine.js`.
2. Replace four gameplay actions with two direction actions.
3. Add a transition lock and owned timer cleanup.
4. Make both correct directions advance exactly once.
5. Make reaching eight correct choices trigger victory.
6. Add dependency-free unit tests with Node's built-in test runner.
7. Keep the existing five visual anomalies for now.

Suggested minimal `package.json`:

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

Required unit cases:

- normal encounter + forward is correct;
- normal encounter + back is wrong;
- anomaly encounter + back is correct;
- anomaly encounter + forward is wrong;
- either correct choice increments progress once;
- a second choice during transition is ignored;
- a wrong choice follows the chosen reset/game-over rule;
- progress 7 plus either correct choice produces victory;
- a new run resets all state and invalidates old callbacks.

### Phase 2: Create a fair, data-driven scene

Deliverables:

1. Add a stable normal corridor with reference objects.
2. Consolidate anomaly metadata into one registry.
3. Convert the five current effects into mutations of normal objects.
4. Remove round-number lookup from the renderer.
5. Add reproducible encounter generation with injectable randomness.
6. Generate the catalog from the registry.

Do not add new anomalies until every existing anomaly has a clear normal counterpart and is testable by ID.

### Phase 3: Improve UX, accessibility, and responsive behavior

Deliverables:

1. Neutral status messages that do not reveal answers.
2. Keyboard and pointer parity through the same action functions.
3. Focus management, live-region announcements, and visible focus states.
4. Reduced-motion behavior.
5. Desktop and mobile layout verification.
6. Removal of duplicated CSS and JavaScript inline presentation.

### Phase 4: Align documentation and deployment

Deliverables:

1. Update both README files with accurate status and commands.
2. Convert `plan.md` from an unchecked original proposal into a roadmap or archive it clearly as historical.
3. Add a manual browser smoke-test checklist.
4. Verify that all paths remain relative and work under `/test/exit8/` on GitHub Pages.
5. Report remaining limitations honestly.

## 7. Coding rules for Qwen Coder

1. Read this guide and all files under `exit8/` before editing.
2. Run `git status --short` first. Preserve unrelated user changes.
3. Do not commit, push, open a pull request, or change deployment settings unless explicitly asked.
4. Do not rewrite the visual design during Phase 1.
5. Make the smallest coherent change for the active phase.
6. Keep rules, rendering, and DOM/timer control separate.
7. Use one source of truth for anomaly data.
8. Prefer pure functions for state changes and inject randomness.
9. Never use a timer as the only input lock.
10. Cancel owned timers whenever a run or screen is abandoned.
11. Keep Korean UI text valid UTF-8. Do not introduce mojibake.
12. Keep GitHub Pages compatibility: use relative imports and asset URLs.
13. Do not claim a feature is complete until its acceptance criteria pass.
14. After every phase, list changed files, commands run, observed results, and remaining risks.

## 8. Definition of done

### Core behavior

- A player can reach victory through eight correct choices.
- Correct forward and correct back choices both advance progress.
- One encounter can affect progress only once, even under rapid clicks or key presses.
- Restarting or returning to the menu prevents old callbacks from changing the new run.
- The displayed progress always matches engine state.
- The last encounter may be normal or anomalous and can still produce victory.

### Observation design

- A normal corridor is visually stable between encounters.
- Every implemented anomaly changes one known baseline object.
- Status text does not identify the changed object.
- The selected anomaly is not determined by progress number.
- The same anomaly is not repeated immediately.

### Quality

- Unit tests pass with `npm test`.
- JavaScript syntax checks pass.
- The browser console has no errors during the complete success path and one failure/reset path.
- The app works with mouse/touch and keyboard.
- The app remains usable on desktop and a narrow mobile viewport.
- Reduced-motion users can play without continuous flicker or movement.
- Direct serving of `exit8/` and GitHub Pages subpath serving both work.

## 9. Recommended first prompt for Qwen Coder

Copy and paste the following prompt from the repository root:

```text
You are improving the Exit 8 browser mockup in this repository.

Before editing anything:
1. Read QWEN_CODER_REVIEW_GUIDE.md completely.
2. Read every source file under exit8/.
3. Run git status --short and preserve unrelated changes.
4. Briefly restate the current blocking defects and your Phase 1 plan.

Implement ONLY Phase 1 from QWEN_CODER_REVIEW_GUIDE.md. Do not redesign the visuals and do not add new anomalies yet.

Required product rules for this phase:
- Progress starts at 0 and victory requires 8 consecutive correct choices.
- Go Forward means the corridor is normal.
- Turn Back means an anomaly was detected.
- Either correct choice advances progress by exactly one and loads a new encounter.
- A wrong choice resets progress to 0 and loads a new encounter.
- Victory must work whether the eighth correct encounter is normal or anomalous.
- Only one choice may be accepted per encounter.

Required engineering changes:
- Extract DOM-free progression logic into exit8/js/game-engine.js.
- Use an explicit phase/input lock so rapid clicks and key presses cannot schedule multiple transitions.
- Own and cancel all transition timers on restart, reset, and return to menu.
- Replace the four gameplay buttons with only Go Forward and Turn Back, and route pointer and keyboard input through the same two action methods.
- Keep the current renderer and five existing anomaly visuals working during this phase.
- Add package.json with a dependency-free Node test command and add unit tests for the cases listed in the guide.
- Preserve Korean UI text as UTF-8 and keep relative paths compatible with GitHub Pages under /test/exit8/.

Validation required before you finish:
- Run npm test.
- Run syntax checks on every JavaScript file.
- Serve exit8/ locally and manually verify: menu -> start -> correct normal -> correct anomaly -> wrong choice/reset -> restart -> eight-correct-choice victory.
- Check the browser console for errors.

At the end, report:
1. Files changed and why.
2. Exact commands run and their results.
3. Manual scenarios verified.
4. Any remaining risks or Phase 2 work.

Do not commit or push. If an important ambiguity conflicts with these rules, stop and explain it before editing instead of inventing a different game loop.
```

## 10. Follow-up prompts

Use these only after reviewing and accepting the previous phase.

### Phase 2 follow-up

```text
Read QWEN_CODER_REVIEW_GUIDE.md again and inspect the completed Phase 1 changes. Implement only Phase 2: create a stable normal corridor, consolidate the five implemented anomalies into one registry, render anomalies by ID rather than progress number, add injectable/reproducible encounter generation, and generate the catalog from the registry. Preserve the tested Phase 1 engine contract. Add or update tests, run all validation, and do not commit or push.
```

### Phase 3 follow-up

```text
Read QWEN_CODER_REVIEW_GUIDE.md and inspect the accepted Phase 1-2 implementation. Implement only Phase 3: neutral non-spoiler messaging, pointer/keyboard parity, focus management, an aria-live status region, visible focus states, reduced-motion support, responsive corridor sizing, and removal of duplicated CSS/inline anomaly presentation. Verify desktop and approximately 390x844 mobile layouts, run all tests, check console errors, and do not commit or push.
```

### Phase 4 follow-up

```text
Read QWEN_CODER_REVIEW_GUIDE.md and inspect the completed implementation. Implement only Phase 4: make both README files accurate, mark plan.md clearly as historical or convert it into a current roadmap, add local/test/deployment commands and a browser smoke checklist, and verify GitHub Pages compatibility under /test/exit8/. Do not claim unverified features. Run all validation and do not commit or push.
```

## 11. Final guidance

The current prototype is useful as a visual sketch, so preserve what already communicates the concept. The main engineering goal is not more code; it is a small set of explicit rules that cannot contradict the UI, renderer, or documentation. A tested state machine, one anomaly registry, and a stable normal scene will provide a much stronger base than adding effects to the current fixed-round structure.
