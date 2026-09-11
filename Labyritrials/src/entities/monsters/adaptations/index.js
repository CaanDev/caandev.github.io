/**
 * @fileoverview Точка входа для системы адаптаций монстров.
 * Экспортирует все основные компоненты: конфигурацию адаптаций,
 * счётчики атак, проверку и сброс адаптаций, вспомогательные функции.
 * 
 * @module entities/monsters/adaptations/index
 */

/**
 * Экспорт конфигурации адаптаций
 * @see module:entities/monsters/adaptations/config
 */
export { ADAPTATIONS } from './config.js';

/**
 * Экспорт функций управления счётчиками атак
 * @see module:entities/monsters/adaptations/counter
 */
export { updateAttackCounter, getAttackCount } from './counter.js';

/**
 * Экспорт функций проверки и сброса адаптаций
 * @see module:entities/monsters/adaptations/checker
 */
export { checkAdaptations, resetAdaptations } from './checker.js';

/**
 * Экспорт вспомогательных функций
 * @see module:entities/monsters/adaptations/helpers
 */
export { getHealingMultiplier, hasFireImmunity, hasStunImmunity } from './helpers.js';