/**
 * @fileoverview Общие функции для взаимодействия с объектами.
 * @module entities/player/interactions/helpers
 */

import { CONFIG, SPRITE_SIZES, player } from '../../../core/config/index.js';

/**
 * Получение мировой позиции объекта с учётом смещения спрайта
 * 
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @param {string} offsetsKey - Ключ в SPRITE_SIZES.cells.offsets
 * @returns {{x: number, y: number}} - Мировые координаты
 */
export function getObjectWorldPos(gridX, gridY, offsetsKey) {
  const offsets = SPRITE_SIZES.cells.offsets?.[offsetsKey] || { x: 0, y: 0 };
  return {
    x: gridX * CONFIG.cellSize + CONFIG.cellSize / 2 + offsets.x,
    y: gridY * CONFIG.cellSize + CONFIG.cellSize / 2 + offsets.y,
  };
}

/**
 * Проверка, находится ли игрок рядом с точкой
 * 
 * @param {number} worldX - Мировая координата X
 * @param {number} worldY - Мировая координата Y
 * @param {number} radius - Радиус взаимодействия
 * @returns {boolean} - true, если игрок в радиусе
 */
export function isPlayerNear(worldX, worldY, radius) {
  const dist = Math.hypot(player.px - worldX, player.py - worldY);
  return dist < radius;
}