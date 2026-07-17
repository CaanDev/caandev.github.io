/**
 * @fileoverview Рендерер колонн.
 * Отрисовывает декоративные колонны с объёмным градиентом и возможностью
 * размещения факелов на них.
 * 
 * @module systems/rendering/maze/pillars
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Отрисовка всех колонн в видимой области
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {{startX: number, endX: number, startY: number, endY: number}} visibleRange - Диапазон видимых клеток
 * @returns {void}
 */
export function drawPillars(ctx, visibleRange) {
  if (!state.pillars || state.pillars.length === 0) return;
  
  const { startX, endX, startY, endY } = visibleRange;
  
  for (const pillar of state.pillars) {
    // Проверка видимости по диапазону клеток
    if (pillar.gridX < startX || pillar.gridX >= endX || 
        pillar.gridY < startY || pillar.gridY >= endY) continue;
    
    const gridX = pillar.gridX;
    const gridY = pillar.gridY;
    if (!state.grid[gridY] || !state.grid[gridY][gridX]) continue;
    if (!state.grid[gridY][gridX].revealed && !player.hasMap) continue;
    
    drawSinglePillar(ctx, pillar);
  }
}

/**
 * Отрисовка одной колонны
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} pillar - Объект колонны
 * @param {number} pillar.x - Координата X в пикселях
 * @param {number} pillar.y - Координата Y в пикселях
 * @param {number} pillar.size - Размер колонны
 * @param {boolean} pillar.hasTorch - Есть ли факел на колонне
 * @param {number} pillar.torchFlicker - Фаза мерцания факела
 * @returns {void}
 * @private
 */
function drawSinglePillar(ctx, pillar) {
  const x = pillar.x;
  const y = pillar.y;
  const size = pillar.size;
  const radius = size / 2;
  const hasTorch = pillar.hasTorch;
  
  ctx.save();
  
  // Тень колонны
  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.shadows.strong;
  ctx.shadowOffsetY = 4;
  
  // Градиент колонны (объёмный эффект)
  const gradient = ctx.createRadialGradient(
    x - radius * 0.2, y - radius * 0.2, 0,
    x, y, radius
  );
  gradient.addColorStop(0, COLORS.maze.pillar.light);
  gradient.addColorStop(0.4, COLORS.maze.pillar.mid);
  gradient.addColorStop(0.7, COLORS.maze.pillar.dark);
  gradient.addColorStop(1, COLORS.maze.pillar.darker);
  
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Контур колонны
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.shadows.pillar;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
  ctx.stroke();
  
  // Магическое свечение вокруг колонны
  ctx.shadowBlur = 20;
  ctx.shadowColor = COLORS.shadows.magic;
  ctx.fillStyle = COLORS.shadows.magicInner;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Факел на колонне
  if (hasTorch) {
    drawPillarTorch(ctx, x, y, radius, pillar);
  }
  
  ctx.restore();
}

/**
 * Отрисовка факела на колонне
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} x - Координата X колонны
 * @param {number} y - Координата Y колонны
 * @param {number} radius - Радиус колонны
 * @param {Object} pillar - Объект колонны
 * @param {number} pillar.torchFlicker - Фаза мерцания факела
 * @returns {void}
 * @private
 */
function drawPillarTorch(ctx, x, y, radius, pillar) {
  const torchX = x;
  const torchY = y - radius * 0.7;
  const flicker = 0.8 + Math.sin(pillar.torchFlicker || 0) * 0.2;
  
  pillar.torchFlicker = (pillar.torchFlicker || 0) + 0.04;
  
  ctx.save();
  
  // Свечение факела
  const torchLight = COLORS.torches.light.warm;
  const glowGradient = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, 60);
  glowGradient.addColorStop(0, `${torchLight.stop0}${0.3 * flicker})`);
  glowGradient.addColorStop(0.3, `${torchLight.stop1}${0.2 * flicker})`);
  glowGradient.addColorStop(0.6, `${torchLight.stop2}${0.1 * flicker})`);
  glowGradient.addColorStop(1, torchLight.stop5);
  
  ctx.shadowBlur = 25 * flicker;
  ctx.shadowColor = COLORS.torches.flame;
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(torchX, torchY, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // Пламя
  ctx.shadowBlur = 15 * flicker;
  ctx.shadowColor = COLORS.torches.glow;
  
  const flameHeight = 18 * (0.8 + Math.sin(pillar.torchFlicker * 1.5) * 0.2);
  const flameWidth = 8 * (0.9 + Math.sin(pillar.torchFlicker * 2) * 0.1);
  
  const flameGradient = ctx.createRadialGradient(
    torchX, torchY - flameHeight * 0.2, 0,
    torchX, torchY - flameHeight * 0.2, flameHeight
  );
  flameGradient.addColorStop(0, COLORS.flame.inner);
  flameGradient.addColorStop(0.3, COLORS.effects.gold.light);
  flameGradient.addColorStop(0.7, COLORS.effects.fire);
  flameGradient.addColorStop(1, COLORS.effects.blood);
  
  ctx.fillStyle = flameGradient;
  ctx.beginPath();
  ctx.ellipse(torchX, torchY - flameHeight * 0.3, flameWidth, flameHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Ядро пламени
  ctx.shadowBlur = 8;
  ctx.shadowColor = COLORS.flame.innerShadow;
  ctx.fillStyle = `${COLORS.flame.innerGlow}${0.7 * flicker})`;
  ctx.beginPath();
  ctx.ellipse(torchX, torchY - flameHeight * 0.4, flameWidth * 0.4, flameHeight * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Искры от факела
  if (Math.random() < 0.05) {
    const sparkAngle = (Math.random() - 0.5) * Math.PI * 0.6 - Math.PI / 2;
    const sparkDist = flameHeight * (0.5 + Math.random() * 0.3);
    state.sparks.push({
      x: torchX + Math.cos(sparkAngle) * sparkDist * 0.2,
      y: torchY - flameHeight * 0.4 + Math.sin(sparkAngle) * sparkDist,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.3 - Math.random() * 0.3,
      life: 10 + Math.random() * 8,
      maxLife: 18,
      size: 1 + Math.random() * 1.5,
      color: COLORS.sparks.fire,
      gravity: 0.02
    });
  }
  
  ctx.restore();
}