/**
 * @fileoverview Сбор данных монстров и боссов.
 * 
 * @module save/collectors/monsterCollector
 */

import { state } from '../../core/config/index.js';

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