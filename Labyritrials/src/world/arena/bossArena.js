/**
 * @fileoverview Генерация арены босса и управление появлением босса.
 * Создаёт арену для битвы с боссом, управляет активацией босса,
 * спавном и анимацией появления.
 * 
 * @module world/arena/bossArena
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { Cell } from '../cells/cell.js';
import { spawnBossTorches } from '../../entities/objects/spawners/torchSpawner.js';
import { triggerBossSummonFade, updateBossSummonCircle } from '../../systems/rendering/maze/bossSummonCircle.js';
import { getBossByLevel } from '../../entities/monsters/bosses/config.js';
import { resetBossLightFade } from '../../systems/rendering/maze/index.js';
import { 
  PhaseSummonAbility, 
  SummonMinionsAbility, 
  SpeedBoostAbility, 
  ShootFireballAbility, 
  MindBallAbility, 
  PsionicWaveAbility,
  TeleportWithTrapAbility,
  RageAbility,
  EmpoweredSummonAbility,
  TremorAbility,
  CircleFireballAbility
} from '../../entities/monsters/bosses/abilities/index.js';

/**
 * @namespace PILLAR_CONFIG
 * @description Конфигурация колонн на арене босса 15 уровня
 */
const PILLAR_CONFIG = {
  innerRadius: 7,
  outerRadius: 11,
  innerCount: 6,
  outerCount: 10,
  size: 0.65,
  torchChance: 0.35,
};

/**
 * Генерация арены босса
 * 
 * @returns {void}
 */
export function generateBossArena() {
  // ===== ОЧИСТКА СОСТОЯНИЯ =====
  state.monsters = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.fireballs = [];
  state.damageTexts = [];
  state.pillars = [];
  state.torches = [];

  state.bossLightFade = {
    active: false,
    progress: 0,
    flashActive: false,
    flashTimer: 0,
  };

  const arenaSize = CONFIG.bossArenaSize;
  CONFIG.goal = { x: arenaSize - 2, y: arenaSize - 2 };
  
  // ===== ЗАПОЛНЯЕМ ВСЁ СТЕНАМИ =====
  for (let y = 0; y < arenaSize; y++) {
    for (let x = 0; x < arenaSize; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].isWall = true;
        state.grid[y][x].isBreakable = false;
        state.grid[y][x].isPillar = false;
        state.grid[y][x].revealed = false;
        state.grid[y][x].hasSafePortal = false;
        state.grid[y][x].isPortal = false;
        state.grid[y][x].hasTreasurePortal = false;
        state.grid[y][x].hasShrinePortal = false;
        state.grid[y][x].hasTrapPortal = false;
        state.grid[y][x].isShrinePortal = false;
        state.grid[y][x].isFakePortal = false;
        state.grid[y][x].isTrapExitPortal = false;
      }
    }
  }
  
  // ===== ВНУТРЕННЯЯ ОБЛАСТЬ ПРОХОДИМА =====
  for (let y = 1; y < arenaSize - 1; y++) {
    for (let x = 1; x < arenaSize - 1; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].isWall = false;
      }
    }
  }
  
  // ===== КЛЕТКА СТАРТА ПРОХОДИМА =====
  if (state.grid[2] && state.grid[2][2]) {
    state.grid[2][2].isWall = false;
  }
  
  // ===== КЛЕТКА ВЫХОДА ПРОХОДИМА =====
  const exitX = arenaSize - 2;
  const exitY = arenaSize - 2;
  if (state.grid[exitY] && state.grid[exitY][exitX]) {
    state.grid[exitY][exitX].isWall = false;
  }
  
  // ===== КЛЕТКА (0, 1) — СТЕНА (место портала в безопасную комнату) =====
  if (state.grid[1] && state.grid[1][0]) {
    state.grid[1][0].isWall = true;
    state.grid[1][0].isBreakable = false;
    state.grid[1][0].hasSafePortal = false;
    state.grid[1][0].isPortal = false;
    state.grid[1][0].revealed = false;
  }
  
  state.isBossLevel = true;
  player.hasMap = true;
  state.lootItems = [];

  const bossLevel = Math.floor(state.gameLevel / 5) * 5;
  let bossType = 'demon';
  if (bossLevel === 10) bossType = 'mind';
  if (bossLevel === 15) bossType = 'duo';
  
  // ===== СПАВН ФАКЕЛОВ =====
  spawnBossTorches(arenaSize, bossType);

  // ===== СПАВН КОЛОНН (только на уровне 15) =====
  if (bossLevel === 15) {
    spawnPillars(arenaSize);
  }
  
  // ===== СБРОС СОСТОЯНИЯ БОССА =====
  state.bossSpawned = false;
  state.bossSpawnTriggered = false;
  state.bossSpawnTimer = 0;
  state.bossReady = false;

  state.bossLightFade = {
    active: false,
    progress: 0,
    flashActive: false,
    flashTimer: 0,
  };
  
  state.pendingBossData = {
    arenaSize: arenaSize,
    scaling: 1 + (state.gameLevel - 1) * 0.15,
    bossLevel: Math.floor(state.gameLevel / 5) * 5
  };

  state.hadMonsters = false;
}

/**
 * Спавн колонн на арене (уровень 15)
 * 
 * @param {number} arenaSize - Размер арены
 * @returns {void}
 * @private
 */
function spawnPillars(arenaSize) {
  const centerX = arenaSize / 2;
  const centerY = arenaSize / 2;
  
  // Внутренний круг колонн
  for (let i = 0; i < PILLAR_CONFIG.innerCount; i++) {
    const angle = (Math.PI * 2 / PILLAR_CONFIG.innerCount) * i;
    const radius = PILLAR_CONFIG.innerRadius;
    const px = Math.round(centerX + Math.cos(angle) * radius);
    const py = Math.round(centerY + Math.sin(angle) * radius);
    
    if (px > 1 && px < arenaSize - 2 && py > 1 && py < arenaSize - 2) {
      createPillar(px, py);
    }
  }
  
  // Внешний круг колонн
  for (let i = 0; i < PILLAR_CONFIG.outerCount; i++) {
    const angle = (Math.PI * 2 / PILLAR_CONFIG.outerCount) * i + Math.PI / PILLAR_CONFIG.outerCount;
    const radius = PILLAR_CONFIG.outerRadius;
    const px = Math.round(centerX + Math.cos(angle) * radius);
    const py = Math.round(centerY + Math.sin(angle) * radius);
    
    if (px > 1 && px < arenaSize - 2 && py > 1 && py < arenaSize - 2) {
      const distToCenter = Math.hypot(px - centerX, py - centerY);
      if (distToCenter > PILLAR_CONFIG.innerRadius + 1.5) {
        createPillar(px, py);
      }
    }
  }
}

/**
 * Создание отдельной колонны
 * 
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @returns {void}
 * @private
 */
function createPillar(gridX, gridY) {
  if (!state.grid[gridY] || !state.grid[gridY][gridX]) return;
  if (state.grid[gridY][gridX].isWall) return;
  
  state.grid[gridY][gridX].isPillar = true;
  state.grid[gridY][gridX].isWall = false;
  state.grid[gridY][gridX].revealed = true;

  const hasTorch = Math.random() < PILLAR_CONFIG.torchChance;
  
  state.pillars.push({
    x: gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: gridY * CONFIG.cellSize + CONFIG.cellSize / 2,
    gridX: gridX,
    gridY: gridY,
    size: CONFIG.cellSize * PILLAR_CONFIG.size,
    isPillar: true,
    hasTorch: hasTorch,
    torchFlicker: Math.random() * Math.PI * 2
  });
}

/**
 * Проверка активации босса при приближении игрока
 * 
 * @returns {boolean} - true, если босс активирован
 */
export function checkBossActivation() {
  if (state.bossSpawned || state.bossSpawnTriggered) return false;
  
  const arenaSize = CONFIG.bossArenaSize;
  const centerX = (arenaSize / 2) * CONFIG.cellSize;
  const centerY = (arenaSize / 2) * CONFIG.cellSize;
  
  const distToCenter = Math.hypot(player.px - centerX, player.py - centerY);
  const activationRadius = 180;
  
  if (distToCenter < activationRadius) {
    state.bossSpawnTriggered = true;
    state.bossSpawnTimer = 60;

    // Запуск анимации затемнения
    state.bossLightFade.active = true;
    state.bossLightFade.progress = 0;
    state.bossLightFade.flashActive = false;
    state.bossLightFade.flashTimer = 0;
    state.bossReady = false;
    
    state.screenShake = 8;
    state.damageTexts.push({
      x: player.px, y: player.py - 80,
      text: `👑 БОСС ПРОСЫПАЕТСЯ! 👑`,
      color: COLORS.ui.textGold,
      size: 24,
      life: 60,
      speedy: 0.3
    });
    
    return true;
  }
  return false;
}

/**
 * Спавн босса на арене
 * 
 * @returns {void}
 */
export function spawnBoss() {
  if (state.bossSpawned) return;

  // Запуск анимации исчезновения круга призыва
  triggerBossSummonFade();

  if (!state.pendingBossData) {
    const arenaSize = CONFIG.bossArenaSize || 25;
    state.pendingBossData = {
      arenaSize: arenaSize,
      scaling: 1 + (state.gameLevel - 1) * 0.15,
      bossLevel: Math.floor(state.gameLevel / 5) * 5
    };
  }
  
  const { arenaSize, scaling, bossLevel } = state.pendingBossData;
  
  const spawnX = Math.floor(arenaSize / 2) * CONFIG.cellSize + CONFIG.cellSize / 2;
  const spawnY = Math.floor(arenaSize / 2) * CONFIG.cellSize + CONFIG.cellSize / 2;
  
  // ===== СОЗДАНИЕ БОССА В ЗАВИСИМОСТИ ОТ УРОВНЯ =====
  switch (bossLevel) {
    case 5:
      spawnDemonBoss(spawnX, spawnY, scaling);
      break;
    case 10:
      spawnMindBoss(spawnX, spawnY, scaling);
      break;
    case 15:
      const spawnX1 = Math.floor(arenaSize / 3) * CONFIG.cellSize + CONFIG.cellSize / 2;
      const spawnX2 = Math.floor(arenaSize * 2 / 3) * CONFIG.cellSize + CONFIG.cellSize / 2;
      const spawnYCenter = Math.floor(arenaSize / 2) * CONFIG.cellSize + CONFIG.cellSize / 2;
      spawnDuoBosses(spawnX1, spawnX2, spawnYCenter, scaling);
      break;
    default:
      spawnDemonBoss(spawnX, spawnY, scaling);
  }
  
  state.bossSpawned = true;
  state.hadMonsters = state.monsters.length > 0;
  
  state.screenShake = 15;
  state.damageTexts.push({
    x: spawnX, y: spawnY - 60,
    text: `💀 БОСС ПОЯВИЛСЯ! 💀`,
    color: COLORS.ui.textRed,
    size: 26,
    life: 60,
    speedy: 0.3
  });
}

/**
 * Обновление анимации появления босса
 * 
 * @returns {void}
 */
export function updateBossSpawnAnimation() {
  if (!state.bossSpawnTriggered || state.bossSpawned) return;
  
  if (state.bossSpawnTimer > 0) {
    state.bossSpawnTimer--;
    
    // Эффект пульсации и тряски во время появления
    const pulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    state.screenShake = Math.sin(Date.now() * 0.03) * 3;
    
    if (state.bossSpawnTimer <= 0) {
      spawnBoss();
    }
  }
}

/**
 * Создание босса "Верховный демон" (уровень 5)
 * 
 * @param {number} x - Координата X появления
 * @param {number} y - Координата Y появления
 * @param {number} scaling - Масштабирование характеристик
 * @returns {void}
 * @private
 */
function spawnDemonBoss(x, y, scaling) {
  const bossConfig = getBossByLevel(5);
  
  state.monsters.push({
    x: x, y: y, startX: x, startY: y,
    hp: Math.floor(bossConfig.baseHp * scaling),
    maxHp: Math.floor(bossConfig.baseHp * scaling),
    damage: Math.floor(bossConfig.baseDamage * scaling),
    emoji: bossConfig.emoji,
    bossType: bossConfig.bossType,
    radius: bossConfig.radius,
    name: bossConfig.name,
    speed: bossConfig.baseSpeed,
    vision: bossConfig.vision,
    dir: 1, isHorizontal: true, patrolRange: 0,
    state: 'chase', lastHit: 0, stunTimer: 0,
    minionCooldown: 0, phaseChanged: false,
    attackCooldown: 0, invertedControls: false,
    isBoss: true,
    isDuoBoss: false,
    pathUpdateCounter: 0,
    currentPathTarget: null,
    abilities: {
      phaseSummon: new PhaseSummonAbility(),
      periodicSummon: new SummonMinionsAbility(),
      speedBoost: new SpeedBoostAbility(),
      rage: new RageAbility(),
      empoweredSummon: new EmpoweredSummonAbility(),
      tremor: new TremorAbility()
    },
    currentPhase: 1,
    phaseThresholds: [0.75, 0.5],
    updatePhase: function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      let newPhase = 1;
      
      for (let i = 0; i < this.phaseThresholds.length; i++) {
        if (percent < this.phaseThresholds[i]) {
          newPhase = i + 2;
        } else {
          break;
        }
      }
      
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    }
  });
}

/**
 * Создание босса "Разум" (уровень 10)
 * 
 * @param {number} x - Координата X появления
 * @param {number} y - Координата Y появления
 * @param {number} scaling - Масштабирование характеристик
 * @returns {void}
 * @private
 */
function spawnMindBoss(x, y, scaling) {
  const bossConfig = getBossByLevel(10);
  
  state.monsters.push({
    x: x, y: y, startX: x, startY: y,
    hp: Math.floor(bossConfig.baseHp * scaling),
    maxHp: Math.floor(bossConfig.baseHp * scaling),
    damage: Math.floor(bossConfig.baseDamage * scaling),
    emoji: bossConfig.emoji,
    bossType: bossConfig.bossType,
    radius: 98,
    name: bossConfig.name,
    speed: bossConfig.baseSpeed,
    vision: bossConfig.vision,
    dir: 1, isHorizontal: true, patrolRange: 0,
    state: 'chase', lastHit: 0, stunTimer: 0,
    minionCooldown: 0, phaseChanged: false,
    attackCooldown: 0, invertedControls: false,
    isBoss: true,
    isDuoBoss: false,
    pathUpdateCounter: 0,
    currentPathTarget: null,
    abilities: {
      mindBall: new MindBallAbility(),
      psionicWave: new PsionicWaveAbility(),
      teleportWithTrap: new TeleportWithTrapAbility()
    },
    currentPhase: 1,
    lastPhase: 1,
    phase2MessageShown: false,
    phase3MessageShown: false,
    lastWave: 0,
    lastTeleport: 0,
    phaseThresholds: [0.75, 0.4],
    updatePhase: function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      let newPhase = 1;
      
      for (let i = 0; i < this.phaseThresholds.length; i++) {
        if (percent < this.phaseThresholds[i]) {
          newPhase = i + 2;
        } else {
          break;
        }
      }
      
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    }
  });
}

/**
 * Создание дуэта боссов (уровень 15)
 * 
 * @param {number} x1 - Координата X первого босса (преследователь)
 * @param {number} x2 - Координата X второго босса (стрелок)
 * @param {number} y - Координата Y обоих боссов
 * @param {number} scaling - Масштабирование характеристик
 * @returns {void}
 * @private
 */
function spawnDuoBosses(x1, x2, y, scaling) {
  const bossConfig = getBossByLevel(15);
  
  if (!bossConfig || !bossConfig.chaser || !bossConfig.shooter) return;
  
  // ===== ПРЕСЛЕДОВАТЕЛЬ =====
  state.monsters.push({
    id: 'duo_chaser_' + Date.now() + '_' + Math.random(),
    x: x1, y: y, startX: x1, startY: y,
    hp: Math.floor(bossConfig.chaser.baseHp * scaling),
    maxHp: Math.floor(bossConfig.chaser.baseHp * scaling),
    damage: Math.floor(bossConfig.chaser.baseDamage * scaling),
    emoji: bossConfig.chaser.emoji,
    bossType: bossConfig.chaser.bossType,
    radius: bossConfig.chaser.radius,
    name: bossConfig.chaser.name,
    speed: bossConfig.chaser.baseSpeed,
    vision: bossConfig.chaser.vision,
    dir: 1, isHorizontal: true, patrolRange: 0,
    state: 'chase', lastHit: 0, stunTimer: 0,
    minionCooldown: 0, phaseChanged: false,
    attackCooldown: 0, invertedControls: false,
    isBoss: true,
    isDuoBoss: true,
    duoRole: 'chaser',
    pathUpdateCounter: 0,
    currentPathTarget: null,
    abilities: {
      speedBoost: new SpeedBoostAbility()
    },
    currentPhase: 1,
    phaseThresholds: [0.5],
    updatePhase: function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      const newPhase = percent < 0.5 ? 2 : 1;
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    }
  });
  
  // ===== СТРЕЛОК =====
  state.monsters.push({
    id: 'duo_shooter_' + Date.now() + '_' + Math.random(),
    x: x2, y: y, startX: x2, startY: y,
    hp: Math.floor(bossConfig.shooter.baseHp * scaling),
    maxHp: Math.floor(bossConfig.shooter.baseHp * scaling),
    damage: Math.floor(bossConfig.shooter.baseDamage * scaling),
    emoji: bossConfig.shooter.emoji,
    bossType: bossConfig.shooter.bossType,
    radius: bossConfig.shooter.radius,
    name: bossConfig.shooter.name,
    speed: bossConfig.shooter.baseSpeed,
    vision: bossConfig.shooter.vision,
    dir: 1, isHorizontal: true, patrolRange: 0,
    state: 'flee', lastHit: 0, stunTimer: 0,
    minionCooldown: 0, phaseChanged: false,
    attackCooldown: 0, invertedControls: false,
    isBoss: true,
    isDuoBoss: true,
    duoRole: 'shooter',
    pathUpdateCounter: 0,
    currentPathTarget: null,
    abilities: {
      shootFireball: new ShootFireballAbility(),
      circleFireball: new CircleFireballAbility()
    },
    currentPhase: 1,
    phaseThresholds: [0.5],
    updatePhase: function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      const newPhase = percent < 0.5 ? 2 : 1;
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    },
    rageModeActive: false,
    originalSpeed: undefined,
    currentDynamicCooldown: 100,
    fastModeIndicatorShown: false
  });
}