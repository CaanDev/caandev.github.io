/**
 * @fileoverview Индикатор адаптаций монстров.
 * Отображает список активных адаптаций монстров в левой части экрана.
 * 
 * @module systems/rendering/ui/adaptationIndicator
 */

import { state } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { roundedRect } from './utils.js';

/**
 * Отрисовка индикатора адаптаций монстров
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawAdaptationIndicator(ctx, canvas) {
  // Сбор активных адаптаций
  const adaptations = [];
  
  if (state.monsterAdaptation.fireImmunity) {
    adaptations.push({ icon: '🔥', name: 'Огнеупорность', color: COLORS.effects.fire, desc: 'Иммунитет к огню' });
  }
  if (state.monsterAdaptation.stunImmunity) {
    adaptations.push({ icon: '⚡', name: 'Стойкость', color: COLORS.effects.lightning, desc: 'Иммунитет к оглушению' });
  }
  if (state.monsterAdaptation.healingBlock) {
    adaptations.push({ icon: '🧛', name: 'Блок лечения', color: COLORS.effects.vampire, desc: 'Лечение игрока -50%' });
  }
  if (state.monsterAdaptation.healthBoost) {
    adaptations.push({ icon: '🛡️', name: 'Закалка', color: COLORS.effects.stun, desc: '+50% к HP монстров' });
  }
  
  if (adaptations.length === 0) return;
  
  const startX = 20;
  const startY = 261;
  const itemWidth = 200;
  const itemHeight = 38;
  const gap = 10;
  const radius = 8;
  
  ctx.save();
  
  // ===== ЗАГОЛОВОК =====
  const headerHeight = 24;
  const headerPadding = 10;
  const headerX = startX;
  const headerY = startY - headerHeight - 4;
  const headerWidth = itemWidth;
  const headerRadius = 6;
  
  // Фон заголовка
  ctx.beginPath();
  roundedRect(ctx, headerX, headerY, headerWidth, headerHeight, headerRadius);
  ctx.fillStyle = COLORS.ui.indicator.adaptation.bg || 'rgba(10, 10, 15, 0.85)';
  ctx.fill();
  
  // Текст заголовка
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = COLORS.ui.indicator.adaptation.border || '#e74c3c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const textCenterY = headerY + headerHeight / 2 + 1;
  ctx.fillText('⚔️ АДАПТАЦИИ МОНСТРОВ', startX + headerPadding, textCenterY);
  
  // ===== СПИСОК АДАПТАЦИЙ =====
  for (let i = 0; i < adaptations.length; i++) {
    const a = adaptations[i];
    const x = startX;
    const y = startY + i * (itemHeight + gap);
    
    // Фон элемента
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + itemWidth - radius, y);
    ctx.quadraticCurveTo(x + itemWidth, y, x + itemWidth, y + radius);
    ctx.lineTo(x + itemWidth, y + itemHeight - radius);
    ctx.quadraticCurveTo(x + itemWidth, y + itemHeight, x + itemWidth - radius, y + itemHeight);
    ctx.lineTo(x + radius, y + itemHeight);
    ctx.quadraticCurveTo(x, y + itemHeight, x, y + itemHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fillStyle = COLORS.ui.indicator.adaptation.bg;
    ctx.fill();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Иконка
    ctx.font = '20px Arial';
    ctx.fillStyle = a.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.icon, x + 22, y + itemHeight / 2);
    
    // Название
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = COLORS.ui.indicator.adaptation.text;
    ctx.textAlign = 'left';
    ctx.fillText(a.name, x + 42, y + 14);
    
    // Описание
    ctx.font = '9px Arial';
    ctx.fillStyle = COLORS.ui.indicator.adaptation.subtext;
    ctx.fillText(a.desc, x + 42, y + 28);
  }
  
  ctx.restore();
}