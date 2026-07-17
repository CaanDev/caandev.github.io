/**
 * @fileoverview Анимация затемнения и вспышки перед появлением босса.
 * Создаёт эффект постепенного затемнения экрана и последующей яркой вспышки
 * в центре арены при появлении босса.
 * 
 * @module systems/rendering/maze/bossLightFade
 */

import { CONFIG, state } from '../../../core/config/index.js';

/** @type {number} - Кэш последнего прогресса для оптимизации */
let lastProgress = 0;
/** @type {number} - Время начала вспышки */
let flashStartTime = 0;

/**
 * Обновление анимации затемнения перед боссом
 * 
 * Вызывается каждый кадр из gameLoop.
 * Управляет затемнением и вспышкой при появлении босса.
 * 
 * @returns {void}
 */
export function updateBossLightFade() {
  if (!state.bossLightFade) return;
  
  // Если затемнение не активно и нет вспышки — выходим
  if (!state.bossLightFade.active && !state.bossLightFade.flashActive) return;
  
  // ===== ОБНОВЛЯЕМ ЗАТЕМНЕНИЕ =====
  if (state.bossLightFade.active) {
    // Прогресс затемнения (полная темнота за ~2 секунды при 60 FPS)
    state.bossLightFade.progress += 0.012;
    
    if (state.bossLightFade.progress >= 1) {
      state.bossLightFade.progress = 1;
      state.bossLightFade.active = false;
      
      // Запускаем вспышку
      state.bossLightFade.flashActive = true;
      state.bossLightFade.flashTimer = 0;
      flashStartTime = Date.now();
    }
  }
  
  // ===== ОБНОВЛЯЕМ ВСПЫШКУ =====
  if (state.bossLightFade.flashActive) {
    state.bossLightFade.flashTimer += 0.05; // ~0.3 секунды
    
    if (state.bossLightFade.flashTimer >= 1) {
      state.bossLightFade.flashActive = false;
      state.bossLightFade.flashTimer = 0;
      
      // Босс готов к бою!
      state.bossReady = true;
    }
  }
}

/**
 * Отрисовка эффекта затемнения и вспышки
 * 
 * Вспышка исходит от центра арены (где появляется босс).
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @returns {void}
 */
export function drawBossLightFade(ctx, canvas, camX, camY) {
  if (!state.bossLightFade) return;
  
  // ===== ПОЛУЧАЕМ ПОЗИЦИЮ ЦЕНТРА АРЕНЫ =====
  const arenaSize = CONFIG.bossArenaSize || 25;
  const centerWorldX = (arenaSize / 2) * CONFIG.cellSize;
  const centerWorldY = (arenaSize / 2) * CONFIG.cellSize;
  
  // Переводим в экранные координаты
  const centerScreenX = centerWorldX + camX;
  const centerScreenY = centerWorldY + camY;
  
  // ===== ЗАТЕМНЕНИЕ =====
  if (state.bossLightFade.active) {
    const progress = state.bossLightFade.progress;
    const alpha = progress * 0.85;
    
    // Затемнение экрана
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Эффект "сжатия" света по краям
    if (progress > 0.3) {
      const vignetteAlpha = (progress - 0.3) * 0.6;
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
      
      const gradient = ctx.createRadialGradient(
        centerScreenX, centerScreenY, 0,
        centerScreenX, centerScreenY, maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${vignetteAlpha * 0.3})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }
  
  // ===== ВСПЫШКА ОТ ЦЕНТРА АРЕНЫ =====
  if (state.bossLightFade.flashActive) {
    const progress = state.bossLightFade.flashTimer;
    
    // Вспышка быстро появляется и медленно затухает
    let flashAlpha;
    if (progress < 0.15) {
      // Резкое появление (0-15% времени)
      flashAlpha = progress / 0.15 * 0.9;
    } else {
      // Плавное затухание (15-100% времени)
      flashAlpha = 0.9 * (1 - (progress - 0.15) / 0.85);
    }
    
    flashAlpha = Math.max(0, Math.min(0.9, flashAlpha));
    
    // Белая вспышка с лёгким красноватым оттенком
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    
    const gradient = ctx.createRadialGradient(
      centerScreenX, centerScreenY, 0,
      centerScreenX, centerScreenY, canvas.width * 0.8
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 220, 200, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 150, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 80, 50, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Лучи от центра
    if (flashAlpha > 0.1) {
      ctx.save();
      ctx.globalAlpha = flashAlpha * 0.3;
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i + time * 0.05;
        const length = canvas.width * (0.3 + 0.3 * Math.sin(time * 0.1 + i));
        const x1 = centerScreenX;
        const y1 = centerScreenY;
        const x2 = centerScreenX + Math.cos(angle) * length;
        const y2 = centerScreenY + Math.sin(angle) * length;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3 + 3 * Math.sin(time * 0.2 + i);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

/**
 * Сброс состояния затемнения
 * 
 * @returns {void}
 */
export function resetBossLightFade() {
  if (state.bossLightFade) {
    state.bossLightFade.active = false;
    state.bossLightFade.progress = 0;
    state.bossLightFade.flashActive = false;
    state.bossLightFade.flashTimer = 0;
  }
}