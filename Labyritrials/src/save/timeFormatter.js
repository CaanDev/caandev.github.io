/**
 * @fileoverview Форматирование времени игры.
 * Преобразует секунды в читаемый формат ЧЧ:ММ:СС или ММ:СС.
 * 
 * @module save/timeFormatter
 */

/**
 * Форматирование времени в формат ЧЧ:ММ:СС или ММ:СС
 * 
 * @param {number} seconds - Время в секундах
 * @returns {string} - Отформатированное время
 * 
 * @example
 * formatPlayTime(65)   // "01:05"
 * formatPlayTime(3665) // "01:01:05"
 * formatPlayTime(0)    // "00:00"
 */
export function formatPlayTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}