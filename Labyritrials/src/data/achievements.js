/**
 * @fileoverview Данные о всех достижениях в игре.
 * Содержит названия, описания, иконки, категории и условия разблокировки.
 * 
 * @module data/achievements
 */

/**
 * @typedef {Object} AchievementData
 * @property {string} id - Уникальный идентификатор
 * @property {string} name - Название достижения
 * @property {string} description - Описание достижения
 * @property {string} icon - Иконка (эмодзи)
 * @property {string} category - Категория ('combat', 'exploration', 'collection', 'survival', 'secret')
 * @property {boolean} hidden - Скрыто ли достижение
 * @property {number} maxProgress - Максимальное значение прогресса
 * @property {Function} getProgress - Функция получения текущего прогресса
 * @property {Function} check - Функция проверки разблокировки
 */

/**
 * @constant {Object<string, AchievementData>} ACHIEVEMENTS_DATA - Все достижения в игре
 */
export const ACHIEVEMENTS_DATA = {
  // ============================================================
  // БОЕВЫЕ (Combat)
  // ============================================================

  /**
   * @achievement first_kill
   * @description Убить первого монстра
   */
  first_kill: {
    id: 'first_kill',
    name: 'Первый удар',
    description: 'Убейте первого монстра',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.monsters_killed || 0, 1),
    check: (progress) => (progress.monsters_killed || 0) >= 1
  },

  /**
   * @achievement monster_slayer
   * @description Убить 100 монстров
   */
  monster_slayer: {
    id: 'monster_slayer',
    name: 'Истребитель',
    description: 'Убейте 100 монстров',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    maxProgress: 100,
    getProgress: (progress) => Math.min(progress.monsters_killed || 0, 100),
    check: (progress) => (progress.monsters_killed || 0) >= 100
  },

  /**
   * @achievement monster_massacre
   * @description Убить 500 монстров
   */
  monster_massacre: {
    id: 'monster_massacre',
    name: 'Массовый убийца',
    description: 'Убейте 500 монстров',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    maxProgress: 500,
    getProgress: (progress) => Math.min(progress.monsters_killed || 0, 500),
    check: (progress) => (progress.monsters_killed || 0) >= 500
  },

  /**
   * @achievement monster_legend
   * @description Убить 1000 монстров
   */
  monster_legend: {
    id: 'monster_legend',
    name: 'Легендарный убийца',
    description: 'Убейте 1000 монстров',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    maxProgress: 1000,
    getProgress: (progress) => Math.min(progress.monsters_killed || 0, 1000),
    check: (progress) => (progress.monsters_killed || 0) >= 1000
  },

  /**
   * @achievement boss_hunter_5
   * @description Победить босса 5 уровня
   */
  boss_hunter_5: {
    id: 'boss_hunter_5',
    name: 'Первый босс',
    description: 'Одолейте босса 5 уровня',
    icon: '👹',
    category: 'combat',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.boss_5_killed || 0, 1),
    check: (progress) => (progress.boss_5_killed || 0) >= 1
  },

  /**
   * @achievement boss_hunter_10
   * @description Победить босса 10 уровня
   */
  boss_hunter_10: {
    id: 'boss_hunter_10',
    name: 'Победитель Разума',
    description: 'Одолейте босса 10 уровня',
    icon: '🧠',
    category: 'combat',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.boss_10_killed || 0, 1),
    check: (progress) => (progress.boss_10_killed || 0) >= 1
  },

  /**
   * @achievement boss_hunter_15
   * @description Победить босса 15 уровня
   */
  boss_hunter_15: {
    id: 'boss_hunter_15',
    name: 'Победитель Стражей',
    description: 'Одолейте босса 15 уровня',
    icon: '🗿',
    category: 'combat',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.boss_15_killed || 0, 1),
    check: (progress) => (progress.boss_15_killed || 0) >= 1
  },

  /**
   * @achievement boss_conqueror
   * @description Победить всех боссов
   */
  boss_conqueror: {
    id: 'boss_conqueror',
    name: 'Покоритель боссов',
    description: 'Одолейте всех боссов',
    icon: '👑',
    category: 'combat',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => {
      const hasBoss5 = progress.boss_5_killed || 0;
      const hasBoss10 = progress.boss_10_killed || 0;
      const hasBoss15 = progress.boss_15_killed || 0;
      return (hasBoss5 >= 1 && hasBoss10 >= 1 && hasBoss15 >= 1) ? 1 : 0;
    },
    check: (progress) => {
      const hasBoss5 = progress.boss_5_killed || 0;
      const hasBoss10 = progress.boss_10_killed || 0;
      const hasBoss15 = progress.boss_15_killed || 0;
      return hasBoss5 >= 1 && hasBoss10 >= 1 && hasBoss15 >= 1;
    }
  },

  /**
   * @achievement fire_mage
   * @description Убить 50 монстров огненным шаром
   */
  fire_mage: {
    id: 'fire_mage',
    name: 'Огненный маг',
    description: 'Убейте 50 монстров огненным шаром',
    icon: '🔥',
    category: 'combat',
    hidden: false,
    maxProgress: 50,
    getProgress: (progress) => Math.min(progress.fireball_kills || 0, 50),
    check: (progress) => (progress.fireball_kills || 0) >= 50
  },

  /**
   * @achievement vampire_lord
   * @description Восстановить 500 HP через вампиризм
   */
  vampire_lord: {
    id: 'vampire_lord',
    name: 'Повелитель вампиров',
    description: 'Восстановите 500 HP через вампиризм',
    icon: '🦇',
    category: 'combat',
    hidden: false,
    maxProgress: 500,
    getProgress: (progress) => Math.min(progress.vampire_heal || 0, 500),
    check: (progress) => (progress.vampire_heal || 0) >= 500
  },

  /**
   * @achievement thunderer
   * @description Оглушить 100 монстров
   */
  thunderer: {
    id: 'thunderer',
    name: 'Громовержец',
    description: 'Оглушите 100 монстров',
    icon: '⚡',
    category: 'combat',
    hidden: false,
    maxProgress: 100,
    getProgress: (progress) => Math.min(progress.stun_kills || 0, 100),
    check: (progress) => (progress.stun_kills || 0) >= 100
  },

  // ============================================================
  // ИССЛЕДОВАТЕЛЬСКИЕ (Exploration)
  // ============================================================

  /**
   * @achievement explorer
   * @description Открыть 100% карты на любом уровне
   */
  explorer: {
    id: 'explorer',
    name: 'Исследователь',
    description: 'Откройте 100% карты на любом уровне',
    icon: '🗺️',
    category: 'exploration',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.map_cleared || 0, 1),
    check: (progress) => (progress.map_cleared || 0) >= 1
  },

  /**
   * @achievement cartographer
   * @description Купить карту в магазине
   */
  cartographer: {
    id: 'cartographer',
    name: 'Картограф',
    description: 'Купите карту в магазине',
    icon: '📜',
    category: 'exploration',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.map_bought || 0, 1),
    check: (progress) => (progress.map_bought || 0) >= 1
  },

  /**
   * @achievement treasure_hunter
   * @description Найти сокровищницу
   */
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Кладоискатель',
    description: 'Найдите сокровищницу',
    icon: '💰',
    category: 'exploration',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.treasure_room_found || 0, 1),
    check: (progress) => (progress.treasure_room_found || 0) >= 1
  },

  /**
   * @achievement mystic
   * @description Найти комнату с алтарём
   */
  mystic: {
    id: 'mystic',
    name: 'Мистик',
    description: 'Найдите комнату с алтарём',
    icon: '🔮',
    category: 'exploration',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.shrine_room_found || 0, 1),
    check: (progress) => (progress.shrine_room_found || 0) >= 1
  },

  /**
   * @achievement daredevil
   * @description Найти комнату-ловушку
   */
  daredevil: {
    id: 'daredevil',
    name: 'Сорвиголова',
    description: 'Найдите комнату-ловушку',
    icon: '💀',
    category: 'exploration',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.trap_room_found || 0, 1),
    check: (progress) => (progress.trap_room_found || 0) >= 1
  },

  /**
   * @achievement adventurer
   * @description Посетить все 3 типа тайных комнат
   */
  adventurer: {
    id: 'adventurer',
    name: 'Авантюрист',
    description: 'Посетите все 3 типа тайных комнат',
    icon: '🎯',
    category: 'exploration',
    hidden: false,
    maxProgress: 3,
    getProgress: (progress) => {
      let count = 0;
      if (progress.treasure_room_found) count++;
      if (progress.shrine_room_found) count++;
      if (progress.trap_room_found) count++;
      return Math.min(count, 3);
    },
    check: (progress) => {
      let count = 0;
      if (progress.treasure_room_found) count++;
      if (progress.shrine_room_found) count++;
      if (progress.trap_room_found) count++;
      return count >= 3;
    }
  },

  // ============================================================
  // КОЛЛЕКЦИОННЫЕ (Collection)
  // ============================================================

  /**
   * @achievement gold_finder
   * @description Собрать 1000 золота
   */
  gold_finder: {
    id: 'gold_finder',
    name: 'Золотоискатель',
    description: 'Соберите 1000 золота',
    icon: '💰',
    category: 'collection',
    hidden: false,
    maxProgress: 1000,
    getProgress: (progress) => Math.min(progress.gold_collected || 0, 1000),
    check: (progress) => (progress.gold_collected || 0) >= 1000
  },

  /**
   * @achievement gold_hoarder
   * @description Собрать 5000 золота
   */
  gold_hoarder: {
    id: 'gold_hoarder',
    name: 'Сребролюбец',
    description: 'Соберите 5000 золота',
    icon: '💰',
    category: 'collection',
    hidden: false,
    maxProgress: 5000,
    getProgress: (progress) => Math.min(progress.gold_collected || 0, 5000),
    check: (progress) => (progress.gold_collected || 0) >= 5000
  },

  /**
   * @achievement gold_millionaire
   * @description Собрать 10000 золота
   */
  gold_millionaire: {
    id: 'gold_millionaire',
    name: 'Миллионер',
    description: 'Соберите 10000 золота',
    icon: '💎',
    category: 'collection',
    hidden: false,
    maxProgress: 10000,
    getProgress: (progress) => Math.min(progress.gold_collected || 0, 10000),
    check: (progress) => (progress.gold_collected || 0) >= 10000
  },

  /**
   * @achievement collector
   * @description Собрать 10 артефактов
   */
  collector: {
    id: 'collector',
    name: 'Коллекционер',
    description: 'Соберите 10 артефактов',
    icon: '👑',
    category: 'collection',
    hidden: false,
    maxProgress: 10,
    getProgress: (progress) => Math.min(progress.artifacts_collected || 0, 10),
    check: (progress) => (progress.artifacts_collected || 0) >= 10
  },

  /**
   * @achievement artifactor
   * @description Собрать 30 артефактов
   */
  artifactor: {
    id: 'artifactor',
    name: 'Артефактор',
    description: 'Соберите 30 артефактов',
    icon: '✨',
    category: 'collection',
    hidden: false,
    maxProgress: 30,
    getProgress: (progress) => Math.min(progress.artifacts_collected || 0, 30),
    check: (progress) => (progress.artifacts_collected || 0) >= 30
  },

  /**
   * @achievement fully_equipped
   * @description Купить всё оружие в магазине
   */
  fully_equipped: {
    id: 'fully_equipped',
    name: 'Экипированный',
    description: 'Купите всё оружие в магазине',
    icon: '🛡️',
    category: 'collection',
    hidden: false,
    maxProgress: 3,
    getProgress: (progress) => Math.min(progress.weapons_bought || 0, 3),
    check: (progress) => (progress.weapons_bought || 0) >= 3
  },

  /**
   * @achievement story_collector
   * @description Собрать все записки
   */
  story_collector: {
    id: 'story_collector',
    name: 'Собиратель историй',
    description: 'Соберите все записки',
    icon: '📖',
    category: 'collection',
    hidden: false,
    maxProgress: 12,
    getProgress: (progress) => Math.min(progress.notes_found || 0, 12),
    check: (progress) => (progress.notes_found || 0) >= 12
  },

  // ============================================================
  // ВЫЖИВАНИЕ (Survival)
  // ============================================================

  /**
   * @achievement survivor
   * @description Достигнуть 5 уровня
   */
  survivor: {
    id: 'survivor',
    name: 'Выживший',
    description: 'Достигните 5 уровня',
    icon: '🌟',
    category: 'survival',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => (progress.level_5_reached || 0) >= 1 ? 1 : 0,
    check: (progress) => (progress.level_5_reached || 0) >= 1
  },

  /**
   * @achievement veteran
   * @description Достигнуть 10 уровня
   */
  veteran: {
    id: 'veteran',
    name: 'Ветеран',
    description: 'Достигните 10 уровня',
    icon: '⭐',
    category: 'survival',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => (progress.level_10_reached || 0) >= 1 ? 1 : 0,
    check: (progress) => (progress.level_10_reached || 0) >= 1
  },

  /**
   * @achievement labyrinth_master
   * @description Достигнуть 15 уровня
   */
  labyrinth_master: {
    id: 'labyrinth_master',
    name: 'Мастер лабиринта',
    description: 'Достигните 15 уровня',
    icon: '👑',
    category: 'survival',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => (progress.level_15_reached || 0) >= 1 ? 1 : 0,
    check: (progress) => (progress.level_15_reached || 0) >= 1
  },

  /**
   * @achievement iron_man
   * @description Пройти до первого босса без получения урона
   */
  iron_man: {
    id: 'iron_man',
    name: 'Железный человек',
    description: 'Пройдите до первого босса, не получив урона',
    icon: '🛡️',
    category: 'survival',
    hidden: false,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.iron_man_complete || 0, 1),
    check: (progress) => (progress.iron_man_complete || 0) >= 1
  },

  // ============================================================
  // СКРЫТЫЕ (Secret)
  // ============================================================

  /**
   * @achievement secret_meeting
   * @description Активировать алтарь
   */
  secret_meeting: {
    id: 'secret_meeting',
    name: 'Мистическая встреча',
    description: 'Активируйте алтарь',
    icon: '🔮',
    category: 'secret',
    hidden: true,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.shrine_activated || 0, 1),
    check: (progress) => (progress.shrine_activated || 0) >= 1
  },

  /**
   * @achievement potion_glutton
   * @description Собрать 50 зелий здоровья
   */
  potion_glutton: {
    id: 'potion_glutton',
    name: 'Зельевар',
    description: 'Соберите 50 зелий здоровья',
    icon: '🧪',
    category: 'secret',
    hidden: true,
    maxProgress: 50,
    getProgress: (progress) => Math.min(progress.potions_collected || 0, 50),
    check: (progress) => (progress.potions_collected || 0) >= 50
  },

  /**
   * @achievement dodge_master
   * @description Увернуться от 20 ловушек
   */
  dodge_master: {
    id: 'dodge_master',
    name: 'Мастер уворота',
    description: 'Увернитесь от 20 ловушек',
    icon: '💨',
    category: 'secret',
    hidden: true,
    maxProgress: 20,
    getProgress: (progress) => Math.min(progress.traps_dodged || 0, 20),
    check: (progress) => (progress.traps_dodged || 0) >= 20
  },

  /**
   * @achievement unlucky
   * @description Умереть на первом уровне
   */
  unlucky: {
    id: 'unlucky',
    name: 'Неудачник',
    description: 'Умрите на первом уровне',
    icon: '😅',
    category: 'secret',
    hidden: true,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.death_on_level_1 || 0, 1),
    check: (progress) => (progress.death_on_level_1 || 0) >= 1
  },

  /**
   * @achievement cleaner
   * @description Зачистить уровень 5 раз
   */
  cleaner: {
    id: 'cleaner',
    name: 'Чистильщик',
    description: 'Убейте всех монстров на уровне (зачистка) 5 раз',
    icon: '🧹',
    category: 'secret',
    hidden: true,
    maxProgress: 5,
    getProgress: (progress) => Math.min(progress.clears || 0, 5),
    check: (progress) => (progress.clears || 0) >= 5
  },

  /**
   * @achievement trap_master
   * @description Попасться во все типы ловушек
   */
  trap_master: {
    id: 'trap_master',
    name: 'Знаток ловушек',
    description: 'Попадитесь во все типы ловушек',
    icon: '⚠️',
    category: 'secret',
    hidden: true,
    maxProgress: 5,
    getProgress: (progress) => {
      let count = 0;
      if (progress.trap_spike) count++;
      if (progress.trap_ice) count++;
      if (progress.trap_acid) count++;
      if (progress.trap_lightning) count++;
      if (progress.trap_psionic) count++;
      return Math.min(count, 5);
    },
    check: (progress) => {
      let count = 0;
      if (progress.trap_spike) count++;
      if (progress.trap_ice) count++;
      if (progress.trap_acid) count++;
      if (progress.trap_lightning) count++;
      if (progress.trap_psionic) count++;
      return count >= 5;
    }
  },

  /**
   * @achievement shadow
   * @description Пройти уровень без убийств
   */
  shadow: {
    id: 'shadow',
    name: 'Тень',
    description: 'Пройдите уровень, не убив ни одного монстра',
    icon: '🌑',
    category: 'secret',
    hidden: true,
    maxProgress: 1,
    getProgress: (progress) => Math.min(progress.shadow_complete || 0, 1),
    check: (progress) => (progress.shadow_complete || 0) >= 1
  },

  /**
   * @achievement mimic_paranoid
   * @description Открыть 10 сундуков-мимиков
   */
  mimic_paranoid: {
    id: 'mimic_paranoid',
    name: 'Параноик',
    description: 'Откройте 10 сундуков-мимиков',
    icon: '😈',
    category: 'secret',
    hidden: true,
    maxProgress: 10,
    getProgress: (progress) => Math.min(progress.mimic_total || 0, 10),
    check: (progress) => (progress.mimic_total || 0) >= 10
  }
};

// ============================================================
// КАТЕГОРИИ ДОСТИЖЕНИЙ
// ============================================================

/**
 * @constant {Object} CATEGORIES_DATA - Категории достижений
 */
export const CATEGORIES_DATA = {
  combat: { id: 'combat', name: 'Боевые', icon: '🗡️' },
  exploration: { id: 'exploration', name: 'Исследовательские', icon: '🗺️' },
  collection: { id: 'collection', name: 'Коллекционные', icon: '💰' },
  survival: { id: 'survival', name: 'Выживание', icon: '🛡️' },
  secret: { id: 'secret', name: 'Скрытые', icon: '✨' }
};

/**
 * Получение данных о достижении по ID
 * 
 * @param {string} id - ID достижения
 * @returns {AchievementData|undefined} - Данные о достижении или undefined
 */
export function getAchievementData(id) {
  return ACHIEVEMENTS_DATA[id];
}

/**
 * Получение всех достижений
 * 
 * @returns {AchievementData[]} - Массив данных о достижениях
 */
export function getAllAchievements() {
  return Object.values(ACHIEVEMENTS_DATA);
}

/**
 * Получение достижений по категории
 * 
 * @param {string} categoryId - ID категории
 * @returns {AchievementData[]} - Массив данных о достижениях в категории
 */
export function getAchievementsByCategory(categoryId) {
  return Object.values(ACHIEVEMENTS_DATA).filter(a => a.category === categoryId);
}

/**
 * Получение всех категорий достижений
 * 
 * @returns {Object} - Объект с категориями
 */
export function getCategories() {
  return CATEGORIES_DATA;
}

/**
 * Получение общего количества достижений
 * 
 * @returns {number} - Общее количество достижений
 */
export function getTotalAchievementsCount() {
  return Object.keys(ACHIEVEMENTS_DATA).length;
}