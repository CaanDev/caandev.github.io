/**
 * @fileoverview Флаги состояния игрока.
 * Не путать с объектом player (player.js) — там сами характеристики.
 * 
 * @module core/config/state/playerState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {Object} - Состояние клавиш */
  keys: {},
  /** @type {boolean} - Виден ли игрок на экране (для анимации обрушения) */
  playerVisible: true,
  /** @type {boolean} - Отключён ли игрок (не может двигаться, атаковать) */
  isPlayerDisabled: false,
  /** @type {boolean} - Идёт ли респавн */
  isRespawning: false,
  /** @type {boolean} - Показан ли экран смерти */
  gameOverShown: false,
  /** @type {boolean} - Только что загружена игра */
  justLoaded: false,

  /** @type {Object} - Состояние интерактивных предметов на полу */
  interactiveItems: {
    /** @type {boolean} - Показывать ли подсказку */
    showPrompt: false,
    /** @type {Object|null} - Ближайший предмет для взаимодействия */
    nearestItem: null,
    /** @type {string|null} - Тип действия */
    actionLabel: null,
  },
});