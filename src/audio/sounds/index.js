/**
 * @fileoverview Точка входа для системы звуковых эффектов
 * @module audio/sounds/index
 */

export { sound } from './soundManager.js';
export { soundLoader } from './soundLoader.js';
export {
  SOUNDS,
  FLAT_SOUNDS,
  getSoundConfig,
  hasSound,
  getSoundKeys,
  getSoundsByCategory,
  getSoundCategories,
  getPreloadSounds,
} from './soundConfig.js';