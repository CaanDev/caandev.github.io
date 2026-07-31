/**
 * @fileoverview Рендерер книжных полок.
 * Отрисовывает книжные шкафы в безопасной комнате с использованием изображения или эмодзи.
 * 
 * @module systems/rendering/maze/walls/bookshelfRenderer
 */

import { CONFIG } from '../../../../core/config/index.js';
import { getImage, isImageLoaded } from '../../../../utils/imageLoader.js';

/**
 * Отрисовка книжного шкафа (с использованием изображения)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке (для генерации seed)
 * @param {number} gridY - Координата Y в сетке (для генерации seed)
 * @returns {void}
 */
export function drawBookshelf(ctx, dx, dy, gridX, gridY) {
  const imageKey = 'bookshelf';
  
  if (isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      const cellSize = CONFIG.cellSize;
      const padding = 8;
      const size = cellSize - padding * 2;
      
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.drawImage(img, dx + padding, dy + padding, size, size);
      ctx.restore();
      return;
    }
  }
  
  // Fallback: если изображение не загрузилось — рисуем эмодзи
  drawBookshelfFallback(ctx, dx, dy, gridX, gridY);
}

/**
 * Fallback-отрисовка книжного шкафа (когда изображение не загружено)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @returns {void}
 * @private
 */
function drawBookshelfFallback(ctx, dx, dy, gridX, gridY) {
  const cellSize = CONFIG.cellSize;
  const centerX = dx + cellSize / 2;
  const centerY = dy + cellSize / 2;
  
  // Фон для контраста
  ctx.save();
  ctx.fillStyle = 'rgba(20, 15, 10, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(dx + 8, dy + 8, cellSize - 16, cellSize - 16, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  
  // Эмодзи книг
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