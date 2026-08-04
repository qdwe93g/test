/**
 * Exit 8 - 게임 로직 테스트
 * 브라우저 콘솔에서 runTests() 를 호출하여 실행
 */

import { Game } from './game.js';
import { ANOMALY_REGISTRY, getAnomalyTypes, getRandomAnomalyType } from './anomaly-registry.js';

export function runTests() {
  console.log('🧪 Exit 8 게임 테스트를 시작합니다...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  // 테스트 1: Game 클래스 정의 확인
  test('Game 클래스가 정의되어 있어야 함', () => {
    assert(typeof Game === 'function', 'Game 은 함수여야 함');
  });
  
  // 테스트 2: 라운드 1 은 항상 정상
  test('라운드 1 은 항상 이상 현상이 없어야 함', () => {
    const game = new Game();
    const config = game.initializeRoundConfig();
    assert(config[1].hasAnomaly === false, '라운드 1 은 hasAnomaly 가 false 여야 함');
    assert(config[1].anomalyType === null, '라운드 1 은 anomalyType 이 null 이어야 함');
  });
  
  // 테스트 3: 라운드 설정이 매번 랜덤한지 확인
  test('라운드 2-7 의 설정은 매번 달라야 함', () => {
    const game1 = new Game();
    const game2 = new Game();
    const config1 = game1.initializeRoundConfig();
    const config2 = game2.initializeRoundConfig();
    
    let hasDifference = false;
    for (let round = 2; round <= 7; round++) {
      if (config1[round].hasAnomaly !== config2[round].hasAnomaly ||
          config1[round].anomalyType !== config2[round].anomalyType) {
        hasDifference = true;
        break;
      }
    }
    assert(hasDifference, '적어도 일부 라운드는 달라야 함');
  });
  
  // 테스트 4: 8 개 라운드가 모두 존재하는지 확인
  test('총 8 개의 라운드가 존재해야 함', () => {
    const game = new Game();
    const config = game.initializeRoundConfig();
    assert(Object.keys(config).length === 8, '8 개의 라운드가 있어야 함');
    assert(config[8] !== undefined, '라운드 8 이 존재해야 함');
  });
  
  // 테스트 5: 라운드 8 에는 항상 이상 현상이 있는지 확인
  test('라운드 8 은 항상 이상 현상이 발생해야 함', () => {
    const game = new Game();
    const config = game.initializeRoundConfig();
    assert(config[8].hasAnomaly === true, '라운드 8 은 hasAnomaly 가 true 여야 함');
    assert(config[8].anomalyType !== null, '라운드 8 은 anomalyType 이 null 이 아니어야 함');
  });
  
  // 테스트 6: 이상 현상 타입이 유효한지 확인
  test('이상 현상 타입은 유효해야 함', () => {
    const validTypes = ['poster', 'light', 'floor', 'sign', 'shadow', 'door', 'hand', 'figure'];
    const game = new Game();
    const config = game.initializeRoundConfig();
    
    for (let round = 2; round <= 8; round++) {
      if (config[round].hasAnomaly && config[round].anomalyType) {
        assert(validTypes.includes(config[round].anomalyType), 
          `라운드 ${round} 의 타입 ${config[round].anomalyType} 이 유효하지 않음`);
      }
    }
  });
  
  // 테스트 7: ANOMALY_REGISTRY 에 모든 타입이 정의되어 있는지 확인
  test('ANOMALY_REGISTRY 에 8 가지 타입이 모두 정의되어 있어야 함', () => {
    const types = getAnomalyTypes();
    assert(types.length === 8, `8 가지 타입이 있어야 함 (현재: ${types.length})`);
    
    const expectedTypes = ['poster', 'light', 'floor', 'sign', 'shadow', 'door', 'hand', 'figure'];
    expectedTypes.forEach(type => {
      assert(types.includes(type), `${type} 타입이 누락됨`);
    });
  });
  
  // 테스트 8: 각 이상 현상에 normalDescription 이 있는지 확인
  test('모든 이상 현상은 normalDescription 을 가져야 함', () => {
    const types = getAnomalyTypes();
    types.forEach(type => {
      const data = ANOMALY_REGISTRY[type];
      assert(data.normalDescription !== undefined, `${type} 에 normalDescription 이 없음`);
      assert(typeof data.normalDescription === 'string', `${type}.normalDescription 이 문자열이 아님`);
    });
  });
  
  // 테스트 9: getRandomAnomalyType 이 유효한 타입을 반환하는지 확인
  test('getRandomAnomalyType 은 유효한 타입을 반환해야 함', () => {
    const validTypes = getAnomalyTypes();
    for (let i = 0; i < 10; i++) {
      const type = getRandomAnomalyType();
      assert(validTypes.includes(type), `무효한 타입 ${type} 이 반환됨`);
    }
  });
  
  // 테스트 10: 게임 승리 조건 확인
  test('모든 라운드를 정확히 통과하면 승리해야 함', () => {
    const game = new Game();
    game.initElements = () => {}; // DOM 요소 초기화 스킵
    game.switchScreen = () => {}; // 화면 전환 스킵
    
    // 게임 시작
    game.startGame = function() {
      this.currentRound = 1;
      this.isPlaying = true;
      this.playerJudgment = null;
      this.roundConfig = this.initializeRoundConfig();
    };
    
    game.gameVictoryCalled = false;
    game.gameVictory = function() {
      this.gameVictoryCalled = true;
      this.isPlaying = false;
    };
    
    game.startGame();
    
    // 1-7 라운드까지 정답 처리 시뮬레이션
    for (let round = 1; round <= 7; round++) {
      game.currentRound = round;
      game.hasAnomaly = game.roundConfig[round].hasAnomaly;
      game.playerJudgment = game.hasAnomaly ? 'anomaly' : 'normal';
      game.processJudgment();
    }
    
    // 8 라운드에서 정답 처리
    game.currentRound = 8;
    game.hasAnomaly = game.roundConfig[8].hasAnomaly;
    game.playerJudgment = 'anomaly'; // 라운드 8 은 항상 이상 현상
    game.processJudgment();
    
    assert(game.gameVictoryCalled, '게임 승리가 호출되어야 함');
  });
  
  // 결과 출력
  console.log('\n' + '='.repeat(50));
  console.log(`📊 테스트 결과: ${passed} 통과, ${failed} 실패`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 모든 테스트가 통과했습니다!');
  } else {
    console.log('⚠️ 일부 테스트가 실패했습니다.');
  }
  
  return { passed, failed, total: passed + failed };
}

// 전역에 노출
window.runTests = runTests;

console.log('📖 테스트 실행 방법: 브라우저 콘솔에서 runTests() 호출');
