/**
 * Exit 8 - 메인 진입점
 * 애플리케이션 초기화 및 시작 담당
 */

import { Game } from './game.js';
import { Renderer } from './renderer.js';

// DOM 로드 완료 후 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Exit 8 게임을 시작합니다...');
  
  // 렌더러 초기화
  const renderer = new Renderer('corridor-container');
  window.renderer = renderer;
  
  // 게임 인스턴스 생성
  const game = new Game();
  
  // DOM 요소 초기화
  game.initElements();
  
  // 이벤트 리스너 등록
  game.initEventListeners();
  
  // 렌더러와 게임 연결
  renderer.setGame(game);
  
  // 게임 객체를 전역에 노출 (디버깅 용도)
  window.game = game;
  
  console.log('✅ 게임이 준비되었습니다!');
  console.log('📖 게임 방법:');
  console.log('   - 방향키 또는 A/D 키로 이동');
  console.log('   - Enter/Space: 이상 없음');
  console.log('   - Escape/X: 이상함!');
});
