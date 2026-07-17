/**
 * @fileoverview Точка входа системы сохранения.
 * Экспортирует все модули для работы с сохранениями, записками и временем.
 * 
 * @module save
 */

// ============================================================
// ОСНОВНАЯ СИСТЕМА СОХРАНЕНИЯ
// ============================================================

/**
 * Экспорт основных функций сохранения/загрузки
 * @see module:save/saveSystem
 */
export { saveGame, loadGame, deleteSave, hasSave, getSaveInfo } from './saveSystem.js';

// ============================================================
// ФОРМАТИРОВАНИЕ ВРЕМЕНИ
// ============================================================

/**
 * Экспорт функции форматирования времени
 * @see module:save/timeFormatter
 */
export { formatPlayTime } from './timeFormatter.js';

// ============================================================
// ХРАНИЛИЩЕ СОХРАНЕНИЙ (localStorage)
// ============================================================

/**
 * Экспорт функций работы с localStorage
 * @see module:save/saveStorage
 */
export { 
  saveToLocalStorage, 
  loadFromLocalStorage
} from './saveStorage.js';

// ============================================================
// ХРАНИЛИЩЕ ЗАПИСОК
// ============================================================

/**
 * Экспорт функций работы с записками
 * @see module:save/notesStorage
 */
export { 
  saveNotesToStorage, 
  loadNotesFromStorage, 
  hasNotesStorage, 
  deleteNotesStorage 
} from './notesStorage.js';