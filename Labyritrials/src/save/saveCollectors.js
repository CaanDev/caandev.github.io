/**
 * @fileoverview Сборщики данных для сохранения.
 * Собирают все игровые данные в структурированный объект для сохранения.
 * 
 * @module save/saveCollectors
 */

import { state, player, CONFIG } from '../core/config/index.js';
import { COLORS } from '../core/config/colors.js';
import { formatPlayTime } from './timeFormatter.js';

/**
 * Сбор базовых данных игры
 * 
 * @returns {Object} - Базовые данные игры
 */
export function collectBasicData() {
  return {
    version: '1.3',
    gameLevel: state.gameLevel,
    isBossLevel: state.isBossLevel,
    saveDate: Date.now(),
    seed: state.seed,
    randomCounter: state.randomCounter,
    bonusGiven: state.bonusGiven,
    hadMonsters: state.hadMonsters,
    bossMinionDropCounter: state.bossMinionDropCounter || 0,
    treasureRoomLastLevel: state.treasureRoomLastLevel || 0,
    shrineRoomLastLevel: state.shrineRoomLastLevel || 0,
    shadowActive: state.shadowActive !== undefined ? state.shadowActive : true,
    roomLabel: state.roomLabel || null,
    roomLabelColor: state.roomLabelColor || null,
  };
}

/**
 * Сбор данных о состоянии игрока
 * 
 * @returns {Object} - Данные игрока
 */
export function collectPlayerData() {
  return {
    maxHp: player.maxHp || 100,
    hp: (typeof player.hp === 'number' && !isNaN(player.hp)) ? player.hp : 100,
    gold: player.gold || 0,
    baseDamage: player.baseDamage || 20,
    originalSpeed: player.originalSpeed,
    baseSpeed: player.baseSpeed || 7,
    speed: player.speed || 7,
    hpCost: player.hpCost || 30,
    dmgCost: player.dmgCost || 40,
    hasMap: player.hasMap || false,
    artifactsCollected: player.artifactsCollected || 0,
    goldMultiplier: player.goldMultiplier || 1.0,
    vampMultiplier: player.vampMultiplier || 1.0
  };
}

/**
 * Сбор данных об оружии игрока
 * 
 * @returns {Object} - Данные об оружии
 */
export function collectWeaponData() {
  return {
    meleeWeapon: player.meleeWeapon,
    ownedMeleeWeapons: player.ownedMeleeWeapons,
    rangedWeapon: player.rangedWeapon,
    ownedRangedWeapons: player.ownedRangedWeapons,
    fireballCooldown: player.fireballCooldown
  };
}

/**
 * Сбор данных об эффектах игрока
 * 
 * @returns {Object} - Данные об эффектах
 */
export function collectEffectData() {
  return {
    isFrozen: player.isFrozen,
    freezeTimer: player.freezeTimer,
    shockTimer: player.shockTimer,
    shockSlowAmount: player.shockSlowAmount,
    shockTick: player.shockTick,
    poisonTimer: player.poisonTimer,
    poisonTick: player.poisonTick,
    slowTimer: player.slowTimer
  };
}

/**
 * Сбор данных о позиции игрока
 * 
 * @returns {Object} - Данные о позиции
 */
export function collectPositionData() {
  return {
    px: player.px,
    py: player.py,
    x: player.x,
    y: player.y,
    dirX: player.dirX,
    dirY: player.dirY
  };
}

/**
 * Сбор данных о лабиринте
 * 
 * @returns {Object} - Данные о лабиринте
 */
export function collectMazeData() {
  return {
    mazeCols: CONFIG.cols,
    mazeRows: CONFIG.rows,
    mazeGoal: { x: CONFIG.goal.x, y: CONFIG.goal.y },
    mazeShopPos: { x: CONFIG.shopPos.x, y: CONFIG.shopPos.y },
    mazeGrid: saveMazeGrid(),
    revealedCells: saveRevealedCells(),
    pillars: collectPillarsData()
  };
}

/**
 * Сбор данных о монстрах
 * 
 * @returns {Object[]} - Массив данных о монстрах
 */
export function collectMonstersData() {
  return state.monsters.map(m => ({
    x: m.x, y: m.y, startX: m.startX, startY: m.startY,
    hp: m.hp, maxHp: m.maxHp, damage: m.damage, emoji: m.emoji,
    radius: m.radius, name: m.name, speed: m.speed, vision: m.vision,
    dir: m.dir, isHorizontal: m.isHorizontal, patrolRange: m.patrolRange,
    state: m.state, lastHit: m.lastHit || 0, stunTimer: m.stunTimer || 0,
    poisonTimer: m.poisonTimer || 0, poisonTick: m.poisonTick || 0,
    poisonOnHit: m.poisonOnHit || false, isMinion: m.isMinion || false,
    minionCooldown: m.minionCooldown || 0,
    phaseChanged: m.phaseChanged || false,
    pathUpdateCounter: m.pathUpdateCounter || 0,
    currentPathTarget: m.currentPathTarget || null,
    isFrozen: m.isFrozen || false,
    freezeTimer: m.freezeTimer || 0,
    shockTimer: m.shockTimer || 0,
    shockTick: m.shockTick || 0,
    shockSlowAmount: m.shockSlowAmount || 0,
    originalSpeed: m.originalSpeed || undefined,
    isGhost: m.isGhost || false,
    willNeverStop: m.willNeverStop || false,
    ghostPhaseTimer: m.ghostPhaseTimer || 0,
    isPhasing: m.isPhasing || false,
    glowIntensity: m.glowIntensity || 0,
    originalSpeedDuringPhase: m.originalSpeedDuringPhase || undefined,
    isAdaptationBoosted: m.isAdaptationBoosted || false,
    originalMaxHp: m.originalMaxHp || null,
    originalHp: m.originalHp || null,
    isEventBoosted: m.isEventBoosted || false,
    originalDamage: m.originalDamage || null,
    canDropItems: m.canDropItems || false,
    hasVampirism: m.hasVampirism || false,
    isBoss: m.isBoss || false,
    isDuoBoss: m.isDuoBoss || false,
    duoRole: m.duoRole || null,
    bossType: m.bossType || null,
    lastWave: m.lastWave || 0,
    lastTeleport: m.lastTeleport || 0,
    phase2MessageShown: m.phase2MessageShown || false,
    phase3MessageShown: m.phase3MessageShown || false,
    lastPhase: m.lastPhase || 1,
    lastMinionSummon: m.lastMinionSummon || 0,
    lastTremor: m.lastTremor || 0,
    isTremoring: m.isTremoring || false,
    tremorDuration: m.tremorDuration || 0,
    isPreparingBeam: m.isPreparingBeam || false,
    beamPrepareStart: m.beamPrepareStart || 0,
    beamInterrupted: m.beamInterrupted || false,
    rageModeActive: m.rageModeActive || false,
    rageModeActivated: m.rageModeActivated || false,
    currentDynamicCooldown: m.currentDynamicCooldown || 100,
    fastModeIndicatorShown: m.fastModeIndicatorShown || false,
    currentPhase: m.currentPhase || 1,
    phaseThresholds: m.phaseThresholds || null,
    attackCooldown: m.attackCooldown || 0,
    invertedControls: m.invertedControls || false,
    invertTimer: m.invertTimer || 0
  }));
}

/**
 * Сбор данных о боссе
 * 
 * @returns {Object} - Данные о боссе
 */
export function collectBossData() {
  return {
    pendingBossData: state.pendingBossData || null,
    bossSpawned: state.bossSpawned || false,
    bossSpawnTriggered: state.bossSpawnTriggered || false,
    bossSpawnTimer: state.bossSpawnTimer || 0
  };
}

/**
 * Сбор данных о ловушках
 * 
 * @returns {Object[]} - Массив данных о ловушках
 */
export function collectTrapsData() {
  return state.traps.map(t => ({
    x: t.x, y: t.y, damage: t.damage, type: t.type,
    triggered: t.triggered, resetTimer: t.resetTimer
  }));
}

/**
 * Сбор данных об артефактах
 * 
 * @returns {Object[]} - Массив данных об артефактах
 */
export function collectArtifactsData() {
  return state.artifacts.map(a => ({ x: a.x, y: a.y }));
}

/**
 * Сбор данных о сундуках
 * 
 * @returns {Object[]} - Массив данных о сундуках
 */
export function collectChestsData() {
  return state.chests.map(c => ({
    x: c.x, y: c.y, type: c.type, opened: c.opened,
    countedForAchievement: c.countedForAchievement || false
  }));
}

/**
 * Сбор данных о святилищах (алтарях)
 * 
 * @returns {Object[]} - Массив данных о святилищах
 */
export function collectShrinesData() {
  return state.shrines.map(s => ({
    x: s.x, y: s.y, effect: s.effect, effectText: s.effectText, activated: s.activated
  }));
}

/**
 * Сбор данных о предметах на полу
 * 
 * @returns {Object[]} - Массив данных о предметах
 */
export function collectLootData() {
  return state.lootItems.map(l => ({
    x: l.x, y: l.y, type: l.type, value: l.value
  }));
}

/**
 * Сбор данных о факелах
 * 
 * @returns {Object} - Данные о факелах
 */
export function collectTorchesData() {
  return {
    torches: state.torches.map(t => ({
      x: t.x, y: t.y, active: t.active,
      appearTimer: t.appearTimer || 1,
      flickerPhase: t.flickerPhase || 0,
      intensity: t.intensity || 0.7,
      isTrapTorch: t.isTrapTorch || false,
      flameColor: t.flameColor || COLORS.torches.flame,
      glowColor: t.glowColor || COLORS.torches.glow,
      particleColor: t.particleColor || COLORS.torches.particle,
      emoji: t.emoji || '🕯️'
    })),
    fireParticles: state.fireParticles
  };
}

/**
 * Сбор данных о светлячках
 * 
 * @returns {Object[]} - Массив данных о светлячках
 */
export function collectFirefliesData() {
  if (!state.fireflies) return [];
  return state.fireflies.map(fly => ({
    cellX: fly.cellX,
    cellY: fly.cellY,
    worldX: fly.worldX,
    worldY: fly.worldY,
    portalX: fly.portalX,
    portalY: fly.portalY,
    portalType: fly.portalType,
    angle: fly.angle,
    angleSpeed: fly.angleSpeed,
    radius: fly.radius,
    wobbleX: fly.wobbleX,
    wobbleY: fly.wobbleY,
    wobbleAngle: fly.wobbleAngle,
    wobbleSpeed: fly.wobbleSpeed,
    wobbleRadius: fly.wobbleRadius,
    flickerPhase: fly.flickerPhase,
    flickerSpeed: fly.flickerSpeed,
    opacity: fly.opacity,
    size: fly.size,
    x: fly.x,
    y: fly.y
  }));
}

/**
 * Сбор данных о рунах
 * 
 * @returns {Object[]} - Массив данных о рунах
 */
export function collectRunesData() {
  return state.runes.map(rune => ({
    x: rune.x,
    y: rune.y,
    symbol: rune.symbol,
    size: rune.size,
    color: rune.color,
    flickerPhase: rune.flickerPhase,
    flickerSpeed: rune.flickerSpeed,
    baseOpacity: rune.baseOpacity,
    offsetX: rune.offsetX,
    offsetY: rune.offsetY,
    rotation: rune.rotation,
    glowIntensity: rune.glowIntensity || 0,
    type: rune.type || 'default',
    isOnFloor: rune.isOnFloor || false
  }));
}

/**
 * Сбор данных о колоннах
 * 
 * @returns {Object[]} - Массив данных о колоннах
 */
export function collectPillarsData() {
  if (!state.pillars || state.pillars.length === 0) return [];
  return state.pillars.map(p => ({
    x: p.x,
    y: p.y,
    gridX: p.gridX,
    gridY: p.gridY,
    size: p.size,
    isPillar: p.isPillar,
    hasTorch: p.hasTorch || false,
    torchFlicker: p.torchFlicker || 0
  }));
}

/**
 * Сбор данных об адаптации монстров
 * 
 * @returns {Object} - Данные об адаптации
 */
export function collectAdaptationData() {
  return {
    monsterAdaptation: state.monsterAdaptation,
    totalAttacks: state.totalAttacks
  };
}

/**
 * Сбор данных о случайных событиях
 * 
 * @returns {Object} - Данные о событиях
 */
export function collectEventData() {
  return {
    currentEvent: state.currentEvent,
    bloodMoonActive: state.bloodMoonActive,
    eventDamageMultiplier: player.eventDamageMultiplier,
    eventGoldMultiplier: player.eventGoldMultiplier,
    eventSpeedBonus: player.eventSpeedBonus,
    eventSlowMultiplier: player.eventSlowMultiplier
  };
}

/**
 * Сбор данных о сокровищнице
 * 
 * @returns {Object} - Данные о сокровищнице
 */
export function collectTreasureRoomData() {
  return {
    inTreasureRoom: state.inTreasureRoom,
    secretPortal: state.secretPortal ? { ...state.secretPortal } : null,
    exitPortal: state.exitPortal ? { ...state.exitPortal } : null,
    returnPortal: state.returnPortal ? { ...state.returnPortal } : null,
    originalGrid: state.originalGrid ? saveOriginalGrid() : null,
    originalGoal: state.originalGoal,
    originalShopPos: state.originalShopPos,
    originalMapCols: state.originalMapCols,
    originalMapRows: state.originalMapRows,
    originalMonsters: state.originalMonsters ? collectMonstersDataFrom(state.originalMonsters) : [],
    originalTraps: state.originalTraps ? collectTrapsDataFrom(state.originalTraps) : [],
    originalHadMonsters: state.originalHadMonsters || false,
    originalArtifacts: state.originalArtifacts ? state.originalArtifacts : [],
    originalChests: state.originalChests ? state.originalChests : [],
    originalLootItems: state.originalLootItems ? state.originalLootItems : [],
    originalShrines: state.originalShrines ? collectShrinesDataFrom(state.originalShrines) : [],
    originalTorches: state.originalTorches ? collectTorchesDataFrom(state.originalTorches) : []
  };
}

/**
 * Сбор данных о комнате-ловушке
 * 
 * @returns {Object} - Данные о комнате-ловушке
 */
export function collectTrapRoomData() {
  const aliveMonsters = (state.trapMonsters || []).filter(m => m.hp > 0);
  const monsterIds = [];
  for (const m of aliveMonsters) {
    if (!m.id) {
      m.id = `${m.x},${m.y},${Date.now()}`;
    }
    monsterIds.push(m.id);
  }
  return {
    inTrapRoom: state.inTrapRoom || false,
    trapActivated: state.trapActivated || false,
    trapWave: state.trapWave || 0,
    trapMonstersTotal: state.trapMonstersTotal || 0,
    trapMonstersKilled: state.trapMonstersKilled || 0,
    trapWaveActive: state.trapWaveActive || false,
    trapExitRevealed: state.trapExitRevealed || false,
    trapPortal: state.trapPortal ? {
      x: state.trapPortal.x,
      y: state.trapPortal.y,
      active: state.trapPortal.active || false,
      hidden: state.trapPortal.hidden !== undefined ? state.trapPortal.hidden : true,
      targetMap: state.trapPortal.targetMap || 'trap'
    } : null,
    trapFakePortal: state.trapFakePortal && state.trapFakePortal.active ? {
      x: state.trapFakePortal.x,
      y: state.trapFakePortal.y,
      active: state.trapFakePortal.active || false,
      isFake: true
    } : null,
    trapExitPortal: state.trapExitPortal ? {
      x: state.trapExitPortal.x,
      y: state.trapExitPortal.y,
      spawnX: state.trapExitPortal.spawnX,
      spawnY: state.trapExitPortal.spawnY,
      active: state.trapExitPortal.active || false
    } : null,
    trapRoomLastLevel: state.trapRoomLastLevel || 0,
    trapWaveLoaded: state.trapWaveLoaded || false,
    trapMonsterIds: monsterIds,
    trapMonsters: aliveMonsters.map(m => ({
      id: m.id || `${m.x},${m.y},${Date.now()}`,
      x: m.x, y: m.y,
      startX: m.startX, startY: m.startY,
      hp: m.hp,
      maxHp: m.maxHp,
      damage: m.damage,
      emoji: m.emoji,
      radius: m.radius,
      name: m.name,
      speed: m.speed,
      vision: m.vision,
      dir: m.dir,
      isHorizontal: m.isHorizontal,
      patrolRange: m.patrolRange,
      state: m.state,
      lastHit: m.lastHit || 0,
      stunTimer: m.stunTimer || 0,
      poisonOnHit: m.poisonOnHit || false,
      isGhost: m.isGhost || false,
      isTrapMonster: true,
      canDropItems: false
    }))
  };
}

/**
 * Сбор данных о секретных комнатах
 * 
 * @returns {Object} - Данные о секретных комнатах
 */
export function collectSecretRoomsData() {
  return {
    treasurePortal: state.treasurePortal ? {
      x: state.treasurePortal.x,
      y: state.treasurePortal.y,
      active: state.treasurePortal.active,
      hidden: state.treasurePortal.hidden,
      targetMap: state.treasurePortal.targetMap
    } : null,
    treasureExitPortal: state.treasureExitPortal ? {
      x: state.treasureExitPortal.x,
      y: state.treasureExitPortal.y,
      spawnX: state.treasureExitPortal.spawnX,
      spawnY: state.treasureExitPortal.spawnY,
      active: state.treasureExitPortal.active
    } : null,
    inTreasureRoom: state.inTreasureRoom || false,
    shrinePortal: state.shrinePortal ? {
      x: state.shrinePortal.x,
      y: state.shrinePortal.y,
      active: state.shrinePortal.active,
      hidden: state.shrinePortal.hidden,
      targetMap: state.shrinePortal.targetMap
    } : null,
    shrineExitPortal: state.shrineExitPortal ? {
      x: state.shrineExitPortal.x,
      y: state.shrineExitPortal.y,
      spawnX: state.shrineExitPortal.spawnX,
      spawnY: state.shrineExitPortal.spawnY,
      active: state.shrineExitPortal.active
    } : null,
    inShrineRoom: state.inShrineRoom || false,
    trapPortal: state.trapPortal ? {
      x: state.trapPortal.x,
      y: state.trapPortal.y,
      active: state.trapPortal.active || false,
      hidden: state.trapPortal.hidden !== undefined ? state.trapPortal.hidden : true,
      targetMap: state.trapPortal.targetMap || 'trap'
    } : null,
    trapFakePortal: state.trapFakePortal ? {
      x: state.trapFakePortal.x,
      y: state.trapFakePortal.y,
      active: state.trapFakePortal.active || false,
      isFake: true
    } : null,
    trapExitPortal: state.trapExitPortal ? {
      x: state.trapExitPortal.x,
      y: state.trapExitPortal.y,
      spawnX: state.trapExitPortal.spawnX,
      spawnY: state.trapExitPortal.spawnY,
      active: state.trapExitPortal.active || false
    } : null,
    inTrapRoom: state.inTrapRoom || false,
    originalArtifacts: state.originalArtifacts ? state.originalArtifacts : [],
    originalChests: state.originalChests ? state.originalChests : [],
    originalLootItems: state.originalLootItems ? state.originalLootItems : [],
    originalShrines: state.originalShrines ? collectShrinesDataFrom(state.originalShrines) : [],
    returnPortal: state.returnPortal ? { ...state.returnPortal } : null,
    originalMapCols: state.originalMapCols,
    originalMapRows: state.originalMapRows,
    originalGoal: state.originalGoal,
    originalShopPos: state.originalShopPos,
    bonusGiven: state.bonusGiven,
    hadMonsters: state.hadMonsters
  };
}

/**
 * Сбор данных о безопасной комнате
 * 
 * @returns {Object} - Данные о безопасной комнате
 */
export function collectSafeRoomData() {
  const bookshelves = [];
  if (state.bookshelves) {
    for (const shelf of state.bookshelves) {
      bookshelves.push({ x: shelf.x, y: shelf.y });
    }
  }
  
  return {
    safePortal: state.safePortal ? { ...state.safePortal } : null,
    safeExitPortal: state.safeExitPortal ? { ...state.safeExitPortal } : null,
    inSafeRoom: state.inSafeRoom || false,
    originalSafePortal: state.originalSafePortal ? { ...state.originalSafePortal } : null,
    originalHadMap: state.originalHadMap !== undefined ? state.originalHadMap : undefined,
    originalRevealedCells: state.originalRevealedCells ? [...state.originalRevealedCells] : [],
    safeChestOpened: state.safeChestOpened || false,
    bookshelves: bookshelves
  };
}

/**
 * Сбор данных о статистике игры
 * 
 * @returns {Object} - Данные о статистике
 */
export function collectGameStatsData() {
  return {
    maxHpAtEnd: state.gameStats.maxHpAtEnd || 0,
    hpRemaining: state.gameStats.hpRemaining || 0,
    goldCollected: state.gameStats.goldCollected || 0,
    goldSpent: state.gameStats.goldSpent || 0,
    artifactsCollected: state.gameStats.artifactsCollected || 0,
    artifactsTotalPossible: state.gameStats.artifactsTotalPossible || 0,
    monstersKilled: state.gameStats.monstersKilled || 0,
    bossesTotal: state.gameStats.bossesTotal || 0,
    weaponHits: {
      default: state.gameStats.weaponHits?.default || 0,
      stun: state.gameStats.weaponHits?.stun || 0,
      vampire: state.gameStats.weaponHits?.vampire || 0,
      fireball: state.gameStats.weaponHits?.fireball || 0
    },
    favoriteWeapon: state.gameStats.favoriteWeapon || 'default',
    secretRoomsVisited: state.gameStats.secretRoomsVisited || 0,
    secretRoomsGenerated: state.gameStats.secretRoomsGenerated || 0,
    trapsTriggered: {
      spike: state.gameStats.trapsTriggered?.spike || 0,
      ice: state.gameStats.trapsTriggered?.ice || 0,
      acid: state.gameStats.trapsTriggered?.acid || 0,
      lightning: state.gameStats.trapsTriggered?.lightning || 0
    },
    mimicBites: state.gameStats.mimicBites || 0,
    playTime: state.gameStats.playTime || 0,
    playTimeFormatted: formatPlayTime(state.gameStats.playTime || 0)
  };
}

/**
 * Сбор данных о достижениях
 * 
 * @returns {Object} - Данные о достижениях
 */
export function collectAchievementsData() {
  if (!state.achievements) {
    return {
      unlocked: [],
      progress: {}
    };
  }
  return {
    unlocked: state.achievements.unlocked || [],
    progress: state.achievements.progress || {}
  };
}

/**
 * Сбор данных о записках
 * 
 * @returns {Object} - Данные о записках
 */
export function collectNotesData() {
  if (!state.notes) {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  const positions = {};
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      const cell = state.grid[y]?.[x];
      if (cell && cell.hasNote && cell.noteId) {
        // Сохраняем позицию только если записка ещё не найдена
        if (!state.notes.found.includes(cell.noteId)) {
          positions[cell.noteId] = { x, y };
        }
      }
    }
  }

  return {
    found: state.notes.found || [],
    spawned: state.notes.spawned || {},
    positions: positions
  };
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Сохранение сетки лабиринта
 * 
 * @returns {Array} - Данные сетки
 * @private
 */
function saveMazeGrid() {
  const gridData = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    if (!state.grid[y]) continue;
    gridData[y] = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y][x]) {
        gridData[y][x] = {
          isWall: state.grid[y][x].isWall,
          isBreakable: state.grid[y][x].isBreakable,
          revealed: state.grid[y][x].revealed,
          hasSecretPortal: state.grid[y][x].hasSecretPortal || false,
          hasTreasurePortal: state.grid[y][x].hasTreasurePortal || false,
          hasShrinePortal: state.grid[y][x].hasShrinePortal || false,
          isPortal: state.grid[y][x].isPortal || false,
          isShrinePortal: state.grid[y][x].isShrinePortal || false,
          isPillar: state.grid[y][x].isPillar || false
        };
      } else {
        gridData[y][x] = null;
      }
    }
  }
  return gridData;
}

/**
 * Сохранение открытых клеток
 * 
 * @returns {Array} - Массив открытых клеток
 * @private
 */
function saveRevealedCells() {
  const revealed = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    if (!state.grid[y]) continue;
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y][x] && state.grid[y][x].revealed) {
        revealed.push({ x, y });
      }
    }
  }
  return revealed;
}

/**
 * Сохранение оригинальной сетки (для сокровищницы)
 * 
 * @returns {Array|null} - Данные оригинальной сетки
 * @private
 */
function saveOriginalGrid() {
  if (!state.originalGrid) return null;
  const rows = state.originalMapRows || CONFIG.rows;
  const cols = state.originalMapCols || CONFIG.cols;
  const gridData = [];
  for (let y = 0; y < rows; y++) {
    if (!state.originalGrid[y]) continue;
    gridData[y] = [];
    for (let x = 0; x < cols; x++) {
      if (state.originalGrid[y][x]) {
        gridData[y][x] = {
          isWall: state.originalGrid[y][x].isWall,
          isBreakable: state.originalGrid[y][x].isBreakable,
          revealed: state.originalGrid[y][x].revealed
        };
      } else {
        gridData[y][x] = null;
      }
    }
  }
  return gridData;
}

/**
 * Сбор данных о монстрах из переданного массива
 * 
 * @param {Array} monsters - Массив монстров
 * @returns {Array} - Данные о монстрах
 * @private
 */
function collectMonstersDataFrom(monsters) {
  return monsters.map(m => ({
    x: m.x, y: m.y, startX: m.startX, startY: m.startY,
    hp: m.hp, maxHp: m.maxHp, damage: m.damage, emoji: m.emoji,
    radius: m.radius, name: m.name, speed: m.speed, vision: m.vision,
    dir: m.dir, isHorizontal: m.isHorizontal, patrolRange: m.patrolRange,
    state: m.state, lastHit: m.lastHit || 0, stunTimer: m.stunTimer || 0,
    poisonTimer: m.poisonTimer || 0, poisonTick: m.poisonTick || 0,
    poisonOnHit: m.poisonOnHit || false, isMinion: m.isMinion || false,
    isGhost: m.isGhost || false, willNeverStop: m.willNeverStop || false
  }));
}

/**
 * Сбор данных о ловушках из переданного массива
 * 
 * @param {Array} traps - Массив ловушек
 * @returns {Array} - Данные о ловушках
 * @private
 */
function collectTrapsDataFrom(traps) {
  return traps.map(t => ({
    x: t.x, y: t.y, damage: t.damage, type: t.type,
    triggered: t.triggered, resetTimer: t.resetTimer
  }));
}

/**
 * Сбор данных о святилищах из переданного массива
 * 
 * @param {Array} shrines - Массив святилищ
 * @returns {Array} - Данные о святилищах
 * @private
 */
function collectShrinesDataFrom(shrines) {
  return shrines.map(s => ({
    x: s.x, y: s.y, effect: s.effect, effectText: s.effectText, activated: s.activated
  }));
}

/**
 * Сбор данных о факелах из переданного массива
 * 
 * @param {Array} torches - Массив факелов
 * @returns {Array} - Данные о факелах
 * @private
 */
function collectTorchesDataFrom(torches) {
  return torches.map(t => ({
    x: t.x, y: t.y, active: t.active,
    appearTimer: t.appearTimer || 1,
    flickerPhase: t.flickerPhase || 0,
    intensity: t.intensity || 0.7
  }));
}