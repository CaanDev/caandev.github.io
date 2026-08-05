/**
 * @fileoverview Конфигурация достижений игры.
 * @module systems/achievements/config
 * 
 * @deprecated Используйте импорт из 'data/achievements.js'
 */

// ============================================================
// РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

export {
  ACHIEVEMENTS_DATA,
  CATEGORIES_DATA,
  getAchievementData,
  getAllAchievements,
  getAchievementsByCategory,
  getCategories,
  getTotalAchievementsCount
} from '../../data/achievements.js';

// Для обратной совместимости с кодом, использующим CATEGORIES и ACHIEVEMENTS_LIST
export { CATEGORIES_DATA as CATEGORIES } from '../../data/achievements.js';
export { ACHIEVEMENTS_DATA as ACHIEVEMENTS_LIST } from '../../data/achievements.js';