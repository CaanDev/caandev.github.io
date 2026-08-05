/**
 * @fileoverview Рендерер алтарей (святилищ).
 * Отрисовывает алтари в зависимости от их состояния (активирован/не активирован).
 * 
 * @module systems/rendering/shrineRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { OBJECT_IMAGES, getAltarImage, getAltarBiome } from '../../images/objectImages.js';

/**
 * Отрисовка всех алтарей
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShrines(ctx) {
  if (!state.shrines) return;
  
  // Определяем биом для алтарей
  const biome = getAltarBiome(state);
  
  for (let sh of state.shrines) {
    let sx = Math.floor(sh.x / CONFIG.cellSize);
    let sy = Math.floor(sh.y / CONFIG.cellSize);
    
    // Проверка видимости клетки
    if (!state.grid[sy] || !state.grid[sy][sx]) continue;
    if (!state.grid[sy][sx].revealed && !player.hasMap) continue;
    
    // Получаем путь к изображению
    const imagePath = getAltarImage(biome, sh.activated);
    const cacheKey = Object.keys(OBJECT_IMAGES).find(key => OBJECT_IMAGES[key] === imagePath);
    
    ctx.save();
    
    // ===== ИЗОБРАЖЕНИЕ АЛТАРЯ =====
    if (cacheKey && isImageLoaded(cacheKey)) {
      const img = getImage(cacheKey);
      if (img) {
        const size = 180;
        // Небольшое свечение для неактивного алтаря
        if (!sh.activated) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = 'rgba(155, 89, 182, 0.5)';
        }
        ctx.drawImage(img, sh.x - size/2, sh.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    // ===== FALLBACK: Эмодзи =====
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