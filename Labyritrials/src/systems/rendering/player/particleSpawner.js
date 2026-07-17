/**
 * @fileoverview Спавнеры частиц для эффектов игрока.
 * Управляет созданием, обновлением и отрисовкой кровавых капель
 * и искр молнии.
 * 
 * @module systems/rendering/player/particleSpawner
 */

import { state, player, CONFIG } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Создание кровавых капель (эффект вампиризма)
 * 
 * @param {number} x - Координата X источника
 * @param {number} y - Координата Y источника
 * @param {boolean} isCharged - Заряженная атака (больше капель)
 * @returns {void}
 */
export function spawnBloodDrops(x, y, isCharged) {
  if (!state.bloodDrops) state.bloodDrops = [];
  
  const maxBloodDrops = CONFIG.maxParticles.blood || 60;
  
  // Ограничение количества капель
  if (state.bloodDrops.length >= maxBloodDrops) {
    const removeCount = Math.floor(state.bloodDrops.length * 0.3);
    state.bloodDrops.splice(0, removeCount);
  }
  
  const dropCount = isCharged ? 12 + Math.floor(Math.random() * 8) : 6 + Math.floor(Math.random() * 5);
  const availableSlots = maxBloodDrops - state.bloodDrops.length;
  const actualCount = Math.min(dropCount, Math.max(0, availableSlots));
  
  for (let i = 0; i < actualCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const life = 30 + Math.random() * 20;
    
    state.bloodDrops.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      targetX: player.px,
      targetY: player.py,
      attracted: false
    });
  }
}

/**
 * Обновление кровавых капель
 * 
 * @returns {void}
 */
export function updateBloodDrops() {
  if (!state.bloodDrops) return;
  
  for (let i = state.bloodDrops.length - 1; i >= 0; i--) {
    const drop = state.bloodDrops[i];
    drop.life--;
    
    // Активация притяжения к игроку после 40% времени жизни
    if (!drop.attracted && drop.life < drop.maxLife * 0.6) {
      drop.attracted = true;
    }
    
    if (drop.attracted) {
      const dx = drop.targetX - drop.x;
      const dy = drop.targetY - drop.y;
      const dist = Math.hypot(dx, dy);
      
      // Удаление при достижении цели
      if (dist < 10) {
        state.bloodDrops.splice(i, 1);
        continue;
      }
      
      // Движение к цели
      const speed = 4;
      const angle = Math.atan2(dy, dx);
      drop.vx = Math.cos(angle) * speed;
      drop.vy = Math.sin(angle) * speed;
    }
    
    // Физика частиц
    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.vy += 0.2;
    drop.vx *= 0.98;
    
    if (drop.life <= 0) {
      state.bloodDrops.splice(i, 1);
    }
  }
}

/**
 * Отрисовка кровавых капель
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBloodDrops(ctx) {
  if (!state.bloodDrops) return;
  
  for (const drop of state.bloodDrops) {
    const lifeProgress = drop.life / drop.maxLife;
    const alpha = lifeProgress * 0.8;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 4;
    ctx.shadowColor = COLORS.effects.blood;
    
    // Основная капля
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.effects.blood;
    ctx.fill();
    
    // Блик на капле
    ctx.beginPath();
    ctx.arc(drop.x - 1, drop.y - 1, drop.size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.effects.bloodLight;
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Создание искр молнии (эффект громового посоха)
 * 
 * @param {number} x - Координата X источника
 * @param {number} y - Координата Y источника
 * @param {boolean} isCharged - Заряженная атака (больше искр)
 * @returns {void}
 */
export function spawnLightningSparks(x, y, isCharged) {
  const sparkCount = isCharged ? 8 + Math.floor(Math.random() * 5) : 4 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    const life = 20 + Math.random() * 15;
    
    state.lightningSparks = state.lightningSparks || [];
    state.lightningSparks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      size: 1.5 + Math.random() * 2.5,
      color: Math.random() > 0.5 ? COLORS.sparks.lightning : COLORS.sparks.lightningWhite
    });
  }
}

/**
 * Обновление искр молнии
 * 
 * @returns {void}
 */
export function updateLightningSparks() {
  if (!state.lightningSparks) return;
  
  for (let i = state.lightningSparks.length - 1; i >= 0; i--) {
    const spark = state.lightningSparks[i];
    spark.life--;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vy += 0.1;
    spark.vx *= 0.97;
    
    if (spark.life <= 0) {
      state.lightningSparks.splice(i, 1);
    }
  }
}

/**
 * Отрисовка искр молнии
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawLightningSparks(ctx) {
  if (!state.lightningSparks) return;
  
  for (const spark of state.lightningSparks) {
    const lifeProgress = spark.life / spark.maxLife;
    const alpha = lifeProgress * 0.9;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 6;
    ctx.shadowColor = spark.color;
    
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fillStyle = spark.color;
    ctx.fill();
    
    ctx.restore();
  }
}