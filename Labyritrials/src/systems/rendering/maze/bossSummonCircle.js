/**
 * @fileoverview Круг призыва босса.
 * Отрисовывает зловещий круг с рунами, который появляется на арене
 * перед появлением босса, и управляет его исчезновением.
 * 
 * @module systems/rendering/maze/bossSummonCircle
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Отрисовка круга призыва босса
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBossSummonCircle(ctx) {
  if (!state.isBossLevel) return;
  
  const arenaSize = CONFIG.bossArenaSize || 25;
  const centerX = (arenaSize / 2) * CONFIG.cellSize;
  const centerY = (arenaSize / 2) * CONFIG.cellSize;
  const time = Date.now() * 0.001;
  const radius = CONFIG.cellSize * 1.8;
  
  const fadeProgress = state.bossSummonCircle?.fadeProgress || 0;
  const opacity = 1 - fadeProgress;
  
  // ===== РИСУЕМ КРУГ, ПОКА ОН ВИДЕН =====
  if (opacity > 0.01) {
    drawSummonCircle(ctx, centerX, centerY, radius, time, opacity);
  }
  
  // ===== ВСЕГДА РИСУЕМ ЧАСТИЦЫ =====
  drawSummonParticles(ctx, centerX, centerY);
}

/**
 * Отрисовка круга призыва
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} centerX - Центр по X
 * @param {number} centerY - Центр по Y
 * @param {number} radius - Радиус круга
 * @param {number} time - Текущее время
 * @param {number} opacity - Прозрачность (0-1)
 * @returns {void}
 * @private
 */
function drawSummonCircle(ctx, centerX, centerY, radius, time, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  
  const pulse = 0.7 + 0.3 * Math.sin(time * 0.7);
  
  // Внешнее свечение
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
  glowGradient.addColorStop(0, `rgba(120, 20, 20, ${0.2 * pulse * opacity})`);
  glowGradient.addColorStop(0.4, `rgba(80, 10, 10, ${0.12 * pulse * opacity})`);
  glowGradient.addColorStop(0.7, `rgba(40, 5, 5, ${0.06 * pulse * opacity})`);
  glowGradient.addColorStop(1, 'rgba(20, 0, 0, 0)');
  
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Основной круг
  ctx.fillStyle = `rgba(50, 10, 10, ${0.5 * opacity})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Внешнее кольцо (свечение)
  ctx.shadowBlur = 30 * pulse * opacity;
  ctx.shadowColor = `rgba(180, 30, 30, ${0.5 * pulse * opacity})`;
  ctx.strokeStyle = `rgba(200, 40, 40, ${0.7 * pulse * opacity})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Внутреннее кольцо
  ctx.shadowBlur = 20 * pulse * opacity;
  ctx.shadowColor = `rgba(180, 30, 30, ${0.3 * pulse * opacity})`;
  ctx.strokeStyle = `rgba(150, 30, 30, ${0.5 * pulse * opacity})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Треснувшие дуги
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 / 4) * i + time * 0.03;
    const startR = radius * 0.75;
    const endR = radius * 0.95;
    const gapAngle = 0.15 + 0.1 * Math.sin(time * 0.5 + i);
    
    ctx.strokeStyle = `rgba(180, 40, 40, ${0.3 * pulse * opacity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, startR + (endR - startR) * 0.3, angle - gapAngle, angle + gapAngle);
    ctx.stroke();
  }
  
  // Руны по кругу
  drawSummonRunes(ctx, centerX, centerY, radius, time, pulse, opacity);
  
  // Центральный символ
  const corePulse = 0.5 + 0.5 * Math.sin(time * 0.9);
  ctx.shadowBlur = 30 * corePulse * opacity;
  ctx.shadowColor = `rgba(200, 50, 50, ${0.5 * corePulse * opacity})`;
  ctx.fillStyle = `rgba(200, 60, 60, ${0.4 * corePulse * opacity})`;
  ctx.font = '36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', centerX, centerY);
  ctx.shadowBlur = 0;
  
  // Тёмные линии
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + time * 0.02;
    const length = radius * (0.2 + 0.3 * Math.sin(time * 0.4 + i * 0.7));
    const startR = radius * 0.5;
    
    ctx.strokeStyle = `rgba(150, 30, 30, ${0.15 * pulse * opacity})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * startR, centerY + Math.sin(angle) * startR);
    ctx.lineTo(centerX + Math.cos(angle) * (startR + length), centerY + Math.sin(angle) * (startR + length));
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Отрисовка рун по кругу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} centerX - Центр по X
 * @param {number} centerY - Центр по Y
 * @param {number} radius - Радиус круга
 * @param {number} time - Текущее время
 * @param {number} pulse - Пульсация
 * @param {number} opacity - Прозрачность
 * @returns {void}
 * @private
 */
function drawSummonRunes(ctx, centerX, centerY, radius, time, pulse, opacity) {
  const runeCount = 8;
  const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];
  
  for (let i = 0; i < runeCount; i++) {
    const angle = (Math.PI * 2 / runeCount) * i + time * 0.04;
    const r = radius * 0.85;
    const rx = centerX + Math.cos(angle) * r;
    const ry = centerY + Math.sin(angle) * r;
    
    const runePulse = 0.6 + 0.4 * Math.sin(time * 0.8 + i * 0.5);
    const runeAlpha = 0.4 * runePulse * opacity;
    
    ctx.shadowBlur = 10 * runePulse * opacity;
    ctx.shadowColor = `rgba(200, 50, 50, ${0.3 * runePulse * opacity})`;
    ctx.fillStyle = `rgba(200, 60, 60, ${runeAlpha})`;
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(runeSymbols[i % runeSymbols.length], rx, ry);
  }
  ctx.shadowBlur = 0;
}

/**
 * Отрисовка частиц круга призыва
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} centerX - Центр по X
 * @param {number} centerY - Центр по Y
 * @returns {void}
 * @private
 */
function drawSummonParticles(ctx, centerX, centerY) {
  if (!state.bossSummonCircle?.particles) return;
  
  const particles = state.bossSummonCircle.particles;
  if (particles.length === 0) return;
  
  for (const p of particles) {
    const lifeProgress = p.life / p.maxLife;
    if (lifeProgress <= 0) continue;
    
    const alpha = lifeProgress * 0.7;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (p.isExplosionParticle) {
      // Частицы взрыва — яркие, с большим свечением
      ctx.shadowBlur = 20 * lifeProgress;
      ctx.shadowColor = `rgba(255, 80, 80, ${0.5 * lifeProgress})`;
      ctx.fillStyle = `rgba(255, 100, 80, ${0.9 * lifeProgress})`;
    } else {
      // Обычные частицы
      ctx.shadowBlur = 10 * lifeProgress;
      ctx.shadowColor = `rgba(200, 50, 50, ${0.4 * lifeProgress})`;
      ctx.fillStyle = `rgba(200, 60, 60, ${0.7 * lifeProgress})`;
    }
    
    const size = p.size * (0.3 + lifeProgress * 0.7);
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Запуск анимации исчезновения круга
 * 
 * Создаёт всплеск частиц при исчезновении круга призыва.
 * 
 * @returns {void}
 */
export function triggerBossSummonFade() {
  if (!state.bossSummonCircle) {
    state.bossSummonCircle = {
      active: true,
      fadeProgress: 0,
      particles: []
    };
  }
  
  state.bossSummonCircle.active = false;
  state.bossSummonCircle.fadeProgress = 0;
  
  const arenaSize = CONFIG.bossArenaSize || 25;
  const centerX = (arenaSize / 2) * CONFIG.cellSize;
  const centerY = (arenaSize / 2) * CONFIG.cellSize;
  const radius = CONFIG.cellSize * 1.8;
  
  // Создаём всплеск частиц при исчезновении
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.2 + Math.random() * 0.7);
    const speed = 2 + Math.random() * 5;
    
    state.bossSummonCircle.particles.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 50 + Math.random() * 40,
      maxLife: 90,
      size: 1.5 + Math.random() * 2.5,
      isExplosionParticle: true
    });
  }
  
  // Добавляем мелкие частицы для эффекта
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.5 + Math.random() * 0.5);
    const speed = 1 + Math.random() * 3;
    
    state.bossSummonCircle.particles.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 30 + Math.random() * 25,
      maxLife: 55,
      size: 0.5 + Math.random() * 1.0,
      isExplosionParticle: false
    });
  }
}

/**
 * Обновление анимации исчезновения круга
 * 
 * @returns {void}
 */
export function updateBossSummonCircle() {
  if (!state.bossSummonCircle) return;
  
  // Обновляем fadeProgress
  if (!state.bossSummonCircle.active && state.bossSummonCircle.fadeProgress < 1) {
    state.bossSummonCircle.fadeProgress += 0.015;
    if (state.bossSummonCircle.fadeProgress > 1) {
      state.bossSummonCircle.fadeProgress = 1;
    }
  }
  
  // Обновляем частицы
  if (state.bossSummonCircle.particles) {
    const particles = state.bossSummonCircle.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.vy += 0.04;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }
}