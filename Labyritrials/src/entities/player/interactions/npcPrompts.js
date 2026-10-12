/**
 * @fileoverview Общие подсказки для взаимодействия с NPC.
 * Формирует текст подсказки в зависимости от состояния знакомства с NPC.
 * 
 * @module entities/player/interactions/npcPrompts
 */

import { state } from '../../../core/config/index.js';
import { getNpcName } from '../../../data/npcs.js';
import { isNpcUnknown } from '../../../systems/dialogs/npcStates.js';

/**
 * Получение текста подсказки взаимодействия с NPC.
 * 
 * @param {string} npcId - ID NPC
 * @returns {string} - Текст подсказки
 */
export function getNpcPromptText(npcId) {
  const npcState = state.npcState?.[npcId];

  // До знакомства - нейтральный текст
  if (isNpcUnknown(npcId, npcState)) return '[E] Говорить';
  // После знакомства - имя/роль NPC
  return `[E] ${getNpcName(npcId)}`;
}