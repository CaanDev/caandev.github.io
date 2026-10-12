/**
 * @fileoverview Вспомогательные функции для рендера интерактивных объектов.
 * @module systems/rendering/interactions/helpers
 */

import { CONFIG, SPRITE_SIZES } from '../../../core/config/index.js';
import { getSpriteWithSize } from '../../../sprites/index.js';

/**
 * Получение спрайта объекта с учётом смещения
 * 
 * @param {string} spriteName - Имя спрайта в атласе
 * @param {string} offsetsKey - Ключ в SPRITE_SIZES.cells.offsets
 * @param {number} spriteSize - Размер спрайта
 * @param {number} cellX - Координата X клетки (в пикселях)
 * @param {number} cellY - Координата Y клетки (в пикселях)
 * @returns {{sprite: Object|null, dx: number, dy: number}}
 */
export function getObjectSpritePosition(spriteName, offsetsKey, spriteSize, cellX, cellY) {
  const sprite = getSpriteWithSize(spriteName, spriteSize);
  if (!sprite) return { sprite: null, dx: 0, dy: 0 };
  
  const offsets = SPRITE_SIZES.cells.offsets?.[offsetsKey] || { x: 0, y: 0 };
  const offsetX = (CONFIG.cellSize - sprite.drawW) / 2 + offsets.x;
  const offsetY = (CONFIG.cellSize - sprite.drawH) / 2 + offsets.y;
  
  return {
    sprite,
    dx: cellX + offsetX,
    dy: cellY + offsetY,
  };
}