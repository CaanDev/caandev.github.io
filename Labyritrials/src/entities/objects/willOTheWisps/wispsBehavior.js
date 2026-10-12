/**
 * @fileoverview Движение и жизненный цикл блуждающих огоньков.
 * @module entities/objects/willOTheWisps/wispsBehavior
 */

import { state, player } from '../../../core/config/index.js';
import {
  WISPS_CONFIG,
  WISPS_MOTION,
  WISPS_VISUAL,
  WISPS_COLORS,
  WISPS_BIOME_COLORS,
  WISPS_BLOOD,
  WISPS_DEATH,
} from './wispsData.js';
import { getWisps } from './wispsState.js';
import { findWispTarget, performWispAttack } from './wispsCombat.js';

/** @type {number} - Фаза пульсации (общая) */
let pulsePhase = 0;

/**
 * Определение «эффективного» биома для цветовой схемы.
 *
 * В безопасной комнате, тайных комнатах и на босс-аренах используется
 * стандартная (cave) палитра, независимо от текущего игрового биома.
 *
 * @returns {string} - ID биома ('cave' | 'ice' | 'sand')
 */
function getEffectiveWispBiome() {
  if (
    state.inSafeRoom ||
    state.inTreasureRoom ||
    state.inShrineRoom ||
    state.inTrapRoom ||
    state.isBossLevel
  ) {
    return 'cave';
  }
  return state.currentBiome || 'cave';
}

/**
 * Линейная интерполяция hue по кратчайшему пути по кругу.
 *
 * @param {number} from
 * @param {number} to
 * @param {number} t
 * @returns {number}
 */
function lerpHue(from, to, t) {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (from + diff * t + 360) % 360;
}

/**
 * Квантование значения с шагом step.
 * Используется для ограничения размера кэша спрайтов.
 *
 * @param {number} value
 * @param {number} step
 * @returns {number}
 */
function quantize(value, step) {
  return Math.round(value / step) * step;
}

/**
 * Пересчёт цветов огонька в зависимости от кровавого насыщения.
 *
 * Обновляет hue, color, glowColor, brightColor + сохраняет текущие
 * значения sat/light/glowLight/brightLight/coreSat в полях огонька.
 *
 * Важно: все параметры квантуются, чтобы ограничить размер кэша спрайтов.
 *
 * @param {Object} w - Объект огонька
 * @returns {void}
 */
function updateWispColor(w) {
  const baseHue = w.baseHue ?? WISPS_COLORS.HUE_BASE;
  const baseSat = w.baseSat ?? 100;
  const baseLight = w.baseLight ?? 70;
  const baseGlowLight = w.baseGlowLight ?? 78;
  const baseBrightLight = w.baseBrightLight ?? 90;

  let quantizedHue;
  let currentSat;
  let currentLight;
  let currentGlowLight;
  let currentBrightLight;
  let currentCoreSat;

  if (w.bloodIntensity > 0.001) {
    // Целевой "кровавый" оттенок: 0 + небольшой разброс
    const targetHue = WISPS_BLOOD.HUE + ((baseHue * 7) % WISPS_BLOOD.HUE_RANGE);
    const currentHue = lerpHue(baseHue, targetHue, w.bloodIntensity);

    // Усиленное покраснение
    currentSat = Math.min(100, baseSat + w.bloodIntensity * WISPS_BLOOD.SAT_GAIN);
    currentLight = baseLight - w.bloodIntensity * WISPS_BLOOD.LIGHT_DROP;
    currentGlowLight = baseGlowLight - w.bloodIntensity * WISPS_BLOOD.GLOW_LIGHT_DROP;
    currentBrightLight = baseBrightLight - w.bloodIntensity * WISPS_BLOOD.BRIGHT_LIGHT_DROP;

    // Ядро становится насыщеннее
    currentCoreSat = Math.max(20, currentSat - 40 + w.bloodIntensity * WISPS_BLOOD.CORE_SAT_GAIN);
    quantizedHue = Math.round(currentHue / 5) * 5;
  } else {
    currentSat = baseSat;
    currentLight = baseLight;
    currentGlowLight = baseGlowLight;
    currentBrightLight = baseBrightLight;
    currentCoreSat = Math.max(20, baseSat - 40);
    quantizedHue = Math.round(baseHue / 5) * 5;
  }

  // Квантование параметров
  // Ограничивает размер кэша спрайтов, визуально почти незаметно.
  currentSat = quantize(currentSat, 3);
  currentLight = quantize(currentLight, 2);
  currentGlowLight = quantize(currentGlowLight, 2);
  currentBrightLight = quantize(currentBrightLight, 2);
  currentCoreSat = quantize(currentCoreSat, 3);

  w.hue = String(quantizedHue);
  w.currentSat = currentSat;
  w.currentLight = currentLight;
  w.currentGlowLight = currentGlowLight;
  w.currentBrightLight = currentBrightLight;
  w.currentCoreSat = currentCoreSat;

  w.color = `hsl(${quantizedHue}, ${currentSat}%, ${currentLight}%)`;
  w.glowColor = `hsl(${quantizedHue}, ${currentSat}%, ${currentGlowLight}%)`;
  w.brightColor = `hsl(${quantizedHue}, ${currentSat}%, ${currentBrightLight}%)`;
}

/**
 * Создание одного огонька
 *
 * @param {number} index
 * @param {number} spawnX
 * @param {number} spawnY
 * @returns {Object}
 */
export function createWisp(index, spawnX, spawnY) {
  const angle = (index / WISPS_CONFIG.COUNT) * Math.PI * 2 + Math.random() * 0.8;
  const orbitRadius =
    WISPS_MOTION.ORBIT_RADIUS_MIN +
    Math.random() * (WISPS_MOTION.ORBIT_RADIUS_MAX - WISPS_MOTION.ORBIT_RADIUS_MIN);

  // Используется "эффективный" биом
  const biome = getEffectiveWispBiome();
  const biomeColors = WISPS_BIOME_COLORS[biome] || WISPS_BIOME_COLORS.cave;
  const baseHue = biomeColors.hue + Math.random() * biomeColors.hueRange;

  const w = {
    hue: String(Math.floor(baseHue)),
    baseHue,
    baseSat: biomeColors.sat,
    baseLight: biomeColors.light,
    baseGlowLight: biomeColors.glowLight,
    baseBrightLight: biomeColors.brightLight,

    currentSat: biomeColors.sat,
    currentLight: biomeColors.light,
    currentGlowLight: biomeColors.glowLight,
    currentBrightLight: biomeColors.brightLight,
    currentCoreSat: Math.max(20, biomeColors.sat - 40),

    baseAngle: angle,
    orbitRadius,
    angularSpeed:
      (0.6 + Math.random() * 0.5) *
      WISPS_MOTION.ANGULAR_SPEED_BASE *
      (Math.random() > 0.5 ? 1 : -1),

    offsetX: (Math.random() - 0.5) * 25,
    offsetY: (Math.random() - 0.5) * 25,
    vx: 0,
    vy: 0,
    targetVx: 0,
    targetVy: 0,
    targetSearchTimer: 0,

    color: `hsl(${baseHue}, ${biomeColors.sat}%, ${biomeColors.light}%)`,
    glowColor: `hsl(${baseHue}, ${biomeColors.sat}%, ${biomeColors.glowLight}%)`,
    brightColor: `hsl(${baseHue}, ${biomeColors.sat}%, ${biomeColors.brightLight}%)`,

    trail: [],
    trailCounter: 0,

    pulseOffset: Math.random() * Math.PI * 2,
    pulseSpeed: 0.8 + Math.random() * 0.6,
    pulse: 0.5,

    laggedPlayerX: spawnX,
    laggedPlayerY: spawnY,

    currentX: spawnX,
    currentY: spawnY,
    depthFactor: 0.5,

    target: null,
    attackAngleOffset: Math.random() * Math.PI * 2,
    attackRadius: 12 + Math.random() * 10,
    attackTimeout: 0,
    hitCooldown: 0,
    hitsLeft: WISPS_CONFIG.HITS_PER_RUN,
    runsLeft: WISPS_CONFIG.MAX_RUNS,
    rechargeTimer: 0,
    returning: false,

    staminaSearchCooldown: 0,

    bloodIntensity: 0,
    bloodCooldownTimer: 0,

    dying: false,
    deathTimer: 0,
    _deathParticlesSpawned: false,
  };

  updateWispColor(w);
  return w;
}

/**
 * Обновление всех огоньков
 * @param {number} deltaTime
 * @returns {void}
 */
export function updateWisps(deltaTime) {
  if (state.wisps && state.wisps.resummonCooldown > 0) {
    state.wisps.resummonCooldown -= deltaTime * 60;
    if (state.wisps.resummonCooldown < 0) state.wisps.resummonCooldown = 0;
  }

  const list = getWisps();
  if (!list || list.length === 0) return;

  pulsePhase += 0.03;

  for (let i = list.length - 1; i >= 0; i--) {
    const w = list[i];

    // Обновление кровавого насыщения (всегда)
    if (w.bloodCooldownTimer > 0) {
      w.bloodCooldownTimer -= deltaTime * 60;
      if (w.bloodCooldownTimer < 0) w.bloodCooldownTimer = 0;
    }
    if (w.bloodIntensity > 0 && w.bloodCooldownTimer <= 0) {
      w.bloodIntensity = Math.max(0, w.bloodIntensity - WISPS_BLOOD.DECAY_PER_FRAME * deltaTime * 60);
    }
    updateWispColor(w);

    // Исчезновение
    if (w.dying) {
      w.deathTimer--;
      w.pulse = 0.5 + 0.5 * Math.sin(pulsePhase * w.pulseSpeed + w.pulseOffset);
      w.trail.length = 0;

      if (w.deathTimer === WISPS_DEATH.DURATION - 1 && !w._deathParticlesSpawned) {
        w._deathParticlesSpawned = true;
        spawnDeathParticles(w.currentX, w.currentY, w.brightColor);
      }

      if (w.deathTimer <= 0) {
        if (state.wisps) {
          player.hp = Math.min(
            player.maxHp,
            player.hp + state.wisps.borrowedHpPerWisp
          );
        }
        list.splice(i, 1);

        if (list.length === 0 && state.wisps) {
          state.wisps.active = false;
          state.wisps.borrowedHp = 0;
          state.wisps.resummonCooldown = WISPS_CONFIG.RESUMMON_COOLDOWN_FRAMES;
        }
      }
      continue;
    }

    const followK =
      WISPS_MOTION.FOLLOW_LAG *
      (player.isMoving ? WISPS_MOTION.MOVING_LAG_BOOST : 1);
    w.laggedPlayerX += (player.px - w.laggedPlayerX) * followK;
    w.laggedPlayerY += (player.py - w.laggedPlayerY) * followK;

    if (w.rechargeTimer > 0) {
      w.rechargeTimer -= deltaTime * 60;
      if (w.rechargeTimer <= 0) {
        w.rechargeTimer = 0;
        w.hitsLeft = WISPS_CONFIG.HITS_PER_RUN;
        w.returning = false;
      }
    }

    if (w.staminaSearchCooldown > 0) {
      w.staminaSearchCooldown -= deltaTime * 60;
      if (w.staminaSearchCooldown < 0) w.staminaSearchCooldown = 0;
    }

    if (
      !w.target &&
      w.hitsLeft > 0 &&
      w.rechargeTimer <= 0 &&
      w.runsLeft > 0 &&
      w.staminaSearchCooldown <= 0
    ) {
      w.targetSearchTimer = (w.targetSearchTimer || 0) - 1;
      if (w.targetSearchTimer <= 0) {
        w.targetSearchTimer = 10;
        w.target = findWispTarget(w);
        if (w.target) w.attackTimeout = 0;
      }
    }

    if (w.target) {
      const alive = w.target.hp > 0 && !w.target.isDead;
      if (!alive) {
        w.target = null;
        w.returning = true;
      } else {
        const runComplete = performWispAttack(w, deltaTime);
        if (runComplete) {
          w.target = null;
          w.returning = true;
          w.attackTimeout = 0;
          w.runsLeft--;
          if (w.runsLeft <= 0) {
            w.dying = true;
            w.deathTimer = WISPS_DEATH.DURATION;
            w._deathParticlesSpawned = false;
          } else {
            w.rechargeTimer = WISPS_CONFIG.RECHARGE_FRAMES;
          }
        }
        updateTrail(w);
        continue;
      }
    }

    updateOrbit(w, deltaTime);
    updateVisualPosition(w);
    updateTrail(w);

    w.pulse = 0.5 + 0.5 * Math.sin(pulsePhase * w.pulseSpeed + w.pulseOffset);
  }
}

function updateOrbit(w, deltaTime) {
  w.baseAngle += w.angularSpeed;

  if (Math.random() < 0.015) {
    w.targetVx += (Math.random() - 0.5) * WISPS_MOTION.WANDER_STRENGTH * 4;
    w.targetVy += (Math.random() - 0.5) * WISPS_MOTION.WANDER_STRENGTH * 4;
  }

  const distToCenter = Math.hypot(w.offsetX, w.offsetY);
  if (distToCenter > WISPS_MOTION.RETURN_THRESHOLD) {
    w.targetVx -= w.offsetX * 0.0018;
    w.targetVy -= w.offsetY * 0.0018;
  }

  const sp = Math.hypot(w.targetVx, w.targetVy);
  if (sp > WISPS_MOTION.MAX_WANDER_SPEED) {
    w.targetVx = (w.targetVx / sp) * WISPS_MOTION.MAX_WANDER_SPEED;
    w.targetVy = (w.targetVy / sp) * WISPS_MOTION.MAX_WANDER_SPEED;
  }

  w.vx += (w.targetVx - w.vx) * WISPS_MOTION.SMOOTH_FACTOR;
  w.vy += (w.targetVy - w.vy) * WISPS_MOTION.SMOOTH_FACTOR;

  w.offsetX += w.vx;
  w.offsetY += w.vy;

  const offDist = Math.hypot(w.offsetX, w.offsetY);
  if (offDist > WISPS_MOTION.MAX_OFFSET) {
    w.offsetX = (w.offsetX / offDist) * WISPS_MOTION.MAX_OFFSET;
    w.offsetY = (w.offsetY / offDist) * WISPS_MOTION.MAX_OFFSET;
    w.vx *= 0.95;
    w.vy *= 0.95;
  }
}

function updateVisualPosition(w) {
  const orbitX = Math.cos(w.baseAngle) * w.orbitRadius;
  const orbitYRaw = Math.sin(w.baseAngle) * w.orbitRadius;
  const orbitY = orbitYRaw * WISPS_VISUAL.ORBIT_Y_SCALE;
  const targetX = w.laggedPlayerX + orbitX + w.offsetX;
  const targetY = w.laggedPlayerY + orbitY + w.offsetY + WISPS_VISUAL.HEIGHT_OFFSET;
  const speedMult = w.returning ? WISPS_CONFIG.RETURN_SPEED_MULT : 1;
  const k = WISPS_MOTION.TRANSIT_LERP_RETURN * speedMult;

  w.currentX += (targetX - w.currentX) * k;
  w.currentY += (targetY - w.currentY) * k;
  w.depthFactor = (orbitYRaw / w.orbitRadius + 1) / 2;
}

function updateTrail(w) {
  w.trailCounter++;
  if (w.trailCounter >= WISPS_MOTION.TRAIL_SAMPLE_STEP) {
    w.trailCounter = 0;
    w.trail.push({ x: w.currentX, y: w.currentY });
    if (w.trail.length > WISPS_MOTION.MAX_TRAIL_LENGTH) w.trail.shift();
  }
}

function spawnDeathParticles(x, y, color) {
  if (!state.sparks) state.sparks = [];
  const count = WISPS_DEATH.PARTICLE_COUNT;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp =
      WISPS_DEATH.PARTICLE_SPEED_MIN +
      Math.random() * (WISPS_DEATH.PARTICLE_SPEED_MAX - WISPS_DEATH.PARTICLE_SPEED_MIN);
    state.sparks.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 30 + Math.random() * 15,
      maxLife: 45,
      size: 1.5 + Math.random() * 2.5,
      color,
      gravity: 0.02,
      drag: WISPS_DEATH.PARTICLE_DRAG,
      isWispsDeath: true,
    });
  }
}