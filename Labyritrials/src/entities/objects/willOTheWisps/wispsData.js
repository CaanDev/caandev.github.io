/**
 * @fileoverview Константы и конфигурация блуждающих огоньков.
 * @module entities/objects/willOTheWisps/wispsData
 */

import { CONFIG } from '../../../core/config/index.js';

export const WISPS_CONFIG = {
  COUNT: 3,
  STAMINA_COST: 25,
  WISP_STAMINA_COST: 3,
  HP_BASE_FRACTION: 1 / 3,
  HP_BOSS_REDUCTION: 0.1,
  HP_MIN_FRACTION: 0.1,
  HITS_PER_RUN: 3,
  MAX_RUNS: 3,
  RECHARGE_FRAMES: 120,
  RESUMMON_COOLDOWN_FRAMES: 600,
  HIT_RADIUS: 28,
  HIT_COOLDOWN: 12,
  ATTACK_SPEED_MULT: 1.25,
  RETURN_SPEED_MULT: 1.15,
  HIT_BOUNCE: 15,
};

export function getAggroRadius() {
  return (CONFIG.cellSize || 160) * 2.5;
}

export const WISPS_VISUAL = {
  CORE_RADIUS: 3,
  INNER_GLOW: 7,
  GLOW_RADIUS: 14,
  HALO_SCALE_1: 3.0,
  HALO_SCALE_2: 2.0,
  HALO_SCALE_3: 1.3,
  BLOOM_BLUR: 35,
  SOFT_ALPHA_1: 0.20,
  SOFT_ALPHA_2: 0.13,
  SOFT_ALPHA_3: 0.07,
  ORBIT_Y_SCALE: 0.55,
  HEIGHT_OFFSET: -22,
  PLAYER_LIGHT_RADIUS: 150,
};

export const WISPS_MOTION = {
  ORBIT_RADIUS_MIN: 45,
  ORBIT_RADIUS_MAX: 85,
  ANGULAR_SPEED_BASE: 0.012,
  WANDER_STRENGTH: 0.05,
  SMOOTH_FACTOR: 0.025,
  MAX_WANDER_SPEED: 0.9,
  MAX_OFFSET: 45,
  RETURN_THRESHOLD: 25,
  FOLLOW_LAG: 0.045,
  MOVING_LAG_BOOST: 0.6,
  TRANSIT_LERP_ATTACK: 0.045,
  TRANSIT_LERP_RETURN: 0.05,
  MAX_TRAIL_LENGTH: 6,
  TRAIL_SAMPLE_STEP: 2,
};

export const WISPS_COLORS = {
  HUE_BASE: 265,
  HUE_RANGE: 20,
};

/**
 * @namespace WISPS_BIOME_COLORS
 * @description Цветовые схемы огоньков для разных биомов.
 * Безопасная комната, тайные комнаты и босс-арены используют cave-схему.
 */
export const WISPS_BIOME_COLORS = {
  cave: { hue: 265, hueRange: 20, sat: 100, light: 70, glowLight: 78, brightLight: 90, },
  ice: { hue: 280, hueRange: 15, sat: 100, light: 42, glowLight: 55, brightLight: 72, },
  sand: { hue: 265, hueRange: 20, sat: 100, light: 70, glowLight: 78, brightLight: 90, },
};

/**
 * @namespace WISPS_BLOOD
 * @description Параметры «кровавого насыщения» огоньков при атаках вампирским посохом.
 *
 * Насыщение растёт до 1.0 за 5 ударов. После последнего удара —
 * задержка 1 секунда, затем плавный откат за 15 секунд.
 * При полном насыщении цвет становится глубоким насыщенным красным.
 */
export const WISPS_BLOOD = {
  /** @type {number} - Целевой оттенок при полном насыщении */
  HUE: 0,

  /** @type {number} - Разброс оттенка при полном насыщении */
  HUE_RANGE: 8,

  /** @type {number} - Прирост насыщения за удар (4 удара = 1.0) */
  GAIN_PER_HIT: 1/4,

  /** @type {number} - Затухание за кадр (20 секунд при 60 FPS) */
  DECAY_PER_FRAME: 1 / (20 * 60),

  /** @type {number} - Задержка перед началом затухания (кадры, ~1 сек) */
  COOLDOWN_AFTER_HIT: 60,

  /** @type {number} - Прирост saturation за единицу bloodIntensity */
  SAT_GAIN: 15,

  /** @type {number} - Падение lightness (основного) за единицу bloodIntensity */
  LIGHT_DROP: 18,

  /** @type {number} - Падение glowLight за единицу bloodIntensity */
  GLOW_LIGHT_DROP: 18,

  /** @type {number} - Падение brightLight за единицу bloodIntensity */
  BRIGHT_LIGHT_DROP: 15,

  /** @type {number} - Прирост насыщенности ядра при полном насыщении */
  CORE_SAT_GAIN: 40,
};

export const WISPS_DEATH = {
  DURATION: 45,
  PARTICLE_COUNT: 14,
  PARTICLE_SPEED_MIN: 1,
  PARTICLE_SPEED_MAX: 4,
  PARTICLE_DRAG: 0.96,
};