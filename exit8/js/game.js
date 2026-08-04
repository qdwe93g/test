/**
 * Exit 8 - 게임 로직 모듈
 * 게임 상태 관리, 라운드 진행, 이상 현상 판단 등 코어 로직 담당
 */

import { ANOMALY_REGISTRY, getAnomalyTypes, getRandomAnomalyType } from './anomaly-registry.js';

export class Game {
  constructor() {
    this.currentRound = 1;
    this.maxRounds = 8;
    this.isPlaying = false;
    this.hasAnomaly = false;
    this.playerJudgment = null;
    this.roundConfig = {};
    this.elements = {};
  }

  /**
   * 각 라운드별 이상 현상 설정 초기화
   * 매 게임마다 랜덤하게 이상 현상을 배치하여 예측 불가능한 gameplay 제공
   */
  initializeRoundConfig() {
    const config = {};
    
    // 라운드 1 은 항상 정상 (튜토리얼)
    config[1] = {
      hasAnomaly: false,
      anomalyType: null,
      description: "첫 번째 통로입니다. 주변을 잘 관찰하세요."
    };
    
    // 라운드 2-7: 랜덤하게 이상 현상 배치 (약 50% 확률)
    for (let round = 2; round <= 7; round++) {
      const hasAnomaly = Math.random() < 0.5;
      let anomalyType = null;
      let description = "";
      
      if (hasAnomaly) {
        anomalyType = getRandomAnomalyType();
        const anomalyData = ANOMALY_REGISTRY[anomalyType];
        description = anomalyData ? anomalyData.description : "무언가 이상한 것이 있습니다.";
      } else {
        const anomalyData = ANOMALY_REGISTRY[getRandomAnomalyType()];
        description = anomalyData ? anomalyData.normalDescription : "평범한 통로입니다.";
      }
      
      config[round] = {
        hasAnomaly,
        anomalyType,
        description
      };
    }
    
    // 라운드 8: 반드시 이상 현상 발생 (마지막 라운드)
    const finalAnomalyType = getRandomAnomalyType();
    const finalAnomalyData = ANOMALY_REGISTRY[finalAnomalyType];
    
    config[8] = {
      hasAnomaly: true,
      anomalyType: finalAnomalyType,
      description: finalAnomalyData ? finalAnomalyData.description : "마지막 라운드입니다!"
    };
    
    return config;
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
      btnBack: document.getElementById('btn-back'),
      btnNormal: document.getElementById('btn-normal'),
      btnAnomaly: document.getElementById('btn-anomaly')
    };
  }

  initEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.startGame());
    this.elements.anomalyListBtn.addEventListener('click', () => this.showAnomalyList());
    this.elements.backToMenuBtn.addEventListener('click', () => this.showMenu());
    this.elements.restartBtn.addEventListener('click', () => this.startGame());
    this.elements.menuBtn.addEventListener('click', () => this.showMenu());

    this.elements.btnForward.addEventListener('click', () => this.moveForward());
    this.elements.btnBack.addEventListener('click', () => this.moveBackward());
    this.elements.btnNormal.addEventListener('click', () => this.judgeNormal());
    this.elements.btnAnomaly.addEventListener('click', () => this.judgeAnomaly());

    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    
    this.initAnomalyList();
  }

  initAnomalyList() {
    const anomalies = Object.values(ANOMALY_REGISTRY).map(data => ({
      icon: this.getAnomalyIcon(data.name),
      name: data.name,
      description: data.description,
      example: `심각도: ${data.severity}`
    }));

    if (this.elements.anomalyGrid) {
      this.elements.anomalyGrid.innerHTML = anomalies.map(anomaly => `
        <div class="anomaly-card">
          <div class="anomaly-icon">${anomaly.icon}</div>
          <div class="anomaly-name">${anomaly.name}</div>
          <div class="anomaly-description">${anomaly.description}</div>
          <div class="anomaly-example">${anomaly.example}</div>
        </div>
      `).join('');
    }
  }

  getAnomalyIcon(name) {
    const icons = {
      '포스터 변화': '🪧',
      '조명 깜빡임': '💡',
      '바닥 무늬 이상': '💧',
      '표지판 오류': '🔀',
      '이상한 그림자': '🌫️',
      '비상구 문 개방': '🚪',
      '손 등장': '✋',
      '검은 형상': '👤'
    };
    return icons[name] || '❓';
  }

  startGame() {
    this.currentRound = 1;
    this.isPlaying = true;
    this.playerJudgment = null;
    
    this.roundConfig = this.initializeRoundConfig();
    
    this.switchScreen('game');
    this.updateRoundDisplay();
    this.loadRound();
    this.updateStatus('통로를 잘 관찰하세요. 이상한 점이 있나요?');
  }

  loadRound() {
    const config = this.roundConfig[this.currentRound];
    this.hasAnomaly = config.hasAnomaly;
    
    if (window.renderer) {
      window.renderer.renderCorridor(this.currentRound, this.hasAnomaly, config.anomalyType);
    }
    
    this.updateStatus('통로를 잘 관찰하세요. 이상한 점이 있나요?');
    this.playerJudgment = null;
  }

  moveForward() {
    if (!this.isPlaying) return;
    
    this.animateMovement('forward');
  }

  moveBackward() {
    if (!this.isPlaying) return;
    
    this.animateMovement('backward');
  }

  animateMovement(direction) {
    const corridor = this.elements.corridorContainer;
    corridor.classList.remove('move-forward', 'move-backward');
    
    void corridor.offsetWidth;
    
    if (direction === 'forward') {
      corridor.classList.add('move-forward');
    } else {
      corridor.classList.add('move-backward');
    }
  }

  judgeNormal() {
    if (!this.isPlaying || this.playerJudgment !== null) return;
    
    this.playerJudgment = 'normal';
    this.processJudgment();
  }

  judgeAnomaly() {
    if (!this.isPlaying || this.playerJudgment !== null) return;
    
    this.playerJudgment = 'anomaly';
    this.processJudgment();
  }

  processJudgment() {
    const config = this.roundConfig[this.currentRound];
    const isCorrect = (this.hasAnomaly && this.playerJudgment === 'anomaly') ||
                     (!this.hasAnomaly && this.playerJudgment === 'normal');

    if (isCorrect) {
      if (this.currentRound >= this.maxRounds) {
        this.gameVictory();
      } else {
        this.currentRound++;
        const nextConfig = this.roundConfig[this.currentRound];
        if (nextConfig) {
          this.hasAnomaly = nextConfig.hasAnomaly;
        }
        this.updateStatus('정확합니다! 다음 라운드로 이동합니다...');
        setTimeout(() => {
          this.updateRoundDisplay();
          this.loadRound();
        }, 1500);
      }
    } else {
      this.updateStatus('잘못된 판단입니다! 게임을 다시 시작합니다...');
      setTimeout(() => {
        this.gameOver();
      }, 1500);
    }

    this.playerJudgment = null;
  }

  handleKeyPress(e) {
    if (!this.isPlaying) return;

    switch(e.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.moveForward();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.moveBackward();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.judgeNormal();
        break;
      case 'Escape':
      case 'x':
      case 'X':
        e.preventDefault();
        this.judgeAnomaly();
        break;
    }
  }

  gameVictory() {
    this.isPlaying = false;
    this.elements.resultTitle.textContent = '🎉 탈출 성공!';
    this.elements.resultTitle.className = 'victory';
    this.elements.resultMessage.textContent = 
      '축하합니다! 모든 이상 현상을 찾아내고 8 번 출구에 도달했습니다!\n\n당신은 진정한 관찰자입니다!';
    this.elements.finalRound.textContent = this.maxRounds;
    
    setTimeout(() => {
      this.switchScreen('result');
    }, 1000);
  }

  gameOver() {
    this.isPlaying = false;
    this.elements.resultTitle.textContent = '😵 탈출 실패...';
    this.elements.resultTitle.className = 'defeat';
    this.elements.resultMessage.textContent = 
      `아쉽게도 ${this.currentRound}라운드에서 잘못된 판단을 했습니다.\n\n조금 더 주의 깊게 관찰해보세요!`;
    this.elements.finalRound.textContent = this.currentRound;
    
    setTimeout(() => {
      this.switchScreen('result');
    }, 1000);
  }

  updateRoundDisplay() {
    const roundDisplay = this.elements.currentRound.parentElement;
    this.elements.currentRound.textContent = this.currentRound;
    
    roundDisplay.classList.remove('changed');
    void roundDisplay.offsetWidth;
    roundDisplay.classList.add('changed');
  }

  updateStatus(message) {
    const statusDisplay = this.elements.statusText.parentElement;
    this.elements.statusText.textContent = message;
    
    statusDisplay.classList.remove('updated');
    void statusDisplay.offsetWidth;
    statusDisplay.classList.add('updated');
  }

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

  showMenu() {
    this.isPlaying = false;
    this.switchScreen('menu');
  }

  showAnomalyList() {
    this.switchScreen('anomaly-list');
  }

  reset() {
    this.currentRound = 1;
    this.isPlaying = false;
    this.playerJudgment = null;
    this.hasAnomaly = false;
    this.roundConfig = {};
  }
}
