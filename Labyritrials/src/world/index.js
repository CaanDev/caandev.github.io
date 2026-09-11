/**
 * @fileoverview Точка входа для системы мира (лабиринта).
 * Экспортирует все функции для генерации, управления и взаимодействия с миром.
 * 
 * @module world/index
 */

// ============================================================
// ЛАБИРИНТ
// ============================================================

/**
 * Экспорт основных функций лабиринта
 * @see module:world/maze
 */
export { generateMaze, addProtectedCell, clearProtectedCells } from './maze.js';

// ============================================================
// ГЕНЕРАТОР ЛАБИРИНТА
// ============================================================

/**
 * Экспорт функций генерации лабиринта
 * @see module:world/mazeGenerator
 */
export {
  generateRandomSeed,
  setSeed,
  getSeed,
  getRandomCounter,
  seededRandom,
  nextRandom,
  resetRandomCounter,
  generateMazeOnly,
  addBreakableWalls,
  clearVisitedFlags,
  getUnvisitedNeighbors
} from './mazeGenerator.js';

// ============================================================
// ФИЗИКА
// ============================================================

/**
 * Экспорт функций физики и коллизий
 * @see module:world/physics
 */
export {
  hasLineOfSight,
  hasWallBetween,
  isPortalCell,
  checkWallCollision,
  findPath,
  hasDirectPath
} from './physics.js';

// ============================================================
// КЛЕТКИ
// ============================================================

/**
 * Экспорт класса клетки
 * @see module:world/cells/cell
 */
export { Cell } from './cells/cell.js';

// ============================================================
// КОМНАТЫ
// ============================================================

/**
 * Экспорт функций комнат
 * @see module:world/rooms/treasureRoom
 * @see module:world/rooms/shrineRoom
 * @see module:world/rooms/trapRoom
 */
export {
  generateTreasurePortal,
  generateTreasureMap,
  returnFromTreasureRoom
} from './rooms/treasureRoom.js';

export {
  generateShrinePortal,
  generateShrineRoom,
  returnFromShrineRoom
} from './rooms/shrineRoom.js';

export {
  generateTrapPortal,
  generateTrapRoom,
  returnFromTrapRoom,
  activateTrapRoom,
  startNextWave,
  checkTrapWaveComplete,
  showRealExitPortal
} from './rooms/trapRoom.js';

// ============================================================
// АРЕНА БОССА
// ============================================================

/**
 * Экспорт функций арены босса
 * @see module:world/arena/bossArena
 */
export {
  generateBossArena,
  checkBossActivation,
  spawnBoss,
  updateBossSpawnAnimation
} from './arena/bossArena.js';