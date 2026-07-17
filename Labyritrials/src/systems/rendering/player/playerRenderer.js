/**
 * @fileoverview Основной рендерер игрока.
 * Отрисовывает игрока с учётом свечения, статусных эффектов,
 * линии атаки и контекстных подсказок (магазин, библиотека, записки).
 * 
 * @module systems/rendering/player/playerRenderer
 */

import { state, player, CONFIG } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { getNoteById } from '../../../data/notes.js';
import {
  getPlayerGlowColor,
  getGlowSize,
  getLowHpGlowAlpha,
  getLowHpGlowColor,
  isPlayerGlowing
} from './statusEffects.js';
import { drawAttackLine } from './attackRenderer.js';
import { drawAttackTrails } from './trailManager.js';
import { drawShockEffect, drawPoisonEffect, drawFreezeEffect } from './effectRenderer.js';

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
  ctx.fillText(text, player.px, player.py - 50);
  
  ctx.restore();
}

/**
 * Основной рендеринг игрока
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPlayer(ctx) {
  ctx.save();
  
  // ===== ОПРЕДЕЛЕНИЕ СВЕЧЕНИЯ =====
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
  
  ctx.shadowBlur = finalGlowSize;
  ctx.shadowColor = finalGlowColor;
  
  // ===== ОТРИСОВКА ИГРОКА =====
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = '42px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.emoji, player.px, player.py);
  
  // ===== СТАТУСНЫЕ ЭФФЕКТЫ =====
  drawShockEffect(ctx);
  drawPoisonEffect(ctx);
  drawFreezeEffect(ctx);
  
  ctx.restore();
  
  // ===== ЛИНИЯ АТАКИ =====
  drawAttackLine(ctx);
  
  // ===== ПОДСКАЗКА [E] ДЛЯ МАГАЗИНА =====
  drawShopPrompt(ctx);

  // ===== ПОДСКАЗКА [E] ДЛЯ БИБЛИОТЕКИ =====
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
    ctx.fillText('[E] Открыть библиотеку', player.px, player.py - 65);
    ctx.restore();
  }

  // ===== ПОДСКАЗКА [E] ДЛЯ ЗАПИСКИ =====
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
      ctx.fillText('[E] Прочитать', player.px, player.py - 65);
      ctx.restore();
    }
  }
}