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
      class: 'anomaly-poster'
    }
  },
  [ANOMALY_TYPES.LIGHT]: {
    name: '조명 깜빡임',
    description: '천장의 형광등이 비정상적으로 깜빡이거나 색이 다릅니다.',
    normalDescription: '형광등이 안정적으로 켜져 있습니다.',
    severity: 'medium',
    renderConfig: {
      element: 'div',
      class: 'anomaly-light'
    }
  },
  [ANOMALY_TYPES.FLOOR]: {
    name: '바닥 무늬 이상',
    description: '바닥 타일의 무늬가 끊기거나 색이 다릅니다.',
    normalDescription: '바닥 타일이 규칙적으로 깔려 있습니다.',
    severity: 'low',
    renderConfig: {
      element: 'div',
      class: 'anomaly-floor'
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
      class: 'anomaly-shadow'
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
      class: 'anomaly-hand'
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
      children: [
        {
          element: 'div',
          class: 'eyes'
        },
        {
          element: 'div',
          class: 'eyes'
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

/**
 * Create an encounter factory with injectable randomness
 * @param {Object} options
 * @param {function(): number} [options.random=Math.random] - Injectable RNG
 * @param {string[]} [options.anomalyIds] - List of anomaly IDs to use
 * @param {number} [options.anomalyProbability=0.5] - Probability of anomaly (0-1)
 * @returns {Object} Encounter factory with generate() method
 */
export function createEncounterFactory(options = {}) {
  const random = options.random || Math.random;
  const anomalyIds = options.anomalyIds || getAnomalyTypes();
  const anomalyProbability = options.anomalyProbability !== undefined ? options.anomalyProbability : 0.5;
  
  let previousAnomalyId = null;
  let encounterCounter = 0;
  
  return {
    generate() {
      encounterCounter++;
      
      // Decide if this encounter has an anomaly
      const hasAnomaly = random() < anomalyProbability;
      
      if (!hasAnomaly) {
        return {
          id: `encounter-${encounterCounter}`,
          anomalyId: null
        };
      }
      
      // Select an anomaly that is different from the previous one
      let selectedAnomalyId;
      const availableAnomalies = anomalyIds.filter(id => id !== previousAnomalyId);
      
      if (availableAnomalies.length === 0) {
        // All anomalies are the same as previous (shouldn't happen with 2+ anomalies)
        selectedAnomalyId = anomalyIds[Math.floor(random() * anomalyIds.length)];
      } else {
        selectedAnomalyId = availableAnomalies[Math.floor(random() * availableAnomalies.length)];
      }
      
      previousAnomalyId = selectedAnomalyId;
      
      return {
        id: `encounter-${encounterCounter}`,
        anomalyId: selectedAnomalyId
      };
    },
    
    /**
     * Set a deterministic sequence for testing
     * @param {(string|null)[]} sequence - Array of anomaly IDs (null for normal)
     */
    setSequence(sequence) {
      let index = 0;
      this.generate = () => {
        encounterCounter++;
        const anomalyId = index < sequence.length ? sequence[index] : null;
        index++;
        if (anomalyId) {
          previousAnomalyId = anomalyId;
        }
        return {
          id: `encounter-${encounterCounter}`,
          anomalyId
        };
      };
    }
  };
}

/**
 * Get a random anomaly type (legacy, for backward compatibility)
 * @deprecated Use createEncounterFactory instead
 */
export function getRandomAnomalyType() {
  const types = getAnomalyTypes();
  return types[Math.floor(Math.random() * types.length)];
}
