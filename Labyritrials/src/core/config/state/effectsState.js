/**
 * @fileoverview Частицы, эффекты, кровь.
 * 
 * @module core/config/state/effectsState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {Array} - Частицы зарядки усиленного удара */
  chargeParticles: [],
  /** @type {Array} - Частицы золота */
  goldParticles: [],
  /** @type {Array} - Частицы артефактов */
  artifactParticles: [],
  /** @type {Array} - Частицы зелий */
  potionParticles: [],
  /** @type {Array} - Искры */
  sparks: [],
  /** @type {Object|null} - Ударная волна */
  shockwave: null,
  /** @type {Object|null} - Псионическая волна (босс "Разум") */
  psionicWave: null,
  /** @type {Array} - Искры от эффекта шока */
  shockSparks: [],
  /** @type {Array} - Пузырьки яда */
  poisonBubbles: [],
  /** @type {Array} - Кровавые капли (вампиризм) */
  bloodDrops: [],
  /** @type {Array} - Искры молнии */
  lightningSparks: [],
  /** @type {Array} - Частицы сдвига реальности */
  realityParticles: [],
  /** @type {Array} - Частицы взрыва */
  explosionParticles: [],
  /** @type {number} - Вспышка взрыва */
  explosionFlash: 0,
  /** @type {Array} - Кровавые лужи */
  bloodPuddles: [],
  /** @type {Array} - Лучи (атаки боссов) */
  beams: [],
  /** @type {Object} - Сдвиг реальности (инверсия управления) */
  realityShift: {
    /** @type {boolean} - Активен ли эффект */
    active: false,
    /** @type {number} - Интенсивность */
    intensity: 0,
    /** @type {number} - Таймер */
    timer: 0,
  },
});