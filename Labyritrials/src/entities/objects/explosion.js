/**
 * @fileoverview Система взрывов.
 * Создаёт, обновляет и отрисовывает эффекты взрывов (от взрывных ловушек).
 * 
 * @module entities/objects/explosion
 */

import { state, player } from '../../core/config/index.js';

/**
 * Создание эффекта взрыва
 * 
 * @param {number} x - Координата X центра взрыва (пиксели)
 * @param {number} y - Координата Y центра взрыва (пиксели)
 * @param {boolean} [isPlayer=true] - Взрыв от игрока (больше частиц и тряска)
 * @returns {void}
 */
export function createExplosion(x, y, isPlayer = true) {
  if (!state.explosionParticles) {
    state.explosionParticles = [];
  }

  // Вспышка взрыва
  state.explosionFlash = 15;

  const count = isPlayer ? 20 : 10;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    const life = 20 + Math.random() * 20;
    const size = 2 + Math.random() * 4;

    const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    state.explosionParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: life,
      maxLife: life,
      size: size,
      color: color,
      gravity: 0.12,
      drag: 0.98,
      type: Math.random() > 0.7 ? 'glow' : 'spark'
    });
  }

  state.screenShake = isPlayer ? 12 : 6;
}

/**
 * Обновление частиц взрыва
 * Вызывается каждый кадр
 * 
 * @returns {void}
 */
export function updateExplosion() {
  // Обновление вспышки
  if (state.explosionFlash > 0) {
    state.explosionFlash--;
  }

  // Обновление частиц
  if (!state.explosionParticles) return;

  for (let i = state.explosionParticles.length - 1; i >= 0; i--) {
    const p = state.explosionParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.life--;

    if (p.life <= 0) {
      state.explosionParticles.splice(i, 1);
    }
  }
}

/**
 * Отрисовка эффекта взрыва
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawExplosion(ctx) {
  // ===== ВСПЫШКА =====
  if (state.explosionFlash > 0) {
    const progress = state.explosionFlash / 15;
    const alpha = progress * 0.7;
    const radius = 60 + (1 - progress) * 40;

    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(
      player.px, player.py, 0,
      player.px, player.py, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.7)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)');
    gradient.addColorStop(0.8, 'rgba(200, 80, 20, 0.15)');
    gradient.addColorStop(1, 'rgba(150, 50, 0, 0)');

    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ff8800';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.px, player.py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ===== ЧАСТИЦЫ =====
  if (!state.explosionParticles || state.explosionParticles.length === 0) return;

  for (const p of state.explosionParticles) {
    const lifeProgress = p.life / p.maxLife;
    const alpha = lifeProgress * 0.9;
    const size = p.size * (0.3 + lifeProgress * 0.7);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'glow') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
    }

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Очистка всех эффектов взрыва
 * 
 * @returns {void}
 */
export function clearExplosion() {
  state.explosionParticles = [];
  state.explosionFlash = 0;
}