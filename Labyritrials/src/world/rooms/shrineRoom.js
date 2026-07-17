/**
 * @fileoverview Комната с алтарём.
 * Управляет генерацией портала в комнату с алтарём, созданием комнаты,
 * спавном алтаря с эффектами и возвратом в основной лабиринт.
 * 
 * @module world/rooms/shrineRoom
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { addProtectedCell, clearProtectedCells } from '../maze.js';
import { clearPlayerTrails } from '../../entities/objects/playerTrails.js';
import { clearAllRoomParticles } from '../../entities/objects/index.js';
import { clearFireflies, generatedPortals } from '../../entities/objects/firefly.js';

/**
 * Генерация портала в комнату с алтарём
 * 
 * @returns {void}
 */
export function generateShrinePortal() {
  if (state.isBossLevel) return;
  if (state.shrinePortal && state.shrinePortal.active) return;

  if (state.gameLevel < 3) return;

  // Проверка, сколько уровней прошло с последней комнаты с алтарём
  const levelsSinceLastShrine = state.gameLevel - (state.shrineRoomLastLevel || 0);
  if (levelsSinceLastShrine < 5 && state.shrineRoomLastLevel !== 0) return;
  
  if (Math.random() > CONFIG.shrinePortalChance) return;
  
  let attempts = 0;
  let maxAttempts = 500;
  let wallX, wallY;
  let found = false;
  
  while (!found && attempts < maxAttempts) {
    wallX = Math.floor(Math.random() * (CONFIG.cols - 2)) + 1;
    wallY = Math.floor(Math.random() * (CONFIG.rows - 2)) + 1;
    
    if (state.grid[wallY] && state.grid[wallY][wallX] && 
        state.grid[wallY][wallX].isWall && 
        state.grid[wallY][wallX].isBreakable &&
        (Math.abs(wallX - 1) > 5 || Math.abs(wallY - 1) > 5) &&
        (Math.abs(wallX - CONFIG.goal.x) > 5 || Math.abs(wallY - CONFIG.goal.y) > 5)) {
      
      // Проверка, не занято ли место порталом в сокровищницу
      let alreadyUsed = false;
      if (state.treasurePortal && state.treasurePortal.x === wallX && state.treasurePortal.y === wallY) {
        alreadyUsed = true;
      }
      
      if (!alreadyUsed) {
        let hasAdjacentFree = false;
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (let [dx, dy] of neighbors) {
          const nx = wallX + dx;
          const ny = wallY + dy;
          if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].isWall) {
            hasAdjacentFree = true;
            break;
          }
        }
        
        if (hasAdjacentFree) {
          found = true;
        }
      }
    }
    attempts++;
  }

  // Деактивируем старый портал
  if (state.shrinePortal) {
    state.shrinePortal.active = false;
    state.shrinePortal.hidden = true;
  }
  
  if (found) {
    state.shrinePortal = {
      x: wallX,
      y: wallY,
      active: false,
      hidden: true,
      targetMap: 'shrine'
    };

    state.shrineRoomLastLevel = state.gameLevel;
    state.grid[wallY][wallX].hasShrinePortal = true;
  }
}

/**
 * Генерация комнаты с алтарём
 * 
 * @returns {void}
 */
export function generateShrineRoom() {
  if (state.inShrineRoom) return;
  
  // ===== ОЧИСТКА И СОХРАНЕНИЕ СОСТОЯНИЯ =====
  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();
  clearFireflies();
  generatedPortals.clear();
  
  state.originalGrid = state.grid;
  state.originalGoal = { ...CONFIG.goal };
  state.originalShopPos = { ...CONFIG.shopPos };
  state.originalMonsters = [...state.monsters];
  state.originalHadMonsters = state.hadMonsters;
  state.originalTraps = [...state.traps];
  
  // Сохраняем открытые клетки для мини-карты
  state.originalRevealedCells = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].revealed) {
        state.originalRevealedCells.push({ x, y });
      }
    }
  }
  
  // ===== СОХРАНЕНИЕ ОБЪЕКТОВ =====
  state.originalArtifacts = state.artifacts.map(a => ({
    gridX: Math.floor(a.x / CONFIG.cellSize),
    gridY: Math.floor(a.y / CONFIG.cellSize),
    x: a.x,
    y: a.y
  }));
  
  state.originalChests = state.chests.map(c => ({
    gridX: Math.floor(c.x / CONFIG.cellSize),
    gridY: Math.floor(c.y / CONFIG.cellSize),
    type: c.type,
    opened: c.opened,
    countedForAchievement: c.countedForAchievement || false
  }));
  
  state.originalLootItems = state.lootItems.map(l => ({
    gridX: Math.floor(l.x / CONFIG.cellSize),
    gridY: Math.floor(l.y / CONFIG.cellSize),
    type: l.type,
    value: l.value,
    x: l.x,
    y: l.y
  }));
  
  state.originalShrines = [...state.shrines];
  state.originalTorches = [...state.torches];
  state.originalMapCols = CONFIG.cols;
  state.originalMapRows = CONFIG.rows;

  state.originalRunes = [...state.runes];
  state.originalFireflies = state.fireflies ? [...state.fireflies] : [];

  state.gameStats.secretRoomsGenerated++;
  
  // ===== СОХРАНЕНИЕ ПОРТАЛОВ =====
  state.originalTreasurePortal = state.treasurePortal ? { ...state.treasurePortal } : null;
  state.originalShrinePortal = state.shrinePortal ? { ...state.shrinePortal } : null;
  state.originalTrapPortal = state.trapPortal ? { ...state.trapPortal } : null;
  state.originalSafePortal = state.safePortal ? { ...state.safePortal } : null;
  
  state.returnPortal = {
    x: player.x,
    y: player.y,
    px: player.px,
    py: player.py
  };
  
  // ===== НАСТРОЙКА РАЗМЕРОВ =====
  const roomSize = CONFIG.shrineRoomSize || 11;
  CONFIG.cols = roomSize;
  CONFIG.rows = roomSize;
  CONFIG.goal = { x: -100, y: -100 };
  CONFIG.shopPos = { x: -100, y: -100 };

  state.roomLabel = 'shrine';
  state.roomLabelColor = '#9b59b6';

  state.originalRunes = [...state.runes];
  
  // ===== ОЧИСТКА ОБЪЕКТОВ =====
  state.monsters = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.fireballs = [];
  state.damageTexts = [];
  state.torches = [];
  state.flies = [];
  state.bloodPuddles = [];
  state.runes = [];
  state.inShrineRoom = true;
  
  state.bonusGiven = true;
  state.hadMonsters = false;
  
  // ===== ГЕНЕРАЦИЯ КОМНАТЫ =====
  generateEmptyArena();
  addProtectedCell(1, 1);
  
  player.x = 1;
  player.y = 1;
  player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  
  createShrineInCenter();
  createShrineRoomExit();

  // ===== СПАВН РУН =====
  import('../../entities/objects/spawners/runeSpawner.js').then(module => {
    module.clearRunes();
    module.spawnRunesForShrineRoom();
  });
}

/**
 * Генерация пустой арены для комнаты с алтарём
 * 
 * @returns {void}
 * @private
 */
function generateEmptyArena() {
  const arenaSize = CONFIG.cols;
  
  state.grid = [];
  for (let y = 0; y < arenaSize; y++) {
    state.grid[y] = [];
    for (let x = 0; x < arenaSize; x++) {
      state.grid[y][x] = {
        x: x, y: y,
        isWall: false,
        isBreakable: false,
        visited: false,
        revealed: true
      };
    }
  }
  
  // Стены по периметру
  for (let i = 0; i < arenaSize; i++) {
    if (state.grid[0]) state.grid[0][i].isWall = true;
    if (state.grid[arenaSize - 1]) state.grid[arenaSize - 1][i].isWall = true;
    if (state.grid[i]) state.grid[i][0].isWall = true;
    if (state.grid[i]) state.grid[i][arenaSize - 1].isWall = true;
  }
}

/**
 * Создание алтаря в центре комнаты
 * 
 * @returns {void}
 * @private
 */
function createShrineInCenter() {
  const centerX = Math.floor(CONFIG.cols / 2);
  const centerY = Math.floor(CONFIG.rows / 2);
  
  const pool = [
    { id: 'berserk', text: '🔥 БЕРСЕРК: +15 Урон, но -25 Макс HP' },
    { id: 'greed',   text: '💰 ЖАДНОСТЬ: х2 Золото, но скорость снижена' },
    { id: 'vampire', text: '🦇 ВАМПИРИЗМ: Усилен вампиризм, но -15 Урон' },
    { id: 'guardian',text: '🛡️ СТРАЖ: +50 Макс HP, но урон снижен на 5' }
  ];
  
  const chosenEffect = pool[Math.floor(Math.random() * pool.length)];
  
  state.shrines.push({
    x: centerX * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: centerY * CONFIG.cellSize + CONFIG.cellSize / 2,
    effect: chosenEffect.id,
    effectText: chosenEffect.text,
    activated: false
  });
}

/**
 * Создание портала выхода из комнаты с алтарём
 * 
 * @returns {void}
 * @private
 */
function createShrineRoomExit() {
  if (!state.inShrineRoom) return;
  
  let exitX, exitY;
  let found = false;
  
  // Поиск позиции для выхода (с конца карты)
  for (let y = CONFIG.rows - 2; y > 0 && !found; y--) {
    for (let x = CONFIG.cols - 2; x > 0 && !found; x--) {
      if (x === 1 && y === 1) continue;
      if (x === Math.floor(CONFIG.cols / 2) && y === Math.floor(CONFIG.rows / 2)) continue;
      
      if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
        exitX = x;
        exitY = y;
        found = true;
      }
    }
  }
  
  // Fallback: поиск по всей карте
  if (!found) {
    for (let y = 1; y < CONFIG.rows - 1 && !found; y++) {
      for (let x = 1; x < CONFIG.cols - 1 && !found; x++) {
        if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
          exitX = x;
          exitY = y;
          found = true;
        }
      }
    }
  }
  
  if (found) {
    state.grid[exitY][exitX].isShrinePortal = true;
    state.grid[exitY][exitX].revealed = true;
    
    state.shrineExitPortal = {
      x: exitX,
      y: exitY,
      spawnX: exitX,
      spawnY: exitY,
      active: true
    };
    
    addProtectedCell(exitX, exitY);
  }
}

/**
 * Возврат из комнаты с алтарём в основной лабиринт
 * 
 * @returns {void}
 */
export function returnFromShrineRoom() {
  if (!state.inShrineRoom) return;
  
  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();
  
  if (!state.originalGrid) {
    console.error('❌ [SHRINE] originalGrid не существует!');
    state.inShrineRoom = false;
    return;
  }

  const portalX = state.shrinePortal?.x;
  const portalY = state.shrinePortal?.y;
  
  // Деактивируем портал входа
  if (state.shrinePortal) {
    state.shrinePortal.active = false;
    state.shrinePortal.hidden = true;
  }

  // ===== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ =====
  state.grid = state.originalGrid;
  CONFIG.cols = state.originalMapCols;
  CONFIG.rows = state.originalMapRows;
  CONFIG.goal = state.originalGoal;
  CONFIG.shopPos = state.originalShopPos;
  state.monsters = state.originalMonsters;
  state.traps = state.originalTraps;

  state.roomLabel = null;
  state.roomLabelColor = null;

  // ===== ВОССТАНОВЛЕНИЕ ПОРТАЛА В БЕЗОПАСНУЮ КОМНАТУ =====
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
  
  // ===== ВОССТАНОВЛЕНИЕ АРТЕФАКТОВ =====
  if (state.originalArtifacts && state.originalArtifacts.length > 0) {
    if (state.originalArtifacts[0].gridX !== undefined) {
      state.artifacts = state.originalArtifacts.map(a => ({
        x: a.x !== undefined ? a.x : a.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: a.y !== undefined ? a.y : a.gridY * CONFIG.cellSize + CONFIG.cellSize / 2
      }));
    } else {
      state.artifacts = state.originalArtifacts;
    }
  } else {
    state.artifacts = [];
  }
  
  // ===== ВОССТАНОВЛЕНИЕ СУНДУКОВ =====
  if (state.originalChests && state.originalChests.length > 0) {
    if (state.originalChests[0].gridX !== undefined) {
      state.chests = state.originalChests.map(c => ({
        x: c.x !== undefined ? c.x : c.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: c.y !== undefined ? c.y : c.gridY * CONFIG.cellSize + CONFIG.cellSize / 2,
        type: c.type,
        opened: c.opened,
        countedForAchievement: c.countedForAchievement || false
      }));
    } else {
      state.chests = state.originalChests;
    }
  } else {
    state.chests = [];
  }
  
  // ===== ВОССТАНОВЛЕНИЕ ПРЕДМЕТОВ НА ПОЛУ =====
  if (state.originalLootItems && state.originalLootItems.length > 0) {
    if (state.originalLootItems[0].gridX !== undefined) {
      state.lootItems = state.originalLootItems.map(l => ({
        x: l.x !== undefined ? l.x : l.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: l.y !== undefined ? l.y : l.gridY * CONFIG.cellSize + CONFIG.cellSize / 2,
        type: l.type,
        value: l.value
      }));
    } else {
      state.lootItems = state.originalLootItems;
    }
  } else {
    state.lootItems = [];
  }
  
  state.shrines = state.originalShrines || [];
  state.torches = state.originalTorches || [];

  // ===== ВОССТАНОВЛЕНИЕ ПОРТАЛОВ =====
  if (state.originalTreasurePortal) {
    state.treasurePortal = state.originalTreasurePortal;
  }
  if (state.originalShrinePortal) {
    state.shrinePortal = state.originalShrinePortal;
    if (state.shrinePortal) {
      state.shrinePortal.active = false;
      state.shrinePortal.hidden = true;
    }
  }
  if (state.originalTrapPortal) {
    state.trapPortal = state.originalTrapPortal;
  }
  if (state.originalSafePortal) {
    state.safePortal = state.originalSafePortal;
  }

  // ===== ВОССТАНОВЛЕНИЕ РУН =====
  if (state.originalRunes) {
    state.runes = state.originalRunes;
  }

  // ===== ВОССТАНОВЛЕНИЕ СВЕТЛЯЧКОВ =====
  if (state.originalFireflies) {
    state.fireflies = state.originalFireflies;
  }
  
  // ===== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ КАРТЫ =====
  // Закрываем все клетки
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].revealed = false;
      }
    }
  }
  
  // Открываем только те клетки, что были открыты до входа
  if (state.originalRevealedCells) {
    for (const cell of state.originalRevealedCells) {
      if (state.grid[cell.y] && state.grid[cell.y][cell.x]) {
        state.grid[cell.y][cell.x].revealed = true;
      }
    }
  }
  
  // ===== ВОССТАНОВЛЕНИЕ ПОЗИЦИИ ИГРОКА =====
  if (state.returnPortal) {
    let targetX = state.returnPortal.x;
    let targetY = state.returnPortal.y;
    
    // Если игрок стоит на портале входа — смещаем
    if (portalX !== undefined && portalY !== undefined &&
        targetX === portalX && targetY === portalY) {
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
    
    if (state.grid[targetY] && state.grid[targetY][targetX] && 
        !state.grid[targetY][targetX].isWall) {
      player.x = targetX;
      player.y = targetY;
      player.px = targetX * CONFIG.cellSize + CONFIG.cellSize / 2;
      player.py = targetY * CONFIG.cellSize + CONFIG.cellSize / 2;
    } else {
      player.x = 1;
      player.y = 1;
      player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
      player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
    }
  }
  
  // ===== СБРОС СОСТОЯНИЯ =====
  state.inShrineRoom = false;
  state.returnPortal = null;
  state.shrineExitPortal = null;
  state.bonusGiven = false;
  state.hadMonsters = state.originalHadMonsters || false;

  if (state.originalHadMonsters && state.monsters.length === 0) {
    state.bonusGiven = false;
  }

  // ===== ОЧИСТКА СОХРАНЁННЫХ ДАННЫХ =====
  state.originalGrid = null;
  state.originalMonsters = [];
  state.originalTraps = [];
  state.originalArtifacts = [];
  state.originalChests = [];
  state.originalShrines = [];
  state.originalTorches = [];
  state.originalShrinePortal = null;
  state.originalTreasurePortal = null;
  state.originalTrapPortal = null;
  state.originalSafePortal = null;
  state.originalRunes = null;
  state.originalFireflies = null;
  state.originalRevealedCells = [];
}