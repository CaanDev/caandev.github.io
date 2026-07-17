/**
 * @fileoverview Рендерер линии атаки игрока.
 * Отрисовывает визуальный эффект атаки в зависимости от типа оружия
 * (обычный посох, громовой посох, посох вампира) и заряженности удара.
 * 
 * @module systems/rendering/player/attackRenderer
 */

import { state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { drawAttackTrails, createAttackTrail, updateAttackTrails } from './trailManager.js';

export { drawAttackTrails, updateAttackTrails };

/**
 * Отрисовка линии атаки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawAttackLine(ctx) {
  // Проверка, активна ли атака
  if (!player.isAttacking || !player.attackExecuted) return;
  
  const isCharged = player.chargeTime > 30;
  const isVampire = player.meleeWeapon === 'vampire';
  const isStun = player.meleeWeapon === 'stun';
  const animProgress = (Date.now() % 300) / 300;
  
  const playerRadius = 28;
  const startX = player.px + player.dirX * playerRadius;
  const startY = player.py + player.dirY * playerRadius;
  const endX = startX + player.dirX * (120 * 0.75);
  const endY = startY + player.dirY * (120 * 0.75);
  const angle = Math.atan2(endY - startY, endX - startX);
  
  ctx.save();
  ctx.shadowBlur = 15;
  
  // Установка цвета свечения в зависимости от оружия
  if (isVampire) {
    ctx.shadowColor = isCharged ? COLORS.effects.blood : COLORS.effects.vampire;
  } else if (isStun) {
    ctx.shadowColor = isCharged ? COLORS.effects.stun : COLORS.effects.lightningSpark;
  } else {
    ctx.shadowColor = isCharged ? COLORS.effects.fireGlow : COLORS.effects.fire;
  }
  
  ctx.lineCap = 'round';
  
  // ===== ОСНОВНАЯ ЛИНИЯ =====
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  applyGradientColors(gradient, isVampire, isStun, isCharged);
  
  ctx.strokeStyle = gradient;
  
  if (isVampire) {
    // Для вампирского посоха — рваная линия
    drawRaggedLine(ctx, startX, startY, endX, endY, isCharged);
  } else {
    ctx.lineWidth = isCharged ? 9 : 6;
    ctx.stroke();
  }
  
  // ===== ВНУТРЕННЯЯ ЛИНИЯ =====
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  if (isStun) {
    ctx.strokeStyle = COLORS.player.attack.stun.inner;
  } else if (isVampire) {
    ctx.strokeStyle = COLORS.player.attack.vampire.inner;
  } else {
    ctx.strokeStyle = COLORS.player.attack.fire.inner;
  }
  
  ctx.lineWidth = isCharged ? 3.5 : 2.5;
  ctx.stroke();
  
  // ===== СПИРАЛИ ВДОЛЬ ЛИНИИ АТАКИ =====
  drawAttackSpirals(ctx, startX, startY, endX, endY, angle, isCharged, isVampire, isStun, animProgress);
  
  // ===== СЛЕДЫ ДЛЯ ГРОМОВОГО ПОСОХА =====
  if (isStun) {
    createAttackTrail(startX, startY, endX, endY, isCharged);
  }
  
  ctx.restore();
}

/**
 * Применение цветов градиента в зависимости от оружия
 * 
 * @param {CanvasGradient} gradient - Градиент для заполнения
 * @param {boolean} isVampire - Вампирский посох
 * @param {boolean} isStun - Громовой посох
 * @param {boolean} isCharged - Заряженная атака
 * @returns {void}
 * @private
 */
function applyGradientColors(gradient, isVampire, isStun, isCharged) {
  if (isVampire) {
    const colors = COLORS.player.attack.vampire;
    if (isCharged) {
      gradient.addColorStop(0, colors.line1);
      gradient.addColorStop(0.3, colors.line2);
      gradient.addColorStop(0.6, colors.line3);
      gradient.addColorStop(0.8, colors.line4);
      gradient.addColorStop(1, colors.line5);
    } else {
      gradient.addColorStop(0, colors.line2);
      gradient.addColorStop(0.5, colors.line3);
      gradient.addColorStop(1, colors.line4);
    }
  } else if (isStun) {
    const colors = COLORS.player.attack.stun;
    if (isCharged) {
      gradient.addColorStop(0, colors.line1);
      gradient.addColorStop(0.3, colors.line2);
      gradient.addColorStop(0.6, colors.line3);
      gradient.addColorStop(0.8, colors.line4);
      gradient.addColorStop(1, colors.line5);
    } else {
      gradient.addColorStop(0, colors.line2);
      gradient.addColorStop(0.5, colors.line3);
      gradient.addColorStop(1, colors.line4);
    }
  } else {
    const colors = COLORS.player.attack.fire;
    if (isCharged) {
      gradient.addColorStop(0, colors.line1);
      gradient.addColorStop(0.4, colors.line2);
      gradient.addColorStop(0.7, colors.line3);
      gradient.addColorStop(1, colors.line4);
    } else {
      gradient.addColorStop(0, colors.line1);
      gradient.addColorStop(0.5, colors.line2);
      gradient.addColorStop(1, colors.line3);
    }
  }
}

/**
 * Отрисовка рваной линии (для вампирского посоха)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} startX - Начальная координата X
 * @param {number} startY - Начальная координата Y
 * @param {number} endX - Конечная координата X
 * @param {number} endY - Конечная координата Y
 * @param {boolean} isCharged - Заряженная атака
 * @returns {void}
 * @private
 */
function drawRaggedLine(ctx, startX, startY, endX, endY, isCharged) {
  const length = Math.hypot(endX - startX, endY - startY);
  const steps = Math.max(20, Math.floor(length / 5));
  const dx = (endX - startX) / steps;
  const dy = (endY - startY) / steps;
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  for (let i = 1; i <= steps; i++) {
    let x = startX + dx * i;
    let y = startY + dy * i;
    
    // Случайное смещение перпендикулярно линии
    const offset = (Math.random() - 0.5) * (isCharged ? 6 : 4);
    const perpX = -dy / length;
    const perpY = dx / length;
    
    x += perpX * offset;
    y += perpY * offset;
    
    ctx.lineTo(x, y);
  }
  
  ctx.lineWidth = isCharged ? 11 : 8;
  ctx.stroke();
}

/**
 * Отрисовка спиралей вокруг линии атаки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} startX - Начальная координата X
 * @param {number} startY - Начальная координата Y
 * @param {number} endX - Конечная координата X
 * @param {number} endY - Конечная координата Y
 * @param {number} angle - Угол линии атаки
 * @param {boolean} isCharged - Заряженная атака
 * @param {boolean} isVampire - Вампирский посох
 * @param {boolean} isStun - Громовой посох
 * @param {number} animProgress - Прогресс анимации (0-1)
 * @returns {void}
 * @private
 */
function drawAttackSpirals(ctx, startX, startY, endX, endY, angle, isCharged, isVampire, isStun, animProgress) {
  const spiralCount = isCharged ? 12 : 8;
  
  for (let i = 0; i < spiralCount; i++) {
    const t = i / spiralCount;
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;
    
    const spiralAngle = angle + t * Math.PI * 4 + animProgress * Math.PI * 2;
    const offset = Math.sin(t * Math.PI) * (isCharged ? 10 : 7);
    const offsetX = Math.cos(spiralAngle) * offset;
    const offsetY = Math.sin(spiralAngle) * offset;
    
    const px = baseX + offsetX;
    const py = baseY + offsetY;
    const size = (1 - t) * (isCharged ? 4 : 3);
    const alpha = (1 - t) * 0.7;
    
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    
    if (isVampire) {
      const r = 180 + Math.floor(75 * (1 - t));
      const g = 20 + Math.floor(20 * (1 - t));
      const b = 20 + Math.floor(20 * (1 - t));
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (isStun) {
      const r = 50 + Math.floor(50 * (1 - t));
      const g = 150 + Math.floor(105 * (1 - t));
      const b = 255;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(255, ${isCharged ? 180 : 100}, ${isCharged ? 50 : 0}, ${alpha})`;
    }
    
    ctx.fill();
  }
}