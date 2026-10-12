/**
 * @fileoverview Точка входа для системы "умной" сложности.
 * 
 * @module systems/difficulty/index
 */

export { DIFFICULTY_CONFIG } from './config.js';

export {
  getDifficultyMultiplier,
  getBossDifficultyMultiplier,
  calculateDifficultyMultiplier,
  resetDifficultyCache,
  registerDeath,
  resetDeathStreak,
} from './difficultyManager.js';

export {
  checkBuildPower,
  checkDeathFactor,
  checkHpFactor,
  checkPaceFactor,
  checkStressFactor,
  getDebugSnapshot,
} from './checkers.js';

export {
  loadMetaProgress,
  saveMetaProgress,
  clearMetaProgress,
} from './metaStorage.js';

export {
  trackDamage,
  trackPotion,
  trackTrap,
  resetStressWindow,
} from './stressTracker.js';