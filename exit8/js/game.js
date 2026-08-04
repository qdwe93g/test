/**
 * Exit 8 - 게임 로직 모듈
 * 게임 상태 관리, 라운드 진행, 이상 현상 판단 등 코어 로직 담당
 */

class Game {
    constructor() {
        // 게임 상태
        this.currentRound = 1;
        this.maxRounds = 8;
        this.isPlaying = false;
        this.hasAnomaly = false;
        this.playerJudgment = null;
        
        // 각 라운드별 이상 현상 설정
        this.roundConfig = this.initializeRoundConfig();
        
        // DOM 요소들 (나중에 초기화)
        this.elements = {};
    }

    /**
     * 각 라운드별 이상 현상 설정 초기화
     */
    initializeRoundConfig() {
        return {
            1: {
                hasAnomaly: false, // 라운드 1 은 항상 정상 (튜토리얼)
                anomalyType: null,
                description: "첫 번째 통로입니다. 주변을 잘 관찰하세요."
            },
            2: {
                hasAnomaly: true,
                anomalyType: 'poster', // 포스터 색상 변경
                description: "벽에 붙은 포스터를 주의 깊게 보세요."
            },
            3: {
                hasAnomaly: false,
                anomalyType: null,
                description: "아무런 이상이 없는 것 같습니다."
            },
            4: {
                hasAnomaly: true,
                anomalyType: 'light', // 조명 깜빡임
                description: "조명의 상태를 확인해보세요."
            },
            5: {
                hasAnomaly: true,
                anomalyType: 'floor', // 바닥 패턴 변화
                description: "바닥 타일 패턴을 유심히 살펴보세요."
            },
            6: {
                hasAnomaly: false,
                anomalyType: null,
                description: "오늘따라 조용한 통로네요."
            },
            7: {
                hasAnomaly: true,
                anomalyType: 'sign', // 사인판 방향 변경
                description: "출구 표시판을 확인하세요."
            },
            8: {
                hasAnomaly: true,
                anomalyType: 'shadow', // 이상한 그림자
                description: "마지막 라운드입니다. 모든 것을 주의 깊게 관찰하세요!"
            }
        };
    }

    /**
     * DOM 요소 초기화
     */
    initElements() {
        this.elements = {
            menuScreen: document.getElementById('menu-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultScreen: document.getElementById('result-screen'),
            currentRound: document.getElementById('current-round'),
            statusText: document.getElementById('status-text'),
            corridorContainer: document.getElementById('corridor-container'),
            anomalyContainer: document.getElementById('anomaly-container'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            finalRound: document.getElementById('final-round'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            menuBtn: document.getElementById('menu-btn'),
            btnForward: document.getElementById('btn-forward'),
            btnBack: document.getElementById('btn-back'),
            btnNormal: document.getElementById('btn-normal'),
            btnAnomaly: document.getElementById('btn-anomaly')
        };
    }

    /**
     * 이벤트 리스너 등록
     */
    initEventListeners() {
        // 메인 메뉴 버튼
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.restartBtn.addEventListener('click', () => this.startGame());
        this.elements.menuBtn.addEventListener('click', () => this.showMenu());

        // 게임 컨트롤 버튼
        this.elements.btnForward.addEventListener('click', () => this.moveForward());
        this.elements.btnBack.addEventListener('click', () => this.moveBackward());
        this.elements.btnNormal.addEventListener('click', () => this.judgeNormal());
        this.elements.btnAnomaly.addEventListener('click', () => this.judgeAnomaly());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    /**
     * 키보드 입력 처리
     */
    handleKeyPress(e) {
        if (!this.isPlaying) return;

        switch(e.key) {
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moveForward();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moveBackward();
                break;
            case 'Enter':
            case ' ':
                this.judgeNormal();
                break;
            case 'Escape':
            case 'x':
            case 'X':
                this.judgeAnomaly();
                break;
        }
    }

    /**
     * 게임 시작
     */
    startGame() {
        this.currentRound = 1;
        this.isPlaying = true;
        this.playerJudgment = null;
        
        this.switchScreen('game');
        this.updateRoundDisplay();
        this.loadRound();
        this.updateStatus('라운드를 탐색하세요. 이상한 점을 찾아주세요!');
    }

    /**
     * 현재 라운드 로드
     */
    loadRound() {
        const config = this.roundConfig[this.currentRound];
        this.hasAnomaly = config.hasAnomaly;
        
        // 렌더러에게 라운드 정보 전달
        if (window.renderer) {
            window.renderer.renderCorridor(this.currentRound, this.hasAnomaly);
        }
        
        this.updateStatus(config.description);
        this.playerJudgment = null;
    }

    /**
     * 앞으로 이동
     */
    moveForward() {
        if (!this.isPlaying) return;
        
        this.animateMovement('forward');
        this.updateStatus('앞으로 이동합니다...');
        
        setTimeout(() => {
            this.updateStatus('통로를 관찰하고 판단해주세요.');
        }, 600);
    }

    /**
     * 뒤로 이동
     */
    moveBackward() {
        if (!this.isPlaying) return;
        
        this.animateMovement('backward');
        this.updateStatus('뒤로 이동합니다...');
        
        setTimeout(() => {
            this.updateStatus('통로를 관찰하고 판단해주세요.');
        }, 600);
    }

    /**
     * 이동 애니메이션
     */
    animateMovement(direction) {
        const corridor = this.elements.corridorContainer;
        corridor.classList.remove('move-forward', 'move-backward');
        
        // void 를 읽어 CSS 리플로우 강제
        void corridor.offsetWidth;
        
        if (direction === 'forward') {
            corridor.classList.add('move-forward');
        } else {
            corridor.classList.add('move-backward');
        }
    }

    /**
     * '이상 없음' 판단
     */
    judgeNormal() {
        if (!this.isPlaying || this.playerJudgment !== null) return;
        
        this.playerJudgment = 'normal';
        this.processJudgment();
    }

    /**
     * '이상함' 판단
     */
    judgeAnomaly() {
        if (!this.isPlaying || this.playerJudgment !== null) return;
        
        this.playerJudgment = 'anomaly';
        this.processJudgment();
    }

    /**
     * 플레이어 판단 처리
     */
    processJudgment() {
        const config = this.roundConfig[this.currentRound];
        const isCorrect = this.hasAnomaly && this.playerJudgment === 'anomaly' ||
                         !this.hasAnomaly && this.playerJudgment === 'normal';

        if (isCorrect) {
            // 정답 처리
            if (this.playerJudgment === 'anomaly') {
                // 이상이 있다고 정확히 판단 - 다시 처음으로 돌아가서 재시작
                this.updateStatus('이상을 발견했습니다! 라운드를 다시 시작합니다...');
                setTimeout(() => {
                    this.loadRound();
                    this.updateStatus('다시 한 번 관찰해주세요.');
                }, 1500);
            } else {
                // 이상이 없다고 정확히 판단 - 다음 라운드로 진행
                if (this.currentRound >= this.maxRounds) {
                    // 마지막 라운드 클리어 - 게임 승리!
                    this.gameVictory();
                } else {
                    this.currentRound++;
                    this.updateStatus('정확합니다! 다음 라운드로 이동합니다...');
                    setTimeout(() => {
                        this.updateRoundDisplay();
                        this.loadRound();
                    }, 1500);
                }
            }
        } else {
            // 오답 처리 - 잘못된 판단
            this.updateStatus('잘못된 판단입니다! 게임을 다시 시작합니다...');
            setTimeout(() => {
                this.gameOver();
            }, 1500);
        }
        
        this.playerJudgment = null;
    }

    /**
     * 게임 승리 처리
     */
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

    /**
     * 게임 오버 처리
     */
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

    /**
     * 라운드 표시 업데이트
     */
    updateRoundDisplay() {
        const roundDisplay = this.elements.currentRound.parentElement;
        this.elements.currentRound.textContent = this.currentRound;
        
        // 애니메이션 효과
        roundDisplay.classList.remove('changed');
        void roundDisplay.offsetWidth; // 리플로우 강제
        roundDisplay.classList.add('changed');
    }

    /**
     * 상태 메시지 업데이트
     */
    updateStatus(message) {
        const statusDisplay = this.elements.statusText.parentElement;
        this.elements.statusText.textContent = message;
        
        // 애니메이션 효과
        statusDisplay.classList.remove('updated');
        void statusDisplay.offsetWidth; // 리플로우 강제
        statusDisplay.classList.add('updated');
    }

    /**
     * 화면 전환
     */
    switchScreen(screenName) {
        // 모든 화면 숨기기
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('screen')) {
                el.classList.remove('active');
            }
        });

        // 해당 화면 표시
        const targetScreen = this.elements[`${screenName}Screen`];
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.classList.add('fade-in');
            
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 500);
        }
    }

    /**
     * 메인 메뉴 표시
     */
    showMenu() {
        this.isPlaying = false;
        this.switchScreen('menu');
    }

    /**
     * 게임 초기화
     */
    reset() {
        this.currentRound = 1;
        this.isPlaying = false;
        this.hasAnomaly = false;
        this.playerJudgment = null;
        
        if (window.renderer) {
            window.renderer.clear();
        }
    }
}

// 전역 객체로 내보내기
window.Game = Game;
