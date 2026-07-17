/**
 * @fileoverview Рендерер алтарей (святилищ).
 * Отрисовывает алтари в зависимости от их состояния (активирован/не активирован).
 * 
 * @module systems/rendering/shrineRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';

/**
 * Отрисовка всех алтарей
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShrines(ctx) {
  if (!state.shrines) return;
  
  for (let sh of state.shrines) {
    let sx = Math.floor(sh.x / CONFIG.cellSize);
    let sy = Math.floor(sh.y / CONFIG.cellSize);
    
    // Проверка видимости клетки
    if (!state.grid[sy] || !state.grid[sy][sx]) continue;
    if (!state.grid[sy][sx].revealed && !player.hasMap) continue;
    
    ctx.save();
    
    // Свечение для неактивного алтаря
    if (!sh.activated) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = COLORS.shrines.inactive;
    }
    
    // Отрисовка эмодзи алтаря
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '46px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sh.activated ? EMOJIS.shrines.active : EMOJIS.shrines.inactive, sh.x, sh.y);
    
    ctx.restore();
  }
}