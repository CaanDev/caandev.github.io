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

export { drawBloodPuddles } from './bloodRenderer.js';

// ============================================================
// ПРЕДМЕТЫ НА ПОЛУ
// ============================================================

export { drawLoot } from './lootRenderer.js';

// ============================================================
// СУНДУКИ И МУХИ
// ============================================================

export { drawChests, drawFlies } from './chestRenderer.js';

// ============================================================
// ЛАБИРИНТ
// ============================================================

export { drawFloor, drawWalls } from './mazeRenderer.js';

// ============================================================
// МОНСТРЫ
// ============================================================

export { drawMonsters } from './monsterRenderer.js';

// ============================================================
// ЧАСТИЦЫ
// ============================================================

export { drawAllParticles } from './particleRenderer.js';

// ============================================================
// ИГРОК
// ============================================================

export {
  drawPlayer,
  spawnBloodDrops,
  updateBloodDrops,
  drawBloodDrops,
  spawnLightningSparks,
  updateLightningSparks,
  drawLightningSparks
} from './player/index.js';

// ============================================================
// NPC
// ============================================================

export { drawResearcher } from './npcRenderer.js';
export {
  drawNpcQuestIndicator,
  drawTraderQuestIndicator,
  drawResearcherQuestIndicator,
  hasUnacceptedQuest,
  hasNewTraderSpeech,
  shouldShowResearcherIndicator,
} from './npcIndicator.js';

// ============================================================
// ПОРТАЛЫ И МАГАЗИН
// ============================================================

export { drawAllPortals } from './portalRenderer.js';
export { drawShop } from './interactions/shopRenderer.js';

// ============================================================
// СНАРЯДЫ И ЭФФЕКТЫ
// ============================================================

export {
  drawFireballs,
  drawDamageTexts,
  drawSparks,
  drawBeams,
  drawPsionicWave
} from './projectileRenderer.js';

// ============================================================
// БЛУЖДАЮЩИЕ ОГОНЬКИ
// ============================================================

export {
  drawWisps,
  drawWildWisps,
  getWispSprite,
  getWildWispSprite,
  clearWispsSpriteCache,
} from './willOTheWisps/index.js';

// ============================================================
// ЭФФЕКТЫ РЕАЛЬНОСТИ
// ============================================================

export { drawRealityShift, updateRealityShift } from './realityShiftRenderer.js';

// ============================================================
// АЛТАРИ
// ============================================================

export { drawShrines } from './shrineRenderer.js';

// ============================================================
// ФАКЕЛЫ
// ============================================================

export { drawTorches, updateTorchParticles } from './torchRenderer.js';

// ============================================================
// ЛОВУШКИ
// ============================================================

export { drawTraps } from './trapRenderer.js';

// ============================================================
// UI
// ============================================================

export {
  drawMiniMap,
  drawEventIndicator,
  drawAdaptationIndicator,
  drawBossHealthBar,
  drawRoomLabel
} from './uiRenderer.js';

// ============================================================
// УТИЛИТЫ ВИДИМОСТИ
// ============================================================

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

export {
  BatchManager,
  CircleBatch,
  EllipseBatch,
  RectBatch,
  ParticleStyles
} from './batchRenderer.js';