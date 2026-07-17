/**
 * @fileoverview Счётчики атак для системы адаптаций монстров.
 * Отслеживает количество атак разных типов, совершённых игроком,
 * для активации адаптаций монстров.
 * 
 * @module entities/monsters/adaptations/counter
 */

import { state } from '../../../core/config/index.js';

/**
 * Обновление счётчика атак определённого типа
 * 
 * Увеличивает счётчик указанного типа атаки. На босс-уровнях
 * счётчики не обновляются (адаптации не активируются во время битвы с боссом).
 * 
 * @param {string} attackType - Тип атаки ('fireball', 'stun', 'vampirism', 'magic')
 * @param {number} [points=1] - Количество очков для добавления
 * @returns {void}
 */
export function updateAttackCounter(attackType, points = 1) {
  // На босс-уровнях адаптации не активируются
  if (state.isBossLevel) return;

  switch (attackType) {
    case 'fireball':
      state.totalAttacks.fireball += points;
      state.totalAttacks.magic += points;
      break;
    case 'stun':
      state.totalAttacks.stun += points;
      state.totalAttacks.magic += points;
      break;
    case 'vampirism':
      state.totalAttacks.vampirism += points;
      break;
    default:
      if (attackType === 'magic') {
        state.totalAttacks.magic += points;
      }
  }
}

/**
 * Получение количества атак определённого типа
 * 
 * @param {string} attackType - Тип атаки ('fireball', 'stun', 'vampirism', 'magic')
 * @returns {number} - Количество атак указанного типа
 */
export function getAttackCount(attackType) {
  switch (attackType) {
    case 'fireball': return state.totalAttacks.fireball;
    case 'stun': return state.totalAttacks.stun;
    case 'vampirism': return state.totalAttacks.vampirism;
    case 'magic': return state.totalAttacks.magic;
    default: return 0;
  }
}