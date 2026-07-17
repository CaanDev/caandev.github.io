/**
 * @fileoverview Точка входа для рендеринга стен.
 * Экспортирует основной рендерер стен, конфигурацию типов стен,
 * особенности стен и шаблоны трещин.
 * 
 * @module systems/rendering/maze/walls/index
 */

// ============================================================
// ОСНОВНОЙ РЕНДЕРЕР
// ============================================================

/**
 * Экспорт основного рендерера стен
 * @see module:systems/rendering/maze/walls/wallRenderer
 */
export { drawWalls } from './wallRenderer.js';

// ============================================================
// КОНФИГУРАЦИЯ СТЕН
// ============================================================

/**
 * Экспорт конфигурации типов стен
 * @see module:systems/rendering/maze/walls/wallConfig
 */
export {
  WALL_TYPES,
  getWallConfig,
  getWallColor,
  getWallBorderColor,
  getWallBorderWidth,
  getWallFeatures,
  hasWallFeature,
  getWallTypeFromState
} from './wallConfig.js';

// ============================================================
// ОСОБЕННОСТИ СТЕН
// ============================================================

/**
 * Экспорт функций особенностей стен
 * @see module:systems/rendering/maze/walls/wallFeatures
 */
export {
  drawCracks,
  drawDemonicGlow,
  drawPsiGlow,
  drawGuardianGlow,
  drawShrineGlow,
  drawTrapGlow,
  clearTreasureCrackCache
} from './wallFeatures.js';

// ============================================================
// ШАБЛОНЫ ТРЕЩИН
// ============================================================

/**
 * Экспорт шаблонов трещин
 * @see module:systems/rendering/maze/walls/crackTemplates
 */
export { getCrackTemplate } from './crackTemplates.js';