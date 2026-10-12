/**
 * @fileoverview Рендерер книжных полок.
 * @module systems/rendering/interactions/bookshelfRenderer
 */

import { CONFIG, getCellBasedSize } from '../../../core/config/index.js';
import { getObjectSpritePosition } from './helpers.js';

/**
 * Отрисовка книжного шкафа
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @returns {void}
 */
export function drawBookshelf(ctx, dx, dy, gridX, gridY) {
  const spriteName = 'objBookshelf';
  const spriteSize = getCellBasedSize('bookshelf', CONFIG.cellSize);
  const { sprite, dx: drawX, dy: drawY } = getObjectSpritePosition(
    spriteName, 'bookshelf', spriteSize, dx, dy
  );
  
  if (sprite) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      drawX, drawY,
      sprite.drawW, sprite.drawH
    );
    ctx.restore();
    return;
  }
  
  // Fallback: если спрайт не загрузился
  drawFallbackBookshelf(ctx, dx, dy);
}

/**
 * Fallback-отрисовка книжной полки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X клетки
 * @param {number} dy - Координата Y клетки
 * @returns {void}
 * @private
 */
function drawFallbackBookshelf(ctx, dx, dy) {
  const cellSize = CONFIG.cellSize;
  const centerX = dx + cellSize / 2;
  const centerY = dy + cellSize / 2;
  const size = 160;
  
  ctx.save();
  ctx.fillStyle = 'rgba(20, 15, 10, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(dx + 8, dy + 8, size, size, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '36px Arial';
  ctx.fillStyle = '#d4c8a0';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText('📚', centerX, centerY);
  ctx.restore();
}