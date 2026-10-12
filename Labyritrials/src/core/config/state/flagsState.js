/**
 * @fileoverview Мелкие флаги состояния и системные данные.
 * 
 * @module core/config/state/flagsState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {boolean} - Идёт ли очистка данных */
  isClearingData: false,
  /** @type {boolean} - Был ли выдан бонус за зачистку */
  bonusGiven: false,
  /** @type {boolean} - Были ли монстры на уровне */
  hadMonsters: false,
  /** @type {number} - Начальное количество монстров */
  initialMonstersCount: 0,
  /** @type {boolean} - Разблокировано ли достижение "Картограф" */
  mapClearedAchievementUnlocked: false,

  /** @type {number|null} - Сид генератора */
  seed: null,
  /** @type {number} - Счётчик случайных чисел */
  randomCounter: 0,

  /** @type {Array} - Активные звуковые события (для слуха монстров) */
  soundEvents: [],
});