/**
 * @fileoverview Точка входа для системы ввода.
 * Объединяет обработчики клавиатуры, мыши и события потери фокуса.
 * 
 * @module systems/input/index
 */

import { initKeyboardHandlers, resetAllKeys } from './keyboard.js';
import { initMouseHandlers, initBlurHandler } from './mouse.js';

/**
 * @namespace Input
 * @description Объект для инициализации системы ввода
 */
export const Input = {
  /**
   * Инициализация всех обработчиков ввода
   * 
   * @returns {void}
   */
  init() {
    initKeyboardHandlers();
    initMouseHandlers();
    initBlurHandler();
  }
};

/**
 * Экспорт функции сброса состояния клавиш
 * @see module:systems/input/keyboard
 */
export { resetAllKeys };