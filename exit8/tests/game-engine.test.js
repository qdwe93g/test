/**
 * Exit 8 - Game Engine Tests
 * Node.js native test runner - no DOM required
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import {
  createInitialState,
  startRun,
  evaluateChoice,
  applyChoice,
  completeTransition,
  resetToMenu,
  getDisplayInfo
} from '../js/game-engine.js';
import { createEncounterFactory, ANOMALY_TYPES } from '../js/anomaly-registry.js';

describe('Game Engine', () => {
  describe('createInitialState', () => {
    it('should create initial state with progress 0', () => {
      const state = createInitialState();
      assert.strictEqual(state.phase, 'menu');
      assert.strictEqual(state.progress, 0);
      assert.strictEqual(state.targetProgress, 8);
      assert.strictEqual(state.encounter, null);
      assert.strictEqual(state.previousAnomalyId, null);
      assert.strictEqual(state.runId, 0);
    });
  });

  describe('startRun', () => {
    it('should start run with observing phase and increment runId', () => {
      const initialState = createInitialState();
      const factory = createEncounterFactory({ random: () => 0.3 });
      const newState = startRun(initialState, factory);
      
      assert.strictEqual(newState.phase, 'observing');
      assert.strictEqual(newState.progress, 0);
      assert.strictEqual(newState.runId, 1);
      assert.ok(newState.encounter !== null);
    });

    it('should generate first encounter on start', () => {
      const initialState = createInitialState();
      const factory = createEncounterFactory({ 
        random: () => 0.3,
        anomalyProbability: 1.0
      });
      const newState = startRun(initialState, factory);
      
      assert.ok(newState.encounter !== null);
      assert.ok(newState.encounter.id !== undefined);
    });
  });

  describe('evaluateChoice', () => {
    it('normal encounter + forward is correct', () => {
      const encounter = { id: 'e1', anomalyId: null };
      const result = evaluateChoice(encounter, 'forward');
      assert.strictEqual(result.correct, true);
      assert.strictEqual(result.reason, 'correct_normal_forward');
    });

    it('normal encounter + back is wrong', () => {
      const encounter = { id: 'e1', anomalyId: null };
      const result = evaluateChoice(encounter, 'back');
      assert.strictEqual(result.correct, false);
      assert.strictEqual(result.reason, 'wrong_normal_back');
    });

    it('anomaly encounter + back is correct', () => {
      const encounter = { id: 'e1', anomalyId: 'poster' };
      const result = evaluateChoice(encounter, 'back');
      assert.strictEqual(result.correct, true);
      assert.strictEqual(result.reason, 'correct_anomaly_back');
    });

    it('anomaly encounter + forward is wrong', () => {
      const encounter = { id: 'e1', anomalyId: 'poster' };
      const result = evaluateChoice(encounter, 'forward');
      assert.strictEqual(result.correct, false);
      assert.strictEqual(result.reason, 'wrong_anomaly_forward');
    });
  });

  describe('applyChoice', () => {
    it('correct normal forward increments progress once', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      // Force normal encounter
      state.encounter = { id: 'e1', anomalyId: null };
      
      const { newState, result } = applyChoice(state, 'forward');
      assert.strictEqual(result, 'correct');
      assert.strictEqual(newState.progress, 1);
      assert.strictEqual(newState.phase, 'transitioning');
    });

    it('correct anomaly back increments progress once', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.9, anomalyProbability: 1.0 }));
      state.encounter = { id: 'e1', anomalyId: 'poster' };
      
      const { newState, result } = applyChoice(state, 'back');
      assert.strictEqual(result, 'correct');
      assert.strictEqual(newState.progress, 1);
      assert.strictEqual(newState.phase, 'transitioning');
    });

    it('wrong choice resets progress to zero', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      state.encounter = { id: 'e1', anomalyId: null };
      state.progress = 3;
      
      const { newState, result } = applyChoice(state, 'back');
      assert.strictEqual(result, 'wrong');
      assert.strictEqual(newState.progress, 0);
    });

    it('action during transitioning is ignored', () => {
      let state = createInitialState();
      state.phase = 'transitioning';
      state.encounter = { id: 'e1', anomalyId: null };
      
      const { newState, result } = applyChoice(state, 'forward');
      assert.strictEqual(result, 'ignored');
      assert.strictEqual(newState.progress, state.progress);
    });

    it('action during menu is ignored', () => {
      let state = createInitialState();
      state.encounter = { id: 'e1', anomalyId: null };
      
      const { newState, result } = applyChoice(state, 'forward');
      assert.strictEqual(result, 'ignored');
    });

    it('progress 7 plus correct normal reaches victory', () => {
      let state = createInitialState();
      state.phase = 'observing';
      state.progress = 7;
      state.encounter = { id: 'e1', anomalyId: null };
      
      const { newState, result } = applyChoice(state, 'forward');
      assert.strictEqual(result, 'victory');
      assert.strictEqual(newState.phase, 'victory');
      assert.strictEqual(newState.progress, 8);
    });

    it('progress 7 plus correct anomaly reaches victory', () => {
      let state = createInitialState();
      state.phase = 'observing';
      state.progress = 7;
      state.encounter = { id: 'e1', anomalyId: 'poster' };
      
      const { newState, result } = applyChoice(state, 'back');
      assert.strictEqual(result, 'victory');
      assert.strictEqual(newState.phase, 'victory');
      assert.strictEqual(newState.progress, 8);
    });

    it('ten rapid actions affect progress once', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      state.encounter = { id: 'e1', anomalyId: null };
      
      // First action
      let result = applyChoice(state, 'forward');
      assert.strictEqual(result.result, 'correct');
      assert.strictEqual(result.newState.progress, 1);
      
      // Subsequent actions while transitioning should be ignored
      for (let i = 0; i < 9; i++) {
        result = applyChoice(result.newState, 'forward');
        assert.strictEqual(result.result, 'ignored');
        assert.strictEqual(result.newState.progress, 1);
      }
    });
  });

  describe('completeTransition', () => {
    it('should return to observing phase with new encounter', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      state.phase = 'transitioning';
      state.progress = 1;
      
      const factory = createEncounterFactory({ random: () => 0.1 });
      const newState = completeTransition(state, factory);
      
      assert.strictEqual(newState.phase, 'observing');
      assert.ok(newState.encounter !== null);
    });

    it('should not change victory state', () => {
      let state = createInitialState();
      state.phase = 'victory';
      state.progress = 8;
      
      const newState = completeTransition(state, null);
      
      assert.strictEqual(newState.phase, 'victory');
      assert.strictEqual(newState.progress, 8);
    });
  });

  describe('resetToMenu', () => {
    it('should reset to menu and increment runId', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      state.progress = 5;
      
      const newState = resetToMenu(state);
      
      assert.strictEqual(newState.phase, 'menu');
      assert.strictEqual(newState.progress, 0);
      assert.strictEqual(newState.runId, state.runId + 1);
    });
  });

  describe('encounter factory', () => {
    it('deterministic sequence follows supplied sequence', () => {
      const factory = createEncounterFactory();
      factory.setSequence(['poster', null, 'light', null]);
      
      const e1 = factory.generate();
      assert.strictEqual(e1.anomalyId, 'poster');
      
      const e2 = factory.generate();
      assert.strictEqual(e2.anomalyId, null);
      
      const e3 = factory.generate();
      assert.strictEqual(e3.anomalyId, 'light');
      
      const e4 = factory.generate();
      assert.strictEqual(e4.anomalyId, null);
    });

    it('consecutive identical anomalies are prevented', () => {
      const seenPairs = new Set();
      const factory = createEncounterFactory({ 
        random: () => 0.5,
        anomalyProbability: 1.0,
        anomalyIds: ['poster', 'light', 'floor']
      });
      
      let previous = null;
      for (let i = 0; i < 20; i++) {
        const encounter = factory.generate();
        if (previous !== null && encounter.anomalyId !== null) {
          assert.notStrictEqual(encounter.anomalyId, previous);
        }
        previous = encounter.anomalyId;
      }
    });

    it('both normal and anomalous encounters are possible', () => {
      // Use a sequence that guarantees both types
      const factory = createEncounterFactory();
      factory.setSequence([null, 'poster', null, 'light']);
      
      const results = [];
      for (let i = 0; i < 4; i++) {
        results.push(factory.generate().anomalyId === null ? 'normal' : 'anomaly');
      }
      
      const hasNormal = results.includes('normal');
      const hasAnomaly = results.includes('anomaly');
      assert.ok(hasNormal, 'Should have at least one normal encounter');
      assert.ok(hasAnomaly, 'Should have at least one anomaly encounter');
    });
  });

  describe('getDisplayInfo', () => {
    it('should return display info', () => {
      let state = createInitialState();
      state = startRun(state, createEncounterFactory({ random: () => 0.1 }));
      
      const info = getDisplayInfo(state);
      assert.strictEqual(info.phase, 'observing');
      assert.strictEqual(info.progress, 0);
      assert.strictEqual(info.targetProgress, 8);
      assert.ok(info.encounterId !== null);
    });
  });
});
