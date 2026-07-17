/**
 * @fileoverview Рендерер снарядов и эффектов.
 * Отрисовывает огненные шары, кольцевые снаряды, тексты урона,
 * искры, лучи и псионические волны.
 * 
 * @module systems/rendering/projectileRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Отрисовка всех огненных шаров и снарядов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawFireballs(ctx) {
  for (let fb of state.fireballs) {
    ctx.save();
    
    // ===== КОЛЬЦЕВЫЕ СНАРЯДЫ (босс-стрелок) =====
    if (fb.isRingProjectile && fb.ringActive) {
      drawRingProjectile(ctx, fb);
      ctx.restore();
      continue;
    }
    
    // ===== ОБЫЧНЫЕ СНАРЯДЫ =====
    drawNormalFireball(ctx, fb);
    ctx.restore();
  }
}

/**
 * Отрисовка кольцевого снаряда
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} fb - Объект снаряда
 * @returns {void}
 * @private
 */
function drawRingProjectile(ctx, fb) {
  const ringRadius = fb.ringOrbitRadius || 50;
  const ballCount = fb.ringBallCount || 8;
  const orbitAngle = fb.ringOrbitAngle || 0;
  const pulse = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
  
  // Центральное свечение
  ctx.shadowBlur = 35;
  ctx.shadowColor = COLORS.effects.fireGlow;
  
  const coreGradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, 35);
  coreGradient.addColorStop(0, `rgba(255, 100, 0, ${0.8 * pulse})`);
  coreGradient.addColorStop(0.4, `rgba(255, 60, 0, ${0.5 * pulse})`);
  coreGradient.addColorStop(0.7, `rgba(200, 30, 0, ${0.2 * pulse})`);
  coreGradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, 35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = `rgba(255, 120, 20, ${0.9 * pulse})`;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, 14, 0, Math.PI * 2);
  ctx.fill();
  
  // Огненные шары по кольцу
  for (let b = 0; b < ballCount; b++) {
    const angle = orbitAngle + (Math.PI * 2 / ballCount) * b;
    const ballX = fb.x + Math.cos(angle) * ringRadius;
    const ballY = fb.y + Math.sin(angle) * ringRadius;
    
    const ballSize = 12 + Math.sin(Date.now() * 0.012 + b) * 2;
    
    const gradient = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, ballSize);
    gradient.addColorStop(0, '#fff4a0');
    gradient.addColorStop(0.3, COLORS.effects.gold.light);
    gradient.addColorStop(0.6, COLORS.effects.fire);
    gradient.addColorStop(1, COLORS.effects.blood);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.effects.fireGlow;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Блик на шаре
    ctx.fillStyle = COLORS.player.shadow;
    ctx.beginPath();
    ctx.arc(ballX - 3, ballY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Искры вокруг шаров
    const time = Date.now() * 0.015;
    for (let s = 0; s < 3; s++) {
      const sparkAngle = angle + time + s * Math.PI * 1.5;
      const sparkX = ballX + Math.cos(sparkAngle) * 8;
      const sparkY = ballY + Math.sin(sparkAngle) * 8;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2 + Math.sin(time * 2 + s) * 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 180, 50, ${0.7 + Math.sin(time * 3) * 0.3})`;
      ctx.fill();
    }
  }
  
  // Частицы вокруг кольца
  const time2 = Date.now() * 0.01;
  for (let p = 0; p < 12; p++) {
    const angle = time2 + (Math.PI * 2 / 12) * p;
    const particleX = fb.x + Math.cos(angle) * (ringRadius + 8);
    const particleY = fb.y + Math.sin(angle) * (ringRadius + 8);
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2 + Math.sin(time2 * 3 + p) * 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${0.4 + Math.sin(time2 * 4) * 0.2})`;
    ctx.fill();
  }
}

/**
 * Отрисовка обычного огненного шара
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} fb - Объект снаряда
 * @returns {void}
 * @private
 */
function drawNormalFireball(ctx, fb) {
  const isGlowingMindBall = fb.isMindBall && fb.isGlowing;
  
  let gradient;
  if (isGlowingMindBall) {
    // Светящийся пси-шар (фаза 2 Разума)
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.player.shadow);
    gradient.addColorStop(0.3, COLORS.effects.artifact.light);
    gradient.addColorStop(0.6, COLORS.effects.magic);
    gradient.addColorStop(1, COLORS.effects.artifact.dark);
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLORS.effects.magic;
  } else if (fb.isMindBall) {
    // Обычный пси-шар
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.effects.artifact.light);
    gradient.addColorStop(0.5, COLORS.effects.magic);
    gradient.addColorStop(1, COLORS.effects.artifact.dark);
    ctx.shadowBlur = 12;
    ctx.shadowColor = COLORS.effects.magic;
  } else {
    // Огненный шар
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.effects.gold.light);
    gradient.addColorStop(0.5, COLORS.effects.fire);
    gradient.addColorStop(1, COLORS.effects.blood);
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.effects.fireGlow;
  }
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, fb.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Эмодзи в центре
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = `${fb.radius + 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (fb.isMindBall) {
    ctx.fillText('🧠', fb.x, fb.y);
  } else {
    ctx.fillText('🔥', fb.x, fb.y);
  }
}

/**
 * Отрисовка текстов урона и сообщений
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawDamageTexts(ctx) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let i = state.damageTexts.length - 1; i >= 0; i--) {
    let dt = state.damageTexts[i];
    ctx.fillStyle = dt.color;
    ctx.font = `bold ${dt.size}px Arial`;
    ctx.fillText(dt.text, dt.x, dt.y);
    
    dt.y -= dt.speedy;
    dt.life--;
    
    if (dt.life <= 0) {
      state.damageTexts.splice(i, 1);
    }
  }
}

/**
 * Отрисовка искр
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawSparks(ctx) {
  if (!state.sparks || state.sparks.length === 0) return;

  // Ограничение количества искр
  const maxSparks = CONFIG.maxParticles.spark || 120;
  if (state.sparks.length > maxSparks) {
    const removeCount = state.sparks.length - maxSparks;
    state.sparks.splice(0, removeCount);
  }
  
  for (let spark of state.sparks) {
    const lifeProgress = spark.life / spark.maxLife;
    
    // ===== ИСКРЫ ОТ РУН =====
    if (spark.isRuneSpark) {
      drawRuneSpark(ctx, spark, lifeProgress);
      continue;
    }
    
    // ===== ОБЫЧНЫЕ ИСКРЫ =====
    const opacity = Math.min(1, lifeProgress * 1.5);
    const size = spark.size * (0.5 + lifeProgress * 0.5);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 4;
    ctx.shadowColor = spark.color || COLORS.sparks.fire;
    
    if (spark.isDust) {
      ctx.fillStyle = spark.color || COLORS.sparks.dust;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = spark.color || COLORS.sparks.fire;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = COLORS.player.shadow;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Отрисовка искры от руны
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} spark - Объект искры
 * @param {number} lifeProgress - Прогресс жизни (0-1)
 * @returns {void}
 * @private
 */
function drawRuneSpark(ctx, spark, lifeProgress) {
  let opacity = 1;
  if (lifeProgress < 0.1) {
    opacity = lifeProgress / 0.1;
  } else if (lifeProgress > 0.7) {
    opacity = (1 - lifeProgress) / 0.3;
  }
  
  if (spark.flickerPhase !== undefined) {
    spark.flickerPhase += spark.flickerSpeed || 0.01;
    const flicker = 0.6 + Math.sin(spark.flickerPhase) * 0.25;
    opacity *= (0.5 + flicker * 0.5);
  }
  
  const size = spark.size * (0.7 + lifeProgress * 0.3);
  
  ctx.save();
  ctx.globalAlpha = Math.min(0.8, opacity);
  
  if (spark.glow) {
    const glowSize = 10 + (spark.glowIntensity || 0.8) * 12;
    ctx.shadowBlur = glowSize;
    ctx.shadowColor = spark.color || COLORS.sparks.magic;
  }
  
  const color = spark.color || COLORS.sparks.magic;
  
  const gradient = ctx.createRadialGradient(
    spark.x, spark.y, 0,
    spark.x, spark.y, size * 2.5
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, size * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Отрисовка лучей (атака босса Демон)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBeams(ctx) {
  if (!state.beams) return;
  
  for (const beam of state.beams) {
    const lifeProgress = beam.life / 20;
    const opacity = Math.min(1, lifeProgress * 2);
    
    let endX = beam.endX;
    let endY = beam.endY;
    if (!endX || !endY) {
      endX = beam.x + Math.cos(beam.angle) * beam.length;
      endY = beam.y + Math.sin(beam.angle) * beam.length;
    }
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.bosses.demon.beam;
    
    const gradient = ctx.createLinearGradient(beam.x, beam.y, endX, endY);
    gradient.addColorStop(0, COLORS.bosses.demon.beam);
    gradient.addColorStop(0.3, COLORS.effects.fire);
    gradient.addColorStop(0.6, COLORS.effects.fireGlow);
    gradient.addColorStop(1, COLORS.effects.gold.light);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.strokeStyle = COLORS.player.shadow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
  }
}

/**
 * Отрисовка псионической волны (атака босса Разум)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPsionicWave(ctx) {
  if (!state.psionicWave) return;
  
  const wave = state.psionicWave;
  wave.radius += 8;
  wave.life--;
  wave.opacity *= 0.92;
  
  ctx.save();
  ctx.globalAlpha = wave.opacity;
  
  // Внешнее кольцо
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.bosses.mind.wave;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Внутреннее кольцо
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.effects.artifact.light;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Точки по окружности
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const x = wave.x + Math.cos(angle) * wave.radius;
    const y = wave.y + Math.sin(angle) * wave.radius;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bosses.mind.wave;
    ctx.fill();
  }
  
  ctx.restore();
  
  // Автоматическое удаление по окончании
  if (wave.life <= 0 || wave.radius >= wave.maxRadius) {
    state.psionicWave = null;
  }
}