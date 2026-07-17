/**
 * @fileoverview Централизованное хранилище всех эмодзи игры.
 * Упрощает замену и модификацию иконок для игроков, монстров, предметов и UI.
 * 
 * @module emojis
 */

/**
 * @namespace EMOJIS
 * @description Объект со всеми эмодзи игры.
 * Сгруппирован по категориям для удобного доступа.
 */
export const EMOJIS = {
  /**
   * @namespace EMOJIS.player
   * @description Эмодзи игрока
   */
  player: {
    /** @type {string} - Обычный игрок */
    default: '🧙',
    /** @type {string} - Альтернативный вариант */
    defaultAlt: '🧙'
  },
  
  /**
   * @namespace EMOJIS.monsters
   * @description Эмодзи монстров
   */
  monsters: {
    /** @type {string} - Призрак */
    ghost: '👻',
    /** @type {string} - Тыква */
    pumpkin: '🎃',
    /** @type {string} - Череп */
    skull: '💀',
    /** @type {string} - Скорпион */
    scorpion: '🦂',
    /** @type {string} - Летучая мышь */
    bat: '🦇',
    /** @type {string} - Демон */
    demon: '😈'
  },
  
  /**
   * @namespace EMOJIS.bosses
   * @description Эмодзи боссов
   */
  bosses: {
    /** @type {string} - Верховный демон (уровень 5) */
    demon: '👹',
    /** @type {string} - Разум (уровень 15) */
    mind: '🧠',
    /** @type {string} - Страж лабиринта (уровень 10) */
    guardian: '👹',
    /** @type {string} - Альтернативный вариант стража */
    guardianAlt: '🗿',
    /** @type {string} - Альтернативный вариант демона */
    demonAlt: '😈',
    /** @type {string} - Альтернативный вариант разума */
    mindAlt: '👁️'
  },
  
  /**
   * @namespace EMOJIS.minions
   * @description Эмодзи миньонов (призываемых существ)
   */
  minions: {
    /** @type {string} - Призрак-миньон */
    ghost: '👻',
    /** @type {string} - Тыква-миньон */
    pumpkin: '🎃',
    /** @type {string} - Череп-миньон */
    skull: '💀'
  },
  
  /**
   * @namespace EMOJIS.items
   * @description Эмодзи предметов и объектов
   */
  items: {
    /** @type {string} - Золото */
    gold: '💰',
    /** @type {string} - Зелье */
    potion: '🧪',
    /** @type {string} - Артефакт */
    artifact: '👑',
    /** @type {string} - Закрытый сундук */
    chestClosed: '📦',
    /** @type {string} - Сундук с золотом */
    chestGold: '✨💰✨',
    /** @type {string} - Сундук с артефактом */
    chestArtifact: '✨👑✨',
    /** @type {string} - Сундук-мимик */
    chestMimic: '😈📦',
    /** @type {string} - Магазин (лавка торговца) */
    shop: '🏪',
    /** @type {string} - Портал */
    portal: '🌀',
    /** @type {string} - Выходной портал */
    portalExit: '🚪',
  },
  
  /**
   * @namespace EMOJIS.shrines
   * @description Эмодзи алтарей
   */
  shrines: {
    /** @type {string} - Неактивный алтарь */
    inactive: '🔮🗿🔮',
    /** @type {string} - Активный алтарь */
    active: '🗿'
  },
  
  /**
   * @namespace EMOJIS.traps
   * @description Эмодзи ловушек
   */
  traps: {
    /** @type {string} - Взрывная ловушка */
    spike: '💥',
    /** @type {string} - Ледяная ловушка */
    ice: '❄️',
    /** @type {string} - Кислотная ловушка */
    acid: '🧪',
    /** @type {string} - Электрическая ловушка */
    lightning: '⚡',
    /** @type {string} - Псионическая ловушка */
    psionic: '🧠'
  },
  
  /**
   * @namespace EMOJIS.ui
   * @description Эмодзи для пользовательского интерфейса
   */
  ui: {
    /** @type {string} - Восклицательный знак */
    exclamation: '❗',
    /** @type {string} - Двойной восклицательный знак */
    doubleExclamation: '❗❗',
    /** @type {string} - Предупреждение */
    warning: '⚠️',
    /** @type {string} - Корона (для полоски здоровья босса) */
    crown: '👑'
  },

  /**
   * @namespace EMOJIS.torches
   * @description Эмодзи факелов
   */
  torches: {
    /** @type {string} - Обычный факел */
    normal: '🕯️',
    /** @type {string} - Магический факел */
    magic: '🔮',
    /** @type {string} - Альтернативный вариант */
    alt: '🕯'
  }
};

/**
 * Получение эмодзи Стража по роли (для уровня 10)
 * 
 * @param {string} role - Роль стража ('chaser' или 'shooter')
 * @returns {string} - Эмодзи стража
 */
export function getGuardianEmojiByRole(role) {
  // Для разнообразия можно использовать разные emoji
  if (role === 'chaser') {
    return '👹';  // Преследователь
  }
  return '👹';    // Стрелок (можно использовать другой, например '🗿')
}

/**
 * Получение эмодзи монстра по типу (для обратной совместимости с CSS)
 * 
 * @param {number} type - Тип монстра (1-4)
 * @returns {string} - Эмодзи монстра
 */
export const getMonsterEmojiByType = (type) => {
  const map = {
    1: EMOJIS.monsters.ghost,
    2: EMOJIS.monsters.pumpkin,
    3: EMOJIS.monsters.skull,
    4: EMOJIS.monsters.demon
  };
  return map[type] || EMOJIS.monsters.ghost;
};