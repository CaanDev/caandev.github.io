/**
 * @fileoverview Индикатор активного игрового события.
 * Отображает название и цвет текущего события в правом верхнем углу экрана.
 * 
 * @module systems/rendering/ui/eventIndicator
 */

import { state } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { getEventName, getEventColor } from '../../events/index.js';

/**
 * Отрисовка индикатора события
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawEventIndicator(ctx, canvas) {
  // Не показываем индикатор в тайных комнатах и безопасной комнате
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  if (!state.currentEvent) return;
  
  const eventName = getEventName();
  const eventColor = getEventColor();
  
  const indicatorWidth = 160;
  const indicatorHeight = 40;
  const radius = 8;
  const paddingRight = 21;
  const paddingTop = 192;

  const indicatorX = canvas.width - indicatorWidth - paddingRight;
  const indicatorY = paddingTop;
  
  ctx.save();
  
  // ===== ФОН ИНДИКАТОРА =====
  ctx.beginPath();
  ctx.moveTo(indicatorX + radius, indicatorY);
  ctx.lineTo(indicatorX + indicatorWidth - radius, indicatorY);
  ctx.quadraticCurveTo(indicatorX + indicatorWidth, indicatorY, indicatorX + indicatorWidth, indicatorY + radius);
  ctx.lineTo(indicatorX + indicatorWidth, indicatorY + indicatorHeight - radius);
  ctx.quadraticCurveTo(indicatorX + indicatorWidth, indicatorY + indicatorHeight, indicatorX + indicatorWidth - radius, indicatorY + indicatorHeight);
  ctx.lineTo(indicatorX + radius, indicatorY + indicatorHeight);
  ctx.quadraticCurveTo(indicatorX, indicatorY + indicatorHeight, indicatorX, indicatorY + indicatorHeight - radius);
  ctx.lineTo(indicatorX, indicatorY + radius);
  ctx.quadraticCurveTo(indicatorX, indicatorY, indicatorX + radius, indicatorY);
  ctx.closePath();
  
  ctx.fillStyle = COLORS.ui.indicator.bg;
  ctx.fill();
  ctx.strokeStyle = eventColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // ===== НАЗВАНИЕ СОБЫТИЯ =====
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.ui.indicator.text;
  let displayName = eventName;
  if (displayName.length > 18) {
    displayName = displayName.substring(0, 15) + '...';
  }
  ctx.fillText(displayName, indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight / 2);
  
  // ===== ПОДПИСЬ =====
  ctx.font = '9px Arial';
  ctx.fillStyle = COLORS.ui.indicator.subtext;
  ctx.fillText('Активно на этом уровне', indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight + 12);
  
  ctx.restore();
}