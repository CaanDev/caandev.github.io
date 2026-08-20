/**
 * @fileoverview Конфигурация спрайтов игрока
 * @module sprites/spriteConfig
 */

/**
 * Размер отображения игрока на экране (в пикселях)
 * @type {number}
 */
export const PLAYER_DISPLAY_SIZE = 150;

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
 * Конфигурация всех спрайт-листов игрока
 * @namespace SPRITE_CONFIG
 * @type {Object.<string, SpriteConfig>}
 */
export const SPRITE_CONFIG = {
  /**
   * Конфигурация анимации бездействия
   * @type {SpriteConfig}
   */
  idle: {
    path: 'assets/spritesheets/characters/male/idle.png',
    frameWidth: 100,
    frameHeight: 100,
    framesPerDirection: 1,
    totalDirections: 8,
    fps: 1,
    columns: 4,
    rows: 2,
  },
  /**
   * Конфигурация анимации ходьбы
   * @type {SpriteConfig}
   */
  walk: {
    path: 'assets/spritesheets/characters/male/walk.png',
    frameWidth: 100,
    frameHeight: 100,
    framesPerDirection: 8,
    totalDirections: 8,
    fps: 10,
    columns: 8,
    rows: 8,
  },
  /**
   * Конфигурация анимации атаки
   * @type {SpriteConfig}
   */
  attack: {
    path: 'assets/spritesheets/characters/male/attack.png',
    frameWidth: 100,
    frameHeight: 100,
    framesPerDirection: 9,
    totalDirections: 8,
    fps: 18,
    columns: 9,
    rows: 8,
  },
};

/**
 * @typedef {Object} SpriteConfig
 * @property {string} path - Путь к файлу спрайт-листа
 * @property {number} frameWidth - Ширина одного кадра в пикселях
 * @property {number} frameHeight - Высота одного кадра в пикселях
 * @property {number} framesPerDirection - Количество кадров на одно направление
 * @property {number} totalDirections - Общее количество направлений (8)
 * @property {number} fps - Скорость анимации в кадрах в секунду
 * @property {number} columns - Количество колонок в спрайт-листе
 * @property {number} rows - Количество строк в спрайт-листе
 */

/**
 * Получение конфигурации для состояния
 * @param {string} state - Название состояния ('idle', 'walk', 'attack')
 * @returns {SpriteConfig|undefined} - Конфигурация состояния
 */
export function getSpriteConfig(state) {
  return SPRITE_CONFIG[state];
}

/**
 * Получение индекса направления по координатам
 * @param {number} dirX - Направление по X (-1, 0, 1)
 * @param {number} dirY - Направление по Y (-1, 0, 1)
 * @returns {number} - Индекс направления (0-7)
 */
export function getDirectionIndex(dirX, dirY) {
  if (dirX === 0 && dirY === 0) return 0;
  
  const key = `${dirX},${dirY}`;
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
  
  return mapping[key] || 0;
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