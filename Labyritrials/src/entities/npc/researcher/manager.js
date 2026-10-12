/**
 * @fileoverview Менеджер исследовательницы.
 * Обновление состояния NPC каждый кадр, обработка исчезновения.
 * 
 * @module entities/npc/researcher/manager
 */

import { state, player } from '../../../core/config/index.js';
import { logger } from '../../../utils/logger.js';
import { RESEARCHER_STATES } from '../../../systems/dialogs/npcStates.js';
import { getDistanceVisibility } from '../../../systems/fog/index.js';
import { clearResearcherPosition } from './spawner.js';

let questCheckCounter = 0;
const QUEST_CHECK_INTERVAL = 30;

/**
 * Проверка, готов ли игрок сдать задание Астрид.
 * Если задание активно, собрано 4 огонька и есть Ловец духов -
 * перевести Астрид в QUEST_READY_TO_TURN_IN и заспавнить в safeRoom.
 * 
 * @returns {void}
 */
export function checkResearcherQuestReady() {
  if (state.npcState.researcher !== RESEARCHER_STATES.QUEST_ACTIVE) return;
  
  // Проверка, что задание активно
  const isQuestActive = state.quests?.active?.some(q => q.id === 'researcherWisps');
  if (!isQuestActive) return;
  
  // Проверка, что собрано 4 огонька
  const caughtCount = player.inventory?.items?.counts?.caughtWisp || 0;
  if (caughtCount < 4) return;
  
  // Проверка, что есть Ловец духов
  const hasSpiritCatcher = player.inventory?.items?.equipment?.includes('spiritCatcher') || false;
  if (!hasSpiritCatcher) return;
  
  // Перевод в состояние "готов к сдаче"
  setResearcherState(RESEARCHER_STATES.QUEST_READY_TO_TURN_IN);
  
  // Если игрок уже в safeRoom - немедленный спавн Астрид
  if (state.inSafeRoom) {
    import('./spawner.js').then(module => {
      module.spawnResearcherInSafeRoom();
    });
  }
  
  // Обновление индикатора (если есть)
  import('../../../systems/rendering/npcIndicator.js').then(module => {
    // Индикатор обновится автоматически через shouldShowResearcherIndicator
  });
}

/**
 * Обновление состояния исследовательницы.
 * Вызывается каждый кадр из gameLoop.
 * 
 * @param {number} [deltaTime] - Время с прошлого кадра (мс). Не используется, оставлено для совместимости.
 * @returns {void}
 */
export function updateResearcher(deltaTime) {
  // Проверка таймера изучения (WISPS_QUEST_STUDYING -> WISPS_QUEST_COMPLETE)
  if (state.npcState.researcher === RESEARCHER_STATES.WISPS_QUEST_STUDYING) {
    const elapsed = (state.gameStats.playTime || 0) - (state.researcher.studyStartTime || 0);
    if (elapsed >= 180) setResearcherState(RESEARCHER_STATES.WISPS_QUEST_COMPLETE);
  }
  
  // Проверка готовности к сдаче (QUEST_ACTIVE -> QUEST_READY_TO_TURN_IN)
  questCheckCounter++;
  if (questCheckCounter >= QUEST_CHECK_INTERVAL) {
    questCheckCounter = 0;
    checkResearcherQuestReady();
  }

  // Если нет данных о позиции - нечего обновлять
  if (state.researcher.x === null || state.researcher.y === null) return;
  // Обработка только состояния LEAVING_LABYRINTH
  if (state.npcState.researcher !== RESEARCHER_STATES.LEAVING_LABYRINTH) return;

  // Проверка видимости
  const visibility = getDistanceVisibility(state.researcher.x, state.researcher.y);
  if (visibility > 0.05) return; // ещё видна - ожидание

  // NPC вне поля зрения - удаление из лабиринта
  removeResearcherFromLabyrinth();
}

/**
 * Удаление исследовательницы из лабиринта и перевод в состояние IN_SAFE_ROOM.
 * 
 * @returns {void}
 */
export function removeResearcherFromLabyrinth() {
  clearResearcherPosition();

  state.researcher.status = RESEARCHER_STATES.IN_SAFE_ROOM;
  state.npcState.researcher = RESEARCHER_STATES.IN_SAFE_ROOM;

  // Автосохранение
  import('../../../save/saveSystem.js').then(({ saveGame }) => {
    saveGame();
  });
}

/**
 * Установка состояния исследовательницы (для использования из диалогов).
 * 
 * @param {string} newState - Новое состояние из RESEARCHER_STATES
 * @returns {void}
 */
export function setResearcherState(newState) {
  state.npcState.researcher = newState;
  state.researcher.status = newState;
}