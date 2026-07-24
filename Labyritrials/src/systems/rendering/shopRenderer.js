/**
 * @fileoverview Рендерер магазина (лавки торговца).
 * Отрисовывает лавку на игровом поле.
 * 
 * @module systems/rendering/shopRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { getDistanceVisibility } from '../fog/index.js';

/**
 * Отрисовка магазина
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShop(ctx) {
  if (!state.grid || !CONFIG.shopPos) return;
  
  const shopX = CONFIG.shopPos.x;
  const shopY = CONFIG.shopPos.y;
  
  if (shopX < 0 || shopY < 0) return;
  if (shopY >= CONFIG.rows || shopX >= CONFIG.cols) return;
  
  const cell = state.grid[shopY]?.[shopX];
  if (!cell || cell.isWall) return;
  if (!cell.revealed && !player.hasMap) return;
  
  const sdx = shopX * CONFIG.cellSize;
  const sdy = shopY * CONFIG.cellSize;
  const shopCenterX = sdx + CONFIG.cellSize / 2;
  const shopCenterY = sdy + CONFIG.cellSize / 2;
  
  let visibility = 1.0;
  if (!state.inSafeRoom) {
    visibility = getDistanceVisibility(shopCenterX, shopCenterY);
    if (visibility <= 0.05) return;
  }
  
  // Изображение
  const imageKey = 'shopStand';
  if (isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      const size = 110;
      ctx.save();
      ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
      ctx.drawImage(img, shopCenterX - size / 2, shopCenterY - size / 2, size, size);
      ctx.restore();
      return;
    }
  }
  
  // Fallback: старая отрисовка
  ctx.save();
  ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
  
  // Фон лавки
  ctx.beginPath();
  ctx.roundRect(sdx + 15, sdy + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
  ctx.fillStyle = COLORS.ui.shop.bg;
  ctx.fill();
  
  // Рамка лавки
  ctx.beginPath();
  ctx.roundRect(sdx + 15, sdy + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
  ctx.strokeStyle = COLORS.ui.shop.border;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.globalAlpha = 1.0;
  ctx.restore();
  
  // Иконка магазина (эмодзи)
  ctx.save();
  ctx.globalAlpha = Math.min(1, visibility * 0.8 + 0.1);
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJIS.items.shop, shopCenterX, shopCenterY);
  ctx.restore();
}