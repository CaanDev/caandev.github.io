/**
 * @fileoverview Точка входа для рендеринга лабиринта.
 * Экспортирует все компоненты отрисовки: стены, пол, колонны, руны,
 * фон, круг призыва босса и эффекты затемнения.
 * 
 * @module systems/rendering/maze/index
 */

// ============================================================
// СТЕНЫ
// ============================================================

/**
 * Экспорт рендерера стен и шаблонов трещин
 * @see module:systems/rendering/maze/walls/index
 */
export { drawWalls, getCrackTemplate } from './walls/index.js';

// ============================================================
// ПОЛ
// ============================================================

/**
 * Экспорт рендерера пола
 * @see module:systems/rendering/maze/floors/index
 */
export { drawFloor } from './floors/index.js';

// ============================================================
// КОЛОННЫ
// ============================================================

/**
 * Экспорт рендерера колонн
 * @see module:systems/rendering/maze/pillars
 */
export { drawPillars } from './pillars.js';

// ============================================================
// РУНЫ
// ============================================================

/**
 * Экспорт рендерера рун
 * @see module:systems/rendering/maze/runes
 */
export { drawRunes } from './runes.js';

// ============================================================
// КРУГ ПРИЗЫВА БОССА
// ============================================================

/**
 * Экспорт функций круга призыва босса
 * @see module:systems/rendering/maze/bossSummonCircle
 */
export {
  drawBossSummonCircle,
  triggerBossSummonFade,
  updateBossSummonCircle
} from './bossSummonCircle.js';

// ============================================================
// ЗАТЕМНЕНИЕ БОССА
// ============================================================

/**
 * Экспорт функций затемнения и вспышки босса
 * @see module:systems/rendering/maze/bossLightFade
 */
export {
  drawBossLightFade,
  updateBossLightFade,
  resetBossLightFade
} from './bossLightFade.js';

// ============================================================
// ФОН
// ============================================================

/**
 * Экспорт рендерера фона
 * @see module:systems/rendering/maze/background
 */
export { drawBackground } from './background.js';