/**
 * @fileoverview Точка входа для системы достижений.
 * Экспортирует все функции управления достижениями, UI-компоненты
 * и конфигурацию достижений.
 * 
 * @module systems/achievements/index
 */

import { 
  initAchievements,
  updateProgress,
  setProgress,
  checkAchievements,
  isUnlocked,
  getAchievementState,
  getAllAchievementsState,
  getAchievementsStats,
  getCategoryStats,
  forceLoadAchievements
} from './manager.js';

import { 
  initAchievementsUI,
  openAchievementsWindow,
  showAchievementNotification,
  closeAchievementsWindow,
  updateCategoryStats,
  isAchievementsOpen
} from './ui.js';

import {
  ACHIEVEMENTS_DATA,
  CATEGORIES_DATA,
  getAchievementData,
  getAllAchievements,
  getAchievementsByCategory,
  getCategories,
  getTotalAchievementsCount
} from '../../data/achievements.js';

// ============================================================
// ЭКСПОРТ ФУНКЦИЙ УПРАВЛЕНИЯ
// ============================================================

export { 
  initAchievements,
  initAchievementsUI,
  openAchievementsWindow,
  closeAchievementsWindow,
  showAchievementNotification,
  updateCategoryStats,
  isAchievementsOpen,
  updateProgress,
  setProgress,
  checkAchievements,
  isUnlocked,
  getAchievementState,
  getAllAchievementsState,
  getAchievementsStats,
  getCategoryStats,
  forceLoadAchievements
};

// ============================================================
// ЭКСПОРТ КОНФИГУРАЦИИ
// ============================================================

export {
  ACHIEVEMENTS_DATA,
  CATEGORIES_DATA as CATEGORIES,
  getAchievementData,
  getAllAchievements,
  getAchievementsByCategory,
  getCategories,
  getTotalAchievementsCount
};

// ============================================================
// УСТАРЕВШИЕ АЛИАСЫ (для обратной совместимости)
// ============================================================

/**
 * @deprecated Используйте getAllAchievements()
 */
export const getAchievementsList = getAllAchievements;

/**
 * @deprecated Используйте getAllAchievements()
 */
export const getAchievementsListOld = getAllAchievements;

/**
 * @deprecated Используйте getAchievementsByCategory()
 */
export const getAchievementsByCategoryLegacy = getAchievementsByCategory;

/**
 * @deprecated Используйте getCategories()
 */
export const getCategoriesLegacy = getCategories;

/**
 * @deprecated Используйте getTotalAchievementsCount()
 */
export const getTotalCount = getTotalAchievementsCount;

/**
 * @deprecated Используйте ACHIEVEMENTS_DATA
 */
export const ACHIEVEMENTS_LIST = ACHIEVEMENTS_DATA;