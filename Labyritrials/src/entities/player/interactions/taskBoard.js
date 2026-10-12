/**
 * @fileoverview Логика взаимодействия с доской заданий.
 * @module entities/player/interactions/taskBoard
 */

import { state } from '../../../core/config/index.js';
import { INTERACTION_CONFIG } from './config.js';
import { getObjectWorldPos, isPlayerNear } from './helpers.js';

/**
 * Проверка, находится ли игрок рядом с доской заданий
 * 
 * @returns {boolean} - true, если игрок рядом с доской
 */
export function isNearTaskBoard() {
  if (!state.taskBoards || state.taskBoards.length === 0) return false;
  
  const config = INTERACTION_CONFIG.taskBoard;
  for (const board of state.taskBoards) {
    const pos = getObjectWorldPos(board.x, board.y, config.offsetsKey);
    if (isPlayerNear(pos.x, pos.y, config.radius)) return true;
  }
  return false;
}

/**
 * Обработка нажатия E на доске заданий
 * 
 * @returns {Promise<boolean>} - true, если взаимодействие выполнено
 */
export async function interactWithTaskBoard() {
  if (!isNearTaskBoard()) return false;
  
  const { openTaskBoard } = await import('../../../systems/ui/taskBoardUI.js');
  openTaskBoard();
  return true;
}