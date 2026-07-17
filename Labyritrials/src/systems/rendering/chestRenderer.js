/**
 * @fileoverview Рендерер предметов, сундуков и мух.
 * Отрисовывает лут на полу, сундуки разных типов и мух над мимиками.
 * 
 * @module systems/rendering/chestRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';

/**
 * Отрисовка предметов на полу (золото и зелья)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawLoot(ctx) {
  // Золото и зелья
  for (let item of state.lootItems) {
    let ix = Math.floor(item.x / CONFIG.cellSize);
    let iy = Math.floor(item.y / CONFIG.cellSize);
    if (!state.grid[iy] || !state.grid[iy][ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (item.type === 'gold') ctx.fillText(EMOJIS.items.gold, item.x, item.y);
    else if (item.type === 'potion') ctx.fillText(EMOJIS.items.potion, item.x, item.y);
  }
  
  // Артефакты
  for (let art of state.artifacts) {
    let ax = Math.floor(art.x / CONFIG.cellSize);
    let ay = Math.floor(art.y / CONFIG.cellSize);
    if (!state.grid[ay] || !state.grid[ay][ax]) continue;
    if (!state.grid[ay][ax].revealed && !player.hasMap) continue;
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.artifact, art.x, art.y);
  }
}

/**
 * Отрисовка всех сундуков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawChests(ctx) {
  if (!state.chests) return;
  
  for (let ch of state.chests) {
    let cx = Math.floor(ch.x / CONFIG.cellSize);
    let cy = Math.floor(ch.y / CONFIG.cellSize);
    
    if (!state.grid[cy] || !state.grid[cy][cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (!ch.opened) {
      // Закрытый сундук
      ctx.fillText(EMOJIS.items.chestClosed, ch.x, ch.y);
    } else {
      // Открытый сундук — отображаем содержимое
      if (ch.type === 'gold') {
        ctx.fillText(EMOJIS.items.chestGold, ch.x, ch.y - 10);
      } else if (ch.type === 'artifact') {
        ctx.fillText(EMOJIS.items.chestArtifact, ch.x, ch.y - 10);
      } else if (ch.type === 'potion_chest') {
        ctx.fillText(EMOJIS.items.potion, ch.x, ch.y - 10);
      } else if (ch.type === 'mimic') {
        ctx.font = '42px Arial';
        ctx.fillText(EMOJIS.items.chestMimic, ch.x, ch.y);
      } else if (ch.type === 'empty') {
        ctx.fillStyle = COLORS.ui.textDark;
        ctx.font = '30px Arial';
        ctx.fillText('📦', ch.x, ch.y);
      }
    }
  }
}

/**
 * Отрисовка мух над сундуками-мимиками
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawFlies(ctx) {
  if (!state.flies || state.flies.length === 0) return;
  
  for (let fly of state.flies) {
    // Анимация мерцания
    fly.flickerPhase = (fly.flickerPhase || 0) + 0.1;
    const flicker = 0.7 + Math.sin(fly.flickerPhase) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = 0.7 * flicker;
    ctx.shadowBlur = 2;
    ctx.shadowColor = COLORS.shadows.strong;
    
    // Тело мухи
    ctx.font = `${12 + fly.size * 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#222222';
    ctx.fillText('•', fly.x, fly.y);
    
    // Крылья
    ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * flicker})`;
    ctx.font = `${8 + fly.size * 3}px Arial`;
    ctx.fillText('⚬', fly.x - 5, fly.y - 3);
    ctx.fillText('⚬', fly.x + 5, fly.y - 3);
    
    ctx.restore();
  }
}