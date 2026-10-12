/**
 * @fileoverview Игровой мир: сетка, монстры, объекты на карте.
 * Расширяет базовый объект state через Object.assign.
 * 
 * @module core/config/state/worldState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {string} - Текущий биом */
  currentBiome: 'cave',
  /** @type {Array[]} - Двумерная сетка лабиринта */
  grid: [],
  /** @type {Array} - Зоны освещения */
  lightZones: [],
  /** @type {Array} - Монстры на уровне */
  monsters: [],
  /** @type {Array} - Дикие блуждающие огоньки */
  wildWisps: [],
  /** @type {Array} - Мимики */
  mimics: [],
  /** @type {Array} - Предметы на полу (золото, зелья) */
  lootItems: [],
  /** @type {Array} - Ловушки */
  traps: [],
  /** @type {Array} - Артефакты */
  artifacts: [],
  /** @type {Array} - Сундуки */
  chests: [],
  /** @type {Array} - Святилища (алтари) */
  shrines: [],
  /** @type {Array} - Руны */
  runes: [],
  /** @type {Array} - Следы игрока */
  playerTrails: [],
  /** @type {Array} - Тексты урона */
  damageTexts: [],
  /** @type {Array} - Огненные шары */
  fireballs: [],
  /** @type {Array} - Факелы */
  torches: [],
  /** @type {Array} - Частицы огня от факелов */
  fireParticles: [],
  /** @type {Array} - Светлячки (у порталов) */
  fireflies: [],
  /** @type {Array} - Мухи (над сундуками-мимиками) */
  flies: [],
  /** @type {Array} - Колонны */
  pillars: [],
});