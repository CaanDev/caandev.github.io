/**
 * @fileoverview Точка входа для объектов и утилит.
 * Экспортирует все функции для работы с игровыми объектами, частицами и спавнерами.
 * 
 * @module entities/objects
 */

// ============================================================
// УТИЛИТЫ
// ============================================================

/**
 * Экспорт функций для работы с кровью
 * @see module:entities/objects/utils/bloodSystem
 */
export { createBloodPuddle, clearBloodPuddles } from './utils/bloodSystem.js';

/**
 * Экспорт функций для поиска свободных клеток
 * @see module:entities/objects/utils/spawnUtils
 */
export { 
  getRandomFreeCell, 
  getRandomFreeCells, 
  markCellUsed, 
  rebuildFreeCellsCache, 
  invalidateFreeCellsCache, 
  getFreeCellsCount 
} from './utils/spawnUtils.js';

// ============================================================
// ЧАСТИЦЫ И ЭФФЕКТЫ
// ============================================================

/**
 * Экспорт функций создания искр
 * @see module:entities/objects/sparks
 */
export { createSparks } from './sparks.js';

/**
 * Экспорт функций для работы с мухами
 * @see module:entities/objects/fly
 */
export { 
  createFlies, 
  updateFlies, 
  removeFlies, 
  clearAllFlies 
} from './fly.js';

/**
 * Экспорт функций для работы со светлячками
 * @see module:entities/objects/firefly
 */
export { 
  Firefly, 
  generateFirefliesForPortal, 
  generateFirefliesForAllPortals, 
  updateFireflies, 
  drawFireflies, 
  clearFireflies, 
  updateFirefliesColor, 
  removeFirefliesForPortal, 
  generatedPortals 
} from './firefly.js';

/**
 * Экспорт функций для работы со следами игрока
 * @see module:entities/objects/playerTrails
 */
export { 
  spawnPlayerTrail, 
  updatePlayerTrails, 
  drawPlayerTrails, 
  clearPlayerTrails, 
  resetTrailPosition 
} from './playerTrails.js';

/**
 * Экспорт функций для работы со взрывами
 * @see module:entities/objects/explosion
 */
export { 
  createExplosion, 
  updateExplosion, 
  drawExplosion, 
  clearExplosion 
} from './explosion.js';

// ============================================================
// СПАВНЕРЫ
// ============================================================

/**
 * Экспорт функций спавна монстров и артефактов
 * @see module:entities/objects/spawners/monsterSpawner
 */
export { spawnMonsters, spawnArtifacts } from './spawners/monsterSpawner.js';

/**
 * Экспорт функций спавна сундуков
 * @see module:entities/objects/spawners/chestSpawner
 */
export { spawnChests, spawnTreasureRoomLoot } from './spawners/chestSpawner.js';

/**
 * Экспорт функций спавна ловушек
 * @see module:entities/objects/spawners/trapSpawner
 */
export { spawnTraps } from './spawners/trapSpawner.js';

/**
 * Экспорт функций спавна факелов
 * @see module:entities/objects/spawners/torchSpawner
 */
export { 
  spawnTorches, 
  spawnBossTorches, 
  activateAllTorches 
} from './spawners/torchSpawner.js';

/**
 * Экспорт функций спавна рун
 * @see module:entities/objects/spawners/runeSpawner
 */
export { 
  spawnRunes, 
  clearRunes, 
  spawnRunesForShrineRoom 
} from './spawners/runeSpawner.js';

// ============================================================
// ОЧИСТКА
// ============================================================

/**
 * Экспорт функции очистки частиц комнаты
 * @see module:entities/objects/clearRoomEffects
 */
export { clearAllRoomParticles } from './clearRoomEffects.js';