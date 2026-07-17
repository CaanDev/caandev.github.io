/**
 * @fileoverview Комната-ловушка.
 * Управляет генерацией портала в комнату-ловушку, созданием комнаты,
 * спавном волн монстров и возвратом в основной лабиринт.
 * 
 * @module world/rooms/trapRoom
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { addProtectedCell, clearProtectedCells } from '../maze.js';
import { updateFirefliesColor } from '../../entities/objects/firefly.js';
import { clearPlayerTrails } from '../../entities/objects/playerTrails.js';
import { clearAllRoomParticles } from '../../entities/objects/index.js';
import { clearFireflies, generatedPortals } from '../../entities/objects/firefly.js';
import { createBloodPuddle } from '../../entities/objects/utils/bloodSystem.js';

/**
 * @namespace WAVE_CONFIG
 * @description Конфигурация волн монстров в комнате-ловушке
 * @property {Object} 1 - Первая волна
 * @property {number} 1.count - Количество монстров
 * @property {number} 1.multiplier - Множитель сложности
 * @property {string} 1.label - Текст уведомления
 * @property {string[]} 1.types - Типы монстров
 */
const WAVE_CONFIG = {
  1: { 
    count: 7, 
    multiplier: 1.0, 
    label: '⚔️ ВОЛНА 1! ⚔️',
    types: ['pumpkin', 'bat']
  },
  2: { 
    count: 12, 
    multiplier: 1.15, 
    label: '⚔️ ВОЛНА 2! ⚔️',
    types: ['demon', 'skull']
  },
  3: { 
    count: 15, 
    multiplier: 1.3, 
    label: '⚔️ ВОЛНА 3! ⚔️',
    types: ['scorpion', 'ghost']
  }
};

/** @type {boolean} - Флаг загрузки волны */
let isLoadingWave = false;

/** @type {number} - Размер комнаты-ловушки в клетках */
const TRAP_ROOM_SIZE = 11;

/**
 * Создаёт постоянные следы крови в комнате-ловушке
 * 
 * Размещает случайные кровавые пятна по комнате, создавая атмосферу
 * опасности. Пятна отмечаются как постоянные (isPermanent) и не исчезают
 * со временем. При выходе из комнаты они удаляются.
 * 
 * @returns {void}
 */
function spawnTrapRoomBloodstains() {
  const bloodstainCount = 6 + Math.floor(Math.random() * 6);
  const cellSize = CONFIG.cellSize;
  const roomSize = CONFIG.cols;
  
  for (let i = 0; i < bloodstainCount; i++) {
    let attempts = 0;
    let x, y;
    let found = false;
    
    while (!found && attempts < 100) {
      attempts++;
      x = Math.floor(Math.random() * (roomSize - 2)) + 1;
      y = Math.floor(Math.random() * (roomSize - 2)) + 1;
      
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      
      if (x === Math.floor(roomSize / 2) && y === Math.floor(roomSize / 2)) continue;
      if (x === 1 && y === 1) continue;
      
      let tooClose = false;
      for (const stain of state.bloodPuddles) {
        const stainX = Math.floor(stain.x / cellSize);
        const stainY = Math.floor(stain.y / cellSize);
        if (Math.hypot(stainX - x, stainY - y) < 1.5) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        found = true;
      }
    }
    
    if (found) {
      const posX = x * cellSize + cellSize / 2 + (Math.random() - 0.5) * 30;
      const posY = y * cellSize + cellSize / 2 + (Math.random() - 0.5) * 30;
      
      createBloodPuddle(posX, posY, false);
      
      const recentPuddles = state.bloodPuddles.slice(-8);
      for (const puddle of recentPuddles) {
        const dist = Math.hypot(puddle.x - posX, puddle.y - posY);
        if (dist < 80) {
          puddle.life = 99999;
          puddle.maxLife = 99999;
          puddle.isPermanent = true;
          puddle.isTrapRoomBlood = true;
        }
      }
    }
  }
}

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
 * Генерация пустой арены для комнаты-ловушки
 * 
 * Создаёт сетку размером TRAP_ROOM_SIZE с проходимым полом
 * и стенами по периметру.
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
 * @private
 */
function setupTrapTorches() {
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
 * @private
 */
function createFakeExitPortal() {
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

  showTrapRoomActivationNotification();

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
    startNextWave();
  }, 1200);
}

/**
 * Запуск следующей волны монстров
 * 
 * Проверяет, все ли монстры текущей волны убиты, и запускает
 * следующую волну или открывает выход после 3-й волны.
 * 
 * @returns {void}
 */
export function startNextWave() {
  if (state.trapWave >= 3) return;
  
  const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);
  
  if (aliveMonsters.length > 0) {
    state.trapWaveActive = true;
    return;
  }

  if (state.trapWaveLoaded) {
    state.trapWaveLoaded = false;
    state.trapWave++;
    state.trapWaveActive = true;
    
    if (state.trapWave >= 3) {
      showRealExitPortal();
    } else {
      setTimeout(() => {
        startNextWave();
      }, 500);
    }
    return;
  }

  if (state.trapMonsters.length > 0 && aliveMonsters.length === 0) {
    if (state.trapWave >= 3) {
      showRealExitPortal();
      return;
    }
    state.trapWave++;
    state.trapWaveActive = true;
    const waveConfig = WAVE_CONFIG[state.trapWave];
    const monsterCount = waveConfig.count;
    const waveTypes = waveConfig.types;
    showTrapWaveNotification(state.trapWave);
    spawnTrapMonsters(monsterCount, waveConfig.multiplier, waveTypes);
    return;
  }

  state.trapWave++;
  state.trapWaveActive = true;

  const waveConfig = WAVE_CONFIG[state.trapWave];
  const monsterCount = waveConfig.count;
  const waveTypes = waveConfig.types;

  showTrapWaveNotification(state.trapWave);
  spawnTrapMonsters(monsterCount, waveConfig.multiplier, waveTypes);
}

/**
 * Показ уведомления об активации комнаты-ловушки
 * 
 * @returns {void}
 * @private
 */
function showTrapRoomActivationNotification() {
  state.damageTexts.push({
    x: player.px,
    y: player.py - 120,
    text: '🔥 КОМНАТА-ЛОВУШКА АКТИВИРОВАНА! 🔥',
    color: '#ff2200',
    size: 28,
    life: 100,
    speedy: 0.2
  });

  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: '⚔️ ГОТОВЬТЕСЬ К БИТВЕ! ⚔️',
    color: '#ff6600',
    size: 22,
    life: 90,
    speedy: 0.3
  });

  state.screenShake = 15;
}

/**
 * Спавн монстров для волны
 * 
 * @param {number} count - Количество монстров
 * @param {number} multiplier - Множитель сложности
 * @param {string[]} waveTypes - Типы монстров в волне
 * @returns {void}
 * @private
 */
function spawnTrapMonsters(count, multiplier, waveTypes) {
  if (!waveTypes || !Array.isArray(waveTypes)) {
    console.warn('⚠️ waveTypes не определён, используем типы по умолчанию');
    waveTypes = ['pumpkin', 'bat'];
  }

  const scaling = 1 + (state.gameLevel - 1) * 0.15 * multiplier;

  const typeMap = {
    pumpkin: { emoji: '🎃', hp: 60, damage: 14, radius: 24, name: 'Тыква', speed: 2.2, vision: 350 },
    bat: { emoji: '🦇', hp: 25, damage: 6, radius: 18, name: 'Летучая мышь', speed: 3.0, vision: 280 },
    demon: { emoji: '😈', hp: 120, damage: 28, radius: 28, name: 'Демон', speed: 1.8, vision: 400 },
    skull: { emoji: '💀', hp: 90, damage: 20, radius: 22, name: 'Череп', speed: 2.4, vision: 350 },
    scorpion: { emoji: '🦂', hp: 130, damage: 24, radius: 26, name: 'Скорпион', speed: 1.6, vision: 350, poisonOnHit: true },
    ghost: { emoji: '👻', hp: 35, damage: 8, radius: 22, name: 'Призрак', speed: 1.5, vision: 260, isGhost: true }
  };

  let availableTypes = waveTypes
    .map(type => typeMap[type])
    .filter(t => t !== undefined);

  if (availableTypes.length === 0) {
    console.warn('⚠️ Нет доступных типов монстров для волны, используем fallback');
    availableTypes = [typeMap['pumpkin']];
  }

  const roomSize = CONFIG.cols;
  const centerX = Math.floor(roomSize / 2);
  const centerY = Math.floor(roomSize / 2);

  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);

  const MIN_SPAWN_DISTANCE = 3;

  let spawned = 0;
  let attempts = 0;
  const maxAttempts = 400;

  while (spawned < count && attempts < maxAttempts) {
    attempts++;

    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 2.5;
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance);

    if (x < 1 || x >= roomSize - 1 || y < 1 || y >= roomSize - 1) continue;
    if (x === 1 && y === 1) continue;
    if (x === centerX && y === centerY) continue;

    const distToPlayer = Math.hypot(x - playerGridX, y - playerGridY);
    if (distToPlayer < MIN_SPAWN_DISTANCE) continue;

    if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
      const base = availableTypes[Math.floor(Math.random() * availableTypes.length)];

      const monster = {
        x: x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: y * CONFIG.cellSize + CONFIG.cellSize / 2,
        startX: x * CONFIG.cellSize + CONFIG.cellSize / 2,
        startY: y * CONFIG.cellSize + CONFIG.cellSize / 2,
        hp: Math.floor(base.hp * scaling),
        maxHp: Math.floor(base.hp * scaling),
        damage: Math.floor(base.damage * scaling),
        emoji: base.emoji,
        radius: base.radius,
        name: base.name,
        speed: base.speed,
        vision: base.vision,
        dir: 1,
        isHorizontal: Math.random() < 0.5,
        patrolRange: CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1),
        state: 'chase',
        lastHit: 0,
        stunTimer: 0,
        poisonOnHit: base.poisonOnHit || false,
        isGhost: base.isGhost || false,
        justSpawned: true,
        justSpawnedTimer: 30,
        isTrapMonster: true,
        canDropItems: false
      };

      state.monsters.push(monster);
      state.trapMonsters.push(monster);
      spawned++;
    }
  }

  state.trapMonstersTotal = count;
  state.trapMonstersKilled = 0;
}

/**
 * Проверка завершения текущей волны монстров
 * 
 * Вызывается каждый кадр из игрового цикла.
 * Если все монстры волны убиты — запускает следующую волну
 * или открывает выход после 3-й волны.
 * 
 * @returns {void}
 */
export function checkTrapWaveComplete() {
  if (!state.inTrapRoom) return;
  if (!state.trapActivated) return;
  if (state.trapWave >= 3 && state.trapExitRevealed) return;

  const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);

  if (aliveMonsters.length === 0 && state.trapMonsters.length === 0) {
    state.trapWaveActive = false;

    if (state.trapWave >= 3) {
      showRealExitPortal();
    } else {
      setTimeout(() => {
        if (state.trapMonsters.filter(m => m.hp > 0).length === 0) {
          startNextWave();
        }
      }, 500);
    }
  } else {
    state.trapWaveActive = true;
  }
}

/**
 * Показ уведомления о начале волны
 * 
 * @param {number} wave - Номер волны (1-3)
 * @returns {void}
 * @private
 */
function showTrapWaveNotification(wave) {
  const waveConfig = WAVE_CONFIG[wave];
  if (!waveConfig) return;

  const text = waveConfig.label;

  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: text,
    color: '#ff4444',
    size: 32,
    life: 80,
    speedy: 0.3
  });

  state.screenShake = 10;
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
    console.warn('⚠️ Не найдено место для портала выхода!');
  }
}

/**
 * Показ уведомления об открытии выхода
 * 
 * @returns {void}
 * @private
 */
function showTrapExitNotification() {
  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: '🚪 ВЫХОД ОТКРЫТ! 🚪',
    color: '#2ecc71',
    size: 28,
    life: 80,
    speedy: 0.3
  });

  state.screenShake = 8;
}

/**
 * Изменение цвета факелов в комнате-ловушке
 * 
 * @param {string} flameColor - Новый цвет пламени (HEX)
 * @param {string} glowColor - Новый цвет свечения (HEX)
 * @returns {void}
 * @private
 */
function setTorchesColor(flameColor, glowColor) {
  for (const torch of state.torches) {
    if (torch.isTrapTorch) {
      torch.flameColor = flameColor;
      torch.glowColor = glowColor;
      torch.particleColor = flameColor;
    }
  }
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