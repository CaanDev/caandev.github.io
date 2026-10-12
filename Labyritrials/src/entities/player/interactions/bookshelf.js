/**
 * @fileoverview Логика взаимодействия с книжной полкой.
 * @module entities/player/interactions/bookshelf
 */

import { state } from '../../../core/config/index.js';
import { INTERACTION_CONFIG } from './config.js';
import { getObjectWorldPos, isPlayerNear } from './helpers.js';

/**
 * Проверка, находится ли игрок рядом с полкой
 * 
 * @returns {boolean} - true, если игрок рядом с полкой
 */
export function isNearBookshelf() {
  if (!state.bookshelves || state.bookshelves.length === 0) return false;
  
  const config = INTERACTION_CONFIG.bookshelf;
  for (const shelf of state.bookshelves) {
    const pos = getObjectWorldPos(shelf.x, shelf.y, config.offsetsKey);
    if (isPlayerNear(pos.x, pos.y, config.radius)) return true;
  }
  return false;
}

/**
 * Обработка нажатия E на полке
 * 
 * @returns {Promise<boolean>} - true, если взаимодействие выполнено
 */
export async function interactWithBookshelf() {
  if (!isNearBookshelf()) return false;
  
  const { openBookshelf } = await import('../../../systems/ui/bookshelfUI.js');
  openBookshelf();
  return true;
}