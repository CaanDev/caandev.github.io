/**
 * @fileoverview Основной рендерер игрока.
 * Отрисовывает игрока с учётом свечения, статусных эффектов,
 * линии атаки и контекстных подсказок (магазин, библиотека, записки).
 * 
 * @module systems/rendering/player/playerRenderer
 */

import { state, player, CONFIG } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { playerAnimator } from '../../../sprites/index.js';
import { PLAYER_DISPLAY_SIZE } from '../../../sprites/spriteConfig.js';
import { getNoteById } from '../../../data/notes.js';
import {
  getPlayerGlowColor,
  getGlowSize,
  getLowHpGlowAlpha,
  getLowHpGlowColor,
} from './statusEffects.js';
import { drawAttackLine } from './attackRenderer.js';
import { drawAttackTrails } from './trailManager.js';
import { 
  drawShockEffect, 
  drawPoisonEffect, 
  drawFreezeEffect,
  drawShockSparks,
  drawPoisonBubbles
} from './effectRenderer.js';

export { drawAttackTrails };

/**
 * Проверка, находится ли игрок на клетке с книжными полками
 * 
 * @returns {boolean} - true, если игрок рядом с полками
 * @private
 */
function isNearBookshelf() {
  if (!state.bookshelves || state.bookshelves.length === 0) return false;
  
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  
  for (const shelf of state.bookshelves) {
    const dist = Math.hypot(playerGridX - shelf.x, playerGridY - shelf.y);
    if (dist <= 0.6) {
      return true;
    }
  }
  return false;
}

/**
 * Проверка, находится ли игрок рядом с лавкой торговца
 * 
 * @returns {boolean} - true, если игрок рядом с магазином
 * @private
 */
function isNearShop() {
  if (state.isBossLevel) return false;
  if (CONFIG.shopPos.x < 0 || CONFIG.shopPos.y < 0) return false;
  
  const shopGridX = CONFIG.shopPos.x;
  const shopGridY = CONFIG.shopPos.y;
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  
  const dist = Math.hypot(playerGridX - shopGridX, playerGridY - shopGridY);
  return dist <= 0.6;
}

/**
 * Отрисовка подсказки [E] над игроком для открытия магазина
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShopPrompt(ctx) {
  if (!isNearShop()) return;
  if (state.isShopOpen) return;
  if (player.hp <= 0) return;

  ctx.save();
  
  const text = '[E] Торговец';
  const fontSize = 16;
  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
  ctx.fillStyle = `rgba(241, 196, 15, ${0.6 + 0.3 * pulse})`;
  ctx.fillText(text, player.px, player.py - 80);
  
  ctx.restore();
}

/**
 * Основной рендеринг игрока
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPlayer(ctx) {
  // ============================================================
  // 1. ЭФФЕКТЫ ПОД СПРАЙТОМ (свечение, градиенты)
  // ============================================================
  ctx.save();
  
  // Фоновое свечение от шока (под спрайтом)
  drawShockGlow(ctx);
  // Фоновое свечение от яда (под спрайтом)
  drawPoisonGlow(ctx);
  // Фоновое свечение от заморозки (под спрайтом)
  drawFreezeGlow(ctx);
  
  ctx.restore();
  
  // ============================================================
  // 2. СПРАЙТ ИГРОКА
  // ============================================================
  ctx.save();
  
  // Определяем свечение для спрайта
  const glowColor = getPlayerGlowColor();
  const glowSize = getGlowSize();
  
  const lowHpAlpha = getLowHpGlowAlpha();
  const lowHpColor = getLowHpGlowColor();
  
  let finalGlowColor = glowColor;
  let finalGlowSize = glowSize;
  
  if (lowHpAlpha !== null && lowHpColor) {
    finalGlowColor = lowHpColor;
    finalGlowSize = Math.max(finalGlowSize, glowSize);
  }
  
  // Получаем текущий кадр анимации
  const sprite = playerAnimator.getCurrentFrame();
  
  // Отрисовка спрайта
  if (sprite && sprite.texture) {
    // Применяем свечение
    if (finalGlowColor && finalGlowSize > 0) {
      ctx.shadowBlur = finalGlowSize;
      ctx.shadowColor = finalGlowColor;
    }
    
    const displaySize = PLAYER_DISPLAY_SIZE;
    const dx = player.px - displaySize / 2;
    const dy = player.py - displaySize / 2 - 20;
    
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy, sprite.sw, sprite.sh,
      dx, dy, displaySize, displaySize
    );
  } else {
    // Fallback: эмодзи
    ctx.shadowBlur = getGlowSize();
    ctx.shadowColor = getPlayerGlowColor();
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.px, player.py - 20);
  }
  
  ctx.restore();
  
  // ============================================================
  // 3. ЭФФЕКТЫ ПОВЕРХ СПРАЙТА (молнии, пузырьки, кристаллы)
  // ============================================================
  ctx.save();
  
  // Электрические дуги и искры (поверх спрайта)
  drawShockOverlay(ctx);
  // Пузырьки яда (поверх спрайта)
  drawPoisonOverlay(ctx);
  // Кристаллы льда (поверх спрайта)
  drawFreezeOverlay(ctx);
  
  ctx.restore();
  
  // ============================================================
  // 4. ЛИНИЯ АТАКИ И ПОДСКАЗКИ
  // ============================================================
  drawAttackLine(ctx);
  drawShopPrompt(ctx);

  // Подсказка [E] для библиотеки
  if (isNearBookshelf()) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
    ctx.fillStyle = `rgba(241, 196, 15, ${0.6 + 0.3 * pulse})`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(241, 196, 15, 0.3)';
    ctx.fillText('[E] Библиотека', player.px, player.py - 80);
    ctx.restore();
  }

  // Подсказка [E] для записки
  if (state.showNotePrompt && state.notePromptId) {
    const note = getNoteById(state.notePromptId);
    if (note) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
      ctx.fillStyle = `rgba(200, 200, 100, ${0.6 + 0.3 * pulse})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(200, 200, 100, 0.3)';
      ctx.fillText('[E] Прочитать', player.px, player.py - 80);
      ctx.restore();
    }
  }

  // Подсказка [E] для интерактивных предметов
  if (state.interactiveItems.showPrompt && state.interactiveItems.nearestItem) {
    const label = state.interactiveItems.actionLabel || 'Взять';
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
    ctx.fillStyle = `rgba(155, 89, 182, ${0.6 + 0.3 * pulse})`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(155, 89, 182, 0.3)';
    ctx.fillText(`[E] ${label}`, player.px, player.py - 80);
    ctx.restore();
  }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАЗДЕЛЕНИЯ ЭФФЕКТОВ
// ============================================================

/**
 * Отрисовка свечения шока (под спрайтом)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawShockGlow(ctx) {
  if (player.shockTimer <= 0) return;
  
  const now = Date.now();
  const pulse = 0.7 + Math.sin(now * 0.02) * 0.3;
  
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 85
  );
  gradient.addColorStop(0, `rgba(255, 230, 80, ${0.5 * pulse})`);
  gradient.addColorStop(0.3, `rgba(255, 210, 50, ${0.35 * pulse})`);
  gradient.addColorStop(0.7, `rgba(200, 180, 30, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(150, 130, 20, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Отрисовка свечения яда (под спрайтом)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawPoisonGlow(ctx) {
  if (player.poisonTimer <= 0 || player.shockTimer > 0) return;
  
  const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 75
  );
  gradient.addColorStop(0, `rgba(50, 255, 100, ${0.45 * pulse})`);
  gradient.addColorStop(0.3, `rgba(30, 220, 80, ${0.35 * pulse})`);
  gradient.addColorStop(0.7, `rgba(20, 180, 60, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(10, 120, 40, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Отрисовка свечения заморозки (под спрайтом)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawFreezeGlow(ctx) {
  if (!player.isFrozen || player.freezeTimer <= 0 || player.shockTimer > 0 || player.poisonTimer > 0) return;
  
  const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.2 * pulse;
  const gradient = ctx.createRadialGradient(
    player.px, player.py, 5,
    player.px, player.py, 80
  );
  gradient.addColorStop(0, `rgba(100, 220, 255, ${0.4 * pulse})`);
  gradient.addColorStop(0.3, `rgba(80, 200, 255, ${0.3 * pulse})`);
  gradient.addColorStop(0.7, `rgba(50, 150, 255, ${0.15 * pulse})`);
  gradient.addColorStop(1, 'rgba(30, 100, 200, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.px, player.py, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Отрисовка эффектов шока поверх спрайта (молнии, искры)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawShockOverlay(ctx) {
  if (player.shockTimer <= 0) return;
  
  const now = Date.now();
  const pulse = 0.7 + Math.sin(now * 0.02) * 0.3;
  
  // ===== ЭЛЕКТРИЧЕСКИЕ ДУГИ =====
  ctx.save();
  ctx.globalAlpha = 0.6 * pulse;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255, 220, 50, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 220, 80, 0.8)';
  
  const arcCount = 3 + Math.floor(Math.sin(now * 0.003) * 1.5);
  for (let a = 0; a < arcCount; a++) {
    const baseAngle = (Math.PI * 2 / arcCount) * a + now * 0.002;
    const length = 25 + Math.sin(now * 0.005 + a * 2) * 10;
    
    ctx.beginPath();
    let x = player.px;
    let y = player.py;
    ctx.moveTo(x, y);
    
    const segments = 4 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const angle = baseAngle + Math.sin(now * 0.01 + i * 1.5 + a) * 0.8;
      const dist = length * t + Math.sin(now * 0.008 + i * 2 + a) * 4;
      x = player.px + Math.cos(angle) * dist;
      y = player.py + Math.sin(angle) * dist;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  
  // ===== ИСКРЫ ШОКА (поверх спрайта) =====
  drawShockSparks(ctx);
}

/**
 * Отрисовка эффектов яда поверх спрайта (пузырьки)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawPoisonOverlay(ctx) {
  if (player.poisonTimer <= 0) return;
  
  // Пузырьки яда (поверх спрайта)
  drawPoisonBubbles(ctx);
}

/**
 * Отрисовка эффектов заморозки поверх спрайта (кристаллы)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawFreezeOverlay(ctx) {
  if (!player.isFrozen || player.freezeTimer <= 0 || player.shockTimer > 0 || player.poisonTimer > 0) return;
  
  const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  
  // ===== КРИСТАЛЛЫ ЛЬДА =====
  ctx.save();
  ctx.globalAlpha = 0.7 * pulse;
  const crystalCount = 8;
  for (let i = 0; i < crystalCount; i++) {
    const angle = (Math.PI * 2 / crystalCount) * i + Date.now() * 0.001;
    const dist = 32 + Math.sin(Date.now() * 0.005 + i) * 6;
    const cx = player.px + Math.cos(angle) * dist;
    const cy = player.py + Math.sin(angle) * dist;
    
    const size = 2 + Math.sin(Date.now() * 0.008 + i * 2) * 1.5;
    ctx.fillStyle = i % 2 === 0 ? '#88ddff' : '#bbeeff';
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.5, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.5, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}