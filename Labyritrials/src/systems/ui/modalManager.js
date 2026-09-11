/**
 * @fileoverview Централизованное управление модальными окнами
 * @module systems/ui/modalManager
 */

/** @type {Set<string>} - Множество открытых окон */
const openModals = new Set();

/**
 * Регистрация открытия окна
 * @param {string} modalId - ID окна
 * @returns {void}
 */
export function registerModalOpen(modalId) {
  openModals.add(modalId);
}

/**
 * Регистрация закрытия окна
 * @param {string} modalId - ID окна
 * @returns {void}
 */
export function registerModalClose(modalId) {
  openModals.delete(modalId);
}

/**
 * Проверка, открыто ли любое модальное окно
 * @returns {boolean}
 */
export function isAnyModalOpen() {
  return openModals.size > 0;
}

/**
 * Проверка, открыто ли конкретное окно
 * @param {string} modalId - ID окна
 * @returns {boolean}
 */
export function isModalOpen(modalId) {
  return openModals.has(modalId);
}

/**
 * Получение списка открытых окон
 * @returns {string[]}
 */
export function getOpenModals() {
  return Array.from(openModals);
}

/**
 * Закрытие всех окон
 * @returns {void}
 */
export function closeAllModals() {
  openModals.clear();
}

/**
 * Обработчик клавиатуры — блокирует все клавиши при открытых окнах
 * @param {KeyboardEvent} e
 * @returns {void}
 */
export function handleModalKeys(e) {
  if (isAnyModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * Инициализация глобального обработчика клавиш
 * @returns {void}
 */
export function initModalManager() {
  document.addEventListener('keydown', handleModalKeys, true);
}