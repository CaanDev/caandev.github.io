/**
 * @fileoverview UI-функции для отображения информации о событиях.
 * Предоставляет данные о текущем активном событии для интерфейса.
 * 
 * @module systems/events/ui
 */

import { state } from '../../core/config/index.js';
import { EVENTS } from './config.js';

/**
 * Получение иконки текущего активного события
 * 
 * @returns {string} - Иконка события или пустая строка
 */
export function getEventIcon() {
  if (!state.currentEvent) return '';
  return EVENTS[state.currentEvent]?.icon || '';
}

/**
 * Получение названия текущего активного события
 * 
 * @returns {string} - Название события или пустая строка
 */
export function getEventName() {
  if (!state.currentEvent) return '';
  return EVENTS[state.currentEvent]?.name || '';
}

/**
 * Получение цвета текущего активного события
 * 
 * @returns {string} - Цвет события или пустая строка
 */
export function getEventColor() {
  if (!state.currentEvent) return '';
  return EVENTS[state.currentEvent]?.color || '';
}