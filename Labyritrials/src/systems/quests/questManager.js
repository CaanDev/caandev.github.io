/**
 * @fileoverview Менеджер заданий.
 * Управляет взятием, обновлением прогресса и завершением заданий.
 * 
 * @module systems/quests/questManager
 */

import { state, player } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { QUESTS_DATA, getQuestData } from '../../data/quests.js';

/**
 * Взятие задания
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если задание взято
 */
export function startQuest(questId) {
  const questData = getQuestData(questId);
  if (!questData) {
    logger.warn(`⚠️ Задание "${questId}" не найдено`);
    return false;
  }

  // Инициализация
  if (!state.quests) state.quests = { active: [], completed: [] };
  if (!state.quests.active) state.quests.active = [];
  if (!state.quests.completed) state.quests.completed = [];

  // Проверка, не завершено ли уже
  if (state.quests.completed.includes(questId)) {
    logger.warn(`⚠️ Задание "${questId}" уже завершено`);
    return false;
  }

  // Проверка, не активно ли уже
  if (state.quests.active.some(q => q.id === questId)) {
    logger.warn(`⚠️ Задание "${questId}" уже активно`);
    return false;
  }

  // Добавление в активные
  state.quests.active.push({
    id: questId,
    progress: 0,
    startedAt: Date.now(),
  });

  // Специальные side-effects для задания Астрид "Дикие блуждающие огоньки"
  if (questId === 'researcherWisps') {
    import('../../entities/npc/researcher/manager.js').then(module => {
      module.setResearcherState('quest_active');
    });
  }

  return true;
}

/**
 * Обновление прогресса задания
 * 
 * @param {string} questId - ID задания
 * @param {string} itemId - ID предмета (для проверки цели)
 * @param {number} [count=1] - Прирост (или установка)
 * @param {boolean} [absolute=false] - Установить точное значение
 * @returns {boolean} - true, если прогресс обновлён
 */
export function updateQuestProgress(questId, itemId, count = 1, absolute = false) {
  if (!state.quests || !state.quests.active) return false;

  const activeQuest = state.quests.active.find(q => q.id === questId);
  if (!activeQuest) return false;

  const questData = getQuestData(questId);
  if (!questData) return false;

  // Проверка, что предмет совпадает с целью
  if (questData.target.item !== itemId) return false;

  // Обновление прогресса
  if (absolute) {
    activeQuest.progress = count;
  } else {
    activeQuest.progress = Math.min(
      questData.target.count,
      (activeQuest.progress || 0) + count
    );
  }

  return true;
}

/**
 * Синхронизация прогресса из инвентаря игрока
 * 
 * Полезно после загрузки сохранения или при проверке.
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если прогресс обновлён
 */
export function syncQuestProgressFromInventory(questId) {
  if (!state.quests || !state.quests.active) return false;

  const activeQuest = state.quests.active.find(q => q.id === questId);
  if (!activeQuest) return false;

  const questData = getQuestData(questId);
  if (!questData) return false;

  // Получение количества предмета из инвентаря
  const itemId = questData.target.item;
  const currentCount = player.inventory?.items?.counts?.[itemId] || 0;

  activeQuest.progress = Math.min(currentCount, questData.target.count);
  return true;
}

/**
 * Проверка, выполнено ли задание
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если цель достигнута
 */
export function isQuestComplete(questId) {
  const questData = getQuestData(questId);
  if (!questData) return false;

  // Прогресс - по фактическому количеству предмета
  const itemId = questData.target.item;
  const currentCount = player.inventory?.items?.counts?.[itemId] || 0;

  return currentCount >= questData.target.count;
}

/**
 * Получение прогресса задания
 * 
 * @param {string} questId - ID задания
 * @returns {Object|null} - { current, max, percent } или null
 */
export function getQuestProgress(questId) {
  const questData = getQuestData(questId);
  if (!questData) return null;

  const itemId = questData.target.item;
  const currentCount = player.inventory?.items?.counts?.[itemId] || 0;
  const max = questData.target.count;
  const current = Math.min(currentCount, max);

  return { current, max, percent: max > 0 ? (current / max) * 100 : 0, };
}

/**
 * Завершение задания
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если задание завершено
 */
export function completeQuest(questId) {
  if (!state.quests || !state.quests.active) return false;

  const index = state.quests.active.findIndex(q => q.id === questId);
  if (index === -1) {
    logger.warn(`⚠️ Задание "${questId}" не активно`);
    return false;
  }

  const questData = getQuestData(questId);
  if (!questData) return false;

  // Проверка выполнения
  if (!isQuestComplete(questId)) {
    logger.warn(`⚠️ Задание "${questId}" ещё не выполнено`);
    return false;
  }

  // Удаление предметов из инвентаря
  const itemId = questData.target.item;
  const itemCount = questData.target.count;

  if (player.inventory?.items?.counts?.[itemId]) {
    const currentCount = player.inventory.items.counts[itemId];

    if (currentCount >= itemCount) {
      // Забирается ровно count, остаток остаётся
      const remainder = currentCount - itemCount;

      if (remainder > 0) {
        player.inventory.items.counts[itemId] = remainder;
      } else {
        delete player.inventory.items.counts[itemId];
        // Удаление из available, если предмет закончился
        if (player.inventory.items.available) {
          const availIndex = player.inventory.items.available.indexOf(itemId);
          if (availIndex !== -1) player.inventory.items.available.splice(availIndex, 1);
        }
      }
    }
  }

  // Перемещение из активных в завершённые
  state.quests.active.splice(index, 1);
  if (!state.quests.completed.includes(questId)) state.quests.completed.push(questId);

  // Применение наград
  applyQuestRewards(questData);

  return true;
}

/**
 * Применение наград задания
 * 
 * @param {QuestData} questData - Данные задания
 * @returns {void}
 * @private
 */
function applyQuestRewards(questData) {
  if (!questData.reward) return;

  // Открытие инвентаря
  if (questData.reward.inventory) state.inventoryUnlocked = true;
  // Открытие портала
  state.canExitLevel = true;

  // Золото
  if (questData.reward.gold) player.gold += questData.reward.gold;
}

/**
 * Проверка, активно ли задание
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если активно
 */
export function isQuestActive(questId) {
  if (!state.quests || !state.quests.active) return false;
  return state.quests.active.some(q => q.id === questId);
}

/**
 * Проверка, завершено ли задание
 * 
 * @param {string} questId - ID задания
 * @returns {boolean} - true, если завершено
 */
export function isQuestCompleted(questId) {
  if (!state.quests || !state.quests.completed) return false;
  return state.quests.completed.includes(questId);
}

/**
 * Получение списка активных заданий
 * 
 * @returns {Array} - Массив активных заданий
 */
export function getActiveQuests() {
  if (!state.quests || !state.quests.active) return [];
  return [...state.quests.active];
}

/**
 * Получение списка завершённых заданий
 * 
 * @returns {string[]} - Массив ID завершённых заданий
 */
export function getCompletedQuests() {
  if (!state.quests || !state.quests.completed) return [];
  return [...state.quests.completed];
}