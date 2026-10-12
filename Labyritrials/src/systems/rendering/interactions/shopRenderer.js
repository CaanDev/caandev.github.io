/**
 * @fileoverview Рендерер лавки торговца.
 * @module systems/rendering/interactions/shopRenderer
 */

import { CONFIG, state, player, getCellBasedSize } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { EMOJIS } from '../../../emojis.js';
import { getDistanceVisibility } from '../../fog/index.js';
import { getSpriteWithSize } from '../../../sprites/index.js';
import { drawTraderQuestIndicator } from '../npcIndicator.js';
import { getObjectSpritePosition } from './helpers.js';

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
  
  const spriteName = 'objShopStand';
  const spriteSize = getCellBasedSize('shop', CONFIG.cellSize);
  const cellX = shopX * CONFIG.cellSize;
  const cellY = shopY * CONFIG.cellSize;
  
  const { sprite, dx, dy } = getObjectSpritePosition(spriteName, 'shop', spriteSize, cellX, cellY);
  
  if (sprite) {
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
  } else {
    // Fallback: если спрайт не загрузился
    drawFallbackShop(ctx, cellX, cellY, shopCenterX, shopCenterY, visibility);
  }

  // Индикатор задания
  drawTraderQuestIndicator(ctx);
}

/**
 * Fallback-отрисовка лавки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} cellX - Координата X клетки
 * @param {number} cellY - Координата Y клетки
 * @param {number} shopCenterX - Центр лавки по X
 * @param {number} shopCenterY - Центр лавки по Y
 * @param {number} visibility - Видимость
 * @returns {void}
 * @private
 */
function drawFallbackShop(ctx, cellX, cellY, shopCenterX, shopCenterY, visibility) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
  
  ctx.beginPath();
  ctx.roundRect(cellX + 15, cellY + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
  ctx.fillStyle = COLORS.ui.shop.bg;
  ctx.fill();
  
  ctx.beginPath();
  ctx.roundRect(cellX + 15, cellY + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
  ctx.strokeStyle = COLORS.ui.shop.border;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.globalAlpha = 1.0;
  ctx.restore();
  
  ctx.save();
  ctx.globalAlpha = Math.min(1, visibility * 0.8 + 0.1);
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = '44px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJIS.items.shop, shopCenterX, shopCenterY);
  ctx.restore();
}