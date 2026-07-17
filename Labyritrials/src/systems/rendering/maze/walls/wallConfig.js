/**
 * @fileoverview Конфигурация всех видов стен в игре.
 * Определяет цвета, обводки и особенности для каждого типа стен
 * в зависимости от типа комнаты или уровня.
 * 
 * @module systems/rendering/maze/walls/wallConfig
 */

/**
 * @namespace WALL_TYPES
 * @description Объект с конфигурациями всех типов стен
 */
export const WALL_TYPES = {
  /**
   * @type {Object}
   * @description Стандартная стена лабиринта
   */
  DEFAULT: {
    id: 'default',
    name: 'Стандартная',
    color: '#14191f',
    borderColor: '#0a0d10',
    borderWidth: 7,
    features: []
  },

  /**
   * @type {Object}
   * @description Стена в безопасной комнате (более светлая, тонкая обводка)
   */
  SAFE_ROOM: {
    id: 'safe_room',
    name: 'Стена безопасной комнаты',
    color: '#1a2a3a',
    borderColor: '#0d1a2a',
    borderWidth: 4.5,
    features: []
  },

  /**
   * @type {Object}
   * @description Стена на арене демона (уровень 5) — тёмно-красная
   */
  BOSS_DEMON: {
    id: 'boss_demon',
    name: 'Стена арены демона',
    color: '#1a0a0a',
    borderColor: '#0d0505',
    borderWidth: 7,
    features: ['demonicGlow']
  },

  /**
   * @type {Object}
   * @description Стена на арене разума (уровень 10) — тёмно-синяя
   */
  BOSS_MIND: {
    id: 'boss_mind',
    name: 'Стена арены разума',
    color: '#0a1a2a',
    borderColor: '#05101a',
    borderWidth: 7,
    features: ['psiGlow']
  },

  /**
   * @type {Object}
   * @description Стена на арене стражей (уровень 15) — тёмно-красная
   */
  BOSS_GUARDIAN: {
    id: 'boss_guardian',
    name: 'Стена арены стражей',
    color: '#1a0a0a',
    borderColor: '#0d0505',
    borderWidth: 7,
    features: ['guardianGlow']
  },

  /**
   * @type {Object}
   * @description Стена в сокровищнице — золотисто-коричневая
   */
  TREASURE_ROOM: {
    id: 'treasure_room',
    name: 'Стена сокровищницы',
    color: '#4a3a15',
    borderColor: '#2a1a0a',
    borderWidth: 7,
    features: []
  },

  /**
   * @type {Object}
   * @description Стена в комнате с алтарём — стандартная с фиолетовым свечением
   */
  SHRINE_ROOM: {
    id: 'shrine_room',
    name: 'Стена комнаты с алтарём',
    color: '#14191f',
    borderColor: '#0a0d10',
    borderWidth: 7,
    features: ['shrineGlow']
  },

  /**
   * @type {Object}
   * @description Стена в комнате-ловушке — стандартная с красным свечением
   */
  TRAP_ROOM: {
    id: 'trap_room',
    name: 'Стена комнаты-ловушки',
    color: '#14191f',
    borderColor: '#0a0d10',
    borderWidth: 7,
    features: ['trapGlow']
  }
};

/**
 * Получение конфигурации стены по типу
 * 
 * @param {string} type - Тип стены (ключ из WALL_TYPES)
 * @returns {Object} - Конфигурация стены
 */
export function getWallConfig(type) {
  return WALL_TYPES[type] || WALL_TYPES.DEFAULT;
}

/**
 * Получение цвета стены
 * 
 * @param {string} type - Тип стены
 * @returns {string} - Цвет стены
 */
export function getWallColor(type) {
  const config = getWallConfig(type);
  return config.color;
}

/**
 * Получение цвета обводки стены
 * 
 * @param {string} type - Тип стены
 * @returns {string} - Цвет обводки
 */
export function getWallBorderColor(type) {
  const config = getWallConfig(type);
  return config.borderColor;
}

/**
 * Получение толщины обводки стены
 * 
 * @param {string} type - Тип стены
 * @returns {number} - Толщина обводки в пикселях
 */
export function getWallBorderWidth(type) {
  const config = getWallConfig(type);
  return config.borderWidth;
}

/**
 * Получение особенностей стены
 * 
 * @param {string} type - Тип стены
 * @returns {string[]} - Массив особенностей
 */
export function getWallFeatures(type) {
  const config = getWallConfig(type);
  return config.features || [];
}

/**
 * Проверка наличия особенности у стены
 * 
 * @param {string} type - Тип стены
 * @param {string} feature - Название особенности
 * @returns {boolean} - true, если особенность присутствует
 */
export function hasWallFeature(type, feature) {
  const config = getWallConfig(type);
  return config.features?.includes(feature) || false;
}

/**
 * Определение типа стены по текущему состоянию игры
 * 
 * @param {Object} state - Объект состояния игры
 * @param {boolean} state.inSafeRoom - В безопасной комнате
 * @param {boolean} state.isBossLevel - Босс-уровень
 * @param {number} state.gameLevel - Номер уровня
 * @param {boolean} state.inTreasureRoom - В сокровищнице
 * @param {boolean} state.inShrineRoom - В комнате с алтарём
 * @param {boolean} state.inTrapRoom - В комнате-ловушке
 * @returns {string} - Тип стены (ключ из WALL_TYPES)
 */
export function getWallTypeFromState(state) {
  if (state.inSafeRoom) {
    return 'SAFE_ROOM';
  }
  
  if (state.isBossLevel) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    switch (bossLevel) {
      case 5:  return 'BOSS_DEMON';
      case 10: return 'BOSS_MIND';
      case 15: return 'BOSS_GUARDIAN';
      default: return 'BOSS_DEMON';
    }
  }
  
  if (state.inTreasureRoom) return 'TREASURE_ROOM';
  if (state.inShrineRoom) return 'SHRINE_ROOM';
  if (state.inTrapRoom) return 'TRAP_ROOM';
  
  return 'DEFAULT';
}