/**
 * @fileoverview Точка входа для системы рендеринга.
 * Экспортирует все компоненты рендеринга: объекты, монстров, игрока,
 * частицы, UI-элементы и утилиты.
 * 
 * @module systems/rendering/index
 */

// ============================================================
// КРОВЬ
// ============================================================

/**
 * Экспорт рендерера кровавых луж
 * @see module:systems/rendering/bloodRenderer
 */
export { drawBloodPuddles } from './bloodRenderer.js';

// ============================================================
// ПРЕДМЕТЫ И СУНДУКИ
// ============================================================

/**
 * Экспорт рендерера предметов, сундуков и мух
 * @see module:systems/rendering/chestRenderer
 */
export { drawLoot, drawChests, drawFlies } from './chestRenderer.js';

// ============================================================
// ЛАБИРИНТ
// ============================================================

/**
 * Экспорт рендерера пола и стен
 * @see module:systems/rendering/mazeRenderer
 */
export { drawFloor, drawWalls } from './mazeRenderer.js';

// ============================================================
// МОНСТРЫ
// ============================================================

/**
 * Экспорт рендерера монстров
 * @see module:systems/rendering/monsterRenderer
 */
export { drawMonsters } from './monsterRenderer.js';

// ============================================================
// ЧАСТИЦЫ
// ============================================================

/**
 * Экспорт рендерера всех частиц
 * @see module:systems/rendering/particleRenderer
 */
export { drawAllParticles } from './particleRenderer.js';

// ============================================================
// ИГРОК
// ============================================================

/**
 * Экспорт рендерера игрока и связанных эффектов
 * @see module:systems/rendering/playerRenderer
 */
export {
  drawPlayer,
  spawnBloodDrops,
  updateBloodDrops,
  drawBloodDrops,
  spawnLightningSparks,
  updateLightningSparks,
  drawLightningSparks
} from './playerRenderer.js';

// ============================================================
// ПОРТАЛЫ И МАГАЗИН
// ============================================================

/**
 * Экспорт рендерера порталов и магазина
 * @see module:systems/rendering/portalRenderer
 */
export { drawShopAndPortal } from './portalRenderer.js';

// ============================================================
// СНАРЯДЫ И ЭФФЕКТЫ
// ============================================================

/**
 * Экспорт рендерера снарядов и текстов урона
 * @see module:systems/rendering/projectileRenderer
 */
export {
  drawFireballs,
  drawDamageTexts,
  drawSparks,
  drawBeams,
  drawPsionicWave
} from './projectileRenderer.js';

// ============================================================
// ЭФФЕКТЫ РЕАЛЬНОСТИ
// ============================================================

/**
 * Экспорт рендерера сдвига реальности
 * @see module:systems/rendering/realityShiftRenderer
 */
export { drawRealityShift, updateRealityShift } from './realityShiftRenderer.js';

// ============================================================
// АЛТАРИ
// ============================================================

/**
 * Экспорт рендерера алтарей
 * @see module:systems/rendering/shrineRenderer
 */
export { drawShrines } from './shrineRenderer.js';

// ============================================================
// ФАКЕЛЫ
// ============================================================

/**
 * Экспорт рендерера факелов
 * @see module:systems/rendering/torchRenderer
 */
export { drawTorches, updateTorchParticles } from './torchRenderer.js';

// ============================================================
// ЛОВУШКИ
// ============================================================

/**
 * Экспорт рендерера ловушек
 * @see module:systems/rendering/trapRenderer
 */
export { drawTraps } from './trapRenderer.js';

// ============================================================
// UI
// ============================================================

/**
 * Экспорт рендерера UI-элементов
 * @see module:systems/rendering/uiRenderer
 */
export {
  drawMiniMap,
  drawEventIndicator,
  drawAdaptationIndicator,
  drawBossHealthBar
} from './uiRenderer.js';

// ============================================================
// УТИЛИТЫ ВИДИМОСТИ
// ============================================================

/**
 * Экспорт утилит проверки видимости
 * @see module:systems/rendering/visibilityUtils
 */
export {
  isVisible,
  isVisibleWithRadius,
  isCellVisible,
  isCellVisibleSimple,
  getVisibleCellRange
} from './visibilityUtils.js';

// ============================================================
// ПАКЕТНЫЙ РЕНДЕРЕР
// ============================================================

/**
 * Экспорт классов пакетного рендерера
 * @see module:systems/rendering/batchRenderer
 */
export {
  BatchManager,
  CircleBatch,
  EllipseBatch,
  RectBatch,
  ParticleStyles
} from './batchRenderer.js';

// ============================================================
// ТРЕЩИНЫ СТЕН
// ============================================================

/**
 * Экспорт шаблонов трещин
 * @see module:systems/rendering/crackTemplates
 */
export { getCrackTemplate } from './crackTemplates.js';