/**
 * @fileoverview Эффекты низкого здоровья в тумане войны.
 * Отображает пульсирующее красное свечение и виньетку при низком HP.
 * 
 * @module systems/fog/fogHealth
 */

import { state, player } from '../../core/config/index.js';

/**
 * Отрисовка эффекта низкого здоровья в тумане
 * 
 * Создаёт пульсирующее красное свечение вокруг игрока,
 * интенсивность которого зависит от процента здоровья.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawLowHealthFogEffect(ctx, canvas) {
  const hpPercent = player.hp / player.maxHp;
  
  // Эффект включается только при HP < 50%
  if (isNaN(hpPercent) || !isFinite(hpPercent) || hpPercent > 0.5) return;
  
  // Расчёт интенсивности эффекта (0-1)
  const intensity = 1 - (hpPercent - 0) / 0.5;
  const clampedIntensity = Math.min(1, Math.max(0, intensity));
  
  if (isNaN(clampedIntensity) || clampedIntensity <= 0) return;
  
  // Сердцебиение
  const beatSpeed = 0.002;
  const heartbeat = Math.sin(Date.now() * beatSpeed) * 0.5 + 0.5;
  const pulseFactor = 0.8 + heartbeat * 0.2;
  
  const alpha = clampedIntensity * 0.08 * pulseFactor;
  
  if (isNaN(alpha) || alpha <= 0) return;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 0.8;
  
  if (isNaN(radius) || radius <= 0) return;
  
  // Внутреннее свечение
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(180, 20, 20, ${alpha * 0.5})`);
  gradient.addColorStop(0.3, `rgba(150, 15, 15, ${alpha * 0.8})`);
  gradient.addColorStop(0.6, `rgba(100, 10, 10, ${alpha * 0.5})`);
  gradient.addColorStop(1, `rgba(50, 5, 5, 0)`);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Внешнее свечение при очень низком HP (< 20%)
  if (clampedIntensity > 0.3) {
    const outerAlpha = clampedIntensity * 0.04 * pulseFactor;
    
    if (isNaN(outerAlpha) || outerAlpha <= 0) return;
    
    const outerRadius = radius * 1.4;
    
    const outerGradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, outerRadius);
    outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    outerGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    outerGradient.addColorStop(0.85, `rgba(100, 10, 10, ${outerAlpha * 0.5})`);
    outerGradient.addColorStop(1, `rgba(60, 5, 5, ${outerAlpha})`);
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

/**
 * Отрисовка красной виньетки при низком здоровье
 * 
 * Создаёт затемнение по краям экрана с красным оттенком.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawLowHealthVignette(ctx, canvas) {
  const hpPercent = player.hp / player.maxHp;
  
  // Эффект включается только при HP < 50%
  if (isNaN(hpPercent) || !isFinite(hpPercent) || hpPercent > 0.5) return;
  
  // Расчёт интенсивности эффекта (0-1)
  const intensity = 1 - (hpPercent / 0.5);
  const clampedIntensity = Math.min(1, Math.max(0, intensity));
  
  if (isNaN(clampedIntensity) || clampedIntensity <= 0) return;
  
  // Сердцебиение (чем меньше HP, тем быстрее)
  const beatSpeed = 0.002 + (1 - hpPercent) * 0.004;
  const heartbeat = Math.sin(Date.now() * beatSpeed) * 0.5 + 0.5;
  const pulseFactor = 0.7 + heartbeat * 0.3;
  
  const alpha = clampedIntensity * 0.25 * pulseFactor;
  
  if (isNaN(alpha) || alpha <= 0) return;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxRadius = Math.max(canvas.width, canvas.height) * 0.7;
  
  // Градиент виньетки с красным оттенком
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.45, `rgba(0, 0, 0, ${alpha * 0.1})`);
  gradient.addColorStop(0.65, `rgba(120, 0, 0, ${alpha * 0.3})`);
  gradient.addColorStop(0.80, `rgba(180, 0, 0, ${alpha * 0.5})`);
  gradient.addColorStop(0.92, `rgba(200, 10, 10, ${alpha * 0.7})`);
  gradient.addColorStop(1, `rgba(220, 20, 20, ${alpha * 0.9})`);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}