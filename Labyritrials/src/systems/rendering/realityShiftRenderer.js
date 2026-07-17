/**
 * @fileoverview Рендерер сдвига реальности.
 * Отображает визуальный эффект инверсии управления: трещины, частицы,
 * инвертированные цвета.
 * 
 * @module systems/rendering/realityShiftRenderer
 */

import { state, player } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Отрисовка эффекта сдвига реальности
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawRealityShift(ctx, canvas) {
  // Проверка активности эффекта
  if (!state.realityShift || !state.realityShift.active) return;
  
  const maxTimer = 90;
  const progress = Math.min(1, state.realityShift.timer / maxTimer);
  const intensity = state.realityShift.intensity * progress;
  
  // Если интенсивность слишком мала — отключаем эффект
  if (intensity <= 0.05) {
    state.realityShift.active = false;
    return;
  }
  
  ctx.save();
  
  // ===== ИНВЕРСИЯ ЦВЕТОВ (при инвертированном управлении) =====
  if (player.controlsInverted) {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = COLORS.player.shadow;
    ctx.globalAlpha = 0.12 * intensity;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  // ===== ТРЕЩИНЫ =====
  ctx.beginPath();
  ctx.strokeStyle = `rgba(155, 89, 182, ${0.5 * intensity})`;
  ctx.lineWidth = 2;
  
  const crackCount = 3 + Math.floor(6 * intensity);
  for (let i = 0; i < crackCount; i++) {
    const crackLength = 40 + Math.random() * 60;
    const startX = Math.random() < 0.5 ? 0 : canvas.width;
    const startY = Math.random() * canvas.height;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + Math.cos(angle) * crackLength, startY + Math.sin(angle) * crackLength);
    ctx.stroke();
  }
  
  // ===== ЧАСТИЦЫ РЕАЛЬНОСТИ =====
  if (!state.realityParticles) state.realityParticles = [];

  const maxRealityParticles = CONFIG.maxParticles.reality || 30;
  
  // Ограничение количества частиц
  if (state.realityParticles.length >= maxRealityParticles) {
    const removeCount = Math.floor(state.realityParticles.length * 0.3);
    state.realityParticles.splice(0, removeCount);
  }
  
  // Создание новых частиц
  if (Math.random() < 0.25 && intensity > 0.4 && state.realityParticles.length < maxRealityParticles) {
    state.realityParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      life: 20,
      maxLife: 20,
      size: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 1
    });
  }
  
  // Обновление и отрисовка частиц
  for (let i = state.realityParticles.length - 1; i >= 0; i--) {
    const p = state.realityParticles[i];
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    
    const lifeProgress = p.life / p.maxLife;
    
    if (p.life <= 0) {
      state.realityParticles.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.4 + lifeProgress * 0.6), 0, Math.PI * 2);
    ctx.fillStyle = COLORS.effects.magic;
    ctx.globalAlpha = lifeProgress * 0.6 * intensity;
    ctx.fill();
  }
  
  ctx.restore();
  
  // ===== ОБНОВЛЕНИЕ ТАЙМЕРА =====
  state.realityShift.timer--;
  if (state.realityShift.timer <= 0) {
    state.realityShift.active = false;
    state.realityParticles = [];
  }
}

/**
 * Обновление интенсивности сдвига реальности
 * 
 * @returns {void}
 */
export function updateRealityShift() {
  if (!state.realityShift || !state.realityShift.active) return;
  const maxTimer = 45;
  const progress = Math.min(1, state.realityShift.timer / maxTimer);
  state.realityShift.intensity = progress;
}