/**
 * @fileoverview Состояния NPC.
 * @module systems/dialogs/npcStates
 */

/**
 * @namespace TRADER_STATES
 * @description Состояния торговца
 */
export const TRADER_STATES = {
  // NPC ещё не встречался
  NOT_MET: 'not_met',
  // Идёт первое знакомство (интро-диалог)
  INTRO: 'intro',
  // Игрок взял задание от NPC
  QUEST_ACTIVE: 'quest_active',
  // Задание выполнено, но ещё не сдано
  QUEST_COMPLETE: 'quest_complete',
  // Лавка торговца доступна
  SHOP_OPEN: 'shop_open',
};

/**
 * @namespace RESEARCHER_STATES
 * @description Состояния исследовательницы
 */
export const RESEARCHER_STATES = {
  // NPC ещё не встречалась
  NOT_MET: 'not_met',
  // NPC в лабиринте (сидит в тупике)
  IN_LABYRINTH: 'in_labyrinth',
  // Игрок поговорил в лабиринте, ожидание ухода из поля зрения
  LEAVING_LABYRINTH: 'leaving_labyrinth',
  // NPC в безопасной комнате, ждёт разговора игрока
  IN_SAFE_ROOM: 'in_safe_room',
  // Игрок поговорил в safeRoom, NPC ждёт выдачи/сдачи заданий с доски
  WAITING_FOR_QUEST_BOARD: 'waiting_for_quest_board',
  // Игрок взял задание с доски (NPC не показывается)
  QUEST_ACTIVE: 'quest_active',
  // Условия задания выполнены, NPC ждёт в safeRoom для сдачи
  QUEST_READY_TO_TURN_IN: 'quest_ready_to_turn_in',
  // Игрок сдал задание, идёт таймер 3 минуты
  WISPS_QUEST_STUDYING: 'wisps_quest_studying',
  // Таймер истёк, Астрид готова выдать награду
  WISPS_QUEST_COMPLETE: 'wisps_quest_complete',
};

export const NPC_IDS = {
  TRADER: 'trader',
  RESEARCHER: 'researcher',
};

/**
 * Проверка, знаком ли игрок с NPC (был ли первый контакт).
 * 
 * У каждого NPC свой набор "стартовых"" состояний, при которых игрок ещё не знаком с персонажем.
 * Если состояние NPC неизвестно (undefined) - считается, что не знакомы.
 * 
 * @param {string} npcId - ID NPC
 * @param {string|undefined} npcState - Текущее состояние NPC из state.npcState[npcId]
 * @returns {boolean} - true, если игрок ещё не знаком с NPC
 */
export function isNpcUnknown(npcId, npcState) {
  switch (npcId) {
    case NPC_IDS.TRADER:
      return npcState === TRADER_STATES.NOT_MET || npcState === TRADER_STATES.INTRO;

    case NPC_IDS.RESEARCHER:
      return npcState === RESEARCHER_STATES.NOT_MET || npcState === RESEARCHER_STATES.IN_LABYRINTH || npcState === undefined;

    default:
      // Неизвестный NPC - по умолчанию считается как "не знаком"
      return true;
  }
}