/**
 * @fileoverview Конфигурация спрайтов игрока
 * @module sprites/spriteConfig
 */

import { SPRITE_SIZES } from '../../core/config/index.js';

/**
 * Размер отображения игрока на экране (в пикселях)
 * @type {number}
 */
export const PLAYER_DISPLAY_SIZE = SPRITE_SIZES.player.displaySize;

/**
 * Порядок направлений (индекс = номер строки в спрайт-листе)
 * @type {string[]}
 */
export const DIRECTION_ORDER = [
  'south',      // 0 - вниз
  'southwest',  // 1 - вниз-влево
  'west',       // 2 - влево
  'northwest',  // 3 - вверх-влево
  'north',      // 4 - вверх
  'northeast',  // 5 - вверх-вправо
  'east',       // 6 - вправо
  'southeast',  // 7 - вниз-вправо
];

/**
 * Маппинг направлений на имена спрайтов в атласе
 */
export const DIRECTION_SPRITE_NAMES = {
  south: 'south',
  southwest: 'southwest',
  west: 'west',
  northwest: 'northwest',
  north: 'north',
  northeast: 'northeast',
  east: 'east',
  southeast: 'southeast',
};

/**
 * Получение имени спрайта для конкретного кадра
 * @param {string} gender - Пол ('male' или 'female')
 * @param {string} state - Состояние ('idle', 'walk', 'attack')
 * @param {string} direction - Направление ('south', 'southwest', 'west', ...)
 * @param {number} frameIndex - Индекс кадра
 * @returns {string} - Имя спрайта в атласе
 */
export function getCharacterSpriteName(gender, state, direction, frameIndex = 0) {
  const dirName = DIRECTION_SPRITE_NAMES[direction] || 'south';
  return `${gender}_${state}_${dirName}_${frameIndex}`;
}

/**
 * Получение базового имени спрайта для состояния и направления
 * @param {string} gender - Пол ('male' или 'female')
 * @param {string} state - Состояние ('idle', 'walk', 'attack')
 * @param {string} direction - Направление ('south', 'southwest', 'west', ...)
 * @returns {string} - Базовое имя спрайта
 */
export function getCharacterBaseSpriteName(gender, state, direction) {
  const dirName = DIRECTION_SPRITE_NAMES[direction] || 'south';
  return `${gender}_${state}_${dirName}`;
}

/**
 * Конфигурация анимаций для каждого состояния
 * @type {Object}
 */
export const ANIMATION_CONFIG = {
  idle: {
    frameWidth: 100,
    frameHeight: 100,
    columns: 4,
    rows: 2,
    framesPerDirection: 1,
    totalDirections: 8,
    fps: 1,
    spritePattern: '{gender}_idle_{direction}_0',
  },
  walk: {
    frameWidth: 100,
    frameHeight: 100,
    columns: 8,
    rows: 8,
    framesPerDirection: 8,
    totalDirections: 8,
    fps: 10,
    spritePattern: '{gender}_walk_{direction}_{frame}',
  },
  attack: {
    frameWidth: 100,
    frameHeight: 100,
    columns: 9,
    rows: 8,
    framesPerDirection: 9,
    totalDirections: 8,
    fps: 18,
    spritePattern: '{gender}_attack_{direction}_{frame}',
  },
};

/**
 * Получение конфигурации анимации для состояния
 * @param {string} state - Состояние ('idle', 'walk', 'attack')
 * @returns {Object} - Конфигурация анимации
 */
export function getAnimationConfig(state) {
  return ANIMATION_CONFIG[state] || ANIMATION_CONFIG.idle;
}

/**
 * Получение индекса направления по координатам
 * @param {number} dirX - Направление по X (-1, 0, 1)
 * @param {number} dirY - Направление по Y (-1, 0, 1)
 * @returns {number} - Индекс направления (0-7)
 */
export function getDirectionIndex(dirX, dirY) {
  if (dirX === 0 && dirY === 0) return 0;
  
  const mapping = {
    '0,-1': 4,  // North (вверх)
    '0,1': 0,   // South (вниз)
    '1,0': 6,   // East (вправо)
    '-1,0': 2,  // West (влево)
    '1,-1': 5,  // Northeast (вверх-вправо)
    '-1,-1': 3, // Northwest (вверх-влево)
    '1,1': 7,   // Southeast (вниз-вправо)
    '-1,1': 1,  // Southwest (вниз-влево)
  };
  
  return mapping[`${dirX},${dirY}`] || 0;
}

/**
 * Получение имени направления по индексу
 * @param {number} index - Индекс направления (0-7)
 * @returns {string} - Название направления
 */
export function getDirectionName(index) {
  return DIRECTION_ORDER[index] || 'south';
}

/**
 * Получение индекса направления по имени
 * @param {string} name - Название направления
 * @returns {number} - Индекс направления (0-7)
 */
export function getDirectionIndexByName(name) {
  const index = DIRECTION_ORDER.indexOf(name);
  return index !== -1 ? index : 0;
}