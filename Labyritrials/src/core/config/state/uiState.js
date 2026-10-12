/**
 * @fileoverview UI-флаги и объекты UI.
 * 
 * @module core/config/state/uiState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {boolean} - Открыт ли магазин */
  isShopOpen: false,
  /** @type {boolean} - Показывать ли подсказку магазина */
  showShopPrompt: false,
  /** @type {number} - Сила тряски экрана */
  screenShake: 0,

  /** @type {string|null} - Название текущей комнаты */
  roomLabel: null,
  /** @type {string|null} - Цвет рамки и текста названия */
  roomLabelColor: null,

  /** @type {Array} - Книжные полки (в безопасной комнате) */
  bookshelves: [],
  /** @type {Array} - Доски заданий (в безопасной комнате) */
  taskBoards: [],

  /** @type {number} - Время простоя игрока (мс) для анимации waiting */
  idleTime: 0,
});