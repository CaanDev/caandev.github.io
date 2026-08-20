/**
 * @fileoverview Точка входа для спрайтовой системы
 * @module sprites/index
 */

export {
  SPRITE_CONFIG,
  DIRECTION_ORDER,
  getSpriteConfig,
  getDirectionIndex,
  getDirectionName,
} from './spriteConfig.js';

export {
  SpriteAtlas,
  spriteAtlas,
  getSpriteAtlas,
} from './spriteAtlas.js';

export {
  PlayerAnimator,
  playerAnimator,
  getPlayerAnimator,
} from './playerAnimator.js';