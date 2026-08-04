/**
 * Exit 8 - 메인 진입점
 * 애플리케이션 초기화 및 시작 담당
 */

import { GameController } from './game-controller.js';
import { Renderer } from './renderer.js';
import { ANOMALY_REGISTRY } from './anomaly-registry.js';

// DOM 로드 완료 후 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Exit 8 게임을 시작합니다...');

  // 렌더러 초기화
  const renderer = new Renderer('corridor-container');
  window.renderer = renderer;

  // 게임 컨트롤러 초기화
  const controller = new GameController({ renderer });
  controller.initElements();

  // 이벤트 리스너 등록
  if (controller.elements.startBtn) {
    controller.elements.startBtn.addEventListener('click', () => controller.startNewGame());
  }
  if (controller.elements.anomalyListBtn) {
    controller.elements.anomalyListBtn.addEventListener('click', () => controller.showAnomalyList());
  }
  if (controller.elements.backToMenuBtn) {
    controller.elements.backToMenuBtn.addEventListener('click', () => controller.returnToMenu());
  }
  if (controller.elements.restartBtn) {
    controller.elements.restartBtn.addEventListener('click', () => controller.startNewGame());
  }
  if (controller.elements.menuBtn) {
    controller.elements.menuBtn.addEventListener('click', () => controller.returnToMenu());
  }
  if (controller.elements.btnForward) {
    controller.elements.btnForward.addEventListener('click', () => controller.handleForward());
  }
  if (controller.elements.btnBack) {
    controller.elements.btnBack.addEventListener('click', () => controller.handleBackward());
  }

  // 키보드 입력 처리
  document.addEventListener('keydown', (e) => {
    // 포커스가 버튼에 있을 때는 Enter/Space 가 버튼 클릭을 트리거하도록 함
    const activeElement = document.activeElement;
    const isInteractiveElement =
      activeElement.tagName === 'BUTTON' ||
      activeElement.tagName === 'A' ||
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable;

    if (isInteractiveElement && (e.key === 'Enter' || e.key === ' ')) {
      return; // 기본 동작 허용
    }

    controller.handleKeyPress(e);
  });

  // 이상 현상 목록 초기화
  initAnomalyList(controller.elements.anomalyGrid);

  // 컨트롤러를 전역에 노출 (디버깅 용도)
  window.gameController = controller;

  console.log('✅ 게임이 준비되었습니다!');
  console.log('📖 게임 방법:');
  console.log('   - 방향키 또는 A/D 키로 이동 (전진/후진)');
  console.log('   - 정상 통로: "앞으로" 버튼 클릭');
  console.log('   - 이상 통로: "뒤로" 버튼 클릭');
});

function initAnomalyList(anomalyGrid) {
  if (!anomalyGrid) return;

  const anomalies = Object.values(ANOMALY_REGISTRY).map(data => ({
    icon: getAnomalyIcon(data.name),
    name: data.name,
    description: data.description,
    example: `심각도: ${data.severity}`
  }));

  anomalyGrid.innerHTML = anomalies.map(anomaly => `
    <div class="anomaly-card">
      <div class="anomaly-icon">${anomaly.icon}</div>
      <div class="anomaly-name">${anomaly.name}</div>
      <div class="anomaly-description">${anomaly.description}</div>
      <div class="anomaly-example">${anomaly.example}</div>
    </div>
  `).join('');
}

function getAnomalyIcon(name) {
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
