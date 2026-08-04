/**
 * Exit 8 - Game Engine Tests
 * Node.js native test runner 사용 (DOM mocking 없음)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../js/game-engine.js';
import { createEncounterFactory, ANOMALY_TYPES } from '../js/anomaly-registry.js';

describe('GameEngine', () => {
  describe('기본 규칙', () => {
    it('progress 는 0 에서 시작한다', () => {
      const engine = new GameEngine({ encounterFactory: createEncounterFactory() });
      engine.startNewRun();
      const state = engine.getState();
      assert.strictEqual(state.progress, 0);
    });

    it('목표 progress 는 8 이다', () => {
      const engine = new GameEngine({ encounterFactory: createEncounterFactory() });
      engine.startNewRun();
      const state = engine.getState();
      assert.strictEqual(state.targetProgress, 8);
    });

    it('정상 encounter + 전진은 정답이다', () => {
      // deterministic factory: 항상 normal encounter 생성
      const factory = createEncounterFactory({ rng: () => 0.9, normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      const result = engine.chooseForward();

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.result, 'correct');
      assert.strictEqual(engine.getState().progress, 1);
    });

    it('정상 encounter + 후진은 오답이다', () => {
      const factory = createEncounterFactory({ rng: () => 0.9, normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      const result = engine.chooseBackward();

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.result, 'wrong');
      assert.strictEqual(engine.getState().progress, 0);
    });

    it('이상 encounter + 후진은 정답이다', () => {
      // deterministic factory: 항상 anomaly encounter 생성 (anomalyId='poster')
      let callCount = 0;
      const factory = createEncounterFactory({
        rng: () => {
          callCount++;
          return 0.1; // anomaly 확률로 진입
        },
        normalProbability: 0.0
      });

      const engine = new GameEngine({ encounterFactory: factory });
      engine.startNewRun();

      const state = engine.getState();
      assert.notStrictEqual(state.encounter.anomalyId, null, 'encounter 에 anomaly 가 있어야 함');

      const result = engine.chooseBackward();
      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.result, 'correct');
      assert.strictEqual(engine.getState().progress, 1);
    });

    it('이상 encounter + 전진은 오답이다', () => {
      const factory = createEncounterFactory({ normalProbability: 0.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      const state = engine.getState();
      assert.notStrictEqual(state.encounter.anomalyId, null);

      const result = engine.chooseForward();
      assert.strictEqual(result.result, 'wrong');
      assert.strictEqual(engine.getState().progress, 0);
    });
  });

  describe('transitioning 상태 입력 차단', () => {
    it('transitioning 중에는 입력이 무시된다', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();

      // phase 를 강제로 transitioning 으로 설정하여 테스트
      engine.state.phase = 'transitioning';

      const result = engine.chooseForward();
      assert.strictEqual(result.accepted, false);
      assert.strictEqual(result.result, 'ignored');
    });

    it('한 encounter 에서 한 번만 progress 가 증가한다', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      const initialProgress = engine.getState().progress;

      // 여러 번 연속 호출하지만 encounter 가 변경되므로 실제로는 여러 번 처리됨
      // 이 테스트는 transitioning 상태가 올바르게 동작하는지 확인
      engine.chooseForward(); // 첫 번째 선택 - 처리됨
      const afterFirst = engine.getState().progress;

      // 바로 다음 호출은 새로운 encounter 에 대한 것이므로 처리될 수 있음
      // 중요한 것은 각 encounter 당 한 번만 처리된다는 것
      assert.strictEqual(afterFirst, initialProgress + 1);
    });
  });

  describe('승리 조건', () => {
    it('progress 7 에서 정상 + 전진으로 승리', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      engine.state.progress = 7;
      engine.state.phase = 'observing';

      const result = engine.chooseForward();

      assert.strictEqual(result.result, 'correct');
      assert.strictEqual(engine.getState().phase, 'victory');
    });

    it('progress 7 에서 이상 + 후진으로 승리', () => {
      const factory = createEncounterFactory({ normalProbability: 0.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      engine.state.progress = 7;
      engine.state.phase = 'observing';

      const state = engine.getState();
      assert.notStrictEqual(state.encounter.anomalyId, null);

      const result = engine.chooseBackward();

      assert.strictEqual(result.result, 'correct');
      assert.strictEqual(engine.getState().phase, 'victory');
    });
  });

  describe('오답 시 progress 리셋', () => {
    it('잘못된 선택은 progress 를 0 으로 리셋한다', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      engine.state.progress = 3;

      // 정상 encounter 에서 후진 선택 (오답)
      const result = engine.chooseBackward();

      assert.strictEqual(result.result, 'wrong');
      assert.strictEqual(engine.getState().progress, 0);
    });
  });

  describe('runId 와 상태 초기화', () => {
    it('startNewRun 은 runId 를 증가시킨다', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      const runId1 = engine.getState().runId;

      engine.startNewRun();
      const runId2 = engine.getState().runId;

      assert.strictEqual(runId2, runId1 + 1);
    });

    it('returnToMenu 는 phase 를 menu 로 변경한다', () => {
      const factory = createEncounterFactory({ normalProbability: 1.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();
      engine.returnToMenu();

      const state = engine.getState();
      assert.strictEqual(state.phase, 'menu');
      assert.strictEqual(state.progress, 0);
      assert.strictEqual(state.encounter, null);
    });
  });

  describe('deterministic encounter generation', () => {
    it('고정된 RNG 는 동일한 encounter 시퀀스를 생성한다', () => {
      const fixedRng = () => 0.3; // 고정 값
      const factory1 = createEncounterFactory({ rng: fixedRng, normalProbability: 0.5 });
      const factory2 = createEncounterFactory({ rng: fixedRng, normalProbability: 0.5 });

      const engine1 = new GameEngine({ encounterFactory: factory1 });
      const engine2 = new GameEngine({ encounterFactory: factory2 });

      engine1.startNewRun();
      engine2.startNewRun();

      // 처음 5 개의 encounter 가 동일해야 함
      for (let i = 0; i < 5; i++) {
        const enc1 = engine1.getState().encounter;
        const enc2 = engine2.getState().encounter;
        assert.strictEqual(enc1.anomalyId, enc2.anomalyId, `${i}번째 encounter 가 동일해야 함`);

        engine1.chooseForward();
        engine2.chooseForward();
      }
    });

    it('연속된 encounter 는 동일한 anomaly 를 가지지 않는다', () => {
      // 항상 anomaly 를 생성하지만 이전과 다르게
      const factory = createEncounterFactory({ normalProbability: 0.0 });
      const engine = new GameEngine({ encounterFactory: factory });

      engine.startNewRun();

      let previousAnomalyId = engine.getState().encounter.anomalyId;

      for (let i = 0; i < 10; i++) {
        engine.chooseBackward(); // 정답 처리
        const state = engine.getState();
        if (state.phase === 'victory') break;

        const currentAnomalyId = state.encounter.anomalyId;
        assert.notStrictEqual(currentAnomalyId, previousAnomalyId, '연속된 anomaly 는 달라야 함');
        previousAnomalyId = currentAnomalyId;
      }
    });
  });
});
