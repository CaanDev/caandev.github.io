/**
 * @fileoverview Сбор данных блуждающих огоньков (призванных и диких) для сохранения.
 * @module save/collectors/willOTheWispsCollector
 */

import { state, player } from '../../core/config/index.js';

// ============================================================
// ПРИЗВАННЫЕ ОГОНЬКИ
// ============================================================

/**
 * Сбор данных призванных огоньков.
 * 
 * @returns {Object} - Данные для сохранения
 */
export function collectWispsData() {
  const base = {
    active: false,
    borrowedHpPerWisp: 0,
    borrowedHp: 0,
    wispsAcquiredAtLevel: player.wispsAcquiredAtLevel !== undefined ? player.wispsAcquiredAtLevel : null,
    wispsBossesDefeated: player.wispsBossesDefeated || 0,
    resummonCooldown: state.wisps?.resummonCooldown || 0,
    list: [],
  };

  if (!state.wisps || state.wisps.list.length === 0) return base;

  return {
    active: state.wisps.active,
    borrowedHpPerWisp: state.wisps.borrowedHpPerWisp,
    borrowedHp: state.wisps.borrowedHp,
    wispsAcquiredAtLevel: player.wispsAcquiredAtLevel !== undefined ? player.wispsAcquiredAtLevel : null,
    wispsBossesDefeated: player.wispsBossesDefeated || 0,
    resummonCooldown: state.wisps?.resummonCooldown || 0,
    list: state.wisps.list.map(w => ({
      baseAngle: w.baseAngle,
      orbitRadius: w.orbitRadius,
      angularSpeed: w.angularSpeed,
      offsetX: w.offsetX,
      offsetY: w.offsetY,
      vx: w.vx,
      vy: w.vy,
      targetVx: w.targetVx,
      targetVy: w.targetVy,

      // Цветовые параметры (базовые)
      hue: w.hue,
      baseHue: w.baseHue,
      baseSat: w.baseSat,
      baseLight: w.baseLight,
      baseGlowLight: w.baseGlowLight,
      baseBrightLight: w.baseBrightLight,

      // Цветовые параметры (текущие, с учётом крови)
      currentSat: w.currentSat,
      currentLight: w.currentLight,
      currentGlowLight: w.currentGlowLight,
      currentBrightLight: w.currentBrightLight,
      currentCoreSat: w.currentCoreSat,

      color: w.color,
      glowColor: w.glowColor,
      brightColor: w.brightColor,

      // Кровавое насыщение
      bloodIntensity: w.bloodIntensity || 0,
      bloodCooldownTimer: w.bloodCooldownTimer || 0,

      // Движение и состояние
      pulseOffset: w.pulseOffset,
      pulseSpeed: w.pulseSpeed,
      laggedPlayerX: w.laggedPlayerX,
      laggedPlayerY: w.laggedPlayerY,
      currentX: w.currentX,
      currentY: w.currentY,
      depthFactor: w.depthFactor,
      attackAngleOffset: w.attackAngleOffset,
      attackRadius: w.attackRadius,
      attackTimeout: w.attackTimeout,
      staminaSearchCooldown: w.staminaSearchCooldown,
      targetSearchTimer: w.targetSearchTimer,
      hitCooldown: w.hitCooldown,
      hitsLeft: w.hitsLeft,
      runsLeft: w.runsLeft,
      rechargeTimer: w.rechargeTimer,
      returning: w.returning,
      dying: w.dying,
      deathTimer: w.deathTimer,
    })),
  };
}

// ============================================================
// ДИКИЕ ОГОНЬКИ
// ============================================================

/**
 * Сбор данных диких огоньков.
 * 
 * @returns {Object[]} - Данные для сохранения
 */
export function collectWildWispsData() {
  if (!state.wildWisps) return [];
  return state.wildWisps.map(w => ({
    id: w.id,
    x: w.x,
    y: w.y,
    startX: w.startX,
    startY: w.startY,
    hp: w.hp,
    maxHp: w.maxHp,
    damage: w.damage,
    radius: w.radius,
    speed: w.speed,
    vision: w.vision,
    state: w.state,
    stunTimer: w.stunTimer || 0,
    lastHit: w.lastHit || 0,
    pulsePhase: w.pulsePhase || 0,
    pulseSpeed: w.pulseSpeed || 1,
  }));
}