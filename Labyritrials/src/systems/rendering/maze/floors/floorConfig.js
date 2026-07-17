/**
 * @fileoverview Конфигурация всех видов полов в игре.
 * Определяет цвета, узоры и особенности для каждого типа комнаты.
 * 
 * @module systems/rendering/maze/floors/floorConfig
 */

/**
 * @namespace FLOOR_TYPES
 * @description Объект с конфигурациями всех типов полов
 */
export const FLOOR_TYPES = {
  /**
   * @type {Object}
   * @description Обычный пол лабиринта
   */
  DEFAULT: {
    id: 'default',
    name: 'Стандартный',
    colors: ['#0b0d13'],
    pattern: 'solid',
    features: []
  },

  /**
   * @type {Object}
   * @description Безопасная комната (шахматный пол с магическим кругом)
   */
  SAFE_ROOM: {
    id: 'safe_room',
    name: 'Безопасная комната',
    colors: ['#1a2a3a', '#2d4a60'],
    pattern: 'checkered',
    features: ['magicCircle', 'cornerRunes']
  },

  /**
   * @type {Object}
   * @description Босс-арена: Демон (уровень 5)
   */
  BOSS_DEMON: {
    id: 'boss_demon',
    name: 'Арена демона',
    colors: ['#1a0a0a'],
    pattern: 'solid',
    features: []
  },

  /**
   * @type {Object}
   * @description Босс-арена: Разум (уровень 10)
   */
  BOSS_MIND: {
    id: 'boss_mind',
    name: 'Арена разума',
    colors: ['#0a1a2a'],
    pattern: 'solid',
    features: []
  },

  /**
   * @type {Object}
   * @description Босс-арена: Стражи (уровень 15)
   */
  BOSS_GUARDIAN: {
    id: 'boss_guardian',
    name: 'Арена стражей',
    colors: ['#1a0a0a'],
    pattern: 'solid',
    features: []
  },

  /**
   * @type {Object}
   * @description Сокровищница
   */
  TREASURE_ROOM: {
    id: 'treasure_room',
    name: 'Сокровищница',
    colors: ['#1a1508'],
    pattern: 'solid',
    features: []
  },

  /**
   * @type {Object}
   * @description Комната с алтарём
   */
  SHRINE_ROOM: {
    id: 'shrine_room',
    name: 'Комната с алтарём',
    colors: ['#0b0d13'],
    pattern: 'solid',
    features: ['shrineGlow']
  },

  /**
   * @type {Object}
   * @description Комната-ловушка
   */
  TRAP_ROOM: {
    id: 'trap_room',
    name: 'Комната-ловушка',
    colors: ['#0b0d13'],
    pattern: 'solid',
    features: ['trapGlow']
  }
};

/**
 * Получение конфигурации пола по типу
 * 
 * @param {string} type - Тип пола (ключ из FLOOR_TYPES)
 * @returns {Object} - Конфигурация пола
 */
export function getFloorConfig(type) {
  return FLOOR_TYPES[type] || FLOOR_TYPES.DEFAULT;
}

/**
 * Получение цветов пола
 * 
 * @param {string} type - Тип пола
 * @returns {string[]} - Массив цветов
 */
export function getFloorColors(type) {
  const config = getFloorConfig(type);
  return config.colors;
}

/**
 * Получение основного цвета пола
 * 
 * @param {string} type - Тип пола
 * @returns {string} - Основной цвет
 */
export function getFloorMainColor(type) {
  const colors = getFloorColors(type);
  return colors[0];
}

/**
 * Проверка, является ли пол шахматным
 * 
 * @param {string} type - Тип пола
 * @returns {boolean} - true, если пол шахматный
 */
export function isCheckered(type) {
  const config = getFloorConfig(type);
  return config.pattern === 'checkered';
}

/**
 * Получение особенностей пола
 * 
 * @param {string} type - Тип пола
 * @returns {string[]} - Массив особенностей
 */
export function getFloorFeatures(type) {
  const config = getFloorConfig(type);
  return config.features || [];
}

/**
 * Проверка наличия особенности у пола
 * 
 * @param {string} type - Тип пола
 * @param {string} feature - Название особенности
 * @returns {boolean} - true, если особенность присутствует
 */
export function hasFeature(type, feature) {
  const config = getFloorConfig(type);
  return config.features?.includes(feature) || false;
}

/**
 * Определение типа пола по текущему состоянию игры
 * 
 * @param {Object} state - Объект состояния игры
 * @param {boolean} state.inSafeRoom - В безопасной комнате
 * @param {boolean} state.isBossLevel - Босс-уровень
 * @param {number} state.gameLevel - Номер уровня
 * @param {boolean} state.inTreasureRoom - В сокровищнице
 * @param {boolean} state.inShrineRoom - В комнате с алтарём
 * @param {boolean} state.inTrapRoom - В комнате-ловушке
 * @returns {string} - Тип пола (ключ из FLOOR_TYPES)
 */
export function getFloorTypeFromState(state) {
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