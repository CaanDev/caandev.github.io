/**
 * @fileoverview Вспомогательные функции для работы с адаптациями монстров.
 * Предоставляет удобный доступ к состоянию адаптаций и их эффектам.
 * 
 * @module entities/monsters/adaptations/helpers
 */

import { state } from '../../../core/config/index.js';

/**
 * Получение множителя лечения игрока
 * 
 * @returns {number} - 0.5, если активна адаптация "Блок лечения", иначе 1.0
 */
export function getHealingMultiplier() {
  if (state.monsterAdaptation.healingBlock) {
    return 0.5;
  }
  return 1.0;
}

/**
 * Проверка наличия иммунитета к огню у монстров
 * 
 * @returns {boolean} - true, если активна адаптация "Огнеупорность"
 */
export function hasFireImmunity() {
  return state.monsterAdaptation.fireImmunity;
}

/**
 * Проверка наличия иммунитета к оглушению у монстров
 * 
 * @returns {boolean} - true, если активна адаптация "Стойкость"
 */
export function hasStunImmunity() {
  return state.monsterAdaptation.stunImmunity;
}