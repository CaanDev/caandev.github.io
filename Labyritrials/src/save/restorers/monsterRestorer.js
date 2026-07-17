/**
 * @fileoverview Восстановление данных монстров и боссов.
 * 
 * @module save/restorers/monsterRestorer
 */

import { state, CONFIG } from '../../core/config/index.js';
import { getBossByLevel, BOSS_TYPES } from '../../entities/monsters/bosses/config.js';
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
import { restoreBossAbilities } from './helpers.js';

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