/**
 * @fileoverview Сбор данных окружения (факелы, светлячки, руны).
 * 
 * @module save/collectors/environmentCollector
 */

import { state, CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

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