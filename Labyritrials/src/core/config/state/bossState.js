/**
 * @fileoverview Состояние боссов.
 * 
 * @module core/config/state/bossState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {boolean} - Босс готов к бою */
  bossReady: false,
  /** @type {Object} - Отображаемое HP босса (для анимации) */
  bossDisplayHp: {},
  /** @type {Object} - Отображаемое максимальное HP босса */
  bossDisplayMaxHp: {},
  /** @type {boolean} - Босс заспавнен */
  bossSpawned: false,
  /** @type {boolean} - Активирован ли спавн босса */
  bossSpawnTriggered: false,
  /** @type {number} - Таймер спавна босса */
  bossSpawnTimer: 0,
  /** @type {number} - Счётчик дропа миньонов */
  bossMinionDropCounter: 0,
  /** @type {Array} - Взрывы босса */
  bossExplosions: [],
  /** @type {Object} - Круг призыва босса */
  bossSummonCircle: {
    /** @type {boolean} - Активен ли круг */
    active: true,
    /** @type {number} - Прогресс исчезновения */
    fadeProgress: 0,
    /** @type {Array} - Частицы */
    particles: [],
  },
  /** @type {Object} - Затемнение перед боссом */
  bossLightFade: {
    /** @type {boolean} - Активно ли затемнение */
    active: false,
    /** @type {number} - Прогресс затемнения */
    progress: 0,
    /** @type {boolean} - Активна ли вспышка */
    flashActive: false,
    /** @type {number} - Таймер вспышки */
    flashTimer: 0,
  },
});