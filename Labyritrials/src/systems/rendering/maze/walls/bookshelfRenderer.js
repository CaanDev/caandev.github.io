/**
 * @fileoverview Рендерер книжных полок.
 * Отрисовывает книжные шкафы в безопасной комнате с использованием изображения или эмодзи.
 * 
 * @module systems/rendering/maze/walls/bookshelfRenderer
 */

import { CONFIG } from '../../../../core/config/index.js';
import { getSpriteWithSize } from '../../../../sprites/index.js';

/**
 * Отрисовка книжного шкафа
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке (для генерации seed)
 * @param {number} gridY - Координата Y в сетке (для генерации seed)
 * @returns {void}
 */
export function drawBookshelf(ctx, dx, dy, gridX, gridY) {
  // Спрайт из атласа
  const spriteName = 'objBookshelf';
  const spriteSize = CONFIG.cellSize * 0.85;
  const sprite = getSpriteWithSize(spriteName, spriteSize);
  
  if (sprite) {
    const offsetX = (CONFIG.cellSize - sprite.drawW) / 2;
    const offsetY = (CONFIG.cellSize - sprite.drawH) / 2 + 4;
    const drawX = dx + offsetX;
    const drawY = dy + offsetY;
    
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