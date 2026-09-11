/**
 * @fileoverview Основной модуль генерации и управления лабиринтом.
 * Координирует создание лабиринта, спавн объектов, порталов
 * и управление состоянием мира.
 * 
 * @module world/maze
 */

import { CONFIG, state, player } from '../core/config/index.js';
import { getBiomeByLevel, getBiomeConfig } from '../core/config/biomes.js';
import { Cell } from './cells/cell.js';
import { logger } from '../utils/logger.js';
import { generateMazeOnly, addBreakableWalls, generateRandomSeed, setSeed, getSeed, seededRandom } from './mazeGenerator.js';
import { resetLevelTimer, forceStopSnowfall } from '../systems/weather/snowManager.js';
import { spawnMonsters, spawnArtifacts } from '../entities/objects/spawners/monsterSpawner.js';
import { resetMonsterKillCounter, resetLevelStats, getTransitionStats, setTransitionStatsBonusGold } from '../game/levelTransition.js';
import { removeMapFromInventory } from '../systems/ui/inventory/inventoryUtils.js';
import { spawnTraps } from '../entities/objects/spawners/trapSpawner.js';
import { spawnChests } from '../entities/objects/spawners/chestSpawner.js';
import { spawnTorches } from '../entities/objects/spawners/torchSpawner.js';
import { spawnRunes, clearRunes } from '../entities/objects/spawners/runeSpawner.js';
import { generateTreasurePortal, generateTreasureMap, returnFromTreasureRoom } from './rooms/treasureRoom.js';
import { generateShrinePortal } from './rooms/shrineRoom.js';
import { generateTrapPortal } from './rooms/trapRoom/index.js';
import { generateSafePortal } from './rooms/safeRoom.js';
import { generateBossArena } from './arena/bossArena.js';
import { generateFirefliesForAllPortals, clearFireflies } from '../entities/objects/firefly.js';
import { rebuildFreeCellsCache, invalidateFreeCellsCache } from '../entities/objects/utils/spawnUtils.js';
import { clearAllCaches } from '../utils/cache.js';
import { spawnNotes } from '../systems/notes/index.js';

/** @type {Array<{x: number, y: number}>} - Массив защищённых клеток */
let protectedCells = [];

/**
 * Проверка, является ли клетка защищённой
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean} - true, если клетка защищена
 * @private
 */
function isProtectedCell(x, y) {
  return protectedCells.some(cell => cell.x === x && cell.y === y);
}

/**
 * Добавление защищённой клетки
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {void}
 */
export function addProtectedCell(x, y) {
  protectedCells.push({ x, y });
}

/**
 * Очистка всех защищённых клеток
 * 
 * @returns {void}
 */
export function clearProtectedCells() {
  protectedCells = [];
}

/**
 * Генерация лабиринта
 * 
 * @param {boolean} [isNewGame=true] - Является ли это новой игрой
 * @returns {void}
 */
export function generateMaze(isNewGame = true) {
  clearAllCaches();

  // Проверка и установка биома
  if (!state.currentBiome || state.currentBiome === 'cave' && state.gameLevel > 1) {
    const biomeId = getBiomeByLevel(state.gameLevel);
    state.currentBiome = biomeId;
    const biomeConfig = getBiomeConfig(biomeId);
    logger.game(`🌍 БИОМ: ${biomeConfig.name} (${biomeId}) | Уровень ${state.gameLevel}`);
  }

  // Принудительная остановка снегопада при переходе между уровнями
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  
  // Если игрок не в тайной комнате и не на босс-уровне - остановка снегопада
  if (!isInSecretRoom) forceStopSnowfall();

  // Инициализация Seed
  if (isNewGame || !getSeed()) {
    const newSeed = generateRandomSeed();
    setSeed(newSeed);
  }

  // Очистка состояния
  state.grid = [];
  state.monsters = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.fireballs = [];
  state.damageTexts = [];
  state.torches = [];
  state.fireParticles = [];
  state.sparks = [];
  state.flies = [];
  state.bloodPuddles = [];
  state.pillars = [];

  clearFireflies();
  clearRunes();

  const rows = CONFIG.rows;
  const cols = CONFIG.cols;

  CONFIG.goal = { x: cols - 13, y: rows - 13 };

  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;

  // Сброс карты на новых уровнях (кроме тайный комнат и безопасной комнаты)
  // На босс-уровнях и при переходе на новый уровень (не в тайных комнатах) - сброс карты
  if (isBossLevel || (!isInSecretRoom && !state.justLoaded)) {
    player.hasMap = false;
    removeMapFromInventory();
  }

  // Настройка магазина
  const isShopAvailable = !isInSecretRoom &&
                          !isBossLevel &&
                          state.gameLevel >= CONFIG.shop.minLevel &&
                          state.gameLevel <= 5;

  CONFIG.shopPos = (isShopAvailable) ? { x: 1, y: 1 } : { x: -100, y: -100 };

  // Повторная инициализация Seed (для босс-уровней)
  if (isNewGame || !getSeed()) {
    const newSeed = generateRandomSeed();
    setSeed(newSeed);
  }

  // Сброс статистики
  if (!state.inTreasureRoom && !state.inShrineRoom) {
    resetMonsterKillCounter();
    resetLevelStats();
  }

  // Босс-уровень
  if (isBossLevel) {
    generateBossLevel();
    return;
  }

  // Обычный уровень
  if (isNewGame) state.bonusGiven = false;
  if (!state.justLoaded) state.bonusGiven = false;

  generateMazeOnly();
  addBreakableWalls(0.18);

  // Сброс таймера уровня для системы погоды
  if (!state.inTreasureRoom && !state.inShrineRoom && !state.inTrapRoom) resetLevelTimer();

  // Размещение магазина
  if (CONFIG.shopPos.x >= 0 && CONFIG.shopPos.y >= 0) {
    const shopX = CONFIG.shopPos.x;
    const shopY = CONFIG.shopPos.y;
    if (state.grid[shopY] && state.grid[shopY][shopX]) {
      state.grid[shopY][shopX].isWall = false;
      state.grid[shopY][shopX].revealed = true;
    }
  }

  state.lootItems = [];
  rebuildFreeCellsCache();

  const isTreasureRoom = state.inTreasureRoom;
  const isShrineRoom = state.inShrineRoom;

  // Спавн объектов
  spawnTraps(isTreasureRoom, isProtectedCell);
  spawnMonsters(isTreasureRoom, isProtectedCell);
  spawnArtifacts(isTreasureRoom, isProtectedCell);
  spawnChests(isTreasureRoom, isProtectedCell);
  spawnTorches();

  // Спавн записок
  if (!isBossLevel && !state.inTreasureRoom && !state.inShrineRoom && !state.inTrapRoom && !state.inSafeRoom) spawnNotes();

  state.hadMonsters = state.monsters.length > 0;
  state.initialMonstersCount = state.monsters.length;

  // Генерация порталов
  if (!isBossLevel && !state.inTreasureRoom && !state.inShrineRoom && !state.inTrapRoom && !state.justLoaded) {
    generateTreasurePortal();
    generateShrinePortal();
    generateTrapPortal();
    generateFirefliesForAllPortals();
  }

  // Генерация рун
  if (!isBossLevel && !state.inTreasureRoom) spawnRunes(0.05);

  // Портал в безопасную комнату
  if (!isBossLevel && !state.inTreasureRoom && !state.inShrineRoom && !state.inTrapRoom) generateSafePortal();

  // Позиция игрока
  // На уровнях 2-4 игрок появляется на (2, 1), чтобы не стоять на лавке
  // На остальных уровнях — на (1, 1)
  if (state.gameLevel >= 2 && state.gameLevel <= 4 && !isInSecretRoom && !isBossLevel) {
    player.x = 2;
    player.y = 1;
    player.px = 2 * CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = 1 * CONFIG.cellSize + CONFIG.cellSize / 2;
  } else {
    player.x = 1;
    player.y = 1;
    player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  }
}

/**
 * Генерация босс-уровня
 * 
 * @returns {void}
 * @private
 */
function generateBossLevel() {
  clearAllCaches();
  invalidateFreeCellsCache();

  // Сброс порталов
  state.safePortal = null;
  state.safeExitPortal = null;
  state.inSafeRoom = false;
  state.safeChestOpened = false;
  state.treasurePortal = null;
  state.treasureExitPortal = null;
  state.shrinePortal = null;
  state.shrineExitPortal = null;
  state.trapPortal = null;
  state.trapFakePortal = null;
  state.trapExitPortal = null;
  state.inTreasureRoom = false;
  state.inShrineRoom = false;
  state.inTrapRoom = false;
  state.returnPortal = null;

  const arenaSize = CONFIG.bossArenaSize;
  CONFIG.cols = arenaSize;
  CONFIG.rows = arenaSize;

  // Создание сетки
  state.grid = [];
  for (let y = 0; y < arenaSize; y++) {
    state.grid[y] = [];
    for (let x = 0; x < arenaSize; x++) {
      state.grid[y][x] = new Cell(x, y);
    }
  }

  generateBossArena();
  rebuildFreeCellsCache();
}

/**
 * Очистка флагов порталов на сетке
 * 
 * @returns {void}
 */
export function clearPortalFlags() {
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].hasTreasurePortal = false;
        state.grid[y][x].hasShrinePortal = false;
        state.grid[y][x].hasTrapPortal = false;
        state.grid[y][x].hasSafePortal = false;
        state.grid[y][x].isPortal = false;
        state.grid[y][x].isShrinePortal = false;
        state.grid[y][x].isFakePortal = false;
        state.grid[y][x].isTrapExitPortal = false;
      }
    }
  }
}

// Реэкспорт для обратной совместимости
export { generateTreasureMap, returnFromTreasureRoom };