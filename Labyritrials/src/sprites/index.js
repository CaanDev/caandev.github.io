/**
 * @fileoverview Точка входа для спрайтовой системы
 * @module sprites/index
 */

// ============================================================
// ПЕРСОНАЖИ
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
  SpriteAtlas,
  spriteAtlas,
  getSpriteAtlas,
  PlayerAnimator,
  playerAnimator,
  getPlayerAnimator,
} from './characters/index.js';

// ============================================================
// ЗАГРУЗЧИК СПРАЙТОВ ИЗ АТЛАСОВ
// ============================================================

export {
  loadAllAtlases,
  getSprite,
  getSpriteData,
  getSheetImage,
  getSpriteByAlias,
  getSpritesByAlias,
  isAtlasLoaded,
  getAtlasStats,
  clearSpriteCache,
  getSpriteKeys,
  getAliasMap,
  hasSprite,
  debugSprite,
  getRandomSprite,
  getSpritesByCategory,
  getSheetImage as getImage,
  getSheetImage as getImageLegacy,
} from './spriteLoader.js';

// ============================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ СО СПРАЙТАМИ
// ============================================================

export {
  getEffectiveBounds,
  getCroppedSprite,
  getRandomCroppedSprite,
  getSpriteRenderSize,
  clearSpriteUtilsCache,
  getSpriteUtilsStats,
  debugCroppedSprite,
  getSpriteWithSize,
  drawSpriteScaled,
} from './spriteUtils.js';

// ============================================================
// СПРАЙТЫ ДОСТИЖЕНИЙ
// ============================================================

export {
  ACHIEVEMENT_SPRITE_MAP,
  ACHIEVEMENT_CATEGORY_MAP,
  getAchievementSpriteName,
  getAchievementSprite,
  getAchievementSpriteWithSize,
  getAchievementIconHTML,
  getAllAchievementSprites,
  getAchievementSpriteSize,
  isAchievementSpriteLoaded,
  preloadAchievementSprites,
} from './achievementSprites.js';

// ============================================================
// СПРАЙТЫ СТУПЕНЕК
// ============================================================

export {
  getStairSpriteName,
  getStairSprite,
} from './stairSprites.js';