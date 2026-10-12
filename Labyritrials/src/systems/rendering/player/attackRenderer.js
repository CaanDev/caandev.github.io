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
  // Проверка, активна ли атака и не является ли она огненным шаром
  if (!player.isAttacking || !player.attackExecuted || player.isFireballAttack) return;
  
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
  if (isVampire) ctx.shadowColor = isCharged ? COLORS.effects.blood : COLORS.effects.vampire;
  else if (isStun) ctx.shadowColor = isCharged ? COLORS.effects.stun : COLORS.effects.lightningSpark;
  else ctx.shadowColor = isCharged ? COLORS.effects.fireGlow : COLORS.effects.fire;
  
  ctx.lineCap = 'round';
  
  // Основная линия (кроме громового посоха)
  if (!isStun) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    applyGradientColors(gradient, isVampire, isStun, isCharged);
    
    ctx.strokeStyle = gradient;
    
    if (isVampire) {
      // Для вампирского посоха - рваная линия
      drawRaggedLine(ctx, startX, startY, endX, endY, isCharged);
    } else {
      ctx.lineWidth = isCharged ? 9 : 6;
      ctx.stroke();
    }
  }
  
  // Внутренняя линия (кроме громового посоха)
  if (!isStun) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    if (isVampire) ctx.strokeStyle = COLORS.player.attack.vampire.inner;
    else ctx.strokeStyle = COLORS.player.attack.fire.inner;
    
    ctx.lineWidth = isCharged ? 3.5 : 2.5;
    ctx.stroke();
  }
  
  // Спирали вдоль линии атаки (кроме громового посоха)
  if (!isStun) drawAttackSpirals(ctx, startX, startY, endX, endY, angle, isCharged, isVampire, false, animProgress);
  // Молнии вдоль линии атаки (только для громового посоха)
  if (isStun) drawLightningAlongLine(ctx, startX, startY, endX, endY, isCharged);
  
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

/**
 * Отрисовка электрических молний вдоль линии атаки
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
function drawLightningAlongLine(ctx, startX, startY, endX, endY, isCharged) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);
  if (length < 5) return;
  
  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);
  
  // Единая палитра - холодные синие молнии
  const haloColor  = 'rgba(80, 150, 255, 0.35)';
  const haloShadow = '#2266ff';
  const midColor   = 'rgba(150, 210, 255, 0.85)';
  const midShadow  = '#88bbff';
  const coreColor  = 'rgba(230, 245, 255, 0.95)';
  const coreShadow = '#ddeeff';
  
  // Количество молний
  const boltCount = isCharged ? 3 : 2;
  
  for (let b = 0; b < boltCount; b++) {
    // Молния занимает почти всю длину линии
    const tStart = Math.random() * 0.1;
    const tEnd = 0.9 + Math.random() * 0.1;
    const segStartX = startX + dx * tStart;
    const segStartY = startY + dy * tStart;
    const segEndX = startX + dx * tEnd;
    const segEndY = startY + dy * tEnd;
    
    // Разбитие на сегменты с изломами
    const segments = 7 + Math.floor(Math.random() * 3);
    const maxOffset = isCharged ? 8 : 6;
    
    // Построение ломаной
    const pts = [];
    pts.push({ x: segStartX, y: segStartY });
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = segStartX + (segEndX - segStartX) * t;
      const baseY = segStartY + (segEndY - segStartY) * t;
      const offset = (Math.random() - 0.5) * 2 * maxOffset;
      pts.push({
        x: baseX + perpX * offset,
        y: baseY + perpY * offset
      });
    }
    pts.push({ x: segEndX, y: segEndY });
    
    // Слой 1: широкий внешний ореол (свечение)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.shadowBlur = 25;
    ctx.shadowColor = haloShadow;
    ctx.strokeStyle = haloColor;
    ctx.lineWidth = isCharged ? 6 : 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Слой 2: средний слой (основное свечение)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.shadowBlur = 15;
    ctx.shadowColor = midShadow;
    ctx.strokeStyle = midColor;
    ctx.lineWidth = isCharged ? 2.2 : 1.6;
    ctx.stroke();
    
    // Слой 3: яркое белое ядро
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.shadowBlur = 5;
    ctx.shadowColor = coreShadow;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = isCharged ? 1 : 0.7;
    ctx.stroke();
  }
}