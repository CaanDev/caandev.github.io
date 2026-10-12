/**
 * @fileoverview Точка входа для системы взаимодействий.
 * @module entities/player/interactions
 */

export { INTERACTION_CONFIG } from './config.js';
export { getObjectWorldPos, isPlayerNear } from './helpers.js';
export { isNearShop, updateShopPrompt, interactWithShop } from './shop.js';
export { isNearBookshelf, interactWithBookshelf } from './bookshelf.js';
export { isNearTaskBoard, interactWithTaskBoard } from './taskBoard.js';
export { updateInteractionPrompts, handleInteraction } from './manager.js';
export {
  hasSpiritCatcherEquipped,
  getCaughtWispCount,
  isCaughtWispLimitReached,
  getNearestStunnedWisp,
  canCatchWisp,
  tryCatchWisp,
  MAX_CAUGHT_WISPS,
} from './spiritCatcher.js';