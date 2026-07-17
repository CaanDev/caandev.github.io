/**
 * @fileoverview Точка входа для рендеринга игрока.
 * Экспортирует рендерер игрока, линии атаки, следы атаки,
 * спавнеры частиц и функции статусных эффектов.
 * 
 * @module systems/rendering/player/index
 */

// ============================================================
// РЕНДЕРЕР ИГРОКА
// ============================================================

/**
 * Экспорт основного рендерера игрока
 * @see module:systems/rendering/player/playerRenderer
 */
export { drawPlayer } from './playerRenderer.js';

// ============================================================
// ЛИНИЯ АТАКИ
// ============================================================

/**
 * Экспорт рендерера линии атаки
 * @see module:systems/rendering/player/attackRenderer
 */
export { drawAttackLine } from './attackRenderer.js';

// ============================================================
// СЛЕДЫ АТАКИ
// ============================================================

/**
 * Экспорт функций управления следами атаки
 * @see module:systems/rendering/player/trailManager
 */
export {
  drawAttackTrails,
  updateAttackTrails,
  createAttackTrail,
  clearAttackTrails
} from './trailManager.js';

// ============================================================
// СПАВНЕРЫ ЧАСТИЦ
// ============================================================

/**
 * Экспорт функций спавна и обновления частиц
 * @see module:systems/rendering/player/particleSpawner
 */
export {
  spawnBloodDrops,
  updateBloodDrops,
  drawBloodDrops,
  spawnLightningSparks,
  updateLightningSparks,
  drawLightningSparks
} from './particleSpawner.js';

// ============================================================
// СТАТУСНЫЕ ЭФФЕКТЫ
// ============================================================

/**
 * Экспорт функций статусных эффектов игрока
 * @see module:systems/rendering/player/statusEffects
 */
export {
  getPlayerGlowColor,
  getGlowSize,
  getLowHpGlowAlpha,
  getLowHpGlowColor,
  isPlayerGlowing
} from './statusEffects.js';