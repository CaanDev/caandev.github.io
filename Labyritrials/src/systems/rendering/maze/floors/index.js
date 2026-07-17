/**
 * @fileoverview Точка входа для рендеринга пола.
 * Экспортирует основной рендерер, конфигурацию полов,
 * узоры и декоративные элементы.
 * 
 * @module systems/rendering/maze/floors/index
 */

// ============================================================
// ОСНОВНОЙ РЕНДЕРЕР
// ============================================================

/**
 * Экспорт основного рендерера пола
 * @see module:systems/rendering/maze/floors/floorRenderer
 */
export { drawFloor } from './floorRenderer.js';

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

/**
 * Экспорт конфигурации полов
 * @see module:systems/rendering/maze/floors/floorConfig
 */
export {
  FLOOR_TYPES,
  getFloorConfig,
  getFloorColors,
  getFloorMainColor,
  isCheckered,
  getFloorFeatures,
  hasFeature,
  getFloorTypeFromState
} from './floorConfig.js';

// ============================================================
// УЗОРЫ
// ============================================================

/**
 * Экспорт функций отрисовки узоров пола
 * @see module:systems/rendering/maze/floors/patterns
 */
export {
  drawSolidFloor,
  drawCheckeredFloor
} from './patterns.js';

// ============================================================
// ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ
// ============================================================

/**
 * Экспорт декоративных элементов пола
 * @see module:systems/rendering/maze/floors/features
 */
export {
  drawMagicCircle,
  drawCornerRunes,
  drawShrineGlow,
  drawTrapGlow
} from './features.js';