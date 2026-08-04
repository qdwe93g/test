// js/anomaly-registry.js
// 이상 현상 레지스트리: 모든 이상 현상의 데이터와 설정을 관리합니다.

export const ANOMALY_TYPES = {
  POSTER: 'poster',
  LIGHT: 'light',
  FLOOR: 'floor',
  SIGN: 'sign',
  SHADOW: 'shadow',
  DOOR: 'door',
  HAND: 'hand',
  FIGURE: 'figure'
};

export const ANOMALY_REGISTRY = {
  [ANOMALY_TYPES.POSTER]: {
    name: '포스터 변화',
    description: '벽에 붙은 포스터의 색상이나 모양이 다릅니다.',
    normalDescription: '평범한 광고 포스터가 붙어 있습니다.',
    severity: 'low',
    renderConfig: {
      element: 'div',
      class: 'anomaly-poster',
      style: {
        position: 'absolute',
        left: '10%',
        top: '30%',
        width: '15%',
        height: '20%',
        backgroundColor: '#ff6b6b',
        border: '2px solid #333',
        zIndex: 2
      }
    }
  },
  [ANOMALY_TYPES.LIGHT]: {
    name: '조명 깜빡임',
    description: '천장의 형광등이 비정상적으로 깜빡이거나 색이 다릅니다.',
    normalDescription: '형광등이 안정적으로 켜져 있습니다.',
    severity: 'medium',
    renderConfig: {
      element: 'div',
      class: 'anomaly-light',
      style: {
        position: 'absolute',
        left: '50%',
        top: '5%',
        transform: 'translateX(-50%)',
        width: '40%',
        height: '10px',
        backgroundColor: '#ffeb3b',
        boxShadow: '0 0 15px #ffeb3b',
        animation: 'flicker 0.5s infinite'
      }
    }
  },
  [ANOMALY_TYPES.FLOOR]: {
    name: '바닥 무늬 이상',
    description: '바닥 타일의 무늬가 끊기거나 색이 다릅니다.',
    normalDescription: '바닥 타일이 규칙적으로 깔려 있습니다.',
    severity: 'low',
    renderConfig: {
      element: 'div',
      class: 'anomaly-floor',
      style: {
        position: 'absolute',
        left: '30%',
        bottom: '10%',
        width: '40%',
        height: '10%',
        backgroundColor: '#4a4a4a',
        clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
        zIndex: 1
      }
    }
  },
  [ANOMALY_TYPES.SIGN]: {
    name: '표지판 오류',
    description: '비상구 표지판의 방향이나 문구가 이상합니다.',
    normalDescription: '비상구 표지판이 올바른 방향을 가리키고 있습니다.',
    severity: 'medium',
    renderConfig: {
      element: 'div',
      class: 'anomaly-sign',
      style: {
        position: 'absolute',
        right: '15%',
        top: '25%',
        width: '8%',
        height: '8%',
        backgroundColor: '#fff',
        border: '2px solid green',
        color: 'green',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        transform: 'rotate(180deg)',
        zIndex: 3
      },
      content: 'EXIT'
    }
  },
  [ANOMALY_TYPES.SHADOW]: {
    name: '이상한 그림자',
    description: '출처를 알 수 없는 이상한 그림자가 보입니다.',
    normalDescription: '조명에 따른 자연스러운 그림자만 존재합니다.',
    severity: 'high',
    renderConfig: {
      element: 'div',
      class: 'anomaly-shadow',
      style: {
        position: 'absolute',
        left: '70%',
        top: '40%',
        width: '10%',
        height: '30%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        filter: 'blur(5px)',
        transform: 'skewX(-20deg)',
        zIndex: 1
      }
    }
  },
  [ANOMALY_TYPES.DOOR]: {
    name: '비상구 문 개방',
    description: '닫혀 있어야 할 비상구 문이 열려 있거나 없습니다.',
    normalDescription: '비상구 문이 단단히 닫혀 있습니다.',
    severity: 'high',
    renderConfig: {
      element: 'div',
      class: 'anomaly-door',
      style: {
        position: 'absolute',
        left: '5%',
        top: '20%',
        width: '12%',
        height: '35%',
        border: '3px solid #555',
        backgroundColor: '#222',
        zIndex: 2
      },
      content: ''
    }
  },
  [ANOMALY_TYPES.HAND]: {
    name: '손 등장',
    description: '벽 사이로 손이 나와 있습니다.',
    normalDescription: '벽은 매끄럽고 아무것도 나와있지 않습니다.',
    severity: 'critical',
    renderConfig: {
      element: 'div',
      class: 'anomaly-hand',
      style: {
        position: 'absolute',
        right: '20%',
        top: '50%',
        width: '60px',
        height: '80px',
        backgroundColor: '#ffccbc',
        borderRadius: '30px 30px 10px 10px',
        boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.2)',
        zIndex: 4,
        transform: 'rotate(-10deg)'
      }
    }
  },
  [ANOMALY_TYPES.FIGURE]: {
    name: '검은 형상',
    description: '통로 끝에 검은 사람 형상이 서 있습니다.',
    normalDescription: '통로 끝에 아무도 없습니다.',
    severity: 'critical',
    renderConfig: {
      element: 'div',
      class: 'anomaly-figure',
      style: {
        position: 'absolute',
        left: '50%',
        top: '35%',
        transform: 'translateX(-50%)',
        width: '40px',
        height: '100px',
        backgroundColor: '#000',
        borderRadius: '20px 20px 0 0',
        zIndex: 1,
        opacity: '0.9'
      },
      children: [
        {
          element: 'div',
          class: 'eyes',
          style: {
            position: 'absolute',
            top: '20px',
            left: '10px',
            width: '6px',
            height: '6px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            animation: 'glow 2s infinite'
          }
        },
        {
          element: 'div',
          class: 'eyes',
          style: {
            position: 'absolute',
            top: '20px',
            right: '10px',
            width: '6px',
            height: '6px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            animation: 'glow 2s infinite'
          }
        }
      ]
    }
  }
};

export function getAnomalyTypes() {
  return Object.values(ANOMALY_TYPES);
}

export function getAnomalyData(type) {
  return ANOMALY_REGISTRY[type] || null;
}

export function getRandomAnomalyType() {
  const types = getAnomalyTypes();
  return types[Math.floor(Math.random() * types.length)];
}
