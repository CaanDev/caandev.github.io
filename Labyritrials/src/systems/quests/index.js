/**
 * @fileoverview Точка входа для системы заданий.
 * Экспортирует публичный API для работы с заданиями.
 * 
 * @module systems/quests/index
 */

// ============================================================
// ДАННЫЕ
// ============================================================

export {
  QUESTS_DATA,
  getQuestData,
  getAllQuests,
  getQuestsByGiver,
} from '../../data/quests.js';

// ============================================================
// МЕНЕДЖЕР
// ============================================================

export {
  startQuest,
  updateQuestProgress,
  syncQuestProgressFromInventory,
  isQuestComplete,
  getQuestProgress,
  completeQuest,
  isQuestActive,
  isQuestCompleted,
  getActiveQuests,
  getCompletedQuests,
} from './questManager.js';

// ============================================================
// ТРЕКЕР
// ============================================================

export {
  trackItemPickup,
  syncAllActiveQuests,
} from './questTracker.js';