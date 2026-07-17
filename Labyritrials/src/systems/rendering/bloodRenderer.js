/**
 * @fileoverview Рендерер кровавых луж.
 * Отрисовывает кровавые пятна на полу с плавным затуханием и эффектами.
 * 
 * @module systems/rendering/bloodRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Отрисовка всех кровавых луж
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBloodPuddles(ctx) {
  if (!state.bloodPuddles || state.bloodPuddles.length === 0) return;
  
  for (let i = state.bloodPuddles.length - 1; i >= 0; i--) {
    const puddle = state.bloodPuddles[i];
    
    // Проверка валидности лужи
    if (!puddle || puddle.life === undefined) {
      state.bloodPuddles.splice(i, 1);
      continue;
    }
    
    // Уменьшение времени жизни
    puddle.life--;
    
    if (puddle.life <= 0) {
      state.bloodPuddles.splice(i, 1);
      continue;
    }
    
    const maxLife = puddle.maxLife || 600;
    const opacity = puddle.opacity || 0.35;
    const size = puddle.size || 25;
    const isMain = puddle.isMain === true;
    
    // Расчёт прозрачности в зависимости от времени жизни
    const lifeProgress = puddle.life / maxLife;
    let currentOpacity;
    
    // Появление и затухание
    if (lifeProgress < 0.2) {
      // Появление (первые 20% времени)
      currentOpacity = opacity * (lifeProgress / 0.2) * 0.6;
    } else {
      // Плавное затухание (остальное время)
      currentOpacity = opacity * (0.5 + lifeProgress * 0.5);
    }
    
    currentOpacity = Math.min(0.6, currentOpacity);
    
    if (currentOpacity <= 0.02) continue;
    
    // Проверка видимости клетки
    const gridX = Math.floor(puddle.x / CONFIG.cellSize);
    const gridY = Math.floor(puddle.y / CONFIG.cellSize);
    
    if (!state.grid[gridY] || !state.grid[gridY][gridX]) continue;
    if (!state.grid[gridY][gridX].revealed && !player.hasMap) continue;
    
    // Отрисовка лужи
    ctx.save();
    ctx.globalAlpha = currentOpacity;
    ctx.translate(puddle.x, puddle.y);
    
    if (puddle.rotation) ctx.rotate(puddle.rotation);
    
    if (isMain) {
      // Основная лужа — градиент
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, COLORS.effects.bloodPuddle.main);
      gradient.addColorStop(0.3, COLORS.effects.bloodPuddle.mid);
      gradient.addColorStop(0.6, COLORS.effects.bloodPuddle.dark);
      gradient.addColorStop(0.85, COLORS.effects.bloodPuddle.fade1);
      gradient.addColorStop(1, COLORS.effects.bloodPuddle.fade2);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Вторичные капли и брызги
      ctx.fillStyle = COLORS.effects.bloodPuddle.main;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Светлое пятно в центре
      ctx.fillStyle = COLORS.effects.bloodPuddle.center;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}