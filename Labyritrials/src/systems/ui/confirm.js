/**
 * @fileoverview Кастомное окно подтверждения.
 * Заменяет стандартный confirm() на стилизованное модальное окно.
 * Также поддерживает режим информационного окна (без кнопок).
 * 
 * @module systems/ui/confirm
 */

import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';

/** @type {Function|null} - Колбэк подтверждения */
let currentResolve = null;

/** @type {number|null} - Таймер авто-закрытия */
let autoCloseTimer = null;

/**
 * Показ окна подтверждения
 * 
 * @param {string} message - Текст сообщения
 * @param {Object} [options] - Дополнительные опции
 * @param {string} [options.title='Подтверждение'] - Заголовок окна
 * @param {string} [options.yesText='Да'] - Текст кнопки подтверждения
 * @param {string} [options.noText='Отмена'] - Текст кнопки отмены
 * @param {boolean} [options.hideButtons=false] - Скрыть кнопки (режим уведомления)
 * @param {number} [options.autoCloseDuration=0] - Авто-закрытие через N мс (0 — не закрывать)
 * @returns {Promise<boolean>} - true, если подтверждено
 */
export async function showConfirm(message, options = {}) {
  // Если окно уже открыто - закрытие предыдущего
  if (currentResolve) closeConfirm(false);

  const {
    title = 'Подтверждение',
    yesText = 'Да',
    noText = 'Отмена',
    hideButtons = false,
    autoCloseDuration = 0,
  } = options;

  // Загрузка шаблона
  if (!isTemplateLoaded('confirm')) await loadTemplateIfNeeded('confirm');
  if (!isTemplateInitialized('confirm')) await initTemplateHandlers('confirm');

  const popup = document.getElementById('confirm-popup');
  if (!popup) {
    console.error('❌ Окно confirm-popup не найдено в DOM!');
    // Fallback на стандартный confirm
    if (hideButtons) {
      console.log(`${title}: ${message}`);
      return true;
    }
    return window.confirm(message);
  }

  // Установка текста
  const titleEl = document.getElementById('confirm-popup-title');
  const messageEl = document.getElementById('confirm-popup-message');
  const yesBtn = document.getElementById('confirm-popup-yes');
  const noBtn = document.getElementById('confirm-popup-no');
  const footerEl = popup.querySelector('.confirm-popup-footer');

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (yesBtn) yesBtn.textContent = yesText;
  if (noBtn) noBtn.textContent = noText;

  // Управление видимостью кнопок
  if (hideButtons) {
    if (footerEl) footerEl.style.display = 'none';
    if (yesBtn) yesBtn.style.display = 'none';
    if (noBtn) noBtn.style.display = 'none';
  } else {
    if (footerEl) footerEl.style.display = '';
    if (yesBtn) yesBtn.style.display = '';
    if (noBtn) noBtn.style.display = '';
  }

  // Показ окна
  popup.style.display = 'flex';
  registerModalOpen('confirm');

  // Возврат промиса
  return new Promise((resolve) => {
    currentResolve = resolve;

    // Обработчик Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!hideButtons) closeConfirm(false);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Кнопки (только если не скрыты)
    if (!hideButtons && yesBtn && noBtn) {
      const newYesBtn = yesBtn.cloneNode(true);
      const newNoBtn = noBtn.cloneNode(true);
      yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
      noBtn.parentNode.replaceChild(newNoBtn, noBtn);

      newYesBtn.addEventListener('click', () => closeConfirm(true));
      newNoBtn.addEventListener('click', () => closeConfirm(false));
    }

    // Авто-закрытие
    if (autoCloseDuration > 0) {
      autoCloseTimer = setTimeout(() => {
        closeConfirm(true);
      }, autoCloseDuration);
    }

    // Сохранение обработчика Escape для очистки
    popup._escapeHandler = escapeHandler;
  });
}

/**
 * Закрытие окна подтверждения
 * 
 * @param {boolean} result - Результат (true — подтверждено)
 * @returns {void}
 * @private
 */
function closeConfirm(result) {
  const popup = document.getElementById('confirm-popup');
  if (!popup) return;

  // Защита от повторного закрытия
  if (!currentResolve) return;

  // Очистка таймера
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }

  // Очистка обработчика Escape
  if (popup._escapeHandler) {
    document.removeEventListener('keydown', popup._escapeHandler);
    popup._escapeHandler = null;
  }

  // Скрытие
  popup.style.display = 'none';
  registerModalClose('confirm');

  // Разрешение промиса
  currentResolve(result);
  currentResolve = null;
}

/**
 * Принудительное закрытие окна (без результата)
 * Используется при открытии нового окна поверх.
 * 
 * @returns {void}
 */
export function forceCloseConfirm() {
  closeConfirm(false);
}

/**
 * Проверка, открыто ли окно подтверждения
 * 
 * @returns {boolean} - true, если открыто
 */
export function isConfirmOpen() {
  return currentResolve !== null;
}