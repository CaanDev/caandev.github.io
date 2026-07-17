/**
 * @fileoverview Особенности пола: магический круг, руны, свечения.
 * Содержит функции отрисовки декоративных элементов на полу
 * для безопасной комнаты, комнаты с алтарём и комнаты-ловушки.
 * 
 * @module systems/rendering/maze/floors/features
 */

import { CONFIG } from '../../../../core/config/index.js';
import { COLORS } from '../../../../core/config/colors.js';

/**
 * Отрисовка магического круга в безопасной комнате
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawMagicCircle(ctx) {
  const centerX = (CONFIG.cols / 2) * CONFIG.cellSize;
  const centerY = (CONFIG.rows / 2) * CONFIG.cellSize;
  const time = Date.now() * 0.001;
  
  const radius = CONFIG.cellSize * 1.6;
  const pulse = 0.8 + 0.2 * Math.sin(time * 0.5);
  
  ctx.save();
  
  // ===== ВНЕШНЕЕ СВЕЧЕНИЕ =====
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.6);
  gradient.addColorStop(0, `rgba(80, 180, 240, ${0.35 * pulse})`);
  gradient.addColorStop(0.2, `rgba(80, 180, 240, ${0.25 * pulse})`);
  gradient.addColorStop(0.5, `rgba(80, 180, 240, ${0.15 * pulse})`);
  gradient.addColorStop(0.8, `rgba(80, 180, 240, ${0.05 * pulse})`);
  gradient.addColorStop(1, 'rgba(80, 180, 240, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
  ctx.fill();
  
  // ===== ВНЕШНЕЕ КОЛЬЦО =====
  ctx.shadowBlur = 25;
  ctx.shadowColor = 'rgba(80, 180, 240, 0.5)';
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.7 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // ===== ВНУТРЕННЕЕ КОЛЬЦО =====
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(80, 180, 240, 0.3)';
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // ===== РУНЫ ПО КРУГУ =====
  const runeCount = 8;
  for (let i = 0; i < runeCount; i++) {
    const angle = (Math.PI * 2 / runeCount) * i + time * 0.05;
    const r = radius * 0.85;
    const rx = centerX + Math.cos(angle) * r;
    const ry = centerY + Math.sin(angle) * r;
    
    const runeAlpha = 0.6 + 0.3 * Math.sin(time * 0.7 + i * 1.2);
    ctx.shadowBlur = 12 + 6 * Math.sin(time * 0.6 + i);
    ctx.shadowColor = 'rgba(80, 180, 240, 0.5)';
    ctx.fillStyle = `rgba(120, 210, 255, ${runeAlpha})`;
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', rx, ry);
  }
  ctx.shadowBlur = 0;
  
  // ===== ЦЕНТРАЛЬНЫЙ СИМВОЛ =====
  const corePulse = 0.6 + 0.4 * Math.sin(time * 0.8);
  ctx.shadowBlur = 35;
  ctx.shadowColor = 'rgba(80, 180, 240, 0.6)';
  ctx.fillStyle = `rgba(120, 210, 255, ${0.55 * corePulse})`;
  ctx.font = '36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', centerX, centerY);
  ctx.shadowBlur = 0;
  
  ctx.restore();
}

/**
 * Отрисовка рун в углах безопасной комнаты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawCornerRunes(ctx) {
  const size = CONFIG.cellSize;
  const time = Date.now() * 0.001;
  
  const corners = [
    { x: 1, y: 1 },
    { x: CONFIG.cols - 2, y: 1 },
    { x: 1, y: CONFIG.rows - 2 },
    { x: CONFIG.cols - 2, y: CONFIG.rows - 2 }
  ];
  
  const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ'];
  
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const cx = c.x * size + size / 2;
    const cy = c.y * size + size / 2;
    
    const alpha = 0.45 + 0.2 * Math.sin(time * 0.5 + i * 1.5);
    ctx.fillStyle = `rgba(100, 180, 230, ${alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(80, 150, 200, 0.3)';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(runeSymbols[i], cx, cy);
  }
  ctx.shadowBlur = 0;
}

/**
 * Отрисовка свечения вокруг алтаря
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} shrineX - Координата X алтаря
 * @param {number} shrineY - Координата Y алтаря
 * @returns {void}
 */
export function drawShrineGlow(ctx, shrineX, shrineY) {
  const time = Date.now() * 0.001;
  const pulse = 0.6 + 0.4 * Math.sin(time * 0.5);
  
  ctx.save();
  ctx.globalAlpha = 0.15 * pulse;
  
  const gradient = ctx.createRadialGradient(
    shrineX, shrineY, 10,
    shrineX, shrineY, 150
  );
  gradient.addColorStop(0, 'rgba(155, 89, 182, 0.3)');
  gradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.1)');
  gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(shrineX, shrineY, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Отрисовка свечения комнаты-ловушки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} x - Координата X центра
 * @param {number} y - Координата Y центра
 * @returns {void}
 */
export function drawTrapGlow(ctx, x, y) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7);
  
  ctx.save();
  ctx.globalAlpha = 0.08 * pulse;
  
  const gradient = ctx.createRadialGradient(
    x, y, 10,
    x, y, 120
  );
  gradient.addColorStop(0, 'rgba(200, 40, 40, 0.4)');
  gradient.addColorStop(0.5, 'rgba(200, 40, 40, 0.15)');
  gradient.addColorStop(1, 'rgba(200, 40, 40, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}