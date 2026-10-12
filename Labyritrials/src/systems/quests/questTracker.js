/**
 * @fileoverview Трекер заданий.
 * Подписывается на события игры и обновляет прогресс активных заданий.
 * 
 * @module systems/quests/questTracker
 */

import { state, player } from '../../core/config/index.js';
import { QUESTS_DATA } from '../../data/quests.js';
import { updateQuestProgress } from './questManager.js';

/**
 * Обработка события подбора предмета
 * 
 * Обновляет прогресс всех активных заданий, целью которых является этот предмет.
 * 
 * @param {string} itemId - ID предмета
 * @param {number} [count=1] - Количество подобранных
 * @returns {void}
 */
export function trackItemPickup(itemId, count = 1) {
  if (!state.quests || !state.quests.active) return;

  for (const activeQuest of state.quests.active) {
    const questData = QUESTS_DATA[activeQuest.id];
    if (!questData) continue;
    if (questData.target.item === itemId) updateQuestProgress(activeQuest.id, itemId, count);
  }
}

/**
 * Синхронизация прогресса всех активных заданий
 * 
 * Полезно при загрузке сохранения или после потери предметов.
 * 
 * @returns {void}
 */
export function syncAllActiveQuests() {
  if (!state.quests || !state.quests.active) return;

  for (const activeQuest of state.quests.active) {
    const questData = QUESTS_DATA[activeQuest.id];
    if (!questData) continue;

    const itemId = questData.target.item;
    const currentCount = player.inventory?.items?.counts?.[itemId] || 0;

    activeQuest.progress = Math.min(currentCount, questData.target.count);
  }
}