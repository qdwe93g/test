/**
 * Exit 8 - Game Engine
 * 순수 게임 로직 모듈 (DOM, window, setTimeout 접근 금지)
 */

/**
 * @typedef {Object} GameState
 * @property {'menu'|'observing'|'transitioning'|'victory'} phase
 * @property {number} progress - 0-8
 * @property {number} targetProgress - 8
 * @property {Encounter|null} encounter
 * @property {string|null} previousAnomalyId
 * @property {number} runId
 */

/**
 * @typedef {Object} Encounter
 * @property {string} id
 * @property {string|null} anomalyId - null means normal
 */

/**
 * @typedef {Object} EngineConfig
 * @property {(anomalyId?: string) => Encounter} encounterFactory
 */

export class GameEngine {
  /**
   * @param {EngineConfig} config
   */
  constructor(config) {
    if (!config || !config.encounterFactory) {
      throw new Error('GameEngine requires encounterFactory in config');
    }

    this.encounterFactory = config.encounterFactory;

    /** @type {GameState} */
    this.state = {
      phase: 'menu',
      progress: 0,
      targetProgress: 8,
      encounter: null,
      previousAnomalyId: null,
      runId: 0
    };
  }

  /**
   * 새 게임 실행
   */
  startNewRun() {
    this.state.runId++;
    this.state.phase = 'observing';
    this.state.progress = 0;
    this.state.encounter = null;
    this.state.previousAnomalyId = null;

    // 첫 번째 encounter 생성
    this.state.encounter = this.encounterFactory(this.state.previousAnomalyId);

    return this.getState();
  }

  /**
   * 현재 상태 반환
   * @returns {GameState}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 전진 선택 처리 (플레이어가 통로가 정상이라고 판단)
   * @returns {{accepted: boolean, state: GameState, result?: 'correct'|'wrong'|'ignored'}}
   */
  chooseForward() {
    if (this.state.phase !== 'observing') {
      return { accepted: false, state: this.getState(), result: 'ignored' };
    }

    if (!this.state.encounter) {
      return { accepted: false, state: this.getState(), result: 'ignored' };
    }

    const isNormal = this.state.encounter.anomalyId === null;
    const isCorrect = isNormal; // 전진은 정상일 때만 정답

    return this._processChoice(isCorrect);
  }

  /**
   * 후진 선택 처리 (플레이어가 이상함을 감지)
   * @returns {{accepted: boolean, state: GameState, result?: 'correct'|'wrong'|'ignored'}}
   */
  chooseBackward() {
    if (this.state.phase !== 'observing') {
      return { accepted: false, state: this.getState(), result: 'ignored' };
    }

    if (!this.state.encounter) {
      return { accepted: false, state: this.getState(), result: 'ignored' };
    }

    const hasAnomaly = this.state.encounter.anomalyId !== null;
    const isCorrect = hasAnomaly; // 후진은 이상할 때만 정답

    return this._processChoice(isCorrect);
  }

  /**
   * 선택 처리 공통 로직
   * @param {boolean} isCorrect
   * @returns {{accepted: boolean, state: GameState, result: 'correct'|'wrong'}}
   */
  _processChoice(isCorrect) {
    // phase 를 transitioning 으로 변경 (입력 잠금)
    this.state.phase = 'transitioning';

    if (isCorrect) {
      this.state.progress++;

      // 승리 조건 확인
      if (this.state.progress >= this.state.targetProgress) {
        this.state.phase = 'victory';
      } else {
        // 다음 encounter 생성
        this.state.previousAnomalyId = this.state.encounter?.anomalyId || null;
        this.state.encounter = this.encounterFactory(this.state.previousAnomalyId);
        this.state.phase = 'observing';
      }

      return { accepted: true, state: this.getState(), result: 'correct' };
    } else {
      // 잘못된 선택: progress 리셋
      this.state.progress = 0;
      this.state.previousAnomalyId = this.state.encounter?.anomalyId || null;
      this.state.encounter = this.encounterFactory(this.state.previousAnomalyId);
      this.state.phase = 'observing';

      return { accepted: true, state: this.getState(), result: 'wrong' };
    }
  }

  /**
   * 메뉴 화면으로 복귀
   */
  returnToMenu() {
    this.state.phase = 'menu';
    this.state.progress = 0;
    this.state.encounter = null;
    return this.getState();
  }

  /**
   * 승리로 설정
   */
  setVictory() {
    this.state.phase = 'victory';
    return this.getState();
  }
}
