/**
 * @fileoverview Бонусы от событий.
 * Применяет модификаторы к урону и золоту в зависимости от активного события.
 * 
 * @module systems/events/bonuses
 */

import { state } from '../../core/config/index.js';

/**
 * Получение модифицированного урона с учётом активного события
 * 
 * @param {number} damage - Базовый урон
 * @returns {number} - Модифицированный урон
 */
export function getEventDamageMultiplier(damage) {
  if (state.currentEvent === 'blessing') {
    return Math.floor(damage * 1.5);
  }
  return damage;
}

/**
 * Получение модифицированного количества золота с учётом активного события
 * 
 * @param {number} gold - Базовое количество золота
 * @returns {number} - Модифицированное количество золота
 */
export function getEventGoldMultiplier(gold) {
  if (state.currentEvent === 'bloodMoon') {
    return Math.floor(gold * 2);
  }
  return gold;
}