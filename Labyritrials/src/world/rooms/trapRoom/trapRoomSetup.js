/**
 * @fileoverview Настройка комнаты-ловушки.
 * Содержит функции для создания арены, факелов и порталов.
 * 
 * @module world/rooms/trapRoom/trapRoomSetup
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { INVENTORY_IMAGES } from '../../../images/inventoryImages.js';
import { logger } from '../../../utils/logger.js';
import { addProtectedCell } from '../../maze.js';
import { setTorchesColor, showTrapExitNotification } from './trapRoomUtils.js';

/**
 * Генерация пустой арены для комнаты-ловушки
 * 
 * Создаёт сетку размером TRAP_ROOM_SIZE с проходимым полом
 * и стенами по периметру.
 * 
 * @returns {void}
 */
export function generateEmptyArena() {
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

  for (let i = 0; i < arenaSize; i++) {
    if (state.grid[0]) state.grid[0][i].isWall = true;
    if (state.grid[arenaSize - 1]) state.grid[arenaSize - 1][i].isWall = true;
    if (state.grid[i]) state.grid[i][0].isWall = true;
    if (state.grid[i]) state.grid[i][arenaSize - 1].isWall = true;
  }
}

/**
 * Создание факелов в комнате-ловушке
 * 
 * Размещает факелы по периметру комнаты с красным оттенком.
 * Все факелы активны с самого начала.
 * 
 * @returns {void}
 */
export function setupTrapTorches() {
  state.torches = [];
  const arenaSize = CONFIG.cols;

  for (let i = 0; i < arenaSize; i++) {
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: i,
        y: 0,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: COLORS.torches.flame,
        glowColor: COLORS.torches.glow,
        particleColor: COLORS.torches.particle,
        emoji: '🕯️',
        isTrapTorch: true
      });
    }
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: i,
        y: arenaSize - 1,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: COLORS.torches.flame,
        glowColor: COLORS.torches.glow,
        particleColor: COLORS.torches.particle,
        emoji: '🕯️',
        isTrapTorch: true
      });
    }
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: 0,
        y: i,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: COLORS.torches.flame,
        glowColor: COLORS.torches.glow,
        particleColor: COLORS.torches.particle,
        emoji: '🕯️',
        isTrapTorch: true
      });
    }
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: arenaSize - 1,
        y: i,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: COLORS.torches.flame,
        glowColor: COLORS.torches.glow,
        particleColor: COLORS.torches.particle,
        emoji: '🕯️',
        isTrapTorch: true
      });
    }
  }
}

/**
 * Создание фальшивого портала выхода в центре комнаты
 * 
 * При попытке использовать этот портал активируется комната-ловушка.
 * 
 * @returns {void}
 */
export function createFakeExitPortal() {
  const centerX = Math.floor(CONFIG.cols / 2);
  const centerY = Math.floor(CONFIG.rows / 2);

  state.trapFakePortal = {
    x: centerX,
    y: centerY,
    active: true,
    isFake: true
  };

  if (state.grid[centerY] && state.grid[centerY][centerX]) {
    state.grid[centerY][centerX].isFakePortal = true;
  }
}

/**
 * Активация комнаты-ловушки
 * 
 * Запускает первую волну монстров. Вызывается при попытке
 * использовать фальшивый портал выхода.
 * 
 * @returns {void}
 */
export function activateTrapRoom() {
  if (state.trapActivated) return;

  state.trapActivated = true;
  state.trapWave = 0;
  state.trapWaveLoaded = false;

  setTorchesColor(COLORS.torches.flameTrap || '#ff2200', COLORS.torches.glowTrap || '#cc0000');

  state.screenShake = 15;

  import('./trapRoomUtils.js').then(module => {
    module.showTrapRoomActivationNotification();
  });

  setTimeout(() => {
    if (state.trapFakePortal) {
      state.trapFakePortal.active = false;
      const { x, y } = state.trapFakePortal;
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].isFakePortal = false;
      }
    }
  }, 500);

  setTimeout(() => {
    import('./trapRoomWaves.js').then(module => {
      module.startNextWave();
    });
  }, 1200);
}

/**
 * Показ настоящего портала выхода из комнаты-ловушки
 * 
 * Удаляет фальшивый портал, меняет цвет факелов на обычный
 * и создаёт портал выхода в случайной свободной клетке.
 * 
 * @returns {void}
 */
export function showRealExitPortal() {
  if (state.trapExitRevealed) {
    return;
  }

  state.trapExitRevealed = true;

  if (state.trapFakePortal) {
    state.trapFakePortal.active = false;
    const { x, y } = state.trapFakePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].isFakePortal = false;
    }
    state.trapFakePortal = null;
  }

  setTorchesColor(COLORS.torches.flame, COLORS.torches.glow);

  let exitX, exitY;
  let found = false;

  for (let y = 1; y < CONFIG.rows - 1 && !found; y++) {
    for (let x = 1; x < CONFIG.cols - 1 && !found; x++) {
      if (x === 1 && y === 1) continue;
      if (x === Math.floor(CONFIG.cols / 2) && y === Math.floor(CONFIG.rows / 2)) continue;

      if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
        exitX = x;
        exitY = y;
        found = true;
      }
    }
  }

  if (found) {
    state.trapExitPortal = {
      x: exitX,
      y: exitY,
      active: true,
      spawnX: exitX,
      spawnY: exitY
    };

    if (state.grid[exitY] && state.grid[exitY][exitX]) {
      state.grid[exitY][exitX].isTrapExitPortal = true;
      state.grid[exitY][exitX].revealed = true;
    }

    addProtectedCell(exitX, exitY);
    showTrapExitNotification();
  } else {
    logger.warn('⚠️ Не найдено место для портала выхода!');
  }

  // Появление сундука с талисманом
  spawnMimicHunterChest();
}

/**
 * Создание сундука с талисманом охотника на мимиков в центре комнаты-ловушки
 * 
 * @returns {void}
 */
export function spawnMimicHunterChest() {
  // Проверяем, есть ли уже талисман у игрока
  if (player.inventory?.items?.equipment?.includes('talismanMimicHunter')) return;
  // Проверяем, не появлялся ли уже сундук
  if (state.mimicHunterChestSpawned) return;
  // Шанс 33.3%
  if (Math.random() > 0.333) return;
  
  const centerX = Math.floor(CONFIG.cols / 2);
  const centerY = Math.floor(CONFIG.rows / 2);
  
  // Проверяем, что центр не занят
  if (state.grid[centerY]?.[centerX]?.isWall) return;
  
  // Создаём сундук в центре
  state.chests.push({
    x: centerX * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: centerY * CONFIG.cellSize + CONFIG.cellSize / 2,
    type: 'mimic_hunter_chest',
    opened: false,
    countedForAchievement: false,
    spawnX: centerX,
    spawnY: centerY,
  });
  
  state.mimicHunterChestSpawned = true;
}