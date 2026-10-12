/**
 * @fileoverview Точка входа для спрайтов персонажей
 * @module sprites/characters/index
 */

// ============================================================
// КОНФИГУРАЦИЯ СПРАЙТОВ
// ============================================================

export {
  PLAYER_DISPLAY_SIZE,
  DIRECTION_ORDER,
  DIRECTION_SPRITE_NAMES,
  ANIMATION_CONFIG,
  getCharacterSpriteName,
  getCharacterBaseSpriteName,
  getAnimationConfig,
  getDirectionIndex,
  getDirectionName,
  getDirectionIndexByName,
} from './spriteConfig.js';

// ============================================================
// АТЛАС ПЕРСОНАЖЕЙ
// ============================================================

export {
  SpriteAtlas,
  spriteAtlas,
  getSpriteAtlas,
} from './spriteAtlas.js';

// ============================================================
// АНИМАТОР ИГРОКА
// ============================================================

export {
  PlayerAnimator,
  playerAnimator,
  getPlayerAnimator,
} from './playerAnimator.js';