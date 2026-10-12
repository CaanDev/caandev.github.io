/**
 * @fileoverview Туман войны и состояние погоды.
 * 
 * @module core/config/state/fogState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {Object} - Состояние тумана войны */
  fogState: {
    /** @type {Object} - Память затухания клеток */
    memoryFade: {},
    /** @type {number} - Текущий радиус видимости */
    currentRadius: 800,
    /** @type {number} - Целевой радиус видимости */
    targetRadius: 800,
    /** @type {string|null} - Цвет события */
    eventColor: null,
    /** @type {number} - Интенсивность события */
    eventIntensity: 0,
  },

  /** @type {Object} - Состояние погоды для сохранения */
  weatherState: {
    /** @type {boolean} - Активен ли снегопад */
    snowActive: false,
    /** @type {number} - Время начала снегопада */
    snowStartTime: 0,
    /** @type {number} - Время окончания последнего снегопада */
    lastSnowfallEnd: 0,
    /** @type {number} - Время начала уровня */
    levelStartTime: 0,
    /** @type {number} - Прогресс заморозки (0-100) */
    frostProgress: 0,
    /** @type {boolean} - Полностью ли замёрз игрок */
    frostFrozen: false,
    /** @type {number} - Таймер потери HP */
    frostDamageTimer: 0,
  },
});