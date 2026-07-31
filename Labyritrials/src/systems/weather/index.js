/**
 * @fileoverview Точка входа для системы погоды
 * @module systems/weather/index
 */

// ============================================================
// УПРАВЛЕНИЕ СНЕГОПАДОМ
// ============================================================

export {
  snowState,
  startSnowfall,
  stopSnowfall,
  updateSnowfall,
  updateSnowPositions,
  initSnowManager,
  cleanupSnowManager
} from './snowManager.js';

// ============================================================
// РЕНДЕРИНГ СНЕЖИНОК
// ============================================================

export {
  drawSnow,
  clearSnow,
  getSnowflakeCount,
  createSnowflakes,
  updateSnowPositions
} from './snowRenderer.js';

// ============================================================
// СИСТЕМА ЗАМОРОЗКИ
// ============================================================

export {
  frostState,
  updateFrost,
  resetFrost,
  getFrostProgress,
  isPlayerFrozen,
  isNearActiveTorch
} from './frostSystem.js';