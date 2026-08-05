/**
 * @fileoverview Точка входа для ИИ монстров
 * @module entities/monsters/ai/index
 */

// ===== УПРАВЛЕНИЕ СОСТОЯНИЯМИ =====
export { updateMonsterState } from './states.js';

// ===== ПАМЯТЬ (главный координатор) =====
export { updateMonsterMemory } from './memory.js';

// ===== ДВИЖЕНИЕ (патруль, преследование, бегство) =====
export { 
  updateChaseMovement, 
  updatePatrolMovement, 
  updateFleeMovement 
} from './movement.js';

// ===== ДВИЖЕНИЕ С ИНЕРЦИЕЙ =====
export { 
  smoothMoveToPosition, 
  initMovementState, 
  resetMovement 
} from './smoothMovement.js';

// ===== ПРЕДСКАЗАНИЕ ПУТИ =====
export {
  predictPlayerPath,
  updatePredictedPath,
  getNextPredictionTarget,
  advancePredictionStep
} from './pathPredictor.js';

// ===== СОСТОЯНИЯ ПОИСКА =====
export {
  handleNormalSearch,
  handleExpandedSearch,
  handleMoveToLastKnown
} from './searchStates.js';

// ===== ОБРАБОТКА ЗАСТРЕВАНИЯ =====
export {
  checkAndHandleStuck,
  resetStuckState,
  transitionToPatrol
} from './stuckHandler.js';

// ===== РЕАКЦИЯ НА ЗВУКИ =====
export { updateMonsterHearing, isReactingToSound } from './hearing.js';

// ===== ИСПОЛЬЗОВАНИЕ ЗЕЛИЙ =====
export { usePotionIfNearby } from './potion.js';

// ===== ПОВЕДЕНИЕ ПРИЗРАКОВ =====
export { updateLostGhostBehavior } from './ghost.js';