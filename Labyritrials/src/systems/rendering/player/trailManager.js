/**
 * @fileoverview Управление следами атаки для громового посоха.
 * Создаёт, обновляет и отрисовывает электрические следы, остающиеся
 * после атак громовым посохом.
 * 
 * @module systems/rendering/player/trailManager
 */

import { COLORS } from '../../../core/config/colors.js';

/** @type {Array} - Массив активных следов атаки */
let attackTrails = [];

/**
 * Создание следа атаки
 * 
 * @param {number} startX - Начальная координата X
 * @param {number} startY - Начальная координата Y
 * @param {number} endX - Конечная координата X
 * @param {number} endY - Конечная координата Y
 * @param {boolean} isCharged - Заряженная атака (больше время жизни)
 * @returns {void}
 */
export function createAttackTrail(startX, startY, endX, endY, isCharged) {
  const trailPoints = [];
  const length = Math.hypot(endX - startX, endY - startY);
  const steps = Math.max(6, Math.floor(length / 15));
  
  // Создание точек вдоль линии атаки
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    trailPoints.push({ x, y });
  }
  
  attackTrails.push({
    points: trailPoints,
    life: isCharged ? 18 : 12,
    maxLife: isCharged ? 18 : 12,
    isCharged: isCharged
  });
  
  // Ограничение количества следов
  while (attackTrails.length > 8) {
    attackTrails.shift();
  }
}

/**
 * Обновление следов атаки (уменьшение времени жизни)
 * 
 * @returns {void}
 */
export function updateAttackTrails() {
  for (let i = attackTrails.length - 1; i >= 0; i--) {
    const trail = attackTrails[i];
    trail.life--;
    
    if (trail.life <= 0) {
      attackTrails.splice(i, 1);
    }
  }
}

/**
 * Отрисовка следов атаки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawAttackTrails(ctx) {
  for (const trail of attackTrails) {
    if (trail.life <= 0) continue;
    
    const lifeProgress = trail.life / trail.maxLife;
    const alpha = lifeProgress * 0.5;
    const width = (trail.isCharged ? 6 : 4) * lifeProgress;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Создание пути из точек следа
    const path = new Path2D();
    path.moveTo(trail.points[0].x, trail.points[0].y);
    for (let j = 1; j < trail.points.length; j++) {
      path.lineTo(trail.points[j].x, trail.points[j].y);
    }
    
    // Основная линия с свечением
    ctx.shadowBlur = 4;
    ctx.shadowColor = COLORS.effects.lightningSpark;
    ctx.strokeStyle = COLORS.effects.lightningSpark;
    ctx.lineWidth = width;
    ctx.stroke(path);
    
    // Внутренняя линия (белая)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.sparks.lightningWhite;
    ctx.lineWidth = width * 0.4;
    ctx.stroke(path);
    
    ctx.restore();
  }
}

/**
 * Очистка всех следов атаки
 * 
 * @returns {void}
 */
export function clearAttackTrails() {
  attackTrails = [];
}

/**
 * Получение массива активных следов атаки
 * 
 * @returns {Array} - Массив следов атаки
 */
export function getAttackTrails() {
  return attackTrails;
}