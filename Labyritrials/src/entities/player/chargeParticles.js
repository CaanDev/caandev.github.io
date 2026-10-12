/**
 * @fileoverview Частицы зарядки усиленного удара.
 * Создаёт маленькие точки, которые летят к игроку во время зарядки.
 * Частицы привязаны к системе координат игрока и двигаются вместе с ним.
 * Прозрачность растёт по мере приближения к игроку.
 * 
 * @module entities/player/chargeParticles
 */

import { state, player } from '../../core/config/index.js';

/** @type {number} - Порог зарядки для появления частиц (кадры) */
const CHARGE_THRESHOLD = 60;

/** @type {number} - Максимальное количество частиц */
const MAX_PARTICLES = 25;

/** @type {number} - Интервал спавна (кадры) */
const SPAWN_INTERVAL = 5;

/** @type {number} - Радиус появления частиц (мин) */
const SPAWN_RADIUS_MIN = 80;

/** @type {number} - Радиус появления частиц (макс) */
const SPAWN_RADIUS_MAX = 150;

/** @type {number} - Минимальный размер частицы */
const SIZE_MIN = 0.8;

/** @type {number} - Максимальный размер частицы */
const SIZE_MAX = 1.6;

/** @type {number} - Скорость движения (мин) */
const SPEED_MIN = 1.2;

/** @type {number} - Скорость движения (макс) */
const SPEED_MAX = 2.0;

/** @type {number} - Счётчик кадров для спавна */
let spawnCounter = 0;

/**
 * Получение цветов частиц в зависимости от оружия
 * 
 * @returns {{main: string, glow: string}} - Основной цвет и цвет свечения
 */
function getParticleColors() {
  const weapon = player.meleeWeapon || 'default';
  
  switch (weapon) {
    case 'stun': return { main: '#ffffff', glow: '#66ccff' };
    case 'vampire': return { main: '#ff4444', glow: '#cc0000' };
    case 'default':
    default: return { main: '#ffdd44', glow: '#ffaa00' };
  }
}

/**
 * Спавн одной частицы
 * Частица привязывается к игроку через offsetX/offsetY
 * 
 * @returns {void}
 */
function spawnParticle() {
  if (!state.chargeParticles) state.chargeParticles = [];
  if (state.chargeParticles.length >= MAX_PARTICLES) return;

  const angle = Math.random() * Math.PI * 2;
  const radius = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);

  // Смещение относительно игрока (в системе координат игрока)
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  const colors = getParticleColors();
  const size = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN);
  const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);

  state.chargeParticles.push({
    // Смещение от игрока (глобальные координаты = player.px + offsetX)
    offsetX: offsetX,
    offsetY: offsetY,
    // Начальное расстояние (для расчёта прогресса)
    initialDist: radius,
    size: size,
    color: colors.main,
    glowColor: colors.glow,
    speed: speed,
    // Яркость для мерцания
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.15 + Math.random() * 0.1,
  });
}

/**
 * Обновление частиц зарядки (спавн + движение)
 * Вызывается каждый кадр из updatePlayer
 * 
 * @param {number} deltaTime - Время с прошлого кадра (сек)
 * @returns {void}
 */
export function updateChargeParticles(deltaTime = 1 / 60) {
  if (!state.chargeParticles) {
    state.chargeParticles = [];
    return;
  }

  // Спавн новых частиц
  if (player.isCharging && player.chargeTime >= CHARGE_THRESHOLD) {
    spawnCounter++;
    if (spawnCounter >= SPAWN_INTERVAL) {
      spawnCounter = 0;
      spawnParticle();
    }
  } else {
    // Если не заряжается - нет спавна
    spawnCounter = 0;
  }

  // Обновление позиций частиц (в системе координат игрока)
  const chargeBoost = Math.min(2, player.chargeTime / 60);

  for (let i = state.chargeParticles.length - 1; i >= 0; i--) {
    const p = state.chargeParticles[i];

    // Текущее смещение от игрока
    const dist = Math.hypot(p.offsetX, p.offsetY);

    // Частица достигла игрока - удаление
    if (dist < 12) {
      state.chargeParticles.splice(i, 1);
      continue;
    }

    // Движение к игроку (уменьшение смещения)
    const speed = p.speed * (1 + chargeBoost * 0.3);
    p.offsetX -= (p.offsetX / dist) * speed;
    p.offsetY -= (p.offsetY / dist) * speed;

    // Мерцание
    p.pulsePhase += p.pulseSpeed;
  }
}

/**
 * Отрисовка частиц зарядки
 * Глобальная позиция = player.px + offsetX, player.py + offsetY
 * Прозрачность зависит от прогресса приближения к игроку
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawChargeParticles(ctx) {
  if (!state.chargeParticles || state.chargeParticles.length === 0) return;

  ctx.save();

  for (const p of state.chargeParticles) {
    // Глобальные координаты (привязка к текущей позиции игрока)
    const worldX = player.px + p.offsetX;
    const worldY = player.py + p.offsetY;

    // Прогресс приближения: 0 (далеко) -> 1 (близко к игроку)
    const currentDist = Math.hypot(p.offsetX, p.offsetY);
    const progress = 1 - currentDist / p.initialDist;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Базовая прозрачность зависит от прогресса: почти 0 в начале, 1 у игрока
    const baseAlpha = clampedProgress;

    // Мерцание поверх
    const pulse = 0.7 + Math.sin(p.pulsePhase) * 0.3;
    const alpha = baseAlpha * pulse;

    // Пропуск слишком прозрачных
    if (alpha < 0.02) continue;

    // Размер растёт с прогрессом (частица "проявляется")
    const size = p.size * (0.5 + clampedProgress * 0.7) * (0.8 + pulse * 0.3);

    // Свечение
    ctx.globalAlpha = alpha * 0.5;
    ctx.shadowBlur = 5;
    ctx.shadowColor = p.glowColor;
    ctx.fillStyle = p.glowColor;
    ctx.beginPath();
    ctx.arc(worldX, worldY, size * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Ядро
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(worldX, worldY, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Очистка всех частиц зарядки
 * 
 * @returns {void}
 */
export function clearChargeParticles() {
  if (state.chargeParticles) state.chargeParticles = [];
  spawnCounter = 0;
}