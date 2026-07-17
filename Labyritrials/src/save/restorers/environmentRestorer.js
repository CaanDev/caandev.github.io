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
 * Восстановление данных о кровавых лужах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBloodPuddles(save) {
  state.bloodPuddles = (save.bloodPuddles && Array.isArray(save.bloodPuddles)) ? save.bloodPuddles : [];
}