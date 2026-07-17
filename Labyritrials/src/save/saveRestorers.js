/**
 * @fileoverview Восстановление данных из сохранения.
 * Восстанавливает все игровые данные: состояние игрока, монстров, лабиринт, порталы и т.д.
 * 
 * @module save/saveRestorers
 */

import { state, player, CONFIG } from '../core/config/index.js';
import { EMOJIS } from '../emojis.js';
import { formatPlayTime } from './timeFormatter.js';
import { loadNotesFromStorage } from './notesStorage.js';
import { Firefly, generatedPortals } from '../entities/objects/firefly.js';
import { setSeed } from '../world/mazeGenerator.js';
import { Cell } from '../world/cells/cell.js';
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
} from '../entities/monsters/bosses/abilities/index.js';
import { getBossByLevel, BOSS_TYPES } from '../entities/monsters/bosses/config.js';

// ============================================================
// БАЗОВЫЕ ДАННЫЕ
// ============================================================

/**
 * Восстановление базовых данных игры
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBasicData(save) {
  state.gameLevel = save.gameLevel;
  state.isBossLevel = save.isBossLevel || false;
  state.bonusGiven = save.bonusGiven || false;
  state.hadMonsters = save.hadMonsters || false;
  state.bossMinionDropCounter = save.bossMinionDropCounter || 0;
  state.treasureRoomLastLevel = save.treasureRoomLastLevel || 0;
  state.shrineRoomLastLevel = save.shrineRoomLastLevel || 0;
  if (save.seed !== undefined) {
    setSeed(save.seed, save.randomCounter || 0);
    state.seed = save.seed;
    state.randomCounter = save.randomCounter || 0;
  }
  if (save.shadowActive !== undefined) {
    state.shadowActive = save.shadowActive;
  }
  state.roomLabel = save.roomLabel || null;
  state.roomLabelColor = save.roomLabelColor || null;
}

// ============================================================
// ДАННЫЕ ИГРОКА
// ============================================================

/**
 * Восстановление данных о состоянии игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restorePlayerData(save) {
  player.maxHp = (typeof save.maxHp === 'number' && !isNaN(save.maxHp) && save.maxHp > 0) ? save.maxHp : 100;
  player.hp = (typeof save.hp === 'number' && !isNaN(save.hp) && save.hp > 0) ? save.hp : player.maxHp;
  player.gold = (typeof save.gold === 'number' && !isNaN(save.gold) && save.gold >= 0) ? save.gold : 0;
  player.baseDamage = (typeof save.baseDamage === 'number' && !isNaN(save.baseDamage) && save.baseDamage > 0) ? save.baseDamage : 20;
  player.originalSpeed = save.originalSpeed;
  player.baseSpeed = (typeof save.baseSpeed === 'number' && !isNaN(save.baseSpeed) && save.baseSpeed > 0) ? save.baseSpeed : 7;
  player.speed = (typeof save.speed === 'number' && !isNaN(save.speed) && save.speed > 0) ? save.speed : player.baseSpeed;
  player.hpCost = (typeof save.hpCost === 'number' && !isNaN(save.hpCost) && save.hpCost > 0) ? save.hpCost : 30;
  player.dmgCost = (typeof save.dmgCost === 'number' && !isNaN(save.dmgCost) && save.dmgCost > 0) ? save.dmgCost : 40;
  player.hasMap = save.hasMap || false;
  player.artifactsCollected = (typeof save.artifactsCollected === 'number' && !isNaN(save.artifactsCollected) && save.artifactsCollected >= 0) ? save.artifactsCollected : 0;
  player.emoji = EMOJIS.player.default;
  player.goldMultiplier = save.goldMultiplier || 1.0;
  player.vampMultiplier = save.vampMultiplier || 1.0;
}

/**
 * Восстановление данных об оружии игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreWeaponData(save) {
  player.meleeWeapon = save.meleeWeapon || 'default';
  player.ownedMeleeWeapons = save.ownedMeleeWeapons || ['default'];
  player.rangedWeapon = save.rangedWeapon || null;
  player.ownedRangedWeapons = save.ownedRangedWeapons || [];
  player.fireballCooldown = save.fireballCooldown || 0;
}

/**
 * Восстановление данных об эффектах игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreEffectData(save) {
  player.isFrozen = save.isFrozen || false;
  player.freezeTimer = save.freezeTimer || 0;
  player.shockTimer = save.shockTimer || 0;
  player.shockSlowAmount = save.shockSlowAmount || 0.6;
  player.shockTick = save.shockTick || 0;
  player.poisonTimer = save.poisonTimer || 0;
  player.poisonTick = save.poisonTick || 0;
  player.slowTimer = save.slowTimer || 0;
  player.isCharging = false;
  player.chargeTime = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
}

/**
 * Восстановление данных о позиции игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restorePositionData(save) {
  player.px = save.px || 180;
  player.py = save.py || 180;
  player.x = save.x || 1;
  player.y = save.y || 1;
  player.dirX = save.dirX || 0;
  player.dirY = save.dirY || 1;
}

// ============================================================
// ДАННЫЕ ЛАБИРИНТА
// ============================================================

/**
 * Восстановление данных о лабиринте
 * 
 * @param {Object} save - Объект сохранения
 * @returns {boolean} - true, если восстановление успешно
 */
export function restoreMazeData(save) {
  if (save.mazeCols && save.mazeRows) {
    CONFIG.cols = save.mazeCols;
    CONFIG.rows = save.mazeRows;
    CONFIG.goal = save.mazeGoal || { x: CONFIG.cols - 13, y: CONFIG.rows - 13 };
    CONFIG.shopPos = save.mazeShopPos || { x: 1, y: 2 };
  }

  if (!restoreMazeGrid(save.mazeGrid)) {
    console.warn('⚠️ Не удалось восстановить лабиринт');
    return false;
  }

  restoreRevealedCells(save.revealedCells);
  restorePillarsData(save);
  restorePortalFlags(save);

  return true;
}

/**
 * Восстановление флагов порталов на сетке
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 * @private
 */
function restorePortalFlags(save) {
  if (save.treasurePortal && save.treasurePortal.x !== undefined && save.treasurePortal.y !== undefined) {
    const { x, y } = save.treasurePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTreasurePortal = true;
      if (save.treasurePortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  if (save.shrinePortal && save.shrinePortal.x !== undefined && save.shrinePortal.y !== undefined) {
    const { x, y } = save.shrinePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasShrinePortal = true;
      if (save.shrinePortal.active) {
        state.grid[y][x].isShrinePortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  if (save.trapPortal && save.trapPortal.x !== undefined && save.trapPortal.y !== undefined) {
    const { x, y } = save.trapPortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTrapPortal = true;
      if (save.trapPortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }
}

// ============================================================
// ДАННЫЕ МОНСТРОВ И БОССОВ
// ============================================================

/**
 * Восстановление данных о монстрах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreMonstersData(save) {
  if (save.monsters && Array.isArray(save.monsters)) {
    state.monsters = save.monsters.map(m => {
      const restored = { ...m };
      restored.lastHit = m.lastHit || 0;
      restored.stunTimer = m.stunTimer || 0;
      restored.poisonTimer = m.poisonTimer || 0;
      restored.poisonTick = m.poisonTick || 0;
      restored.shockTimer = Number(m.shockTimer) || 0;
      restored.shockTick = Number(m.shockTick) || 0;
      restored.minionCooldown = m.minionCooldown || 0;
      restored.phaseChanged = m.phaseChanged || false;
      restored.pathUpdateCounter = m.pathUpdateCounter || 0;
      restored.currentPathTarget = m.currentPathTarget || null;
      restored.isGhost = m.isGhost || false;
      restored.willNeverStop = m.willNeverStop || false;
      restored.ghostPhaseTimer = m.ghostPhaseTimer || 0;
      restored.isPhasing = m.isPhasing || false;
      restored.glowIntensity = m.glowIntensity || 0;
      restored.originalSpeedDuringPhase = m.originalSpeedDuringPhase || undefined;
      restored.isAdaptationBoosted = m.isAdaptationBoosted || false;
      restored.originalMaxHp = m.originalMaxHp || null;
      restored.originalHp = m.originalHp || null;
      restored.isEventBoosted = m.isEventBoosted || false;
      restored.originalDamage = m.originalDamage || null;
      restored.canDropItems = m.canDropItems || false;
      restored.hasVampirism = m.hasVampirism || false;
      restored.isBoss = m.isBoss || false;
      restored.isDuoBoss = m.isDuoBoss || false;
      restored.duoRole = m.duoRole || null;
      restored.bossType = m.bossType || null;
      restored.lastWave = m.lastWave || 0;
      restored.lastTeleport = m.lastTeleport || 0;
      restored.phase2MessageShown = m.phase2MessageShown || false;
      restored.phase3MessageShown = m.phase3MessageShown || false;
      restored.lastPhase = m.lastPhase || 1;
      restored.lastMinionSummon = m.lastMinionSummon || 0;
      restored.lastTremor = m.lastTremor || 0;
      restored.isTremoring = m.isTremoring || false;
      restored.tremorDuration = m.tremorDuration || 0;
      restored.isPreparingBeam = m.isPreparingBeam || false;
      restored.beamPrepareStart = m.beamPrepareStart || 0;
      restored.beamInterrupted = m.beamInterrupted || false;
      restored.rageModeActive = m.rageModeActive || false;
      restored.rageModeActivated = m.rageModeActivated || false;
      restored.currentDynamicCooldown = m.currentDynamicCooldown || 100;
      restored.fastModeIndicatorShown = m.fastModeIndicatorShown || false;
      restored.currentPhase = m.currentPhase || 1;
      restored.phaseThresholds = m.phaseThresholds || null;
      restored.attackCooldown = m.attackCooldown || 0;
      restored.invertedControls = m.invertedControls || false;
      restored.invertTimer = m.invertTimer || 0;

      if (restored.isBoss || restored.isDuoBoss) {
        restoreBossAbilities(restored);
      }

      return restored;
    });
  } else {
    state.monsters = [];
  }
}

/**
 * Восстановление данных о боссе
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBossData(save) {
  if (save.pendingBossData) {
    state.pendingBossData = save.pendingBossData;
  } else if (state.isBossLevel) {
    const arenaSize = CONFIG.bossArenaSize || 25;
    state.pendingBossData = {
      arenaSize: arenaSize,
      scaling: 1 + (state.gameLevel - 1) * 0.15,
      bossLevel: Math.floor(state.gameLevel / 5) * 5
    };
  }

  if (save.bossSpawned !== undefined) {
    state.bossSpawned = save.bossSpawned;
  }
  if (save.bossSpawnTriggered !== undefined) {
    state.bossSpawnTriggered = save.bossSpawnTriggered;
  }
  if (save.bossSpawnTimer !== undefined) {
    state.bossSpawnTimer = save.bossSpawnTimer;
  }
}

/**
 * Восстановление способностей босса
 * 
 * @param {Object} monster - Объект монстра
 * @returns {Object} - Восстановленный монстр
 * @private
 */
function restoreBossAbilities(monster) {
  if (!monster.isBoss && !monster.isDuoBoss) return monster;

  const bossLevel = Math.floor(state.gameLevel / 5) * 5;
  const bossConfig = getBossByLevel(bossLevel);

  if (!bossConfig) return monster;

  const bossType = monster.bossType || 'demon';

  switch (bossType) {
    case BOSS_TYPES.DEMON:
      monster.abilities = {
        phaseSummon: new PhaseSummonAbility(),
        periodicSummon: new SummonMinionsAbility(),
        speedBoost: new SpeedBoostAbility(),
        rage: new RageAbility(),
        empoweredSummon: new EmpoweredSummonAbility(),
        tremor: new TremorAbility()
      };
      break;

    case BOSS_TYPES.MIND:
      monster.abilities = {
        mindBall: new MindBallAbility(),
        psionicWave: new PsionicWaveAbility(),
        teleportWithTrap: new TeleportWithTrapAbility()
      };
      monster.lastWave = monster.lastWave || 0;
      monster.lastTeleport = monster.lastTeleport || 0;
      monster.phase2MessageShown = monster.phase2MessageShown || false;
      monster.phase3MessageShown = monster.phase3MessageShown || false;
      monster.lastPhase = monster.lastPhase || 1;
      break;

    case BOSS_TYPES.DUO_CHASER:
      monster.abilities = {
        speedBoost: new SpeedBoostAbility()
      };
      break;

    case BOSS_TYPES.DUO_SHOOTER:
      monster.abilities = {
        shootFireball: new ShootFireballAbility(),
        circleFireball: new CircleFireballAbility()
      };
      monster.rageModeActive = monster.rageModeActive || false;
      monster.originalSpeed = monster.originalSpeed || monster.speed;
      monster.currentDynamicCooldown = monster.currentDynamicCooldown || 100;
      monster.fastModeIndicatorShown = monster.fastModeIndicatorShown || false;
      break;

    default:
      monster.abilities = {};
  }

  if (!monster.updatePhase) {
    monster.updatePhase = function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      let newPhase = 1;

      if (this.phaseThresholds) {
        for (let i = 0; i < this.phaseThresholds.length; i++) {
          if (percent < this.phaseThresholds[i]) {
            newPhase = i + 2;
          } else {
            break;
          }
        }
      } else {
        if (percent < 0.5) newPhase = 2;
      }

      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    };
  }

  if (monster.isDuoBoss && !monster.updatePhase) {
    monster.updatePhase = function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      const newPhase = percent < 0.5 ? 2 : 1;
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    };
  }

  return monster;
}

// ============================================================
// ОБЪЕКТЫ И МЕХАНИКИ
// ============================================================

/**
 * Восстановление данных о ловушках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTrapsData(save) {
  state.traps = (save.traps && Array.isArray(save.traps)) ? save.traps : [];
}

/**
 * Восстановление данных об артефактах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreArtifactsData(save) {
  state.artifacts = (save.artifacts && Array.isArray(save.artifacts)) ? save.artifacts : [];
}

/**
 * Восстановление данных о сундуках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreChestsData(save) {
  state.chests = (save.chests && Array.isArray(save.chests))
    ? save.chests.map(c => ({
      x: c.x, y: c.y, type: c.type, opened: c.opened,
      countedForAchievement: c.countedForAchievement || false
    }))
    : [];

  if (state.isBossLevel) state.chests = [];
}

/**
 * Восстановление данных о святилищах (алтарях)
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreShrinesData(save) {
  state.shrines = (save.shrines && Array.isArray(save.shrines)) ? save.shrines : [];
}

/**
 * Восстановление данных о предметах на полу
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreLootData(save) {
  state.lootItems = (save.lootItems && Array.isArray(save.lootItems)) ? save.lootItems : [];
}

/**
 * Восстановление данных о факелах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTorchesData(save) {
  if (save.torches && Array.isArray(save.torches)) {
    state.torches = save.torches.map(t => ({
      x: t.x, y: t.y, active: t.active,
      appearTimer: t.appearTimer || 1,
      flickerPhase: t.flickerPhase || 0,
      intensity: t.intensity || 0.7,
      isTrapTorch: t.isTrapTorch || false,
      flameColor: t.flameColor || COLORS.torches.flame,
      glowColor: t.glowColor || COLORS.torches.glow,
      particleColor: t.particleColor || COLORS.torches.particle,
      emoji: t.emoji || '🕯️'
    }));
  } else {
    state.torches = [];
  }

  if (save.fireParticles && Array.isArray(save.fireParticles)) {
    state.fireParticles = save.fireParticles;
  } else {
    state.fireParticles = [];
  }
}

/**
 * Восстановление данных о светлячках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreFirefliesData(save) {
  if (!save.fireflies || !Array.isArray(save.fireflies)) {
    state.fireflies = [];
    return;
  }

  state.fireflies = save.fireflies.map(f => {
    const fly = new Firefly(
      f.cellX, f.cellY, f.worldX, f.worldY,
      f.portalX, f.portalY, f.portalType
    );

    fly.angle = f.angle;
    fly.angleSpeed = f.angleSpeed;
    fly.radius = f.radius;
    fly.wobbleX = f.wobbleX;
    fly.wobbleY = f.wobbleY;
    fly.wobbleAngle = f.wobbleAngle;
    fly.wobbleSpeed = f.wobbleSpeed;
    fly.wobbleRadius = f.wobbleRadius;
    fly.flickerPhase = f.flickerPhase;
    fly.flickerSpeed = f.flickerSpeed;
    fly.opacity = f.opacity;
    fly.size = f.size;
    fly.x = f.x;
    fly.y = f.y;
    fly.active = true;

    return fly;
  });

  if (save.fireflies.length > 0) {
    generatedPortals.clear();
    for (const fly of state.fireflies) {
      const portalId = `${fly.portalType}_${fly.portalX}_${fly.portalY}`;
      generatedPortals.add(portalId);
    }
  }
}

/**
 * Восстановление данных о рунах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreRunesData(save) {
  if (save.runes && Array.isArray(save.runes)) {
    state.runes = save.runes.map(rune => ({
      ...rune,
      glowIntensity: rune.glowIntensity || 0
    }));
  } else {
    state.runes = [];
  }
}

/**
 * Восстановление данных о колоннах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {boolean} - true, если восстановление успешно
 */
export function restorePillarsData(save) {
  let pillarsData = null;

  if (save.pillars && Array.isArray(save.pillars)) {
    pillarsData = save.pillars;
  } else if (save.secretRoomsData && save.secretRoomsData.pillars) {
    pillarsData = save.secretRoomsData.pillars;
  } else if (save.mazeData && save.mazeData.pillars) {
    pillarsData = save.mazeData.pillars;
  }

  if (!pillarsData || !Array.isArray(pillarsData) || pillarsData.length === 0) {
    state.pillars = [];
    return false;
  }

  state.pillars = pillarsData.map(p => ({
    x: p.x,
    y: p.y,
    gridX: p.gridX,
    gridY: p.gridY,
    size: p.size || CONFIG.cellSize * 0.65,
    isPillar: p.isPillar !== undefined ? p.isPillar : true,
    hasTorch: p.hasTorch || false,
    torchFlicker: p.torchFlicker || 0
  }));

  for (const pillar of state.pillars) {
    const { gridX, gridY } = pillar;
    if (state.grid[gridY] && state.grid[gridY][gridX]) {
      state.grid[gridY][gridX].isPillar = true;
      state.grid[gridY][gridX].isWall = false;
      state.grid[gridY][gridX].revealed = true;
    }
  }

  return true;
}

// ============================================================
// СИСТЕМЫ И СОБЫТИЯ
// ============================================================

/**
 * Восстановление данных об адаптации монстров
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreAdaptationData(save) {
  state.monsterAdaptation = save.monsterAdaptation || {
    fireImmunity: false,
    stunImmunity: false,
    healingBlock: false,
    healthBoost: false
  };

  state.totalAttacks = save.totalAttacks || {
    fireball: 0,
    stun: 0,
    vampirism: 0,
    magic: 0
  };
}

/**
 * Восстановление данных о событиях
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreEventData(save) {
  state.currentEvent = save.currentEvent || null;
  state.bloodMoonActive = save.bloodMoonActive || false;
  state.eventMessageShown = true;

  player.eventDamageMultiplier = save.eventDamageMultiplier || 1.0;
  player.eventGoldMultiplier = save.eventGoldMultiplier || 1.0;
  player.eventSpeedBonus = save.eventSpeedBonus || 0;
  player.eventSlowMultiplier = save.eventSlowMultiplier || 1.0;

  if (state.currentEvent === 'bloodMoon') {
    state.bloodMoonActive = true;
    player.eventGoldMultiplier = 2.0;
  }
}

/**
 * Восстановление данных о кровавых лужах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBloodPuddles(save) {
  state.bloodPuddles = (save.bloodPuddles && Array.isArray(save.bloodPuddles)) ? save.bloodPuddles : [];
}

// ============================================================
// ТАЙНЫЕ КОМНАТЫ
// ============================================================

/**
 * Восстановление данных о сокровищнице
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTreasureRoomData(save) {
  if (!save.treasureRoomData) {
    state.inTreasureRoom = false;
    state.secretPortal = null;
    state.exitPortal = null;
    state.returnPortal = null;
    return;
  }

  const tr = save.treasureRoomData;
  state.inTreasureRoom = tr.inTreasureRoom || false;
  state.secretPortal = tr.secretPortal || null;
  state.exitPortal = tr.exitPortal || null;
  state.returnPortal = tr.returnPortal || null;
  state.originalGoal = tr.originalGoal || null;
  state.originalShopPos = tr.originalShopPos || null;
  state.originalMapCols = tr.originalMapCols || CONFIG.cols;
  state.originalMapRows = tr.originalMapRows || CONFIG.rows;
  state.originalTorches = tr.originalTorches || [];

  state.originalArtifacts = tr.originalArtifacts || [];
  state.originalChests = tr.originalChests || [];
  state.originalLootItems = tr.originalLootItems || [];
  state.originalShrines = tr.originalShrines || [];

  if (tr.originalArtifacts && tr.originalArtifacts.length > 0 && typeof tr.originalArtifacts[0].gridX !== 'undefined') {
    state.originalArtifacts = tr.originalArtifacts;
  } else if (tr.originalArtifacts && tr.originalArtifacts.length > 0) {
    state.originalArtifacts = tr.originalArtifacts.map(a => ({
      gridX: Math.floor(a.x / CONFIG.cellSize),
      gridY: Math.floor(a.y / CONFIG.cellSize)
    }));
  } else {
    state.originalArtifacts = [];
  }

  if (tr.originalGrid) {
    restoreOriginalMazeGrid(tr.originalGrid, tr.originalMapCols, tr.originalMapRows);
  }

  state.originalMonsters = tr.originalMonsters || [];
  state.originalTraps = tr.originalTraps || [];
}

/**
 * Восстановление данных о комнате-ловушке
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTrapRoomData(save) {
  if (!save.trapRoomData) {
    state.inTrapRoom = false;
    state.trapActivated = false;
    state.trapWave = 0;
    state.trapMonstersTotal = 0;
    state.trapMonstersKilled = 0;
    state.trapWaveActive = false;
    state.trapExitRevealed = false;
    state.trapPortal = null;
    state.trapFakePortal = null;
    state.trapExitPortal = null;
    state.trapMonsters = [];
    state.trapWaveLoaded = false;
    state.trapMonsterIds = new Set();
    return;
  }

  const tr = save.trapRoomData;

  state.inTrapRoom = tr.inTrapRoom || false;
  state.trapActivated = tr.trapActivated || false;
  state.trapWave = tr.trapWave || 0;
  state.trapMonstersTotal = tr.trapMonstersTotal || 0;
  state.trapMonstersKilled = tr.trapMonstersKilled || 0;
  state.trapWaveActive = tr.trapWaveActive || false;
  state.trapExitRevealed = tr.trapExitRevealed || false;
  state.trapPortal = tr.trapPortal || null;
  state.trapFakePortal = tr.trapFakePortal || null;
  state.trapExitPortal = tr.trapExitPortal || null;
  state.trapRoomLastLevel = tr.trapRoomLastLevel || 0;
  state.trapWaveLoaded = tr.trapWaveLoaded || false;
  state.trapMonsterIds = new Set(Array.isArray(tr.trapMonsterIds) ? tr.trapMonsterIds : []);

  if (tr.trapPortal) {
    state.trapPortal = {
      x: tr.trapPortal.x,
      y: tr.trapPortal.y,
      active: tr.trapPortal.active || false,
      hidden: tr.trapPortal.hidden !== undefined ? tr.trapPortal.hidden : true,
      targetMap: tr.trapPortal.targetMap || 'trap'
    };

    if (state.inTrapRoom) {
      state.trapPortal.active = false;
      state.trapPortal.hidden = true;
    }
  } else {
    state.trapPortal = null;
  }

  state.trapMonsters = (tr.trapMonsters || []).filter(m => m.hp > 0);

  if (state.inTrapRoom && state.trapActivated) {
    state.monsters = state.monsters.filter(m => {
      if (m.isTrapMonster) return false;
      if (state.trapMonsterIds.has(m.id || `${m.x},${m.y}`)) return false;
      return true;
    });

    for (const m of state.trapMonsters) {
      if (m.hp === undefined || m.hp <= 0) {
        m.hp = m.maxHp || 50;
      }
      if (m.maxHp === undefined || m.maxHp <= 0) {
        m.maxHp = m.hp || 50;
      }

      m.isTrapMonster = true;
      m.canDropItems = false;

      if (!m.id) {
        m.id = `${m.x},${m.y},${Date.now()}`;
      }
      state.trapMonsterIds.add(m.id);

      state.monsters.push(m);
    }

    const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);

    if (aliveMonsters.length > 0) {
      state.trapWaveActive = true;
    } else {
      state.trapWaveActive = false;

      if (state.trapWave >= 3) {
        if (!state.trapExitRevealed) {
          state.trapExitRevealed = true;
          import('../world/rooms/trapRoom.js').then(module => {
            setTimeout(() => {
              module.showRealExitPortal();
            }, 300);
          });
        }
      } else {
        import('../world/rooms/trapRoom.js').then(module => {
          setTimeout(() => {
            if (state.trapMonsters.filter(m => m.hp > 0).length === 0) {
              module.startNextWave();
            }
          }, 500);
        });
      }
    }
  }
}

/**
 * Восстановление данных о секретных комнатах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreSecretRoomsData(save) {
  if (!save.secretRoomsData) {
    state.inTreasureRoom = false;
    state.inShrineRoom = false;
    state.inTrapRoom = false;
    state.treasurePortal = null;
    state.treasureExitPortal = null;
    state.shrinePortal = null;
    state.shrineExitPortal = null;
    state.trapPortal = null;
    state.trapFakePortal = null;
    state.trapExitPortal = null;
    state.roomLabel = null;
    state.roomLabelColor = null;
    return;
  }

  const sr = save.secretRoomsData;

  state.treasurePortal = sr.treasurePortal || null;
  state.treasureExitPortal = sr.treasureExitPortal || null;
  state.inTreasureRoom = sr.inTreasureRoom || false;

  state.shrinePortal = sr.shrinePortal || null;
  state.shrineExitPortal = sr.shrineExitPortal || null;
  state.inShrineRoom = sr.inShrineRoom || false;

  state.trapPortal = sr.trapPortal || null;
  state.trapFakePortal = sr.trapFakePortal || null;
  state.trapExitPortal = sr.trapExitPortal || null;
  state.inTrapRoom = sr.inTrapRoom || false;

  // Восстанавливаем название комнаты
  if (state.inTreasureRoom) {
    state.roomLabel = 'treasure';
    state.roomLabelColor = '#f39c12';
  } else if (state.inShrineRoom) {
    state.roomLabel = 'shrine';
    state.roomLabelColor = '#9b59b6';
  } else if (state.inTrapRoom) {
    state.roomLabel = 'trap';
    state.roomLabelColor = '#e74c3c';
  } else {
    state.roomLabel = null;
    state.roomLabelColor = null;
  }

  if (state.inTreasureRoom && state.treasurePortal) {
    state.treasurePortal.active = false;
    state.treasurePortal.hidden = true;
  }

  if (state.inShrineRoom && state.shrinePortal) {
    state.shrinePortal.active = false;
    state.shrinePortal.hidden = true;
  }

  if (state.inTrapRoom && state.trapPortal) {
    state.trapPortal.active = false;
    state.trapPortal.hidden = true;
  }

  restorePortalFlagsOnGrid();
}

/**
 * Восстановление флагов порталов на сетке
 * 
 * @returns {void}
 * @private
 */
function restorePortalFlagsOnGrid() {
  if (state.treasurePortal) {
    const { x, y } = state.treasurePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTreasurePortal = true;
      if (state.treasurePortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  if (state.shrinePortal) {
    const { x, y } = state.shrinePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasShrinePortal = true;
      if (state.shrinePortal.active) {
        state.grid[y][x].isShrinePortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  if (state.trapPortal) {
    const { x, y } = state.trapPortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTrapPortal = true;
      if (state.trapPortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }
}

// ============================================================
// БЕЗОПАСНАЯ КОМНАТА
// ============================================================

/**
 * Восстановление данных о безопасной комнате
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreSafeRoomData(save) {
  if (!save) return;
  
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;
  const isInSafeRoom = save.inSafeRoom || false;
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom;
  
  state.inSafeRoom = isInSafeRoom;

  if (isInSafeRoom) {
    state.roomLabel = 'safe';
    state.roomLabelColor = '#3498db';
  } else if (!isInSecretRoom) {
    state.roomLabel = null;
    state.roomLabelColor = null;
  }
  
  if (save.originalHadMap !== undefined) {
    state.originalHadMap = save.originalHadMap;
  }
  
  if (save.originalRevealedCells && Array.isArray(save.originalRevealedCells)) {
    state.originalRevealedCells = save.originalRevealedCells;
  } else {
    state.originalRevealedCells = [];
  }
  
  if (save.originalSafePortal) {
    state.originalSafePortal = {
      x: save.originalSafePortal.x,
      y: save.originalSafePortal.y,
      active: true,
      hidden: false,
      targetMap: save.originalSafePortal.targetMap || 'safe'
    };
  }
  
  if (save.safePortal && !isInSafeRoom && !isBossLevel && !isInSecretRoom) {
    state.safePortal = {
      x: save.safePortal.x,
      y: save.safePortal.y,
      active: save.safePortal.active !== undefined ? save.safePortal.active : true,
      hidden: save.safePortal.hidden !== undefined ? save.safePortal.hidden : false,
      targetMap: save.safePortal.targetMap || 'safe'
    };
    
    if (state.grid[state.safePortal.y] && state.grid[state.safePortal.y][state.safePortal.x]) {
      state.grid[state.safePortal.y][state.safePortal.x].isPortal = true;
      state.grid[state.safePortal.y][state.safePortal.x].revealed = true;
      state.grid[state.safePortal.y][state.safePortal.x].isWall = false;
      state.grid[state.safePortal.y][state.safePortal.x].hasSafePortal = true;
    }
  } else {
    state.safePortal = null;
  }
  
  if (save.safeExitPortal && isInSafeRoom) {
    state.safeExitPortal = {
      x: save.safeExitPortal.x,
      y: save.safeExitPortal.y,
      active: save.safeExitPortal.active !== undefined ? save.safeExitPortal.active : true,
      spawnX: save.safeExitPortal.spawnX || save.safeExitPortal.x,
      spawnY: save.safeExitPortal.spawnY || save.safeExitPortal.y
    };
    
    if (state.grid[state.safeExitPortal.y] && state.grid[state.safeExitPortal.y][state.safeExitPortal.x]) {
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].isPortal = true;
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].revealed = true;
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].isWall = false;
    }
  } else if (save.safeExitPortal && !isInSafeRoom) {
    state.safeExitPortal = null;
  }

  if (save.safeChestOpened !== undefined) {
    state.safeChestOpened = save.safeChestOpened;
  }
  
  if (save.bookshelves && Array.isArray(save.bookshelves)) {
    state.bookshelves = save.bookshelves.map(shelf => ({
      x: shelf.x,
      y: shelf.y
    }));
    
    for (const shelf of state.bookshelves) {
      if (state.grid[shelf.y] && state.grid[shelf.y][shelf.x]) {
        state.grid[shelf.y][shelf.x].hasBookshelf = true;
        state.grid[shelf.y][shelf.x].isWall = false;
        state.grid[shelf.y][shelf.x].revealed = true;
      }
    }
  }
}

// ============================================================
// ФЛАГИ И СТАТИСТИКА
// ============================================================

/**
 * Восстановление флагов состояния
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreFlags(save) {
  state.screenShake = 0;
  state.isShopOpen = false;
  state.damageTexts = [];
  state.fireballs = [];
  state.justLoaded = true;

  restoreBossData(save);

  setTimeout(() => {
    state.justLoaded = false;
  }, 1000);
}

/**
 * Восстановление статистики игры
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreGameStatsData(save) {
  if (save.gameStats) {
    const stats = save.gameStats;
    state.gameStats.maxHpAtEnd = stats.maxHpAtEnd || 0;
    state.gameStats.hpRemaining = stats.hpRemaining || 0;
    state.gameStats.goldCollected = stats.goldCollected || 0;
    state.gameStats.goldSpent = stats.goldSpent || 0;
    state.gameStats.artifactsCollected = stats.artifactsCollected || 0;
    state.gameStats.artifactsTotalPossible = stats.artifactsTotalPossible || 0;
    state.gameStats.monstersKilled = stats.monstersKilled || 0;
    state.gameStats.bossesTotal = stats.bossesTotal || 0;

    state.gameStats.weaponHits = {
      default: stats.weaponHits?.default || 0,
      stun: stats.weaponHits?.stun || 0,
      vampire: stats.weaponHits?.vampire || 0,
      fireball: stats.weaponHits?.fireball || 0
    };

    state.gameStats.favoriteWeapon = stats.favoriteWeapon || 'default';
    state.gameStats.secretRoomsVisited = stats.secretRoomsVisited || 0;
    state.gameStats.secretRoomsGenerated = stats.secretRoomsGenerated || 0;

    state.gameStats.trapsTriggered = {
      spike: stats.trapsTriggered?.spike || 0,
      ice: stats.trapsTriggered?.ice || 0,
      acid: stats.trapsTriggered?.acid || 0,
      lightning: stats.trapsTriggered?.lightning || 0
    };

    state.gameStats.mimicBites = stats.mimicBites || 0;

    state.gameStats.playTime = stats.playTime || 0;
    state.playTimeAccumulator = state.gameStats.playTime;

    console.log('📀 Восстановлена статистика игры');
    console.log(`⏱️ Время игры: ${stats.playTimeFormatted || formatPlayTime(state.gameStats.playTime)}`);
  } else {
    state.gameStats = {
      maxHpAtEnd: 0,
      hpRemaining: 0,
      goldCollected: 0,
      goldSpent: 0,
      artifactsCollected: 0,
      artifactsTotalPossible: 0,
      monstersKilled: 0,
      bossesTotal: 0,
      weaponHits: {
        default: 0,
        stun: 0,
        vampire: 0,
        fireball: 0
      },
      favoriteWeapon: 'default',
      secretRoomsVisited: 0,
      secretRoomsGenerated: 0,
      trapsTriggered: {
        spike: 0,
        ice: 0,
        acid: 0,
        lightning: 0
      },
      mimicBites: 0
    };
  }
}

/**
 * Восстановление данных о достижениях
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreAchievementsData(save) {
  if (save.achievements) {
    let unlocked = save.achievements.unlocked || [];
    let progress = save.achievements.progress || {};

    if (unlocked.includes('fully_equipped')) {
      progress.weapons_bought = 3;
    } else {
      let count = 0;
      if (player.ownedMeleeWeapons.includes('vampire')) count++;
      if (player.ownedMeleeWeapons.includes('stun')) count++;
      if (player.ownedRangedWeapons.includes('fireball')) count++;
      progress.weapons_bought = count;
    }

    state.achievements = {
      unlocked: unlocked,
      progress: progress
    };

  } else {
    state.achievements = {
      unlocked: [],
      progress: {}
    };
  }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Восстановление сетки лабиринта
 * 
 * @param {Array} gridData - Данные сетки
 * @returns {boolean} - true, если восстановление успешно
 * @private
 */
function restoreMazeGrid(gridData) {
  if (!gridData || !Array.isArray(gridData)) {
    console.warn('⚠️ Нет данных о лабиринте в сохранении');
    return false;
  }

  state.grid = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    state.grid[y] = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      if (gridData[y] && gridData[y][x]) {
        const cell = new Cell(x, y);
        cell.isWall = gridData[y][x].isWall;
        cell.isBreakable = gridData[y][x].isBreakable;
        cell.revealed = gridData[y][x].revealed;
        cell.hasSecretPortal = gridData[y][x].hasSecretPortal || false;
        cell.hasTreasurePortal = gridData[y][x].hasTreasurePortal || false;
        cell.hasShrinePortal = gridData[y][x].hasShrinePortal || false;
        cell.isPortal = gridData[y][x].isPortal || false;
        cell.isShrinePortal = gridData[y][x].isShrinePortal || false;
        cell.isPillar = gridData[y][x].isPillar || false;
        state.grid[y][x] = cell;
      } else {
        const cell = new Cell(x, y);
        cell.isWall = true;
        state.grid[y][x] = cell;
      }
    }
  }

  return true;
}

/**
 * Восстановление открытых клеток
 * 
 * @param {Array} revealedCells - Массив открытых клеток
 * @returns {void}
 * @private
 */
function restoreRevealedCells(revealedCells) {
  if (!revealedCells || !Array.isArray(revealedCells)) return;

  for (let cell of revealedCells) {
    if (state.grid[cell.y] && state.grid[cell.y][cell.x]) {
      state.grid[cell.y][cell.x].revealed = true;
    }
  }
}

/**
 * Восстановление оригинальной сетки (для сокровищницы)
 * 
 * @param {Array} gridData - Данные сетки
 * @param {number} cols - Количество колонок
 * @param {number} rows - Количество строк
 * @returns {boolean} - true, если восстановление успешно
 * @private
 */
function restoreOriginalMazeGrid(gridData, cols, rows) {
  if (!gridData) return false;

  state.originalGrid = [];
  for (let y = 0; y < rows; y++) {
    state.originalGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      if (gridData[y] && gridData[y][x]) {
        const cell = new Cell(x, y);
        cell.isWall = gridData[y][x].isWall;
        cell.isBreakable = gridData[y][x].isBreakable;
        cell.revealed = gridData[y][x].revealed;
        state.originalGrid[y][x] = cell;
      } else {
        const cell = new Cell(x, y);
        cell.isWall = true;
        state.originalGrid[y][x] = cell;
      }
    }
  }
  return true;
}

/**
 * Восстановление записок на сетке
 * 
 * @returns {void}
 * @private
 */
function restoreNotesOnGrid() {
  if (!state.notes || !state.notes.positions) return;

  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].hasNote = false;
        state.grid[y][x].noteId = null;
      }
    }
  }

  let restoredCount = 0;
  const notesFound = state.notes.found || [];

  for (const [noteIdStr, pos] of Object.entries(state.notes.positions)) {
    const noteId = parseInt(noteIdStr);

    if (notesFound.includes(noteId)) {
      continue;
    }

    const x = pos.x;
    const y = pos.y;

    if (x === undefined || y === undefined) {
      console.warn(`📜 Записка #${noteId} имеет невалидные координаты:`, pos);
      continue;
    }

    if (!state.grid[y] || !state.grid[y][x]) {
      console.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) не существует`);
      continue;
    }

    const cell = state.grid[y][x];

    if (!cell.isWall) {
      console.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) не является стеной (isWall: ${cell.isWall})`);
      delete state.notes.positions[noteIdStr];
      continue;
    }

    if (cell.hasNote) {
      console.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) уже содержит записку #${cell.noteId}`);
      continue;
    }

    cell.hasNote = true;
    cell.noteId = noteId;
    restoredCount++;
  }
}

/**
 * Восстановление данных о записках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreNotesData(save) {
  if (!state.notes) {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  const notesData = loadNotesFromStorage();

  if (notesData) {
    state.notes.found = notesData.found || [];
    state.notes.spawned = notesData.spawned || {};
    state.notes.positions = notesData.positions || {};
  } else {
    state.notes.found = [];
    state.notes.spawned = {};
    state.notes.positions = {};
  }

  restoreNotesOnGrid();

  state.showNotePrompt = false;
  state.notePromptId = null;
  state.notePromptX = null;
  state.notePromptY = null;
}