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
  getCategoryStats
} from './manager.js';

import { 
  initAchievementsUI,
  openAchievementsWindow,
  showAchievementNotification,
  closeAchievementsWindow,
  updateCategoryStats,
  isAchievementsOpen
} from './ui.js';

// ============================================================
// ЭКСПОРТ ФУНКЦИЙ УПРАВЛЕНИЯ
// ============================================================

/**
 * Экспорт основных функций управления достижениями
 * @see module:systems/achievements/manager
 */
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
  getCategoryStats
};

// ============================================================
// ЭКСПОРТ КОНФИГУРАЦИИ
// ============================================================

/**
 * Экспорт конфигурации достижений
 * @see module:systems/achievements/config
 */
export {
  CATEGORIES,
  ACHIEVEMENTS_LIST,
  getCategories,
  getAchievementsList,
  getAchievement,
  getAchievementsByCategory,
  getAllAchievements,
  getTotalCount
} from './config.js';