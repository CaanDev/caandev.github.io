/**
 * @fileoverview Узоры для отрисовки пола.
 * Содержит функции для рисования однотонного и шахматного пола.
 * 
 * @module systems/rendering/maze/floors/patterns
 */

import { CONFIG } from '../../../../core/config/index.js';

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
 * @returns {void}
 */
export function drawSolidFloor(ctx, minX, maxX, minY, maxY, grid, player, color) {
  const cellSize = CONFIG.cellSize;
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = grid[y]?.[x];
      if (!cell) continue;
      if (!cell.revealed && !player.hasMap) continue;
      if (cell.isWall) continue;
      
      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

/**
 * Отрисовка шахматного пола
 * 
 * Каждая клетка разбивается на 3x3 плитки с чередованием цветов.
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