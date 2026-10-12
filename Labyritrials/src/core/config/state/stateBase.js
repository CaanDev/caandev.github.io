/**
 * @fileoverview Базовый объект состояния игры.
 * Все остальные модули расширяют его через Object.assign.
 * 
 * @module core/config/state/stateBase
 */

/**
 * Базовый объект состояния. Экспортируется как единый state.
 * Поля добавляются модулями-расширениями.
 * 
 * @type {Object}
 */
export const state = {};