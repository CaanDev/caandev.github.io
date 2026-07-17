/**
 * @fileoverview Рендерер ловушек.
 * Отрисовывает все ловушки на карте с учётом их состояния (активна/неактивна)
 * и типа (взрывная, ледяная, кислотная, электрическая, псионическая).
 * 
 * @module systems/rendering/trapRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';

/**
 * Отрисовка всех ловушек
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTraps(ctx) {
  for (let t of state.traps) {
    let tx = Math.floor(t.x / CONFIG.cellSize);
    let ty = Math.floor(t.y / CONFIG.cellSize);
    
    // Проверка видимости клетки
    if (!state.grid[ty] || !state.grid[ty][tx]) continue;
    if (!state.grid[ty][tx].revealed && !player.hasMap) continue;
    
    // Получение цветов для типа ловушки
    let trapColors;
    const trapType = t.type || 'spike';
    
    if (COLORS.traps && COLORS.traps[trapType]) {
      trapColors = COLORS.traps[trapType];
    } else {
      trapColors = {
        bg: '#0f1116',
        border: '#13181f',
        active: '#e74c3c',
        activeBorder: '#c0392b'
      };
    }
    
    // Фон ловушки
    if (t.triggered) {
      ctx.fillStyle = trapColors.active || '#e74c3c';
    } else {
      ctx.fillStyle = trapColors.bg || '#0f1116';
    }
    
    ctx.fillRect(t.x - 15, t.y - 15, 30, 30);
    
    // Рамка ловушки
    const strokeColor = t.triggered 
      ? (trapColors.activeBorder || '#c0392b') 
      : (trapColors.border || '#13181f');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(t.x - 15, t.y - 15, 30, 30);
    
    // Иконка для активированной ловушки
    if (t.triggered) {
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let emoji = EMOJIS.traps.spike;
      if (t.type === 'ice') emoji = EMOJIS.traps.ice;
      else if (t.type === 'acid') emoji = EMOJIS.traps.acid;
      else if (t.type === 'lightning') emoji = EMOJIS.traps.lightning;
      else if (t.type === 'psionic') emoji = EMOJIS.traps.psionic;
      
      ctx.fillText(emoji, t.x, t.y);
    }
  }
}