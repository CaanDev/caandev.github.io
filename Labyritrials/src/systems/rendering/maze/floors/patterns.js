/**
 * @fileoverview Узоры для отрисовки пола.
 * Содержит функции для рисования однотонного и шахматного пола.
 * 
 * @module systems/rendering/maze/floors/patterns
 */

import { CONFIG, state } from '../../../../core/config/index.js';
import { getFloorImageForCell, getBiomeForFloor } from '../../../../images/floorImages.js';
import { getImage, isImageLoaded } from '../../../../utils/imageLoader.js';

/**
 * Отрисовка однотонного пола
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} minX - Минимальная координата X в сетке
 * @param {number} maxX - Максимальная координата X в сетке
 * @param {number} minY - Минимальная координата Y в сетке
 * @param {number} maxY - Максимальная координата Y в сетке
 * @param {Array<Array<Object>>} grid - Двумерный массив клеток
 * @param {Object} player - Объект игрока
 * @param {string} color - Цвет заливки
 * @param {string} biome - ID биома
 * @param {number} seed - Seed для детерминированного выбора
 * @param {boolean} isBossLevel - Является ли уровень босс-уровнем
 * @returns {void}
 */
export function drawSolidFloor(ctx, minX, maxX, minY, maxY, grid, player, color, biome, seed, isBossLevel = false) {
  const cellSize = CONFIG.cellSize;
  const isSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  const useFloorImages = !isSecretRoom && !isBossLevel;

  // ===== ОПРЕДЕЛЯЕМ ЯРКОСТЬ ДЛЯ БИОМА =====
  let imageAlpha = 1.0; // по умолчанию 100%
  
  switch (biome) {
    case 'ice':
      imageAlpha = 0.6; // 60%
      break;
    case 'sand':
      imageAlpha = 0.4; // 40%
      break;
    case 'cave':
    default:
      imageAlpha = 1.0; // 100%
      break;
  }
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = grid[y]?.[x];
      if (!cell) continue;
      if (!cell.revealed && !player.hasMap) continue;
      if (cell.isWall) continue;
      
      const dx = x * cellSize;
      const dy = y * cellSize;
      
      ctx.fillStyle = color;
      ctx.fillRect(dx, dy, cellSize, cellSize);

      if (!useFloorImages) continue;
      
      const imageKey = getFloorImageForCell(x, y, biome, seed);
      
      if (isImageLoaded(imageKey)) {
        const img = getImage(imageKey);
        if (img) {
          // ===== ПРИМЕНЯЕМ ЯРКОСТЬ В ЗАВИСИМОСТИ ОТ БИОМА =====
          if (imageAlpha < 1.0) {
            ctx.save();
            ctx.globalAlpha = imageAlpha;
            ctx.drawImage(img, dx, dy, cellSize, cellSize);
            ctx.restore();
          } else {
            ctx.drawImage(img, dx, dy, cellSize, cellSize);
          }
        }
      }
    }
  }
}

/**
 * Отрисовка шахматного пола
 * 
 * Каждая клетка разбивается на 3x3 плитки с чередованием цветов.
 * Изображения не используются для шахматного пола (только цвет).
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} minX - Минимальная координата X в сетке
 * @param {number} maxX - Максимальная координата X в сетке
 * @param {number} minY - Минимальная координата Y в сетке
 * @param {number} maxY - Максимальная координата Y в сетке
 * @param {Array<Array<Object>>} grid - Двумерный массив клеток
 * @param {Object} player - Объект игрока
 * @param {string[]} colors - Массив из двух цветов
 * @returns {void}
 */
export function drawCheckeredFloor(ctx, minX, maxX, minY, maxY, grid, player, colors) {
  const cellSize = CONFIG.cellSize;
  const tileSize = cellSize / 3;
  const color1 = colors[0];
  const color2 = colors[1];
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = grid[y]?.[x];
      if (!cell) continue;
      if (!cell.revealed) continue;
      if (cell.isWall) continue;
      
      const dx = x * cellSize;
      const dy = y * cellSize;
      
      // 3x3 плитки в одной клетке
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const isEven = (x + y + col + row) % 2 === 0;
          ctx.fillStyle = isEven ? color1 : color2;
          ctx.fillRect(
            dx + col * tileSize,
            dy + row * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    }
  }
}