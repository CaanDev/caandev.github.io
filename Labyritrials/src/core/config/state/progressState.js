/**
 * @fileoverview Прогресс, достижения, задания, NPC, события.
 * 
 * @module core/config/state/progressState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {number} - Текущий уровень игры */
  gameLevel: 1,
  /** @type {boolean} - Босс-уровень */
  isBossLevel: false,
  /** @type {boolean} - Можно ли переходить на следующий уровень */
  canExitLevel: true,
  /** @type {boolean} - Разблокирован ли инвентарь */
  inventoryUnlocked: false,

  /** @type {Object} - Состояния NPC */
  npcState: {
    /** @type {string} - Состояние торговца */
    trader: 'not_met',
  },

  /** @type {Object} - Активные и завершённые задания */
  quests: {
    /** @type {Array} - Активные задания */
    active: [],
    /** @type {Array} - Завершённые задания */
    completed: [],
  },

  /** @type {Object} - Метапрогресс, сохраняется вне забега */
  metaProgress: {
    /** @type {number} - Количество недавних смертей (0-3) */
    recentDeaths: 0,
  },

  /** @type {number} - Время входа на текущий уровень (мс, для paceFactor) */
  levelStartTime: 0,
  /** @type {Array<Object>} - Окно событий стресса (для stressFactor) */
  stressWindow: [],

  /**
   * @type {number[]} - Длительности последних N уровней (сек).
   * Используется для расчёта среднего темпа (paceFactor).
   * Максимум - 3 последних уровня.
   */
  recentLevelDurations: [],
  /**
   * @type {number} - Максимальное количество хранимых длительностей уровней
   */
  maxRecentLevelDurations: 3,

  /** @type {Object} - Статистика прохождения */
  gameStats: {
    /** @type {number} - Максимальное HP в конце */
    maxHpAtEnd: 0,
    /** @type {number} - Осталось HP */
    hpRemaining: 0,
    /** @type {number} - Собрано золота */
    goldCollected: 0,
    /** @type {number} - Потрачено золота */
    goldSpent: 0,
    /** @type {number} - Собрано артефактов */
    artifactsCollected: 0,
    /** @type {number} - Всего артефактов возможно */
    artifactsTotalPossible: 0,
    /** @type {number} - Убито монстров */
    monstersKilled: 0,
    /** @type {number} - Всего боссов */
    bossesTotal: 0,
    /** @type {Object} - Попадания оружием */
    weaponHits: {
      /** @type {number} */
      default: 0,
      /** @type {number} */
      stun: 0,
      /** @type {number} */
      vampire: 0,
      /** @type {number} */
      fireball: 0,
    },
    /** @type {string} - Любимое оружие */
    favoriteWeapon: 'default',
    /** @type {number} - Посещено секретных комнат */
    secretRoomsVisited: 0,
    /** @type {number} - Сгенерировано секретных комнат */
    secretRoomsGenerated: 0,
    /** @type {Object} - Активированные ловушки */
    trapsTriggered: {
      /** @type {number} */
      spike: 0,
      /** @type {number} */
      ice: 0,
      /** @type {number} */
      acid: 0,
      /** @type {number} */
      lightning: 0,
      /** @type {number} */
      psionic: 0,
    },
    /** @type {number} - Укусы мимиков */
    mimicBites: 0,
    /** @type {number} - Время игры (сек) */
    playTime: 0,
    /** @type {string} - Отформатированное время */
    playTimeFormatted: '00:00:00',
  },

  /** @type {number} - Аккумулятор времени игры (секунды) */
  playTimeAccumulator: 0,
  /** @type {number} - Время последнего обновления */
  lastUpdateTime: 0,

  /** @type {Object} - Активные адаптации монстров */
  monsterAdaptation: {
    /** @type {boolean} */
    fireImmunity: false,
    /** @type {boolean} */
    stunImmunity: false,
    /** @type {boolean} */
    healingBlock: false,
    /** @type {boolean} */
    healthBoost: false,
  },
  /** @type {number} - Уровень адаптации */
  adaptationLevel: 0,
  /** @type {Object} - Счётчики атак для адаптации */
  totalAttacks: {
    /** @type {number} */
    fireball: 0,
    /** @type {number} */
    stun: 0,
    /** @type {number} */
    vampirism: 0,
    /** @type {number} */
    magic: 0,
  },

  /** @type {string|null} - Текущее событие */
  currentEvent: null,
  /** @type {boolean} - Показано ли сообщение о событии */
  eventMessageShown: false,
  /** @type {boolean} - Активна ли Кровавая луна */
  bloodMoonActive: false,
  /** @type {boolean} - Активен ли Ледяной ветер */
  eventIceWindActive: false,
  /** @type {boolean} - Активна ли Ярость монстров */
  eventMonsterRageActive: false,

  /** @type {number} - Всего убито монстров на уровне */
  totalMonstersKilledOnLevel: 0,
  /** @type {boolean} - Флаг "Железный человек" */
  ironManActive: true,
  /** @type {boolean} - Флаг "Тень" */
  shadowActive: true,
});