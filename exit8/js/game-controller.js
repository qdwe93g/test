/**
 * Exit 8 - Game Controller
 * DOM 조작, 이벤트 처리, 애니메이션 담당 (GameEngine 와 분리)
 */

import { GameEngine } from './game-engine.js';
import { createEncounterFactory, getAnomalyData } from './anomaly-registry.js';
import { Renderer } from './renderer.js';

export class GameController {
  constructor(options = {}) {
    this.engine = null;
    this.renderer = options.renderer || null;
    this.elements = {};

    // 타이머 관리
    this.activeTimers = [];
    this.currentRunId = 0;

    // UI 상태
    this.isTransitioning = false;
  }

  initElements() {
    this.elements = {
      menuScreen: document.getElementById('menu-screen'),
      anomalyListScreen: document.getElementById('anomaly-list-screen'),
      gameScreen: document.getElementById('game-screen'),
      resultScreen: document.getElementById('result-screen'),
      currentRound: document.getElementById('current-round'),
      statusText: document.getElementById('status-text'),
      corridorContainer: document.getElementById('corridor-container'),
      anomalyContainer: document.getElementById('anomaly-container'),
      anomalyGrid: document.getElementById('anomaly-grid'),
      resultTitle: document.getElementById('result-title'),
      resultMessage: document.getElementById('result-message'),
      finalRound: document.getElementById('final-round'),
      startBtn: document.getElementById('start-btn'),
      anomalyListBtn: document.getElementById('anomaly-list-btn'),
      backToMenuBtn: document.getElementById('back-to-menu-btn'),
      restartBtn: document.getElementById('restart-btn'),
      menuBtn: document.getElementById('menu-btn'),
      btnForward: document.getElementById('btn-forward'),
      btnBack: document.getElementById('btn-back')
    };
  }

  /**
   * 새 게임 시작
   */
  startNewGame() {
    // 이전 타이머 모두 취소
    this.cancelAllTimers();

    // runId 증가
    this.currentRunId++;

    // 엔진 초기화
    const factory = createEncounterFactory({ normalProbability: 0.5 });
    this.engine = new GameEngine({ encounterFactory: factory });
    this.engine.startNewRun();

    this.isTransitioning = false;

    // UI 업데이트
    this.switchScreen('game');
    this.updateProgressDisplay();
    this.renderCurrentEncounter();
    this.updateStatus('통로를 잘 관찰하세요. 이상한 점이 있나요?');
    this.enableControls(true);
  }

  /**
   * 현재 encounter 렌더링
   */
  renderCurrentEncounter() {
    if (!this.renderer || !this.engine) return;

    const state = this.engine.getState();
    const encounter = state.encounter;

    if (!encounter) return;

    const hasAnomaly = encounter.anomalyId !== null;
    const anomalyType = encounter.anomalyId;

    // 라운드 번호는 progress + 1 (0-based to 1-based)
    const round = state.progress + 1;

    this.renderer.renderCorridor(round, hasAnomaly, anomalyType);
  }

  /**
   * 전진 버튼 처리
   */
  handleForward() {
    if (!this.engine || this.isTransitioning) return;

    const result = this.engine.chooseForward();

    if (!result.accepted) {
      return; // 무시됨
    }

    this.isTransitioning = true;
    this.enableControls(false);

    if (result.result === 'correct') {
      this.animateMovement('forward', () => {
        this.handleCorrectChoice();
      });
    } else {
      this.animateMovement('forward', () => {
        this.handleWrongChoice();
      });
    }
  }

  /**
   * 후진 버튼 처리
   */
  handleBackward() {
    if (!this.engine || this.isTransitioning) return;

    const result = this.engine.chooseBackward();

    if (!result.accepted) {
      return; // 무시됨
    }

    this.isTransitioning = true;
    this.enableControls(false);

    if (result.result === 'correct') {
      this.animateMovement('backward', () => {
        this.handleCorrectChoice();
      });
    } else {
      this.animateMovement('backward', () => {
        this.handleWrongChoice();
      });
    }
  }

  /**
   * 정답 처리
   */
  handleCorrectChoice() {
    const state = this.engine.getState();

    if (state.phase === 'victory') {
      this.showVictory();
      return;
    }

    this.updateProgressDisplay();
    this.updateStatus('정확합니다! 다음 라운드로 이동합니다...');

    const timerId = setTimeout(() => {
      this.isTransitioning = false;
      this.enableControls(true);
      this.renderCurrentEncounter();
      this.updateStatus('통로를 잘 관찰하세요. 이상한 점이 있나요?');
    }, 1500);

    this.activeTimers.push(timerId);
  }

  /**
   * 오답 처리
   */
  handleWrongChoice() {
    this.updateStatus('잘못된 판단입니다! 게임을 다시 시작합니다...');

    const timerId = setTimeout(() => {
      this.isTransitioning = false;
      this.enableControls(true);
      this.renderCurrentEncounter();
      this.updateProgressDisplay();
      this.updateStatus('통로를 잘 관찰하세요. 이상한 점이 있나요?');
    }, 1500);

    this.activeTimers.push(timerId);
  }

  /**
   * 이동 애니메이션
   */
  animateMovement(direction, callback) {
    const corridor = this.elements.corridorContainer;
    if (!corridor) return;

    corridor.classList.remove('move-forward', 'move-backward');
    void corridor.offsetWidth; // 리플로우

    if (direction === 'forward') {
      corridor.classList.add('move-forward');
    } else {
      corridor.classList.add('move-backward');
    }

    const timerId = setTimeout(() => {
      corridor.classList.remove('move-forward', 'move-backward');
      if (callback) callback();
    }, 600);

    this.activeTimers.push(timerId);
  }

  /**
   * 진행 상황 표시 업데이트
   */
  updateProgressDisplay() {
    if (!this.elements.currentRound || !this.engine) return;

    const state = this.engine.getState();
    // progress 는 0-8, 라운드 표시는 1-8
    const displayRound = Math.min(state.progress + 1, 8);
    this.elements.currentRound.textContent = displayRound;

    const roundDisplay = this.elements.currentRound.parentElement;
    roundDisplay.classList.remove('changed');
    void roundDisplay.offsetWidth;
    roundDisplay.classList.add('changed');
  }

  /**
   * 상태 메시지 업데이트
   */
  updateStatus(message) {
    if (!this.elements.statusText) return;

    this.elements.statusText.textContent = message;

    const statusDisplay = this.elements.statusText.parentElement;
    statusDisplay.classList.remove('updated');
    void statusDisplay.offsetWidth;
    statusDisplay.classList.add('updated');
  }

  /**
   * 컨트롤 활성화/비활성화
   */
  enableControls(enabled) {
    if (this.elements.btnForward) {
      this.elements.btnForward.disabled = !enabled;
    }
    if (this.elements.btnBack) {
      this.elements.btnBack.disabled = !enabled;
    }
  }

  /**
   * 승리 화면 표시
   */
  showVictory() {
    if (this.elements.resultTitle) {
      this.elements.resultTitle.textContent = '🎉 탈출 성공!';
      this.elements.resultTitle.className = 'victory';
    }
    if (this.elements.resultMessage) {
      this.elements.resultMessage.textContent =
        '축하합니다! 모든 이상 현상을 찾아내고 8 번 출구에 도달했습니다!\\n\\n당신은 진정한 관찰자입니다!';
    }
    if (this.elements.finalRound) {
      this.elements.finalRound.textContent = '8';
    }

    const timerId = setTimeout(() => {
      this.switchScreen('result');
    }, 1000);

    this.activeTimers.push(timerId);
  }

  /**
   * 패배 화면 표시
   */
  showDefeat() {
    if (this.elements.resultTitle) {
      this.elements.resultTitle.textContent = '😵 탈출 실패...';
      this.elements.resultTitle.className = 'defeat';
    }
    if (this.elements.resultMessage) {
      const state = this.engine?.getState();
      const round = state ? state.progress + 1 : 1;
      this.elements.resultMessage.textContent =
        `아쉽게도 ${round}라운드에서 잘못된 판단을 했습니다.\\n\\n조금 더 주의 깊게 관찰해보세요!`;
    }
    if (this.elements.finalRound) {
      const state = this.engine?.getState();
      this.elements.finalRound.textContent = state ? state.progress.toString() : '0';
    }

    const timerId = setTimeout(() => {
      this.switchScreen('result');
    }, 1000);

    this.activeTimers.push(timerId);
  }

  /**
   * 화면 전환
   */
  switchScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.remove('active');
    });

    let targetScreen;
    if (screenName === 'menu') {
      targetScreen = this.elements.menuScreen;
    } else if (screenName === 'anomaly-list') {
      targetScreen = this.elements.anomalyListScreen;
    } else if (screenName === 'game') {
      targetScreen = this.elements.gameScreen;
    } else if (screenName === 'result') {
      targetScreen = this.elements.resultScreen;
    }

    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.classList.add('fade-in');

      setTimeout(() => {
        targetScreen.classList.remove('fade-in');
      }, 500);
    }
  }

  /**
   * 모든 타이머 취소
   */
  cancelAllTimers() {
    this.activeTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.activeTimers = [];
  }

  /**
   * 메뉴로 복귀
   */
  returnToMenu() {
    this.cancelAllTimers();
    this.isTransitioning = false;

    if (this.engine) {
      this.engine.returnToMenu();
    }

    this.switchScreen('menu');
  }

  /**
   * 이상 현상 목록 표시
   */
  showAnomalyList() {
    this.switchScreen('anomaly-list');
  }

  /**
   * 키보드 입력 처리
   */
  handleKeyPress(e) {
    // 게임 중이 아니거나 transition 중이면 무시
    if (!this.engine || this.isTransitioning) return;

    const state = this.engine.getState();
    if (state.phase !== 'observing') return;

    switch(e.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.handleForward();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.handleBackward();
        break;
      // Enter 와 Space 는 포커스된 버튼이 처리하도록 함
    }
  }
}
