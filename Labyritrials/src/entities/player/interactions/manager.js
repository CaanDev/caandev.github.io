/**
 * @fileoverview Координатор интерактивных объектов.
 * @module entities/player/interactions/manager
 */

import { state } from '../../../core/config/index.js';
import { isNearShop, updateShopPrompt, interactWithShop } from './shop.js';
import { isNearBookshelf, interactWithBookshelf } from './bookshelf.js';
import { isNearTaskBoard, interactWithTaskBoard } from './taskBoard.js';

/**
 * Обновление всех подсказок взаимодействия
 * Вызывается каждый кадр из updatePlayer()
 * 
 * @returns {void}
 */
export function updateInteractionPrompts() {
  updateShopPrompt();
}

/**
 * Обработка нажатия E — приоритетный список взаимодействий.
 * 
 * @returns {Promise<boolean>} - true, если взаимодействие выполнено
 */
export async function handleInteraction() {
  // Приоритет 1: интерактивные предметы на полу
  if (state.interactiveItems.showPrompt && state.interactiveItems.nearestItem) {
    const { pickupInteractiveItem } = await import('../interaction.js');
    pickupInteractiveItem();
    return true;
  }

  // Приоритет 2: пленение оглушённого огонька
  const { canCatchWisp, tryCatchWisp } = await import('./spiritCatcher.js');
  if (canCatchWisp()) {
    const success = tryCatchWisp();
    if (success) return true;
  }

  // Приоритет 3: записки
  if (state.showNotePrompt && state.notePromptId) {
    const { openNoteWindow } = await import('../../../systems/input/keyboard.js');
    openNoteWindow(state.notePromptId);
    return true;
  }

  // Приоритет 4: NPC-исследовательница
  const npcModule = await import('../../npc/index.js');
  if (npcModule.isNearResearcher()) {
    const { interactWithResearcher } = await import('../../../systems/dialogs/npcInteraction.js');
    const handled = await interactWithResearcher();
    if (handled) return true;
  }

  // Приоритет 5: книжная полка
  if (isNearBookshelf()) return await interactWithBookshelf();
  // Приоритет 6: доска заданий
  if (isNearTaskBoard()) return await interactWithTaskBoard();
  // Приоритет 7: лавка торговца
  if (isNearShop()) return await interactWithShop();

  return false;
}