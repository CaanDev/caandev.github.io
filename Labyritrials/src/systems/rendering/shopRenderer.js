/**
 * @fileoverview Рендерер магазина (лавки торговца).
 * Отрисовывает лавку на игровом поле.
 * 
 * @module systems/rendering/shopRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { SPRITE_SIZES, getCellBasedSize } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getDistanceVisibility } from '../fog/index.js';
import { getSpriteWithSize } from '../../sprites/index.js';

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
  
  const shopCenterX = shopX * CONFIG.cellSize + CONFIG.cellSize / 2;
  const shopCenterY = shopY * CONFIG.cellSize + CONFIG.cellSize / 2;
  
  let visibility = 1.0;
  if (!state.inSafeRoom) {
    visibility = getDistanceVisibility(shopCenterX, shopCenterY);
    if (visibility <= 0.05) return;
  }
  
  // Спрайт из атласа
  const spriteName = 'objShopStand';
  const spriteSize = getCellBasedSize('shop', CONFIG.cellSize);
  const sprite = getSpriteWithSize(spriteName, spriteSize);
  
  if (sprite) {
    const offsetX = (CONFIG.cellSize - sprite.drawW) / 2;
    const offsetY = (CONFIG.cellSize - sprite.drawH) / 2 + 4;
    const dx = shopX * CONFIG.cellSize + offsetX;
    const dy = shopY * CONFIG.cellSize + offsetY;
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      dx, dy,
      sprite.drawW, sprite.drawH
    );
    ctx.restore();
    return;
  }
  
  // Fallback: если спрайт не загрузился
  const sdx = shopX * CONFIG.cellSize;
  const sdy = shopY * CONFIG.cellSize;
  
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
  ctx.font = '44px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJIS.items.shop, shopCenterX, shopCenterY);
  ctx.restore();
}