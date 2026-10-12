/**
 * @fileoverview Восстановление данных блуждающих огоньков (призванных и диких).
 * @module save/restorers/willOTheWispsRestorer
 */

import { state, player } from '../../core/config/index.js';
import { initWispsState } from '../../entities/objects/willOTheWisps/wispsState.js';
import { WISPS_BIOME_COLORS } from '../../entities/objects/willOTheWisps/wispsData.js';

// ============================================================
// ПРИЗВАННЫЕ ОГОНЬКИ
// ============================================================

/**
 * Восстановление данных призванных огоньков из сохранения
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreWispsData(save) {
  if (!save) return;

  // Счётчики восстанавливаются всегда
  if (save.wispsData) {
    player.wispsAcquiredAtLevel = save.wispsData.wispsAcquiredAtLevel !== undefined ? save.wispsData.wispsAcquiredAtLevel : null;
    player.wispsBossesDefeated = save.wispsData.wispsBossesDefeated || 0;
  }

  if (!save.wispsData || !save.wispsData.list || save.wispsData.list.length === 0) return;

  initWispsState();
  const d = save.wispsData;

  state.wisps.active = d.active || false;
  state.wisps.borrowedHpPerWisp = d.borrowedHpPerWisp || 0;
  state.wisps.borrowedHp = d.borrowedHp || 0;
  state.wisps.resummonCooldown = d.resummonCooldown || 0;

  // Определение текущего биома для фоллбэка цветов
  const biome = state.currentBiome || 'cave';
  const biomeColors = WISPS_BIOME_COLORS[biome] || WISPS_BIOME_COLORS.cave;

  state.wisps.list = d.list.map((w) => {
    const restored = { ...w };

    // Восстановление базовых цветов
    if (restored.baseHue === undefined) {
      const parsedHue = parseFloat(restored.hue);
      restored.baseHue = isNaN(parsedHue) ? biomeColors.hue : parsedHue;
    }
    if (restored.baseSat === undefined) restored.baseSat = biomeColors.sat;
    if (restored.baseLight === undefined) restored.baseLight = biomeColors.light;
    if (restored.baseGlowLight === undefined) restored.baseGlowLight = biomeColors.glowLight;
    if (restored.baseBrightLight === undefined) restored.baseBrightLight = biomeColors.brightLight;

    // Восстановление текущих цветов
    if (restored.currentSat === undefined) restored.currentSat = restored.baseSat;
    if (restored.currentLight === undefined) restored.currentLight = restored.baseLight;
    if (restored.currentGlowLight === undefined) restored.currentGlowLight = restored.baseGlowLight;
    if (restored.currentBrightLight === undefined) restored.currentBrightLight = restored.baseBrightLight;
    if (restored.currentCoreSat === undefined) restored.currentCoreSat = Math.max(20, (restored.baseSat ?? 100) - 40);

    // Восстановление кровавого насыщения
    if (restored.bloodIntensity === undefined) restored.bloodIntensity = 0;
    if (restored.bloodCooldownTimer === undefined) restored.bloodCooldownTimer = 0;

    // Страховка: гарантия наличия всех нужных полей
    restored.hue = restored.hue || String(biomeColors.hue);
    restored.attackTimeout = restored.attackTimeout || 0;
    restored.staminaSearchCooldown = restored.staminaSearchCooldown || 0;
    restored.targetSearchTimer = restored.targetSearchTimer || 0;
    restored.hitCooldown = restored.hitCooldown || 0;
    restored.rechargeTimer = restored.rechargeTimer || 0;
    restored.trailCounter = 0;

    // Сброс визуального состояния
    restored.trail = [];
    restored.pulse = 0.5;
    restored._deathParticlesSpawned = false;

    // Цель не сохраняется - огонёк повторяет выбор
    restored.target = null;

    // Телепорт к игроку
    restored.laggedPlayerX = player.px;
    restored.laggedPlayerY = player.py;
    restored.currentX = player.px + (Math.random() - 0.5) * 40;
    restored.currentY = player.py + (Math.random() - 0.5) * 40 - 22;

    return restored;
  });
}

/**
 * Телепорт призванных огоньков к игроку (при переходах)
 * 
 * @returns {void}
 */
export function teleportWispsToPlayer() {
  if (!state.wisps || !state.wisps.list) return;
  for (const w of state.wisps.list) {
    w.laggedPlayerX = player.px;
    w.laggedPlayerY = player.py;
    w.currentX = player.px + (Math.random() - 0.5) * 30;
    w.currentY = player.py + (Math.random() - 0.5) * 30 - 22;
    w.trail = [];
    w.target = null;
    // Сброс таймеров (страховка)
    w.staminaSearchCooldown = 0;
    w.attackTimeout = 0;
    w.targetSearchTimer = 0;
  }
}

// ============================================================
// ДИКИЕ ОГОНЬКИ
// ============================================================

/**
 * Восстановление данных диких огоньков.
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreWildWispsData(save) {
  if (!save.wildWisps || !Array.isArray(save.wildWisps)) {
    state.wildWisps = [];
    return;
  }

  state.wildWisps = save.wildWisps.map(w => ({
    ...w,
    stunTimer: w.stunTimer || 0,
    lastHit: w.lastHit || 0,
    pulsePhase: w.pulsePhase || Math.random() * Math.PI * 2,
    pulseSpeed: w.pulseSpeed || 0.8 + Math.random() * 0.6,
    isWildWisp: true,
  }));
}