/**
 * @fileoverview Конфигурация интерактивных объектов.
 * @module entities/player/interactions/config
 */

/**
 * @namespace INTERACTION_CONFIG
 * @description Настройки всех интерактивных объектов
 * 
 * @property {Object} shop - Лавка торговца
 * @property {Object} bookshelf - Книжная полка
 * @property {Object} taskBoard - Доска заданий
 * @property {Object} researcher - NPC-исследовательница
 * @property {Object} spiritCatcher - Ловец духов (пленение оглушённых огоньков)
 */
export const INTERACTION_CONFIG = {
  /**
   * Лавка торговца
   */
  shop: {
    /** @type {number} - Радиус взаимодействия (px) */
    radius: 100,
    /** @type {string} - Ключ в SPRITE_SIZES.cells.offsets */
    offsetsKey: 'shop',
    /** @type {string} - Цвет подсказки (RGBA без alpha) */
    promptColor: 'rgba(241, 196, 15,',
  },

  /**
   * Книжная полка
   */
  bookshelf: {
    radius: 100,
    offsetsKey: 'bookshelf',
    promptText: '[E] Библиотека',
    promptColor: 'rgba(241, 196, 15,',
  },

  /**
   * Доска заданий
   */
  taskBoard: {
    radius: 100,
    offsetsKey: 'taskBoard',
    promptText: '[E] Доска заданий',
    promptColor: 'rgba(241, 196, 15,',
  },

  /**
   * NPC-исследовательница
   */
  researcher: {
    radius: 40,
    promptColor: 'rgba(241, 196, 15,',
  },

  /**
   * Ловец духов (пленение оглушённых огоньков)
   */
  spiritCatcher: {
    /** @type {number} - Радиус взаимодействия с оглушённым огоньком (px) */
    radius: 60,
    /** @type {string} - Цвет подсказки (RGBA без alpha) */
    promptColor: 'rgba(255, 215, 0,',
    /** @type {string} - Текст подсказки */
    promptText: '[E] Поймать',
  },
};