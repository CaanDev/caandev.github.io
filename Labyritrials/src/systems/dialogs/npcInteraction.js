/**
 * @fileoverview Логика взаимодействия с NPC.
 * Связывает диалоги, задания и магазин.
 * 
 * @module systems/dialogs/npcInteraction
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { getNpcName } from '../../data/npcs.js';
import { getNpcDialog } from '../../data/npcDialogs.js';
import { NPC_IDS, TRADER_STATES, RESEARCHER_STATES } from './npcStates.js';
import { openDialog, openDialogWithChoice } from './index.js';
import { setResearcherState } from '../../entities/npc/researcher/manager.js';
import {
  startQuest,
  isQuestComplete,
  getQuestProgress,
  completeQuest,
} from '../quests/index.js';

/**
 * Обработка взаимодействия с торговцем
 * 
 * @returns {Promise<void>}
 */
export async function interactWithTrader() {
  const dialog = getNpcDialog(NPC_IDS.TRADER);
  if (!dialog) return;

  const npcName = getNpcName(dialog.id);
  const traderState = state.npcState.trader || TRADER_STATES.NOT_MET;

  // Приоритетная реплика о доске заданий
  if (!state.taskBoardIntroShown && state.gameLevel >= 8 && traderState === TRADER_STATES.SHOP_OPEN && dialog.taskBoardIntro) {
    state.taskBoardIntroShown = true;

    await openDialog({
      speaker: npcName,
      lines: dialog.taskBoardIntro,
    });

    // После реплики сразу открывается лавка торговца
    return 'open_shop';
  }

  switch (traderState) {
    case TRADER_STATES.NOT_MET:
    case TRADER_STATES.INTRO:
      await handleTraderIntro(dialog);
      break;

    case TRADER_STATES.QUEST_ACTIVE:
      await handleTraderQuestActive(dialog);
      break;

    case TRADER_STATES.QUEST_COMPLETE:
      await handleTraderQuestComplete(dialog);
      break;

    case TRADER_STATES.SHOP_OPEN:
      // Открытие лавки торговца
      return 'open_shop';

    default:
      logger.warn(`⚠️ Неизвестное состояние торговца: ${traderState}`);
  }
}

/**
 * Обработка взаимодействия с NPC-исследовательницей.
 * 
 * @returns {Promise<boolean>} - true, если взаимодействие обработано
 */
export async function interactWithResearcher() {
  const status = state.npcState.researcher;
  const dialog = getNpcDialog(NPC_IDS.RESEARCHER);
  if (!dialog) return false;

  const npcName = getNpcName(NPC_IDS.RESEARCHER);

  // NPC в лабиринте (первая встреча)
  if (status === RESEARCHER_STATES.IN_LABYRINTH) {
    await openDialog({
      speaker: npcName,
      lines: dialog.intro,
    });
    // Если игрок уже был в safeRoom - NPC уходит
    if (state.safeRoomIntroShown) setResearcherState(RESEARCHER_STATES.LEAVING_LABYRINTH);
    return true;
  }

  // NPC в safeRoom, первый разговор
  if (status === RESEARCHER_STATES.IN_SAFE_ROOM) {
    await openDialog({
      speaker: npcName,
      lines: dialog.safeRoomIntro,
    });
    setResearcherState(RESEARCHER_STATES.WAITING_FOR_QUEST_BOARD);
    return true;
  }

  // Игрок готов сдать задание
  if (status === RESEARCHER_STATES.QUEST_READY_TO_TURN_IN) {
    await handleWispQuestTurnIn(dialog, npcName);
    return true;
  }

  // Идёт изучение (3 минуты)
  if (status === RESEARCHER_STATES.WISPS_QUEST_STUDYING) {
    const elapsed = (state.gameStats.playTime || 0) - (state.researcher.studyStartTime || 0);
    
    if (elapsed >= 180) {
      // Таймер истёк - выдача награды
      setResearcherState(RESEARCHER_STATES.WISPS_QUEST_COMPLETE);
      await handleWispQuestReward(dialog, npcName);
    } else {
      await openDialog({
        speaker: npcName,
        lines: dialog.wispQuestStudying,
      });
    }
    return true;
  }

  // Таймер истёк, но игрок ещё не получил награду
  if (status === RESEARCHER_STATES.WISPS_QUEST_COMPLETE) {
    await handleWispQuestReward(dialog, npcName);
    return true;
  }

  // В остальных состояниях - взаимодействие недоступно
  return false;
}

/**
 * Первое знакомство с торговцем (предложение задания)
 * 
 * @param {Object} dialog - Данные диалога
 * @returns {Promise<void>}
 * @private
 */
async function handleTraderIntro(dialog) {
  const npcName = getNpcName(dialog.id);

  const accepted = await openDialogWithChoice({
    speaker: npcName,
    lines: dialog.intro,
    yesText: 'Принять',
    noText: 'Отказаться',
  });

  if (accepted) {
    // Взятие задания
    const success = startQuest('traderWings');
    if (success) state.npcState.trader = TRADER_STATES.QUEST_ACTIVE;
  }
  // Если отказ - состояние остаётся NOT_MET/INTRO, при следующем E снова предложит
}

/**
 * Задание активно (проверка прогресса)
 * 
 * @param {Object} dialog - Данные диалога
 * @returns {Promise<void>}
 * @private
 */
async function handleTraderQuestActive(dialog) {
  const npcName = getNpcName(dialog.id);

  // Проверка, выполнено ли задание
  if (isQuestComplete('traderWings')) {
    // Переход в состояние quest_complete
    state.npcState.trader = TRADER_STATES.QUEST_COMPLETE;
    // Повторный вызов обработки
    await handleTraderQuestComplete(dialog);
    return;
  }

  // Прогресс не достигнут - показывается диалог с прогрессом
  const progress = getQuestProgress('traderWings');
  const progressText = progress ? `Собрано: ${progress.current} из ${progress.max}` : '';

  await openDialog({
    speaker: npcName,
    lines: [
      ...dialog.questActive,
      progressText,
    ],
  });
}

/**
 * Задание выполнено (сдача)
 * 
 * @param {Object} dialog - Данные диалога
 * @returns {Promise<void>}
 * @private
 */
async function handleTraderQuestComplete(dialog) {
  const npcName = getNpcName(dialog.id);

  await openDialog({
    speaker: npcName,
    lines: dialog.questComplete,
  });

  // Завершение задания (забираются крылья, выдаётся награда)
  const success = completeQuest('traderWings');
  if (success) state.npcState.trader = TRADER_STATES.SHOP_OPEN;
}

/**
 * Проверка, находится ли игрок рядом с торговцем
 * 
 * @returns {boolean} - true, если рядом
 */
export function isPlayerNearTrader() {
  // Проверка: активен ли торговец
  if (CONFIG.shopPos.x < 0 || CONFIG.shopPos.y < 0) return false;
  if (state.isBossLevel) return false;

  const shopWorldX = CONFIG.shopPos.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  const shopWorldY = CONFIG.shopPos.y * CONFIG.cellSize + CONFIG.cellSize / 2;

  const distToTrader = Math.hypot(player.px - shopWorldX, player.py - shopWorldY);
  return distToTrader < CONFIG.cellSize;
}

/**
 * Сдача задания: забрать 4 огонька + Ловец духов, запустить таймер изучения
 * 
 * @param {Object} dialog - Данные диалога
 * @param {string} npcName - Имя NPC
 * @returns {Promise<void>}
 * @private
 */
async function handleWispQuestTurnIn(dialog, npcName) {
  await openDialog({
    speaker: npcName,
    lines: dialog.wispQuestTurnIn,
  });

  // 1. Завершение задания (пока предметы ещё в инвентаре - иначе isQuestComplete() вернёт false)
  completeQuest('researcherWisps');
  
  // 2. Забираются все пойманные огоньки
  const caughtCount = player.inventory?.items?.counts?.caughtWisp || 0;
  
  if (caughtCount > 0) {
    delete player.inventory.items.counts.caughtWisp;
    const availIndex = player.inventory.items.available.indexOf('caughtWisp');
    if (availIndex !== -1) player.inventory.items.available.splice(availIndex, 1);
  }
  
  // 3. Забирается Ловец духов
  // Из доступного снаряжения
  if (player.inventory?.items?.equipment) {
    const eqIndex = player.inventory.items.equipment.indexOf('spiritCatcher');
    if (eqIndex !== -1) player.inventory.items.equipment.splice(eqIndex, 1);
  }

  // Очистка слота экипировки, если Ловец духов там лежит
  if (player.inventory?.equipped) {
    for (const slot of ['item1', 'item2', 'item3']) {
      if (player.inventory.equipped[slot] === 'spiritCatcher') delete player.inventory.equipped[slot];
    }
  }
  
  // 4. Запускается таймер изучения
  state.researcher.studyStartTime = state.gameStats.playTime || 0;
  setResearcherState(RESEARCHER_STATES.WISPS_QUEST_STUDYING);
  
  // 5. Сохранение
  const { saveGame } = await import('../../save/saveSystem.js');
  saveGame();
}

/**
 * Выдача награды после изучения
 * 
 * @param {Object} dialog - Данные диалога
 * @param {string} npcName - Имя NPC
 * @returns {Promise<void>}
 * @private
 */
async function handleWispQuestReward(dialog, npcName) {
  await openDialog({
    speaker: npcName,
    lines: dialog.wispQuestReward,
  });
  
  // Выдать предмет "Блуждающие огни"
  if (!player.inventory) player.inventory = { equipped: {}, items: { equipment: [] } };
  if (!player.inventory.items) player.inventory.items = { equipment: [] };
  if (!player.inventory.items.equipment) player.inventory.items.equipment = [];
  
  if (!player.inventory.items.equipment.includes('willOTheWisps')) player.inventory.items.equipment.push('willOTheWisps');
  
  // Вернуть Астрид в WAITING_FOR_QUEST_BOARD
  setResearcherState(RESEARCHER_STATES.WAITING_FOR_QUEST_BOARD);
  state.researcher.studyStartTime = 0;
  
  // Сохранение
  const { saveGame } = await import('../../save/saveSystem.js');
  saveGame();
}