/**
 * Exit 8 - 렌더러 모듈
 * 통로 그래픽 렌더링 및 이상 현상 시각적 표현 담당
 */

class Renderer {
    constructor() {
        this.corridorContainer = null;
        this.anomalyContainer = null;
        this.currentRound = 1;
        this.hasAnomaly = false;
    }

    /**
     * 렌더러 초기화
     */
    init() {
        this.corridorContainer = document.getElementById('corridor-container');
        this.anomalyContainer = document.getElementById('anomaly-container');
    }

    /**
     * 통로 렌더링
     */
    renderCorridor(round, hasAnomaly) {
        this.currentRound = round;
        this.hasAnomaly = hasAnomaly;
        
        // 기존 이상 현상 제거
        this.clearAnomalies();
        
        // 통로 기본 스타일 리셋
        this.resetCorridorStyles();
        
        // 라운드에 따른 미세한 변화 (색조 등)
        this.applyRoundVariation(round);
        
        // 이상 현상이 있다면 렌더링
        if (hasAnomaly) {
            this.renderAnomaly(round);
        }
    }

    /**
     * 라운드별 변형 적용
     */
    applyRoundVariation(round) {
        // 각 라운드마다 약간의 색상 변형으로 지루함 방지
        const hueShift = (round - 1) * 2; // 라운드마다 2 도씩 색조 변화
        
        const walls = this.corridorContainer.querySelectorAll('.corridor-wall');
        walls.forEach(wall => {
            wall.style.filter = `hue-rotate(${hueShift}deg)`;
        });
        
        const back = this.corridorContainer.querySelector('.corridor-back');
        if (back) {
            back.style.filter = `hue-rotate(${hueShift}deg)`;
        }
    }

    /**
     * 이상 현상 렌더링
     */
    renderAnomaly(round) {
        const config = this.getRoundConfig(round);
        if (!config || !config.anomalyType) return;

        switch(config.anomalyType) {
            case 'poster':
                this.renderPosterAnomaly();
                break;
            case 'light':
                this.renderLightAnomaly();
                break;
            case 'floor':
                this.renderFloorAnomaly();
                break;
            case 'sign':
                this.renderSignAnomaly();
                break;
            case 'shadow':
                this.renderShadowAnomaly();
                break;
        }
    }

    /**
     * 라운드 설정 가져오기
     */
    getRoundConfig(round) {
        const configs = {
            2: { anomalyType: 'poster' },
            4: { anomalyType: 'light' },
            5: { anomalyType: 'floor' },
            7: { anomalyType: 'sign' },
            8: { anomalyType: 'shadow' }
        };
        return configs[round];
    }

    /**
     * 포스터 이상 현상 (라운드 2)
     * 벽에 붙은 포스터의 색상이 평소와 다름
     */
    renderPosterAnomaly() {
        const leftWall = this.corridorContainer.querySelector('.left-wall');
        if (!leftWall) return;

        const poster = document.createElement('div');
        poster.className = 'anomaly-poster';
        poster.style.cssText = `
            position: absolute;
            width: 60px;
            height: 80px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            border: 3px solid #333;
            border-radius: 4px;
            top: 30%;
            left: 20%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            animation: posterChange 3s ease-in-out infinite;
        `;
        
        // 포스터 내부 텍스트 (이상한 문구)
        poster.innerHTML = `
            <div style="font-size: 10px; color: white; padding: 5px; text-align: center;">
                EXIT<br>9
            </div>
        `;
        
        this.anomalyContainer.appendChild(poster);
    }

    /**
     * 조명 이상 현상 (라운드 4)
     * 천장 조명이 깜빡임
     */
    renderLightAnomaly() {
        const ceiling = this.corridorContainer.querySelector('.corridor-ceiling');
        if (!ceiling) return;

        // 기존 조명에 깜빡임 효과 추가
        ceiling.classList.add('flicker');
        
        // 추가 조명 생성 (비정상적으로 밝거나 어두운)
        const abnormalLight = document.createElement('div');
        abnormalLight.className = 'flicker';
        abnormalLight.style.cssText = `
            position: absolute;
            width: 60px;
            height: 15px;
            background: #ffcc00;
            border-radius: 8px;
            top: 50%;
            right: 20%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 40px rgba(255, 204, 0, 0.8);
            animation: flicker 0.5s infinite;
        `;
        
        this.anomalyContainer.appendChild(abnormalLight);
    }

    /**
     * 바닥 패턴 이상 현상 (라운드 5)
     * 바닥 타일의 패턴이 일부 깨짐
     */
    renderFloorAnomaly() {
        const floor = this.corridorContainer.querySelector('.corridor-floor');
        if (!floor) return;

        // 비정상적인 바닥 패턴
        floor.style.background = `
            repeating-linear-gradient(
                90deg,
                #c4b5a0 0px,
                #c4b5a0 50px,
                #b8a992 50px,
                #b8a992 100px
            ),
            radial-gradient(
                ellipse at 70% 50%,
                rgba(139, 115, 85, 0.3) 0%,
                transparent 40%
            )
        `;
        
        // 얼룩 추가
        const stain = document.createElement('div');
        stain.style.cssText = `
            position: absolute;
            width: 80px;
            height: 60px;
            background: radial-gradient(ellipse, rgba(100, 80, 60, 0.5) 0%, transparent 70%);
            bottom: 20%;
            right: 30%;
            transform: rotate(15deg);
            border-radius: 50%;
        `;
        
        this.anomalyContainer.appendChild(stain);
    }

    /**
     * 사인판 이상 현상 (라운드 7)
     * 출구 표시판의 화살표 방향이 반대
     */
    renderSignAnomaly() {
        const backWall = this.corridorContainer.querySelector('.corridor-back');
        if (!backWall) return;

        const sign = document.createElement('div');
        sign.style.cssText = `
            position: absolute;
            width: 100px;
            height: 40px;
            background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%);
            border: 3px solid #1e8449;
            border-radius: 6px;
            top: 20%;
            right: 15%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        `;
        
        // 화살표가 왼쪽을 가리킴 (비정상 - 출구는 오른쪽이어야 함)
        sign.innerHTML = `
            <span style="color: white; font-weight: bold; font-size: 18px;">
                ← 출구
            </span>
        `;
        
        this.anomalyContainer.appendChild(sign);
    }

    /**
     * 그림자 이상 현상 (라운드 8)
     * 존재하지 않는 물체의 그림자가 보임
     */
    renderShadowAnomaly() {
        const rightWall = this.corridorContainer.querySelector('.right-wall');
        if (!rightWall) return;

        const shadow = document.createElement('div');
        shadow.className = 'anomaly-shadow';
        shadow.style.cssText = `
            position: absolute;
            width: 40px;
            height: 120px;
            background: linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 100%);
            top: 40%;
            left: 30%;
            transform: skewY(-10deg);
            border-radius: 10px;
            animation: shadowMove 4s ease-in-out infinite;
        `;
        
        this.anomalyContainer.appendChild(shadow);
        
        // 인형 같은 실루엣 추가
        const silhouette = document.createElement('div');
        silhouette.style.cssText = `
            position: absolute;
            width: 30px;
            height: 80px;
            background: rgba(0, 0, 0, 0.3);
            top: 35%;
            left: 32%;
            border-radius: 15px 15px 5px 5px;
            animation: shadowMove 4s ease-in-out infinite;
        `;
        
        // 머리 부분
        const head = document.createElement('div');
        head.style.cssText = `
            position: absolute;
            width: 25px;
            height: 25px;
            background: rgba(0, 0, 0, 0.3);
            top: -20px;
            left: 2px;
            border-radius: 50%;
        `;
        silhouette.appendChild(head);
        
        this.anomalyContainer.appendChild(silhouette);
    }

    /**
     * 이상 현상 모두 제거
     */
    clearAnomalies() {
        if (this.anomalyContainer) {
            this.anomalyContainer.innerHTML = '';
        }
        
        // 깜빡임 효과 제거
        const ceiling = this.corridorContainer?.querySelector('.corridor-ceiling');
        if (ceiling) {
            ceiling.classList.remove('flicker');
        }
        
        // 바닥 스타일 초기화
        const floor = this.corridorContainer?.querySelector('.corridor-floor');
        if (floor) {
            floor.style.background = `repeating-linear-gradient(
                90deg,
                #c4b5a0 0px,
                #c4b5a0 50px,
                #b8a992 50px,
                #b8a992 100px
            )`;
        }
    }

    /**
     * 통로 스타일 모두 리셋
     */
    resetCorridorStyles() {
        if (!this.corridorContainer) return;
        
        const walls = this.corridorContainer.querySelectorAll('.corridor-wall');
        walls.forEach(wall => {
            wall.style.filter = 'none';
        });
        
        const back = this.corridorContainer.querySelector('.corridor-back');
        if (back) {
            back.style.filter = 'none';
        }
        
        this.clearAnomalies();
    }

    /**
     * 렌더러 클리어
     */
    clear() {
        this.resetCorridorStyles();
        this.currentRound = 1;
        this.hasAnomaly = false;
    }
}

// 전역 객체로 내보내기 및 자동 초기화
window.Renderer = Renderer;

// DOMContentLoaded 시 자동으로 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    window.renderer = new Renderer();
    window.renderer.init();
});
