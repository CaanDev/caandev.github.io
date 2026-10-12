/**
 * @fileoverview Точка входа для спрайтов NPC.
 * @module sprites/npcs/index
 */

export {
  NPC_DISPLAY_SIZE,
  NPC_DIRECTION_ORDER,
  NPC_DIRECTION_SPRITE_NAMES,
  NPC_ANIMATION_CONFIG,
  getNpcAnimationConfig,
  getNpcSpriteName,
} from './npcConfig.js';

export {
  NpcAnimator,
  createNpcAnimator,
} from './npcAnimator.js';

export {
  getNpcAnimator,
  resetNpcAnimator,
  clearNpcAnimators,
} from './npcAnimators.js';