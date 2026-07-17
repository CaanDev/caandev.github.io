/**
 * @fileoverview Название текущей комнаты.
 * Отображает в верхней части экрана название тайной комнаты
 * (сокровищница, комната с алтарём, комната-ловушка, безопасная комната).
 * 
 * @module systems/rendering/ui/roomLabel
 */

import { state } from '../../../core/config/index.js';
import { roundedRect } from './utils.js';

/**
 * Отрисовка названия комнаты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawRoomLabel(ctx, canvas) {
  if (!state.roomLabel) return;
  
  const labels = {
    treasure: { text: 'СОКРОВИЩНИЦА', color: '#f39c12' },
    shrine: { text: 'КОМНАТА С АЛТАРЁМ', color: '#9b59b6' },
    trap: { text: 'КОМНАТА-ЛОВУШКА', color: '#e74c3c' },
    safe: { text: 'БЕЗОПАСНАЯ КОМНАТА', color: '#3498db' },
  };
  
  const label = labels[state.roomLabel];
  if (!label) return;
  
  const text = label.text;
  const color = label.color;
  
  ctx.save();
  
  const fontSize = 22;
  const padding = 14;
  const borderRadius = 10;
  
  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = fontSize + padding;
  
  const x = (canvas.width - bgWidth) / 2;
  const y = 20;
  
  // ===== ФОН =====
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundedRect(ctx, x, y, bgWidth, bgHeight, borderRadius);
  ctx.fill();
  
  // ===== РАМКА =====
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, bgWidth, bgHeight, borderRadius);
  ctx.stroke();
  
  // ===== ТЕКСТ =====
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, y + bgHeight / 2);
  
  ctx.restore();
}