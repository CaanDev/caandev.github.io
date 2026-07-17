/**
 * @fileoverview Система следов игрока.
 * Создаёт, обновляет и отрисовывает следы от движения игрока.
 * Цвет следов зависит от текущего оружия.
 * 
 * @module entities/objects/playerTrails
 */

import { state, player } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';

/**
 * @namespace TRAIL_CONFIG
 * @description Конфигурация следов игрока
 */
const TRAIL_CONFIG = {
  /** @type {number} - Максимальное количество следов */
  maxTrails: 70,
  /** @type {number} - Интервал спавна следов (кадры) */
  spawnInterval: 10,
  /** @type {number} - Время жизни следа (кадры) */
  lifeTime: 130,
  /** @type {number} - Минимальное расстояние между следами (пиксели) */
  minDistance: 18,
  /** @type {number} - Ширина следа (пиксели) */
  footWidth: 10,
  /** @type {number} - Высота следа (пиксели) */
  footHeight: 5,
  /** @type {number} - Базовая прозрачность следа */
  opacity: 0.35,
  /** @type {number} - Максимальное расстояние отрисовки следа */
  maxDrawDistance: 250,
  /** @type {number} - Длительность кровавого следа (мс) */
  bloodTrailDuration: 1500,
  /** @type {number} - Длительность затухания кровавого следа (мс) */
  bloodFadeDuration: 500,
  /** @type {Object} - Цвета следов для разных типов оружия */
  colors: {
    default: 'rgba(142, 68, 173, 0.5)',
    vampire: 'rgba(192, 57, 43, 0.5)',
    stun: 'rgba(52, 152, 219, 0.5)',
    blood: 'rgba(180, 20, 20, 0.6)',
  }
};

/** @type {number} - Счётчик кадров для спавна следов */
let frameCounter = 0;
/** @type {number} - Последняя позиция X для следа */
let lastTrailX = -999;
/** @type {number} - Последняя позиция Y для следа */
let lastTrailY = -999;
/** @type {number} - Чередование стороны ноги (0/1) */
let footSide = 0;

/** @type {number} - Время начала кровавого следа (мс) */
let bloodTrailStartTime = 0;
/** @type {boolean} - Активен ли кровавый след */
let isBloodTrailActive = false;
/** @type {number} - Время начала затухания кровавого следа (мс) */
let bloodFadeStartTime = 0;
/** @type {number} - Прогресс затухания кровавого следа (0-1) */
let bloodFadeProgress = 0;
/** @type {boolean} - Был ли игрок на крови */
let wasOnBlood = false;
/** @type {boolean} - Идёт ли затухание кровавого следа */
let isFading = false;

/**
 * Получение цвета следа в зависимости от оружия
 * 
 * @returns {string} - Цвет следа
 * @private
 */
function getWeaponColor() {
  let color = TRAIL_CONFIG.colors.default;
  if (player.meleeWeapon === 'vampire') {
    color = TRAIL_CONFIG.colors.vampire;
  } else if (player.meleeWeapon === 'stun') {
    color = TRAIL_CONFIG.colors.stun;
  }
  return color;
}

/**
 * Смешивание цвета крови с цветом оружия
 * 
 * @param {string} bloodColor - Цвет крови
 * @param {string} weaponColor - Цвет оружия
 * @param {number} progress - Прогресс смешивания (0-1)
 * @returns {string} - Смешанный цвет
 * @private
 */
function mixColors(bloodColor, weaponColor, progress) {
  const parseColor = (colorStr) => {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!match) return { r: 180, g: 20, b: 20, a: 0.6 };
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: parseFloat(match[4])
    };
  };

  const blood = parseColor(bloodColor);
  const weapon = parseColor(weaponColor);

  const r = Math.round(blood.r + (weapon.r - blood.r) * progress);
  const g = Math.round(blood.g + (weapon.g - blood.g) * progress);
  const b = Math.round(blood.b + (weapon.b - blood.b) * progress);
  const a = blood.a + (weapon.a - blood.a) * progress;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Проверка, стоит ли игрок на кровавой луже
 * 
 * @returns {boolean} - true, если игрок на крови
 * @private
 */
function isPlayerOnBlood() {
  if (!state.bloodPuddles || state.bloodPuddles.length === 0) return false;

  for (const puddle of state.bloodPuddles) {
    const dist = Math.hypot(player.px - puddle.x, player.py - puddle.y);
    const radius = (puddle.size || 25) * 0.5;
    if (dist < radius + 10) {
      return true;
    }
  }
  return false;
}

/**
 * Обновление состояния кровавого следа
 * 
 * @returns {void}
 * @private
 */
function updateBloodTrailState() {
  const now = Date.now();
  const onBlood = isPlayerOnBlood();

  if (onBlood) {
    isBloodTrailActive = true;
    bloodTrailStartTime = now;
    bloodFadeStartTime = 0;
    bloodFadeProgress = 0;
    isFading = false;
    wasOnBlood = true;
    return;
  }

  if (wasOnBlood && !onBlood) {
    wasOnBlood = false;
    bloodTrailStartTime = now;
  }

  if (isBloodTrailActive && !onBlood) {
    const elapsed = now - bloodTrailStartTime;

    if (!isFading) {
      if (elapsed >= TRAIL_CONFIG.bloodTrailDuration) {
        isFading = true;
        bloodFadeStartTime = now;
        bloodFadeProgress = 0;
      }
    } else {
      const fadeElapsed = now - bloodFadeStartTime;
      bloodFadeProgress = Math.min(1, fadeElapsed / TRAIL_CONFIG.bloodFadeDuration);

      if (bloodFadeProgress >= 1) {
        isBloodTrailActive = false;
        bloodFadeProgress = 0;
        isFading = false;
        bloodTrailStartTime = 0;
        bloodFadeStartTime = 0;
        wasOnBlood = false;
      }
    }
  }
}

/**
 * Создание следа игрока
 * 
 * @returns {void}
 */
export function spawnPlayerTrail() {
  frameCounter++;

  // Проверка интервала спавна
  if (frameCounter % TRAIL_CONFIG.spawnInterval !== 0) return;

  // В некоторых комнатах следы не нужны
  if (state.inTreasureRoom || state.inShrineRoom) return;

  // Проверка расстояния между следами
  const dx = player.px - lastTrailX;
  const dy = player.py - lastTrailY;
  const dist = Math.hypot(dx, dy);

  if (dist < TRAIL_CONFIG.minDistance) return;

  const angle = Math.atan2(dy, dx);

  lastTrailX = player.px;
  lastTrailY = player.py;

  // Проверка, открыта ли клетка
  const gridX = Math.floor(player.px / CONFIG.cellSize);
  const gridY = Math.floor(player.py / CONFIG.cellSize);
  if (!state.grid[gridY]?.[gridX]?.revealed) return;

  updateBloodTrailState();

  let color;
  let opacity = TRAIL_CONFIG.opacity;
  let isBlood = false;

  // Определение цвета следа
  if (isBloodTrailActive) {
    const weaponColor = getWeaponColor();
    color = mixColors(TRAIL_CONFIG.colors.blood, weaponColor, bloodFadeProgress);
    opacity = 0.5;
    isBlood = true;
  } else {
    color = getWeaponColor();
  }

  // Расчёт позиции следа (чередование ног)
  const perpAngle = angle + Math.PI / 2;
  const footOffset = 14;

  const side = footSide;
  footSide = 1 - footSide;

  const offsetX = Math.cos(perpAngle) * (side === 0 ? -footOffset : footOffset);
  const offsetY = Math.sin(perpAngle) * (side === 0 ? -footOffset : footOffset);

  const stepOffset = (side === 0 ? -3 : 3);
  const forwardX = Math.cos(angle) * stepOffset;
  const forwardY = Math.sin(angle) * stepOffset;

  // Добавление следа
  state.playerTrails.push({
    x: player.px + offsetX + forwardX,
    y: player.py + offsetY + forwardY,
    life: TRAIL_CONFIG.lifeTime,
    maxLife: TRAIL_CONFIG.lifeTime,
    width: TRAIL_CONFIG.footWidth,
    height: TRAIL_CONFIG.footHeight,
    color: color,
    opacity: opacity,
    rotation: angle,
    offsetX: (Math.random() - 0.5) * 1.5,
    offsetY: (Math.random() - 0.5) * 1.5,
    side: side,
    isBloodTrail: isBlood
  });

  // Ограничение количества следов
  while (state.playerTrails.length > TRAIL_CONFIG.maxTrails) {
    state.playerTrails.shift();
  }
}

/**
 * Обновление следов игрока (уменьшение времени жизни)
 * 
 * @returns {void}
 */
export function updatePlayerTrails() {
  for (let i = state.playerTrails.length - 1; i >= 0; i--) {
    const trail = state.playerTrails[i];
    trail.life--;

    if (trail.life <= 0) {
      state.playerTrails.splice(i, 1);
    }
  }
}

/**
 * Отрисовка следов игрока
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPlayerTrails(ctx) {
  if (state.playerTrails.length === 0) return;

  const maxDrawDist = TRAIL_CONFIG.maxDrawDistance;

  for (const trail of state.playerTrails) {
    const distToPlayer = Math.hypot(trail.x - player.px, trail.y - player.py);

    if (distToPlayer > maxDrawDist) continue;

    const lifeProgress = trail.life / trail.maxLife;

    // Расчёт прозрачности
    let opacity = trail.opacity * (0.3 + lifeProgress * 0.7);

    // Затухание по расстоянию
    if (distToPlayer > maxDrawDist * 0.6) {
      const distanceFade = 1 - (distToPlayer - maxDrawDist * 0.6) / (maxDrawDist * 0.4);
      opacity *= Math.max(0, distanceFade);
    }

    if (opacity < 0.02) continue;

    const widthScale = 0.3 + lifeProgress * 0.7;
    const heightScale = 0.3 + lifeProgress * 0.7;

    const w = trail.width * widthScale;
    const h = trail.height * heightScale;
    const x = trail.x + trail.offsetX;
    const y = trail.y + trail.offsetY;
    const rotation = trail.rotation || 0;

    ctx.save();
    ctx.globalAlpha = Math.min(opacity, 0.4);

    const shadowSize = trail.isBloodTrail ? 8 : 6;
    ctx.shadowBlur = shadowSize;
    ctx.shadowColor = trail.color;

    ctx.translate(x, y);
    ctx.fillStyle = trail.color;

    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, rotation, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Очистка всех следов игрока
 * 
 * @returns {void}
 */
export function clearPlayerTrails() {
  state.playerTrails = [];
  lastTrailX = -999;
  lastTrailY = -999;
  footSide = 0;
  bloodTrailStartTime = 0;
  isBloodTrailActive = false;
  bloodFadeStartTime = 0;
  bloodFadeProgress = 0;
  wasOnBlood = false;
  isFading = false;
}

/**
 * Сброс позиции для следов (при телепортации)
 * 
 * @returns {void}
 */
export function resetTrailPosition() {
  lastTrailX = player.px;
  lastTrailY = player.py;
  footSide = 0;
}