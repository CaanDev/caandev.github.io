/**
 * @fileoverview Рендерер ловушек.
 * Отрисовывает все ловушки на карте с использованием изображений.
 * 
 * @module systems/rendering/trapRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded, forceLoadImages } from '../../utils/imageLoader.js';
import { TRAP_IMAGES, getTrapImage } from '../../images/objectImages.js';
import { logger } from '../../utils/logger.js';

/** @type {boolean} - Флаг, загружены ли изображения ловушек */
let trapsImagesLoaded = false;

/**
 * Принудительная загрузка изображений ловушек
 * 
 * @returns {Promise<void>}
 */
async function ensureTrapsImagesLoaded() {
  if (trapsImagesLoaded) return;
  
  try {
    await forceLoadImages(TRAP_IMAGES);
    trapsImagesLoaded = true;
  } catch (e) {
    logger.warn('⚠️ Не удалось загрузить изображения ловушек:', e);
  }
}

/**
 * Отрисовка всех ловушек
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTraps(ctx) {
  // Гарантируем загрузку изображений при первом вызове
  if (!trapsImagesLoaded) {
    ensureTrapsImagesLoaded();
    // Продолжаем отрисовку с fallback, пока изображения не загрузятся
  }
  
  for (let t of state.traps) {
    const tx = Math.floor(t.x / CONFIG.cellSize);
    const ty = Math.floor(t.y / CONFIG.cellSize);
    
    if (!state.grid[ty]?.[tx]) continue;
    if (!state.grid[ty][tx].revealed && !player.hasMap) continue;
    
    const trapType = t.type || 'explosion';
    const imagePath = getTrapImage(trapType);
    
    // Находим ключ в TRAP_IMAGES
    let cacheKey = null;
    for (const [key, path] of Object.entries(TRAP_IMAGES)) {
      if (path === imagePath) {
        cacheKey = key;
        break;
      }
    }
    
    // Прямой доступ к изображению из кэша
    const img = getImage(cacheKey);
    
    if (img && img.complete && img.naturalWidth > 0) {
      const size = 38;
      
      // Яркость: 10% если не сработала, 100% если сработала
      const alpha = t.hasDealtDamage ? 1.0 : 0.10;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, t.x - size/2, t.y - size/2, size, size);
      ctx.restore();
      continue;
    }
    
    // Fallback: эмодзи (если изображение не загружено)
    let emoji = EMOJIS.traps.explosion;
    if (t.type === 'ice') emoji = EMOJIS.traps.ice;
    else if (t.type === 'acid') emoji = EMOJIS.traps.acid;
    else if (t.type === 'lightning') emoji = EMOJIS.traps.lightning;
    else if (t.type === 'psionic') emoji = EMOJIS.traps.psionic;
    
    const alpha = t.hasDealtDamage ? 1.0 : 0.10;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, t.x, t.y);
    ctx.restore();
  }
}

// Экспортируем функцию для принудительной загрузки
export { ensureTrapsImagesLoaded };