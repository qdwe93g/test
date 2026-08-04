/**
 * Exit 8 - Game Engine
 * Pure state machine with no DOM access.
 * No document, window, setTimeout, setInterval, CSS, or animations.
 */

/**
 * @typedef {Object} Encounter
 * @property {string} id
 * @property {string|null} anomalyId - null means normal encounter
 */

/**
 * @typedef {Object} GameState
 * @property {'menu'|'observing'|'transitioning'|'victory'} phase
 * @property {number} progress - 0 to 8
 * @property {number} targetProgress - 8
 * @property {Encounter|null} encounter
 * @property {string|null} previousAnomalyId
 * @property {number} runId
 */

/**
 * @typedef {Object} EncounterFactory
 * @property {function(): Encounter} generate
 */

/**
 * Create initial game state
 * @returns {GameState}
 */
export function createInitialState() {
  return {
    phase: 'menu',
    progress: 0,
    targetProgress: 8,
    encounter: null,
    previousAnomalyId: null,
    runId: 0
  };
}

/**
 * Start a new run
 * @param {GameState} state
 * @param {EncounterFactory} encounterFactory
 * @returns {GameState}
 */
export function startRun(state, encounterFactory) {
  const newState = {
    ...createInitialState(),
    phase: 'observing',
    runId: state.runId + 1
  };
  
  if (encounterFactory && typeof encounterFactory.generate === 'function') {
    newState.encounter = encounterFactory.generate();
    if (newState.encounter.anomalyId) {
      newState.previousAnomalyId = newState.encounter.anomalyId;
    }
  }
  
  return newState;
}

/**
 * Evaluate if a choice is correct for an encounter
 * @param {Encounter} encounter
 * @param {'forward'|'back'} direction
 * @returns {{correct: boolean, reason: string}}
 */
export function evaluateChoice(encounter, direction) {
  const isNormal = encounter.anomalyId === null;
  
  // Go Forward means player believes corridor is normal
  // Turn Back means player detected anomaly
  if (direction === 'forward') {
    return {
      correct: isNormal,
      reason: isNormal ? 'correct_normal_forward' : 'wrong_anomaly_forward'
    };
  } else {
    return {
      correct: !isNormal,
      reason: !isNormal ? 'correct_anomaly_back' : 'wrong_normal_back'
    };
  }
}

/**
 * Apply a choice to game state
 * One encounter may change progress at most once.
 * @param {GameState} state
 * @param {'forward'|'back'} direction
 * @returns {{newState: GameState, result: 'correct'|'wrong'|'ignored'|'victory'}}
 */
export function applyChoice(state, direction) {
  // Accept input only in observing phase
  if (state.phase !== 'observing') {
    return {
      newState: { ...state },
      result: 'ignored'
    };
  }
  
  if (!state.encounter) {
    return {
      newState: { ...state },
      result: 'ignored'
    };
  }
  
  const evaluation = evaluateChoice(state.encounter, direction);
  
  // Enter transitioning phase synchronously before any timer/animation
  let newPhase = 'transitioning';
  let newProgress = state.progress;
  let result = evaluation.correct ? 'correct' : 'wrong';
  
  if (evaluation.correct) {
    newProgress = state.progress + 1;
    
    // Victory occurs when progress reaches 8
    if (newProgress >= state.targetProgress) {
      newPhase = 'victory';
      result = 'victory';
    }
  } else {
    // Wrong choice resets progress to 0
    newProgress = 0;
  }
  
  return {
    newState: {
      ...state,
      phase: newPhase,
      progress: newProgress
    },
    result
  };
}

/**
 * Complete transition and prepare next encounter
 * @param {GameState} state
 * @param {EncounterFactory} encounterFactory
 * @returns {GameState}
 */
export function completeTransition(state, encounterFactory) {
  if (state.phase !== 'transitioning' && state.phase !== 'victory') {
    return { ...state };
  }
  
  if (state.phase === 'victory') {
    return { ...state };
  }
  
  let nextEncounter = null;
  let previousAnomalyId = state.previousAnomalyId;
  
  if (encounterFactory && typeof encounterFactory.generate === 'function') {
    nextEncounter = encounterFactory.generate();
    if (nextEncounter.anomalyId) {
      previousAnomalyId = nextEncounter.anomalyId;
    }
  }
  
  return {
    ...state,
    phase: 'observing',
    encounter: nextEncounter,
    previousAnomalyId
  };
}

/**
 * Reset to menu state
 * @param {GameState} state
 * @returns {GameState}
 */
export function resetToMenu(state) {
  return {
    ...createInitialState(),
    runId: state.runId + 1
  };
}

/**
 * Get display info for UI
 * @param {GameState} state
 * @returns {{phase: string, progress: number, targetProgress: number, encounterId: string|null, anomalyId: string|null}}
 */
export function getDisplayInfo(state) {
  return {
    phase: state.phase,
    progress: state.progress,
    targetProgress: state.targetProgress,
    encounterId: state.encounter ? state.encounter.id : null,
    anomalyId: state.encounter ? state.encounter.anomalyId : null
  };
}
