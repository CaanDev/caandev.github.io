/**
 * @fileoverview Данные всех заданий в игре.
 * Содержит описания, цели, награды и условия разблокировки.
 * 
 * @module systems/quests/questsData
 */

/**
 * @typedef {Object} QuestData
 * @property {string} id - Уникальный идентификатор
 * @property {string} title - Название задания
 * @property {string} briefDescription - Краткое описание
 * @property {string} description - Подробное описание
 * @property {string} category - Категория ('collection' | 'exploration')
 * @property {string} giver - ID NPC, выдающего задание
 * @property {Object} target - Цель задания
 * @property {string} target.item - ID предмета для сбора
 * @property {number} target.count - Количество
 * @property {Object} reward - Награды
 * @property {boolean} [reward.inventory] - Открывает ли инвентарь
 * @property {number} [reward.gold] - Золото
 * @property {string} [reward.achievement] - ID достижения
 * @property {boolean} hidden - Скрыто ли до получения
 * @property {boolean} [fromBoard=false] - Доступно ли задание с доски заданий
 */

/**
 * @constant {Object<string, QuestData>} QUESTS_DATA - Все задания в игре
 */
export const QUESTS_DATA = {
  /**
   * Первое сюжетное задание - сбор крыльев летучих мышей
   * Доступно только у торговца
   */
  traderWings: {
    id: 'traderWings',
    title: 'Охота на летучих мышей',
    briefDescription: 'Добыть 5 крыльев летучих мышей и принести их торговцу.',
    description: '',
    category: 'collection',
    giver: 'trader',
    target: {
      item: 'batWing',
      count: 5,
    },
    reward: {
      inventory: true,
    },
    hidden: false,
    fromBoard: false,
  },

  /**
   * Задание от Астрид: поймать 4 диких блуждающих огонька
   * Появляется на доске заданий после первой встречи с Астрид и разговора с ней в безопасной комнате.
   * Только через это задание игрок получает "Блуждающие огни".
   */
  researcherWisps: {
    id: 'researcherWisps',
    title: 'Блуждающие огоньки',
    briefDescription: 'Поймать 4 диких блуждающих огонька и принести их Астрид.',
    description: 'Во время моих вылазок в лабиринт я натыкалась на странные блуждающие огоньки. Они не нападают, если близко не подходить, и ведут себя... иначе, чем монстры. Меня они сильно заинтересовали, поэтому я страстно желаю их изучить!<br>Однако для этого их нужно сначала поймать. У меня был специальный предмет для этих задач — "Ловец духов". Только вот я его потеряла где-то в лабиринте. Думаю, его можно найти в каком-нибудь тупике.<br>И ещё: огоньки довольно опасные, их просто так не поймать. Полагаю, они станут уязвимыми, если их предварительно оглушить.',
    category: 'exploration',
    giver: 'researcher',
    target: {
      item: 'caughtWisp',
      count: 4,
    },
    reward: {
      willOTheWisps: true,
    },
    hidden: false,
    fromBoard: true,
  },
};

/**
 * Получение данных задания по ID
 * 
 * @param {string} id - ID задания
 * @returns {QuestData|undefined} - Данные задания или undefined
 */
export function getQuestData(id) {
  return QUESTS_DATA[id];
}

/**
 * Получение всех заданий
 * 
 * @returns {QuestData[]} - Массив данных
 */
export function getAllQuests() {
  return Object.values(QUESTS_DATA);
}

/**
 * Получение заданий от конкретного NPC
 * 
 * @param {string} npcId - ID NPC
 * @returns {QuestData[]} - Массив заданий
 */
export function getQuestsByGiver(npcId) {
  return Object.values(QUESTS_DATA).filter(q => q.giver === npcId);
}