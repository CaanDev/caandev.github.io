/**
 * @fileoverview Хранилище записок в localStorage.
 * Управляет сохранением, загрузкой и удалением данных о найденных записках.
 * 
 * @module save/notesStorage
 */

import { logger } from '../utils/logger.js';

/** @type {string} - Ключ для хранения записок в localStorage */
const NOTES_KEY = 'labirithria_notes';

/**
 * Сохранение данных о записках в localStorage
 * 
 * @param {Object} notesData - Данные о записках
 * @param {number[]} notesData.found - Массив ID найденных записок
 * @param {Object} notesData.spawned - Объект с заспавненными записками по уровням
 * @param {Object} notesData.positions - Объект с позициями записок на карте
 * @returns {void}
 */
export function saveNotesToStorage(notesData) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notesData));
  } catch (e) {
    logger.warn('⚠️ Не удалось сохранить записки:', e);
  }
}

/**
 * Загрузка данных о записках из localStorage
 * 
 * @returns {Object|null} - Данные о записках или null, если данных нет
 */
export function loadNotesFromStorage() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    logger.warn('⚠️ Не удалось загрузить записки:', e);
  }
  return null;
}

/**
 * Проверка наличия данных о записках в localStorage
 * 
 * @returns {boolean} - true, если данные о записках существуют
 */
export function hasNotesStorage() {
  return localStorage.getItem(NOTES_KEY) !== null;
}

/**
 * Удаление данных о записках из localStorage
 * 
 * @returns {void}
 */
export function deleteNotesStorage() {
  localStorage.removeItem(NOTES_KEY);
}