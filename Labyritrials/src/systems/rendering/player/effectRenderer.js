/**
 * @fileoverview Рендерер статусных эффектов игрока.
 * Отрисовывает визуальные эффекты шока, отравления и заморозки.
 * 
 * @module systems/rendering/player/effectRenderer
 */

import { state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Отрисовка эффекта шока (электричество)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShockEffect(ctx) {
  if (player.shockTimer <= 0) return;
  
  const now = Date.now();
  const pulse = 0.7 + Math.sin(now * 0.02) * 0.3;
  
  // ===== ОСНОВНОЕ СВЕЧЕНИЕ =====
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 85
  );
  gradient.addColorStop(0, `rgba(255, 230, 80, ${0.5 * pulse})`);
  gradient.addColorStop(0.3, `rgba(255, 210, 50, ${0.35 * pulse})`);
  gradient.addColorStop(0.7, `rgba(200, 180, 30, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(150, 130, 20, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // ===== ЭЛЕКТРИЧЕСКИЕ ДУГИ =====
  ctx.save();
  ctx.globalAlpha = 0.6 * pulse;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255, 220, 50, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 220, 80, 0.8)';
  
  const arcCount = 3 + Math.floor(Math.sin(now * 0.003) * 1.5);
  for (let a = 0; a < arcCount; a++) {
    const baseAngle = (Math.PI * 2 / arcCount) * a + now * 0.002;
    const length = 25 + Math.sin(now * 0.005 + a * 2) * 10;
    
    ctx.beginPath();
    let x = player.px;
    let y = player.py;
    ctx.moveTo(x, y);
    
    const segments = 4 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const angle = baseAngle + Math.sin(now * 0.01 + i * 1.5 + a) * 0.8;
      const dist = length * t + Math.sin(now * 0.008 + i * 2 + a) * 4;
      x = player.px + Math.cos(angle) * dist;
      y = player.py + Math.sin(angle) * dist;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  
  // ===== ИСКРЫ ШОКА =====
  drawShockSparks(ctx);
}

/**
 * Отрисовка искр шока
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
export function drawShockSparks(ctx) {
  if (!state.shockSparks) state.shockSparks = [];
  
  // Создание новых искр
  if (state.shockSparks.length < 25 && Math.random() < 0.15) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    state.shockSparks.push({
      x: player.px + (Math.random() - 0.5) * 20,
      y: player.py + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 15 + Math.random() * 20,
      maxLife: 35,
      size: 1 + Math.random() * 2.5,
      color: Math.random() > 0.5 ? '#ffffff' : '#ffdd44'
    });
  }
  
  // Обновление и отрисовка искр
  for (let i = state.shockSparks.length - 1; i >= 0; i--) {
    const s = state.shockSparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.05;
    s.vx *= 0.97;
    s.life--;
    
    if (s.life <= 0) {
      state.shockSparks.splice(i, 1);
      continue;
    }
    
    const lifeProgress = s.life / s.maxLife;
    ctx.save();
    ctx.globalAlpha = lifeProgress * 0.9;
    ctx.shadowBlur = 6;
    ctx.shadowColor = s.color;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * (0.3 + lifeProgress * 0.7), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Ограничение количества искр
  if (state.shockSparks.length > 30) {
    state.shockSparks.splice(0, state.shockSparks.length - 30);
  }
}

/**
 * Отрисовка эффекта отравления
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPoisonEffect(ctx) {
  if (player.poisonTimer <= 0 || player.shockTimer > 0) return;
  
  const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  
  // ===== ОСНОВНОЕ СВЕЧЕНИЕ =====
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 75
  );
  gradient.addColorStop(0, `rgba(50, 255, 100, ${0.45 * pulse})`);
  gradient.addColorStop(0.3, `rgba(30, 220, 80, ${0.35 * pulse})`);
  gradient.addColorStop(0.7, `rgba(20, 180, 60, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(10, 120, 40, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // ===== ПУЗЫРЬКИ ЯДА =====
  drawPoisonBubbles(ctx);
}

/**
 * Отрисовка пузырьков яда
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
export function drawPoisonBubbles(ctx) {
  if (!state.poisonBubbles) state.poisonBubbles = [];
  
  // Создание новых пузырьков
  if (state.poisonBubbles.length < 12 && Math.random() < 0.08) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 30;
    state.poisonBubbles.push({
      x: player.px + Math.cos(angle) * radius,
      y: player.py + Math.sin(angle) * radius + 20,
      startY: player.py + Math.sin(angle) * radius + 20,
      speed: 0.3 + Math.random() * 0.6,
      life: 80 + Math.random() * 60,
      maxLife: 140,
      size: 3 + Math.random() * 4,
      type: Math.random() > 0.6 ? 'circle' : 'dot',
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 1 + Math.random() * 2
    });
  }
  
  // Обновление и отрисовка пузырьков
  for (let i = state.poisonBubbles.length - 1; i >= 0; i--) {
    const b = state.poisonBubbles[i];
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * b.wobbleAmount * 0.3;
    b.life--;
    
    if (b.life <= 0 || b.y < player.py - 60) {
      state.poisonBubbles.splice(i, 1);
      continue;
    }
    
    const lifeProgress = b.life / b.maxLife;
    const opacity = Math.min(1, lifeProgress * 2) * (0.4 + Math.sin(b.wobble * 2) * 0.15);
    
    ctx.save();
    ctx.globalAlpha = opacity * 0.7;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(50, 255, 100, 0.3)';
    
    const size = b.size * (0.5 + lifeProgress * 0.5);
    
    if (b.type === 'circle') {
      // Круглый пузырёк с обводкой
      ctx.strokeStyle = 'rgba(100, 255, 150, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, size, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(50, 255, 100, 0.15)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Точка-пузырёк
      ctx.fillStyle = `rgba(80, 255, 130, ${0.5 + lifeProgress * 0.3})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(50, 255, 100, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(200, 255, 200, 0.3)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(b.x - size * 0.15, b.y - size * 0.15, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Ограничение количества пузырьков
  if (state.poisonBubbles.length > 15) {
    state.poisonBubbles.splice(0, state.poisonBubbles.length - 15);
  }
}

/**
 * Отрисовка эффекта заморозки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawFreezeEffect(ctx) {
  if (!player.isFrozen || player.freezeTimer <= 0 || player.shockTimer > 0 || player.poisonTimer > 0) return;
  
  const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  
  // ===== ОСНОВНОЕ СВЕЧЕНИЕ =====
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 80
  );
  gradient.addColorStop(0, `rgba(100, 220, 255, ${0.4 * pulse})`);
  gradient.addColorStop(0.3, `rgba(80, 200, 255, ${0.3 * pulse})`);
  gradient.addColorStop(0.7, `rgba(50, 150, 255, ${0.15 * pulse})`);
  gradient.addColorStop(1, 'rgba(30, 100, 200, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // ===== КРИСТАЛЛЫ ЛЬДА =====
  ctx.save();
  ctx.globalAlpha = 0.7 * pulse;
  const crystalCount = 8;
  for (let i = 0; i < crystalCount; i++) {
    const angle = (Math.PI * 2 / crystalCount) * i + Date.now() * 0.001;
    const dist = 32 + Math.sin(Date.now() * 0.005 + i) * 6;
    const cx = player.px + Math.cos(angle) * dist;
    const cy = player.py + Math.sin(angle) * dist;
    
    const size = 2 + Math.sin(Date.now() * 0.008 + i * 2) * 1.5;
    ctx.fillStyle = i % 2 === 0 ? '#88ddff' : '#bbeeff';
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.5, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.5, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}