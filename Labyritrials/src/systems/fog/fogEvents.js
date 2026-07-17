/**
 * @fileoverview Визуальные эффекты событий в тумане войны.
 * Отрисовывает уникальные визуальные эффекты для каждого типа события.
 * 
 * @module systems/fog/fogEvents
 */

import { state } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Отрисовка эффекта события в тумане
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawEventFogEffect(ctx, canvas) {
  // Эффекты не отображаются в тайных комнатах
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  
  const event = state.currentEvent;
  if (!event) return;
  
  const time = Date.now() * 0.001;
  
  switch (event) {
    case 'bloodMoon':
      drawBloodMoonEffect(ctx, canvas, time);
      break;
    case 'iceWind':
      drawIceWindEffect(ctx, canvas, time);
      break;
    case 'blessing':
      drawBlessingEffect(ctx, canvas, time);
      break;
    case 'monsterRage':
      drawMonsterRageEffect(ctx, canvas, time);
      break;
    case 'fragility':
      drawFragilityEffect(ctx, canvas, time);
      break;
  }
}

/**
 * Эффект "Кровавая луна" — красное свечение с искрами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} time - Текущее время
 * @returns {void}
 * @private
 */
function drawBloodMoonEffect(ctx, canvas, time) {
  const intensity = 0.15 + Math.sin(time * 0.8) * 0.05;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 1.2;
  const colors = COLORS.fog.effects.bloodMoon;
  
  // Красный градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `${colors.color1}${intensity * 0.5})`);
  gradient.addColorStop(0.4, `${colors.color2}${intensity})`);
  gradient.addColorStop(0.7, `${colors.color3}${intensity * 0.7})`);
  gradient.addColorStop(1, colors.color4);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Случайные искры
  if (Math.random() < 0.15) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 3;
    const alpha = 0.1 + Math.random() * 0.2;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.spark;
    ctx.shadowBlur = 12;
    ctx.shadowColor = colors.sparkShadow;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Виньетка
  const vignetteGradient = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.1);
  vignetteGradient.addColorStop(0, COLORS.fog.gradient.center);
  vignetteGradient.addColorStop(0.7, COLORS.fog.gradient.center);
  vignetteGradient.addColorStop(0.85, `${colors.vignette1}${0.05 + Math.sin(time * 0.5) * 0.02})`);
  vignetteGradient.addColorStop(1, `${colors.vignette2}${0.1 + Math.sin(time * 0.7) * 0.03})`);
  
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Эффект "Ледяной ветер" — голубое свечение с искрами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} time - Текущее время
 * @returns {void}
 * @private
 */
function drawIceWindEffect(ctx, canvas, time) {
  const intensity = 0.12 + Math.sin(time * 1.2 + 1) * 0.04;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 1.2;
  const colors = COLORS.fog.effects.iceWind;
  
  // Голубой градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `${colors.color1}${intensity * 0.5})`);
  gradient.addColorStop(0.4, `${colors.color2}${intensity})`);
  gradient.addColorStop(0.7, `${colors.color3}${intensity * 0.7})`);
  gradient.addColorStop(1, colors.color4);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Дрейфующие искры
  for (let i = 0; i < 3; i++) {
    if (Math.random() < 0.12) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 2.5;
      const alpha = 0.1 + Math.random() * 0.2;
      const driftX = Math.sin(time * 0.5 + x * 0.01) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.spark;
      ctx.shadowBlur = 8;
      ctx.shadowColor = colors.sparkShadow;
      ctx.beginPath();
      ctx.arc(x + driftX, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.sparkShadow;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(x + driftX, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  // Иней
  const frostGradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.1);
  frostGradient.addColorStop(0, COLORS.fog.gradient.center);
  frostGradient.addColorStop(0.7, COLORS.fog.gradient.center);
  frostGradient.addColorStop(0.85, `${colors.frost1}${0.03 + Math.sin(time * 0.8) * 0.02})`);
  frostGradient.addColorStop(1, `${colors.frost2}${0.06 + Math.sin(time * 1.1) * 0.03})`);
  
  ctx.fillStyle = frostGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Эффект "Благословение" — золотое свечение с лучами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} time - Текущее время
 * @returns {void}
 * @private
 */
function drawBlessingEffect(ctx, canvas, time) {
  const intensity = 0.08 + Math.sin(time * 0.6) * 0.03;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 1.3;
  const colors = COLORS.fog.effects.blessing;
  
  // Золотой градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `${colors.color1}${intensity * 0.4})`);
  gradient.addColorStop(0.3, `${colors.color2}${intensity * 0.7})`);
  gradient.addColorStop(0.6, `${colors.color3}${intensity * 0.4})`);
  gradient.addColorStop(1, colors.color4);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Лучи света
  ctx.save();
  ctx.globalAlpha = 0.03 + Math.sin(time * 0.3) * 0.015;
  ctx.translate(cx, cy);
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + time * 0.05;
    const length = radius * (0.6 + Math.sin(time * 0.2 + i) * 0.2);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    ctx.strokeStyle = colors.ray;
    ctx.lineWidth = 2 + Math.sin(time + i) * 1;
    ctx.stroke();
  }
  ctx.restore();
  
  // Искры
  if (Math.random() < 0.08) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    const alpha = 0.1 + Math.random() * 0.15;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.spark;
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.sparkShadow;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Эффект "Ярость монстров" — оранжево-красное свечение с вспышками
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} time - Текущее время
 * @returns {void}
 * @private
 */
function drawMonsterRageEffect(ctx, canvas, time) {
  const intensity = 0.1 + Math.sin(time * 0.9) * 0.04;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 1.2;
  const colors = COLORS.fog.effects.monsterRage;
  
  // Оранжево-красный градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `${colors.color1}${intensity * 0.5})`);
  gradient.addColorStop(0.4, `${colors.color2}${intensity})`);
  gradient.addColorStop(0.7, `${colors.color3}${intensity * 0.7})`);
  gradient.addColorStop(1, colors.color4);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Пульсирующие тени
  const pulse = 0.3 + Math.sin(time * 2) * 0.2;
  const shadowGradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.1);
  shadowGradient.addColorStop(0, COLORS.fog.gradient.center);
  shadowGradient.addColorStop(0.7, COLORS.fog.gradient.center);
  shadowGradient.addColorStop(0.85, `${colors.shadow1}${0.05 * pulse})`);
  shadowGradient.addColorStop(1, `${colors.shadow2}${0.1 * pulse})`);
  
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Вспышки
  if (Math.random() < 0.04) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const flashSize = 20 + Math.random() * 40;
    
    ctx.save();
    ctx.globalAlpha = 0.05 + Math.random() * 0.05;
    ctx.fillStyle = colors.flash;
    ctx.shadowBlur = 30;
    ctx.shadowColor = colors.flashShadow;
    ctx.beginPath();
    ctx.arc(x, y, flashSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Эффект "Хрупкость" — фиолетовое свечение с трещинами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} time - Текущее время
 * @returns {void}
 * @private
 */
function drawFragilityEffect(ctx, canvas, time) {
  const intensity = 0.1 + Math.sin(time * 1.1 + 2) * 0.03;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius * 1.2;
  const colors = COLORS.fog.effects.fragility;
  
  // Фиолетовый градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `${colors.color1}${intensity * 0.5})`);
  gradient.addColorStop(0.4, `${colors.color2}${intensity})`);
  gradient.addColorStop(0.7, `${colors.color3}${intensity * 0.7})`);
  gradient.addColorStop(1, colors.color4);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Трещины
  ctx.save();
  ctx.globalAlpha = 0.03 + Math.sin(time * 0.7) * 0.02;
  ctx.strokeStyle = colors.crack;
  ctx.lineWidth = 1.5;
  
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const length = 30 + Math.random() * 60;
    const angle = Math.random() * Math.PI * 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
    
    // Ветви трещин
    for (let j = 0; j < 2; j++) {
      const branchAngle = angle + (Math.random() - 0.5) * 1.2;
      const branchLength = length * (0.3 + Math.random() * 0.4);
      const branchX = x + Math.cos(angle) * length * (0.3 + j * 0.3);
      const branchY = y + Math.sin(angle) * length * (0.3 + j * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(branchX + Math.cos(branchAngle) * branchLength, branchY + Math.sin(branchAngle) * branchLength);
      ctx.stroke();
    }
  }
  ctx.restore();
  
  // Искры
  if (Math.random() < 0.06) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.random() * 0.1;
    ctx.fillStyle = colors.spark;
    ctx.shadowBlur = 5;
    ctx.shadowColor = colors.sparkShadow;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}