/**
 * @fileoverview Взрывы боссов.
 * Создаёт эффектные взрывы при смерти боссов с различными типами частиц.
 * 
 * @module systems/particles/bossExplosion
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Класс частицы взрыва босса
 * 
 * @class BossExplosionParticle
 */
class BossExplosionParticle {
  /**
   * Создание частицы взрыва
   * 
   * @param {number} x - Координата X центра взрыва
   * @param {number} y - Координата Y центра взрыва
   * @param {boolean} isBoss - Является ли взрыв от босса (увеличивает размер)
   * @param {string} [type='core'] - Тип частицы ('core', 'spark', 'smoke', 'magic', 'magic_core')
   * @param {Array<string>} [colorPalette=null] - Палитра цветов для частиц
   * @param {boolean} [isMindBoss=false] - Взрыв от босса Разум (особая цветовая гамма)
   */
  constructor(x, y, isBoss, type = 'core', colorPalette = null, isMindBoss = false) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    let speed, size, gravity, life, color;
    
    const defaultColors = ['#ff2200', '#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'];
    const mindColors = ['#44aaff', '#66ccff', '#88ddff', '#9b59b6', '#bb8af0', '#dda0dd'];
    const colors = colorPalette || (isMindBoss ? mindColors : defaultColors);
    
    // Настройка параметров в зависимости от типа частицы
    if (type === 'core') {
      speed = 2 + Math.random() * 12;
      size = isBoss ? 6 + Math.random() * 8 : 3 + Math.random() * 5;
      gravity = 0.15;
      life = 45 + Math.random() * 40;
      color = colors[Math.floor(Math.random() * colors.length)];
    } else if (type === 'spark') {
      speed = 5 + Math.random() * 15;
      size = 1.5 + Math.random() * 3;
      gravity = 0.05;
      life = 20 + Math.random() * 25;
      color = isMindBoss ? '#ffffff' : ['#ffff00', '#ffcc00', '#ffaa00'][Math.floor(Math.random() * 3)];
    } else if (type === 'smoke') {
      speed = 1 + Math.random() * 4;
      size = 8 + Math.random() * 12;
      gravity = -0.05;
      life = 60 + Math.random() * 50;
      color = isMindBoss ? '#4433aa' : '#333333';
    } else if (type === 'magic') {
      speed = 3 + Math.random() * 10;
      size = 3 + Math.random() * 5;
      gravity = -0.02;
      life = 50 + Math.random() * 40;
      color = colors[Math.floor(Math.random() * colors.length)];
    } else if (type === 'magic_core') {
      speed = 2 + Math.random() * 8;
      size = 5 + Math.random() * 6;
      gravity = 0.08;
      life = 55 + Math.random() * 35;
      color = '#ffffff';
    } else {
      speed = 3 + Math.random() * 10;
      size = isBoss ? 4 + Math.random() * 6 : 2 + Math.random() * 4;
      gravity = 0.12;
      life = 35 + Math.random() * 35;
      color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2;
    
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.gravity = gravity;
    this.drag = 0.98;
    this.glow = isBoss && type !== 'smoke';
    this.isMindBoss = isMindBoss;
  }
  
  /**
   * Обновление состояния частицы
   * 
   * @returns {boolean} - true, если частица ещё жива
   */
  update() {
    this.life--;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.drag;
    this.vy += this.gravity;
    this.vy *= this.drag;
    return this.life > 0;
  }
  
  /**
   * Отрисовка частицы
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {number} camX - Смещение камеры по X
   * @param {number} camY - Смещение камеры по Y
   * @returns {void}
   */
  draw(ctx, camX, camY) {
    const screenX = this.x + camX;
    const screenY = this.y + camY;
    const lifeProgress = this.life / this.maxLife;
    
    if (this.type === 'smoke') {
      // Дым — полупрозрачный, без свечения
      const alpha = lifeProgress * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size * (0.7 + lifeProgress * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'magic' || this.type === 'magic_core') {
      // Магические частицы — яркие, с большим свечением
      const alpha = lifeProgress * 0.9;
      const size = this.size * (0.4 + lifeProgress * 0.6);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (this.glow) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
      }
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.restore();
    } else {
      // Обычные частицы
      const alpha = lifeProgress * 0.9;
      const size = this.size * (0.4 + lifeProgress * 0.6);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (this.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
      }
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.restore();
    }
  }
}

/**
 * Создание взрыва босса
 * 
 * @param {number} x - Координата X центра взрыва
 * @param {number} y - Координата Y центра взрыва
 * @param {boolean} [isBoss=false] - Является ли взрыв от босса
 * @param {string} [bossType='demon'] - Тип босса ('demon', 'mind', 'duo')
 * @returns {void}
 */
export function createBossExplosion(x, y, isBoss = false, bossType = 'demon') {
  if (!state.bossExplosions) {
    state.bossExplosions = [];
  }

  // Ограничение количества частиц
  const maxExplosionParticles = CONFIG.maxParticles.bossExplosion || 200;
  if (state.bossExplosions.length > maxExplosionParticles) {
    const removeCount = state.bossExplosions.length - maxExplosionParticles;
    state.bossExplosions.splice(0, removeCount);
  }
  
  let colors;
  let isMindBoss = (bossType === 'mind');
  
  if (isMindBoss) {
    colors = ['#44aaff', '#66ccff', '#88ddff', '#9b59b6', '#bb8af0', '#dda0dd'];
  } else {
    colors = ['#ff2200', '#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'];
  }
  
  let particleCount = isBoss ? 120 + Math.floor(Math.random() * 80) : 15 + Math.floor(Math.random() * 15);

  // Проверка доступных слотов
  const availableSlots = maxExplosionParticles - state.bossExplosions.length;
  particleCount = Math.min(particleCount, availableSlots);
  
  // Создание частиц
  for (let i = 0; i < particleCount; i++) {
    let particleType = 'core';
    if (isMindBoss) {
      if (i % 2 === 0) particleType = 'spark';
      else if (i % 5 === 0) particleType = 'magic';
    } else {
      if (i % 3 === 0) particleType = 'spark';
      else if (i % 5 === 0) particleType = 'smoke';
    }
    
    state.bossExplosions.push(new BossExplosionParticle(x, y, isBoss, particleType, colors, isMindBoss));
    
    if (isMindBoss && i % 4 === 0) {
      state.bossExplosions.push(new BossExplosionParticle(x, y, isBoss, 'magic_core', colors, true));
    }
  }
  
  // Вторая волна частиц через 50 мс
  setTimeout(() => {
    if (state.bossExplosions) {
      const currentCount = state.bossExplosions.length;
      const availableForWave = maxExplosionParticles - currentCount;
      const waveCount = Math.min(Math.floor(particleCount / 2), Math.max(0, availableForWave));
      
      for (let i = 0; i < waveCount; i++) {
        let particleType = isMindBoss ? 'magic' : 'secondary';
        state.bossExplosions.push(new BossExplosionParticle(x, y, isBoss, particleType, colors, isMindBoss));
      }
    }
  }, 50);

  // Ударная волна для боссов
  if (isBoss) {
    state.shockwave = {
      x: x,
      y: y,
      radius: 10,
      maxRadius: 200,
      life: 30,
      opacity: 0.8,
      color: isMindBoss ? '#9b59b6' : '#ff6600'
    };
  }
  
  state.screenShake = isBoss ? 25 : 8;
}

/**
 * Обновление частиц взрыва
 * 
 * @returns {void}
 */
export function updateBossExplosions() {
  if (!state.bossExplosions) return;
  
  for (let i = state.bossExplosions.length - 1; i >= 0; i--) {
    const particle = state.bossExplosions[i];
    const alive = particle.update();
    if (!alive) {
      state.bossExplosions.splice(i, 1);
    }
  }
  
  // Обновление ударной волны
  if (state.shockwave) {
    state.shockwave.radius += 10;
    state.shockwave.life--;
    state.shockwave.opacity *= 0.9;
    if (state.shockwave.life <= 0 || state.shockwave.radius >= state.shockwave.maxRadius) {
      state.shockwave = null;
    }
  }
}

/**
 * Отрисовка частиц взрыва
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @returns {void}
 */
export function drawBossExplosions(ctx, camX, camY) {
  if (!state.bossExplosions) {
    return;
  }
  
  for (const particle of state.bossExplosions) {
    particle.draw(ctx, camX, camY);
  }
}

/**
 * Отрисовка ударной волны
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @returns {void}
 */
export function drawShockwave(ctx, camX, camY) {
  if (!state.shockwave) return;
  
  const sw = state.shockwave;
  sw.radius += 12;
  sw.life--;
  sw.opacity *= 0.92;
  
  const screenX = sw.x + camX;
  const screenY = sw.y + camY;
  
  ctx.save();
  ctx.globalAlpha = sw.opacity;
  ctx.beginPath();
  ctx.arc(screenX, screenY, sw.radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(screenX, screenY, sw.radius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
  
  if (sw.life <= 0 || sw.radius >= sw.maxRadius) {
    state.shockwave = null;
  }
}

/**
 * Очистка всех взрывов боссов
 * 
 * @returns {void}
 */
export function clearBossExplosions() {
  if (state.bossExplosions) {
    state.bossExplosions = [];
  }
}