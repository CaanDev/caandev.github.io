/**
 * @fileoverview Рендерер ловушек.
 * Отрисовывает все ловушки с использованием спрайтов из атласов.
 * 
 * @module systems/rendering/trapRenderer
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getSpriteWithSize } from '../../sprites/index.js';

/** @type {number} - Размер отображения ловушки */
const TRAP_DISPLAY_SIZE = SPRITE_SIZES.objects.trap;

/**
 * Получение имени спрайта ловушки по типу
 * 
 * @param {string} trapType - Тип ловушки
 * @returns {string|null} - Имя спрайта или null
 */
function getTrapSpriteName(trapType) {
  const nameMap = {
    'explosion': 'trapExplosion',
    'ice': 'trapIce',
    'acid': 'trapAcid',
    'psionic': 'trapPsionic',
    'lightning': 'trapLightning'
  };
  
  return nameMap[trapType] || 'trapExplosion';
}

/**
 * Отрисовка всех ловушек
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTraps(ctx) {
  for (let t of state.traps) {
    const tx = Math.floor(t.x / CONFIG.cellSize);
    const ty = Math.floor(t.y / CONFIG.cellSize);
    
    if (!state.grid[ty]?.[tx]) continue;
    if (!state.grid[ty][tx].revealed && !player.hasMap) continue;
    
    const trapType = t.type || 'explosion';
    const spriteName = getTrapSpriteName(trapType);
    const sprite = spriteName ? getSpriteWithSize(spriteName, TRAP_DISPLAY_SIZE) : null;
    
    if (sprite) {
      // Определение прозрачности
      let alpha = t.hasDealtDamage ? 1.0 : (trapType === 'ice' ? 0.80 : 0.35);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        t.x - TRAP_DISPLAY_SIZE/2 + sprite.offsetX,
        t.y - TRAP_DISPLAY_SIZE/2 + sprite.offsetY,
        sprite.drawW, sprite.drawH
      );
      
      ctx.restore();
      continue;
    }
    
    // Fallback: эмодзи (если спрайт не загрузился)
    const emojiMap = {
      'explosion': EMOJIS.traps.explosion,
      'ice': EMOJIS.traps.ice,
      'acid': EMOJIS.traps.acid,
      'lightning': EMOJIS.traps.lightning,
      'psionic': EMOJIS.traps.psionic
    };
    
    const emoji = emojiMap[trapType] || EMOJIS.traps.explosion;
    let alpha = t.hasDealtDamage ? 1.0 : (trapType === 'ice' ? 0.80 : 0.35);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, t.x, t.y);
    ctx.restore();
  }
}