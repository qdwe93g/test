// js/renderer.js
import { ANOMALY_REGISTRY } from './anomaly-registry.js';

export class Renderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found.`);
    }
    this.game = null;
    this.anomalyElement = null;
  }

  setGame(game) {
    this.game = game;
  }

  clear() {
    // 이전 이상 현상 제거
    if (this.anomalyElement) {
      this.anomalyElement.remove();
      this.anomalyElement = null;
    }
  }

  renderCorridor(round, hasAnomaly, anomalyType = null) {
    this.clear();
    
    // 기본 통로 렌더링 (CSS 로 처리됨)
    
    // 이상 현상 렌더링
    if (hasAnomaly && anomalyType) {
      this.renderAnomaly(anomalyType);
    }
  }

  renderAnomaly(type) {
    const anomalyData = ANOMALY_REGISTRY[type];
    if (!anomalyData) {
      console.warn(`Unknown anomaly type: ${type}`);
      return;
    }

    const config = anomalyData.renderConfig;
    this.anomalyElement = document.createElement(config.element);
    
    if (config.class) {
      this.anomalyElement.className = config.class;
    }
    
    // 내용물 설정
    if (config.content !== undefined) {
      this.anomalyElement.textContent = config.content;
    }
    
    // 자식 요소 생성
    if (config.children && Array.isArray(config.children)) {
      config.children.forEach(childConfig => {
        const childElement = document.createElement(childConfig.element);
        if (childConfig.class) {
          childElement.className = childConfig.class;
        }
        if (childConfig.content !== undefined) {
          childElement.textContent = childConfig.content;
        }
        this.anomalyElement.appendChild(childElement);
      });
    }
    
    this.container.appendChild(this.anomalyElement);
  }

  renderUI(gameState) {
    // UI 렌더링은 DOM 에서 직접 처리
  }
}
