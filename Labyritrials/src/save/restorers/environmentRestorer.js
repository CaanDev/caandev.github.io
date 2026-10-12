/**
 * @fileoverview Восстановление данных окружения (факелы, светлячки, руны, кровь).
 * 
 * @module save/restorers/environmentRestorer
 */

import { state, CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { Firefly, generatedPortals } from '../../entities/objects/firefly.js';

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

  if (save.fireParticles && Array.isArray(save.fireParticles)) state.fireParticles = save.fireParticles;
  else state.fireParticles = [];
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
      f.cellX, f.cellY,
      f.worldX, f.worldY,
      f.portalX, f.portalY,
      f.portalType,
      f.biome || 'cave',
      f.layer || null
    );

    // Восстановление цветов
    if (f.bodyColor) fly.bodyColor = f.bodyColor;
    if (f.glowColor) fly.glowColor = f.glowColor;
    if (f.coreColor) fly.coreColor = f.coreColor;
    if (f.baseOpacity !== undefined) fly.baseOpacity = f.baseOpacity;
    if (f.sizeMultiplier !== undefined) fly.sizeMultiplier = f.sizeMultiplier;
    if (f.glowSize !== undefined) fly.glowSize = f.glowSize;

    // Восстановление параметров движения
    if (f.angle !== undefined) fly.angle = f.angle;
    if (f.angleSpeed !== undefined) fly.angleSpeed = f.angleSpeed;
    if (f.wanderAngle !== undefined) fly.wanderAngle = f.wanderAngle;
    if (f.wanderSpeed !== undefined) fly.wanderSpeed = f.wanderSpeed;
    if (f.wanderRadius !== undefined) fly.wanderRadius = f.wanderRadius;
    if (f.radius !== undefined) fly.radius = f.radius;
    if (f.radiusSpeed !== undefined) fly.radiusSpeed = f.radiusSpeed;
    if (f.radiusPhase !== undefined) fly.radiusPhase = f.radiusPhase;

    // Восстановление параметров внешнего вида
    if (f.size !== undefined) fly.size = f.size;
    if (f.flickerPhase !== undefined) fly.flickerPhase = f.flickerPhase;
    if (f.flickerSpeed !== undefined) fly.flickerSpeed = f.flickerSpeed;
    if (f.opacity !== undefined) fly.opacity = f.opacity;
    if (f.x !== undefined) fly.x = f.x;
    if (f.y !== undefined) fly.y = f.y;
    if (f.active !== undefined) fly.active = f.active;

    return fly;
  });

  // Восстановление generatedPortals
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
 * Восстановление данных о кровавых лужах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBloodPuddles(save) {
  state.bloodPuddles = (save.bloodPuddles && Array.isArray(save.bloodPuddles)) ? save.bloodPuddles : [];
}