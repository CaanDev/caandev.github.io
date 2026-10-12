/**
 * @fileoverview Состояние системы блуждающих огоньков.
 * @module entities/objects/willOTheWisps/wispsState
 */

import { state } from '../../../core/config/index.js';

/**
 * Инициализация структуры данных огоньков в state.
 * Вызывается только при первом призыве.
 * @returns {void}
 */
export function initWispsState() {
  if (!state.wisps) {
    state.wisps = {
      /** @type {Array} - Массив активных огоньков */
      list: [],
      /** @type {boolean} - Идёт ли сессия огоньков */
      active: false,
      /** @type {number} - HP "взаймы" на один огонёк */
      borrowedHpPerWisp: 0,
      /** @type {number} - Общий HP "взаймы" (borrowedHpPerWisp * COUNT) */
      borrowedHp: 0,
      /** @type {number} - Таймер до возможности повторного призыва (кадры) */
      resummonCooldown: 0,
    };
  }
}

/**
 * Получение массива огоньков
 * @returns {Array}
 */
export function getWisps() {
  return state.wisps?.list || [];
}

/**
 * Проверка, активны ли огоньки
 * @returns {boolean}
 */
export function isWispsActive() {
  return state.wisps?.active === true;
}

/**
 * Полный сброс состояния огоньков (без возврата HP)
 * @returns {void}
 */
export function resetWisps() {
  if (!state.wisps) initWispsState();
  state.wisps.list = [];
  state.wisps.active = false;
  state.wisps.borrowedHpPerWisp = 0;
  state.wisps.borrowedHp = 0;
  state.wisps.resummonCooldown = 0;
}