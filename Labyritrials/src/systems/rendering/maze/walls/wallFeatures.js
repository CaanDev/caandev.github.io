/**
 * @fileoverview Особенности стен: свечения.
 * Содержит функции для отрисовки различных типов свечений
 * в зависимости от типа комнаты.
 * 
 * @module systems/rendering/maze/walls/wallFeatures
 */

import { CONFIG } from '../../../../core/config/index.js';

/**
 * Отрисовка демонического свечения (арена демона, уровень 5)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawDemonicGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7);
  
  ctx.save();
  ctx.globalAlpha = 0.06 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 50, 0, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 30, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка псионического свечения (арена разума, уровень 10)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawPsiGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.6 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.05 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(68, 136, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(68, 136, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(68, 136, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения стражей (арена стражей, уровень 15)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawGuardianGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.5 + (dx + dy) * 0.008);
  
  ctx.save();
  ctx.globalAlpha = 0.04 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 180, 50, 0.2)');
  gradient.addColorStop(0.5, 'rgba(255, 150, 30, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения алтаря (комната с алтарём)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawShrineGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.5 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.04 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(155, 89, 182, 0.25)');
  gradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.08)');
  gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения ловушки (комната-ловушка)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawTrapGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.05 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 40, 40, 0.25)');
  gradient.addColorStop(0.5, 'rgba(255, 20, 20, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}