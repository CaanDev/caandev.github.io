/**
 * @fileoverview Основные функции комнаты-ловушки.
 * Управляет генерацией портала, созданием комнаты и возвратом в основной лабиринт.
 * 
 * @module world/rooms/trapRoom/trapRoomCore
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { addProtectedCell, clearProtectedCells } from '../../maze.js';
import { clearPlayerTrails } from '../../../entities/objects/playerTrails.js';
import { clearAllRoomParticles } from '../../../entities/objects/index.js';
import { clearFireflies, generatedPortals } from '../../../entities/objects/firefly.js';
import { spawnTrapRoomBloodstains, setTorchesColor, showTrapRoomActivationNotification } from './trapRoomUtils.js';
import { generateEmptyArena, setupTrapTorches, createFakeExitPortal } from './trapRoomSetup.js';
import { startNextWave } from './trapRoomWaves.js';

/** @type {number} - Размер комнаты-ловушки в клетках */
const TRAP_ROOM_SIZE = 11;

/**
 * Генерация портала в комнату-ловушку
 * 
 * Ищет подходящую разрушаемую стену для размещения портала.
 * Условия появления:
 * - Не босс-уровень
 * - Уровень >= 8
 * - Прошло не менее 3 уровней с последней комнаты-ловушки
 * - Шанс появления (CONFIG.trapPortalChance)
 * 
 * @returns {void}
 */
export function generateTrapPortal() {
  if (state.isBossLevel) return;
  if (state.trapPortal && state.trapPortal.active) return;
  if (state.gameLevel < 8) return;

  const levelsSinceLastTrap = state.gameLevel - (state.trapRoomLastLevel || 0);
  if (levelsSinceLastTrap < 3 && state.trapRoomLastLevel !== 0) return;

  if (Math.random() > CONFIG.trapPortalChance) return;

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

      let alreadyUsed = false;
      if (state.treasurePortal && state.treasurePortal.x === wallX && state.treasurePortal.y === wallY) {
        alreadyUsed = true;
      }
      if (state.shrinePortal && state.shrinePortal.x === wallX && state.shrinePortal.y === wallY) {
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

  if (found) {
    state.trapPortal = {
      x: wallX,
      y: wallY,
      active: false,
      hidden: true,
      targetMap: 'trap'
    };

    state.trapRoomLastLevel = state.gameLevel;
    state.grid[wallY][wallX].hasTrapPortal = true;
  }
}

/**
 * Генерация комнаты-ловушки
 * 
 * Создаёт изолированную арену с фальшивым порталом выхода и факелами.
 * Сохраняет всё состояние игры для последующего восстановления.
 * 
 * @returns {void}
 */
export function generateTrapRoom() {
  if (state.inTrapRoom) return;

  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();
  clearFireflies();
  generatedPortals.clear();

  // ===== СОХРАНЯЕМ ВСЁ, ЧТО НУЖНО ВОССТАНОВИТЬ =====
  state.originalGrid = state.grid;
  state.originalGoal = { ...CONFIG.goal };
  state.originalShopPos = { ...CONFIG.shopPos };
  state.originalMonsters = [...state.monsters];
  state.originalHadMonsters = state.hadMonsters;
  state.originalTraps = [...state.traps];
  state.originalTorches = [...state.torches];
  state.originalMapCols = CONFIG.cols;
  state.originalMapRows = CONFIG.rows;

  // ===== СОХРАНЯЕМ РАСКРЫТЫЕ КЛЕТКИ (для мини-карты) =====
  state.originalRevealedCells = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].revealed) {
        state.originalRevealedCells.push({ x, y });
      }
    }
  }

  state.originalRunes = [...state.runes];
  state.originalFireflies = state.fireflies ? [...state.fireflies] : [];

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

  CONFIG.cols = TRAP_ROOM_SIZE;
  CONFIG.rows = TRAP_ROOM_SIZE;
  CONFIG.goal = { x: -100, y: -100 };
  CONFIG.shopPos = { x: -100, y: -100 };

  state.roomLabel = 'trap';
  state.roomLabelColor = '#e74c3c';

  state.monsters = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.runes = [];
  state.fireballs = [];
  state.damageTexts = [];
  state.torches = [];
  state.flies = [];
  state.bloodPuddles = [];
  state.inTrapRoom = true;
  state.trapActivated = false;
  state.trapWave = 0;
  state.trapMonstersTotal = 0;
  state.trapMonstersKilled = 0;
  state.trapMonsters = [];
  state.trapWaveActive = false;
  state.trapExitRevealed = false;

  state.bonusGiven = true;
  state.hadMonsters = false;

  generateEmptyArena();
  setupTrapTorches();
  createFakeExitPortal();
  addProtectedCell(1, 1);

  spawnTrapRoomBloodstains();

  player.x = 1;
  player.y = 1;
  player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
}

/**
 * Возврат из комнаты-ловушки в основной лабиринт
 * 
 * Восстанавливает сохранённое состояние игры, очищает
 * временные объекты и возвращает игрока на исходную позицию.
 * 
 * @returns {void}
 */
export function returnFromTrapRoom() {
  if (!state.inTrapRoom) return;

  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();

  if (!state.originalGrid) {
    console.error('❌ [TRAP] originalGrid не существует!');
    state.inTrapRoom = false;
    return;
  }

  // ===== 1. СОХРАНЯЕМ ПОРТАЛ ВХОДА ДЛЯ ДЕАКТИВАЦИИ =====
  const portalX = state.trapPortal?.x;
  const portalY = state.trapPortal?.y;

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

  // ===== ВОССТАНАВЛИВАЕМ ПОРТАЛЫ =====
  if (state.originalTreasurePortal) {
    state.treasurePortal = state.originalTreasurePortal;
  }
  if (state.originalShrinePortal) {
    state.shrinePortal = state.originalShrinePortal;
  }
  if (state.originalTrapPortal) {
    state.trapPortal = state.originalTrapPortal;
    if (state.trapPortal) {
      state.trapPortal.active = false;
      state.trapPortal.hidden = true;
    }
  }
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

  // ===== ВОССТАНАВЛИВАЕМ РУНЫ =====
  if (state.originalRunes) {
    state.runes = state.originalRunes;
  }

  // ===== ВОССТАНАВЛИВАЕМ СВЕТЛЯЧКОВ =====
  if (state.originalFireflies) {
    state.fireflies = state.originalFireflies;
  }

  // ===== ВОССТАНАВЛИВАЕМ СОСТОЯНИЕ КАРТЫ =====
  // Сначала закрываем все клетки
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].revealed = false;
      }
    }
  }
  
  // Открываем только те клетки, что были открыты ДО входа
  if (state.originalRevealedCells) {
    for (const cell of state.originalRevealedCells) {
      if (state.grid[cell.y] && state.grid[cell.y][cell.x]) {
        state.grid[cell.y][cell.x].revealed = true;
      }
    }
  }

  // Проверяем формат сохранённых артефактов
  if (state.originalArtifacts && state.originalArtifacts.length > 0) {
      // Если это массив с gridX/gridY — конвертируем
      if (state.originalArtifacts[0].gridX !== undefined) {
          state.artifacts = state.originalArtifacts.map(a => ({
              x: a.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
              y: a.gridY * CONFIG.cellSize + CONFIG.cellSize / 2
          }));
      } else {
          // Если это уже пиксельные координаты — используем как есть
          state.artifacts = state.originalArtifacts;
      }
  } else {
      state.artifacts = [];
  }

  // Удаляем постоянные пятна крови
  state.bloodPuddles = state.bloodPuddles.filter(p => !p.isTrapRoomBlood);

  // ===== ВОССТАНАВЛИВАЕМ ПОЗИЦИЮ ИГРОКА С ПРОВЕРКОЙ =====
  if (state.returnPortal) {
    let targetX = state.returnPortal.x;
    let targetY = state.returnPortal.y;

    // Проверяем, не стоит ли игрок на клетке портала входа
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

  // Убеждаемся, что игрок не стоит на портале
  if (state.trapPortal && 
      player.x === state.trapPortal.x && 
      player.y === state.trapPortal.y) {
    const directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];
    for (const dir of directions) {
      const newX = player.x + dir.dx;
      const newY = player.y + dir.dy;
      if (state.grid[newY] && state.grid[newY][newX] && !state.grid[newY][newX].isWall) {
        player.x = newX;
        player.y = newY;
        player.px = newX * CONFIG.cellSize + CONFIG.cellSize / 2;
        player.py = newY * CONFIG.cellSize + CONFIG.cellSize / 2;
        break;
      }
    }
  }

  state.bonusGiven = false;
  state.hadMonsters = state.originalHadMonsters || false;
  
  if (state.originalHadMonsters && state.monsters.length === 0) {
    state.bonusGiven = false;
  }

  state.inTrapRoom = false;
  state.trapActivated = false;
  state.trapWave = 0;
  state.trapMonsters = [];
  state.trapMonstersTotal = 0;
  state.trapMonstersKilled = 0;
  state.trapWaveActive = false;
  state.trapExitRevealed = false;
  state.trapFakePortal = null;
  state.trapExitPortal = null;
  state.returnPortal = null;
  state.trapWaveLoaded = false;
  state.trapMonsterIds = new Set();

  state.originalGrid = null;
  state.originalMonsters = [];
  state.originalTraps = [];
  state.originalTorches = [];
  state.originalTrapPortal = null;
  state.originalTreasurePortal = null;
  state.originalShrinePortal = null;
  state.originalSafePortal = null;
  state.originalRunes = null;
  state.originalFireflies = null;
  state.originalHadMonsters = false;
  state.originalRevealedCells = [];
}