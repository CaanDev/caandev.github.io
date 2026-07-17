/**
 * @fileoverview Безопасная комната.
 * Управляет генерацией портала в безопасную комнату, созданием комнаты,
 * спавном объектов и возвратом в основной лабиринт.
 * 
 * @module world/rooms/safeRoom
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { audio } from '../../audio/audioManager.js';
import { addProtectedCell, clearProtectedCells } from '../maze.js';
import { clearPlayerTrails } from '../../entities/objects/playerTrails.js';
import { clearAllRoomParticles } from '../../entities/objects/index.js';

/** @type {number} - Размер безопасной комнаты */
const SAFE_ROOM_SIZE = CONFIG.safeRoom.size || 9;

/**
 * Генерация портала в безопасную комнату
 * 
 * @returns {void}
 */
export function generateSafePortal() {
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;
  if (isBossLevel) return;
  
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) return;
  
  const minLevel = CONFIG.safeRoom?.minLevel ?? 6;
  if (state.gameLevel < minLevel) return;
  
  if (state.safePortal && state.safePortal.active) return;

  const wallX = 0;
  const wallY = 1;

  if (!state.grid[wallY] || !state.grid[wallY][wallX]) return;
  if (!state.grid[wallY][wallX].isWall) return;

  state.safePortal = {
    x: wallX,
    y: wallY,
    active: true,
    hidden: false,
    targetMap: 'safe'
  };

  const cell = state.grid[wallY][wallX];
  cell.isPortal = true;
  cell.revealed = true;
  cell.isWall = false;
  cell.hasSafePortal = true;
}

/**
 * Генерация безопасной комнаты
 * 
 * @returns {void}
 */
export function generateSafeRoom() {
  if (state.inSafeRoom) return;

  // ===== СОХРАНЕНИЕ СОСТОЯНИЯ =====
  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();

  state.originalGrid = state.grid;
  state.originalGoal = { ...CONFIG.goal };
  state.originalShopPos = { ...CONFIG.shopPos };
  state.originalMonsters = [...state.monsters];
  state.originalHadMonsters = state.hadMonsters;
  state.originalTraps = [...state.traps];
  state.originalTorches = [...state.torches];
  state.originalMapCols = CONFIG.cols;
  state.originalMapRows = CONFIG.rows;
  state.originalArtifacts = state.artifacts.map(a => ({ ...a }));
  state.originalChests = state.chests.map(c => ({ ...c }));
  state.originalLootItems = state.lootItems.map(l => ({ ...l }));
  state.originalFlies = state.flies ? [...state.flies] : [];
  state.originalFireflies = state.fireflies ? [...state.fireflies] : [];

  if (state.originalHadMap === undefined) {
    state.originalHadMap = player.hasMap;
  }
  
  // ===== СОХРАНЕНИЕ ОТКРЫТЫХ КЛЕТОК =====
  state.originalRevealedCells = [];
  if (state.grid) {
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        if (state.grid[y] && state.grid[y][x] && state.grid[y][x].revealed) {
          state.originalRevealedCells.push({ x, y });
        }
      }
    }
  }

  // ===== СОХРАНЕНИЕ ПОРТАЛОВ =====
  state.originalTreasurePortal = state.treasurePortal ? { ...state.treasurePortal } : null;
  state.originalShrinePortal = state.shrinePortal ? { ...state.shrinePortal } : null;
  state.originalTrapPortal = state.trapPortal ? { ...state.trapPortal } : null;
  state.originalSafePortal = state.safePortal ? { ...state.safePortal } : null;

  state.returnPortal = {
    x: 1,
    y: 1,
    px: CONFIG.cellSize + CONFIG.cellSize / 2,
    py: CONFIG.cellSize + CONFIG.cellSize / 2
  };

  // ===== НАСТРОЙКА РАЗМЕРОВ =====
  CONFIG.cols = SAFE_ROOM_SIZE;
  CONFIG.rows = SAFE_ROOM_SIZE;
  CONFIG.goal = { x: -100, y: -100 };

  state.roomLabel = 'safe';
  state.roomLabelColor = '#3498db';

  CONFIG.shopPos = { x: 1, y: 3 };

  // ===== ОЧИСТКА ОБЪЕКТОВ =====
  state.monsters = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.fireballs = [];
  state.damageTexts = [];
  state.runes = [];
  state.flies = [];
  state.fireflies = [];
  state.bloodPuddles = [];

  state.inSafeRoom = true;
  state.bonusGiven = true;
  state.hadMonsters = false;

  state.bookshelves = [];

  // ===== ГЕНЕРАЦИЯ КОМНАТЫ =====
  generateEmptySafeArena();
  addProtectedCell(1, 1);

  // ===== ПОЗИЦИЯ ИГРОКА =====
  player.x = 7;
  player.y = 4;
  player.px = player.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = player.y * CONFIG.cellSize + CONFIG.cellSize / 2;

  createSafeRoomExit();
  spawnSafeRoomTorches();
  if (!state.safeChestOpened) createSafeRoomChest();
  createBookshelf();

  // ===== МУЗЫКА =====
  audio.forcePlayMusic('safeRoom');
}

/**
 * Генерация пустой безопасной арены
 * 
 * @returns {void}
 * @private
 */
function generateEmptySafeArena() {
  const size = CONFIG.cols;

  state.grid = [];
  for (let y = 0; y < size; y++) {
    state.grid[y] = [];
    for (let x = 0; x < size; x++) {
      state.grid[y][x] = {
        x: x, y: y,
        isWall: false,
        isBreakable: false,
        visited: false,
        revealed: true,
        hasBookshelf: false
      };
    }
  }

  // ===== СТЕНЫ ПО ПЕРИМЕТРУ =====
  for (let i = 0; i < size; i++) {
    if (state.grid[0]) state.grid[0][i].isWall = true;
    if (state.grid[size - 1]) state.grid[size - 1][i].isWall = true;
    if (state.grid[i]) state.grid[i][0].isWall = true;
    if (state.grid[i]) state.grid[i][size - 1].isWall = true;
  }
}

/**
 * Спавн факелов в безопасной комнате
 * 
 * @returns {void}
 * @private
 */
function spawnSafeRoomTorches() {
  const size = CONFIG.cols;
  state.torches = [];

  // Верхняя стена
  for (let x = 1; x < size - 1; x += 2) {
    state.torches.push({
      x: x,
      y: 0,
      flickerPhase: Math.random() * Math.PI * 2,
      intensity: 0.7 + Math.random() * 0.3,
      active: true,
      flameColor: COLORS.torches.flame,
      glowColor: COLORS.torches.glow,
      particleColor: COLORS.torches.particle,
      emoji: EMOJIS.torches.normal
    });
  }

  // Нижняя стена
  for (let x = 1; x < size - 1; x += 2) {
    state.torches.push({
      x: x,
      y: size - 1,
      flickerPhase: Math.random() * Math.PI * 2,
      intensity: 0.7 + Math.random() * 0.3,
      active: true,
      flameColor: COLORS.torches.flame,
      glowColor: COLORS.torches.glow,
      particleColor: COLORS.torches.particle,
      emoji: EMOJIS.torches.normal
    });
  }

  // Левая стена
  for (let y = 1; y < size - 1; y += 2) {
    state.torches.push({
      x: 0,
      y: y,
      flickerPhase: Math.random() * Math.PI * 2,
      intensity: 0.7 + Math.random() * 0.3,
      active: true,
      flameColor: COLORS.torches.flame,
      glowColor: COLORS.torches.glow,
      particleColor: COLORS.torches.particle,
      emoji: EMOJIS.torches.normal
    });
  }

  // Правая стена (пропускаем выход на y=4)
  for (let y = 1; y < size - 1; y += 2) {
    if (y === 4) continue;
    
    state.torches.push({
      x: size - 1,
      y: y,
      flickerPhase: Math.random() * Math.PI * 2,
      intensity: 0.7 + Math.random() * 0.3,
      active: true,
      flameColor: COLORS.torches.flame,
      glowColor: COLORS.torches.glow,
      particleColor: COLORS.torches.particle,
      emoji: EMOJIS.torches.normal
    });
  }
}

/**
 * Создание портала выхода из безопасной комнаты
 * 
 * @returns {void}
 * @private
 */
function createSafeRoomExit() {
  const exitX = 8;
  const exitY = 4;

  if (state.grid[exitY] && state.grid[exitY][exitX]) {
    state.grid[exitY][exitX].isWall = false;
    state.grid[exitY][exitX].isPortal = true;
    state.grid[exitY][exitX].revealed = true;
  }

  state.safeExitPortal = {
    x: exitX,
    y: exitY,
    active: true,
    spawnX: exitX,
    spawnY: exitY
  };

  addProtectedCell(exitX, exitY);
}

/**
 * Создание сундука с зельем на клетке (7, 7)
 * 
 * @returns {void}
 * @private
 */
function createSafeRoomChest() {
  const chestX = 7;
  const chestY = 7;

  state.chests.push({
    x: chestX * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: chestY * CONFIG.cellSize + CONFIG.cellSize / 2,
    type: 'potion_chest',
    opened: false,
    countedForAchievement: false
  });
}

/**
 * Создание полок с книгами на клетке (1, 1)
 * Проходимый декоративный объект
 * 
 * @returns {void}
 * @private
 */
function createBookshelf() {
  const x = 1;
  const y = 1;

  if (state.grid[y] && state.grid[y][x]) {
    state.grid[y][x].isWall = false;
    state.grid[y][x].isBreakable = false;
    state.grid[y][x].revealed = true;
    state.grid[y][x].hasBookshelf = true;
    
    if (!state.bookshelves) state.bookshelves = [];
    state.bookshelves.push({ x, y });
  }
}

/**
 * Восстановление открытых клеток из оригинала
 * 
 * @returns {void}
 * @private
 */
function restoreRevealedCellsFromOriginal() {
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].revealed = false;
      }
    }
  }
  
  if (state.originalRevealedCells) {
    for (const cell of state.originalRevealedCells) {
      if (state.grid[cell.y] && state.grid[cell.y][cell.x]) {
        state.grid[cell.y][cell.x].revealed = true;
      }
    }
  }
}

/**
 * Возврат из безопасной комнаты в основной лабиринт
 * 
 * @returns {void}
 */
export function returnFromSafeRoom() {
  if (!state.inSafeRoom) return;

  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();

  if (!state.originalGrid) {
    console.error('❌ [SAFE] originalGrid не существует!');
    state.inSafeRoom = false;
    return;
  }

  // ===== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ =====
  state.grid = state.originalGrid;
  CONFIG.cols = state.originalMapCols;
  CONFIG.rows = state.originalMapRows;
  CONFIG.goal = state.originalGoal;
  CONFIG.shopPos = state.originalShopPos;

  state.roomLabel = null;
  state.roomLabelColor = null;

  state.monsters = state.originalMonsters || [];
  state.traps = state.originalTraps || [];
  state.torches = state.originalTorches || [];

  state.artifacts = state.originalArtifacts || [];
  state.chests = state.originalChests || [];
  state.lootItems = state.originalLootItems || [];
  state.flies = state.originalFlies || [];
  state.fireflies = state.originalFireflies || [];

  // ===== ВОССТАНОВЛЕНИЕ ВИДИМОСТИ КАРТЫ =====
  if (state.originalHadMap) {
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        if (state.grid[y] && state.grid[y][x]) {
          state.grid[y][x].revealed = true;
        }
      }
    }
  } else {
    restoreRevealedCellsFromOriginal();
  }

  // ===== ВОССТАНОВЛЕНИЕ ПОРТАЛОВ =====
  if (state.originalSafePortal) {
    state.safePortal = {
      x: state.originalSafePortal.x,
      y: state.originalSafePortal.y,
      active: true,
      hidden: false,
      targetMap: state.originalSafePortal.targetMap || 'safe'
    };
    
    const px = state.safePortal.x;
    const py = state.safePortal.y;
    if (state.grid[py] && state.grid[py][px]) {
      state.grid[py][px].isPortal = true;
      state.grid[py][px].revealed = true;
      state.grid[py][px].isWall = false;
      state.grid[py][px].hasSafePortal = true;
    }
  }

  if (state.originalTreasurePortal) {
    state.treasurePortal = state.originalTreasurePortal;
    const tx = state.treasurePortal.x;
    const ty = state.treasurePortal.y;
    if (state.grid[ty] && state.grid[ty][tx]) {
      state.grid[ty][tx].hasTreasurePortal = true;
      if (state.treasurePortal.active) {
        state.grid[ty][tx].isPortal = true;
        state.grid[ty][tx].revealed = true;
        state.treasurePortal.hidden = false;
      } else {
        state.treasurePortal.hidden = true;
      }
    }
  }

  if (state.originalShrinePortal) {
    state.shrinePortal = state.originalShrinePortal;
    const sx = state.shrinePortal.x;
    const sy = state.shrinePortal.y;
    if (state.grid[sy] && state.grid[sy][sx]) {
      state.grid[sy][sx].hasShrinePortal = true;
      if (state.shrinePortal.active) {
        state.grid[sy][sx].isShrinePortal = true;
        state.grid[sy][sx].revealed = true;
        state.shrinePortal.hidden = false;
      } else {
        state.shrinePortal.hidden = true;
      }
    }
  }

  if (state.originalTrapPortal) {
    state.trapPortal = state.originalTrapPortal;
    const tx = state.trapPortal.x;
    const ty = state.trapPortal.y;
    if (state.grid[ty] && state.grid[ty][tx]) {
      state.grid[ty][tx].hasTrapPortal = true;
      if (state.trapPortal.active) {
        state.grid[ty][tx].isPortal = true;
        state.grid[ty][tx].revealed = true;
        state.trapPortal.hidden = false;
      } else {
        state.trapPortal.hidden = true;
      }
    }
  }

  // ===== ВОССТАНОВЛЕНИЕ ПОЗИЦИИ ИГРОКА =====
  if (state.returnPortal) {
    let targetX = state.returnPortal.x;
    let targetY = state.returnPortal.y;
    
    if (state.safePortal && 
        targetX === state.safePortal.x && 
        targetY === state.safePortal.y) {
      const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];
      let foundNewPos = false;
      for (const dir of directions) {
        const newX = targetX + dir.dx;
        const newY = targetY + dir.dy;
        if (state.grid[newY] && state.grid[newY][newX] && 
            !state.grid[newY][newX].isWall) {
          targetX = newX;
          targetY = newY;
          foundNewPos = true;
          break;
        }
      }
      if (!foundNewPos) {
        targetX = 1;
        targetY = 1;
      }
    }
    
    player.x = targetX;
    player.y = targetY;
    player.px = targetX * CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = targetY * CONFIG.cellSize + CONFIG.cellSize / 2;
  }

  if (state.originalTreasurePortal) {
    state.treasurePortal = state.originalTreasurePortal;
  }
  if (state.originalShrinePortal) {
    state.shrinePortal = state.originalShrinePortal;
  }
  if (state.originalTrapPortal) {
    state.trapPortal = state.originalTrapPortal;
  }

  // ===== СБРОС СОСТОЯНИЯ =====
  state.inSafeRoom = false;
  state.safeExitPortal = null;
  state.returnPortal = null;
  state.bonusGiven = false;
  state.hadMonsters = state.originalHadMonsters || false;

  if (state.originalHadMonsters && state.monsters.length === 0) {
    state.bonusGiven = false;
  }

  state.chests = state.chests.filter(c => c.type !== 'potion_chest');

  // ===== ОЧИСТКА СОХРАНЁННЫХ ДАННЫХ =====
  state.originalGrid = null;
  state.originalMonsters = [];
  state.originalTraps = [];
  state.originalTorches = [];
  state.originalArtifacts = [];
  state.originalChests = [];
  state.originalLootItems = [];
  state.originalFlies = [];
  state.originalFireflies = [];
  state.originalSafePortal = null;
  state.originalTreasurePortal = null;
  state.originalShrinePortal = null;
  state.originalTrapPortal = null;
  state.originalHadMonsters = false;
  state.originalRevealedCells = [];
  state.bookshelves = [];

  // ===== МУЗЫКА =====
  audio.forcePlayMusic('game');
}