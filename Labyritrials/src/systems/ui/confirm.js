/**
 * @fileoverview Кастомное окно подтверждения.
 * Заменяет стандартный confirm() на стилизованное модальное окно.
 * 
 * @module systems/ui/confirm
 */

import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';

/** @type {Function|null} - Колбэк подтверждения */
let currentResolve = null;

/**
 * Показ окна подтверждения
 * 
 * @param {string} message - Текст сообщения
 * @param {Object} [options] - Дополнительные опции
 * @param {string} [options.title='Подтверждение'] - Заголовок окна
 * @param {string} [options.yesText='Да'] - Текст кнопки подтверждения
 * @param {string} [options.noText='Отмена'] - Текст кнопки отмены
 * @returns {Promise<boolean>} - true, если подтверждено
 */
export async function showConfirm(message, options = {}) {
  // Если окно уже открыто - возвращение промиса, который разрешится при закрытии текущего окна
  if (currentResolve) {
    console.warn('⚠️ Окно подтверждения уже открыто');
    return false;
  }

  const {
    title = 'Подтверждение',
    yesText = 'Да',
    noText = 'Отмена',
  } = options;
  
  // Загрузка шаблона
  if (!isTemplateLoaded('confirm')) await loadTemplateIfNeeded('confirm');
  
  // Инициализация обработчиков
  if (!isTemplateInitialized('confirm')) await initTemplateHandlers('confirm');
  
  const popup = document.getElementById('confirm-popup');
  if (!popup) {
    console.error('❌ Окно confirm-popup не найдено в DOM!');
    // Fallback на стандартный confirm
    return window.confirm(message);
  }
  
  // Установка текста
  const titleEl = document.getElementById('confirm-popup-title');
  const messageEl = document.getElementById('confirm-popup-message');
  const yesBtn = document.getElementById('confirm-popup-yes');
  const noBtn = document.getElementById('confirm-popup-no');
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (yesBtn) yesBtn.textContent = yesText;
  if (noBtn) noBtn.textContent = noText;
  
  // Показ окна и регистрация модального окна
  popup.style.display = 'flex';
  registerModalOpen('confirm');
  
  // Возврат промиса
  return new Promise((resolve) => {
    currentResolve = resolve;

    // Функция закрытия (универсальная)
    const close = (result) => {
      popup.style.display = 'none';
      registerModalClose('confirm');
      
      if (currentEscapeHandler) {
        document.removeEventListener('keydown', currentEscapeHandler);
        currentEscapeHandler = null;
      }
      
      if (currentResolve) {
        currentResolve(result);
        currentResolve = null;
      }
    };

    // Escape для отмены
    let currentEscapeHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      }
    };
    
    // Обработчики кнопок (клонирование, чтобы избежать дублирования)
    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    
    newYesBtn.addEventListener('click', () => close(true));
    newNoBtn.addEventListener('click', () => close(false));
    
    document.addEventListener('keydown', currentEscapeHandler);
  });
}