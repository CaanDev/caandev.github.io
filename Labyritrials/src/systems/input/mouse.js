/**
 * @fileoverview Обработка ввода с мыши.
 * Управляет позицией курсора, кликами для атаки и зарядкой удара.
 * 
 * @module systems/input/mouse
 */

import { state, player } from '../../core/config/index.js';
import { executeAttack } from '../../entities/player/index.js';
import { isPauseMenuOpen } from '../../game/pauseMenu.js';
import { isAnyModalOpen } from '../ui/modalManager.js';

/** @type {number} - Мировая координата X курсора */
let mouseWorldX = 0;
/** @type {number} - Мировая координата Y курсора */
let mouseWorldY = 0;
/** @type {number} - Экранная координата X курсора */
let mouseScreenX = 0;
/** @type {number} - Экранная координата Y курсора */
let mouseScreenY = 0;

/**
 * Проверка, был ли клик по кнопке управления
 * 
 * @param {EventTarget} target - Цель события
 * @returns {boolean} - true, если клик по кнопке управления
 * @private
 */
function isClickOnControlButton(target) {
  const controlButtons = ['settings-btn', 'manual-save-btn', 'exit-to-menu-btn'];
  let element = target;
  
  while (element && element !== document.body) {
    if (controlButtons.includes(element.id)) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * Проверка, является ли клик внутри модального окна
 * 
 * @param {EventTarget} target - Цель события
 * @returns {boolean} - true, если клик внутри модального окна
 * @private
 */
function isClickInsideModal(target) {
  const modalSelectors = [
    '.inventory-content', '.achievements-content', '.settings-content',
    '.shop-content', '.pause-content', '.note-reader-content',
    '.bookshelf-content', '.final-screen-content', '.level-up-content'
  ];
  let element = target;
  
  while (element && element !== document.body) {
    for (const selector of modalSelectors) {
      if (element.matches && element.matches(selector)) {
        return true;
      }
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * Обновление позиции курсора мыши
 * 
 * @param {MouseEvent} e - Событие движения мыши
 * @returns {void}
 */
export function updateMousePosition(e) {
  if (isPauseMenuOpen()) return;
  if (isAnyModalOpen()) return;

  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  
  // Сохраняем экранные координаты
  mouseScreenX = e.clientX - rect.left;
  mouseScreenY = e.clientY - rect.top;
  
  // Преобразуем в мировые координаты (с учётом камеры)
  const camX = canvas.width / 2 - player.px;
  const camY = canvas.height / 2 - player.py;
  
  mouseWorldX = mouseScreenX - camX;
  mouseWorldY = mouseScreenY - camY;
  
  // Обновляем направление атаки игрока
  const dx = mouseWorldX - player.px;
  const dy = mouseWorldY - player.py;
  const length = Math.hypot(dx, dy);
  
  if (length > 10) {
    player.targetX = mouseWorldX;
    player.targetY = mouseWorldY;
    player.dirX = dx / length;
    player.dirY = dy / length;
  }
}

/**
 * Обработка нажатия кнопки мыши (начало зарядки атаки)
 * 
 * @param {MouseEvent} e - Событие нажатия мыши
 * @returns {void}
 */
export function handleMouseDown(e) {
  // Если открыто модальное окно — пропускаем клики вне окна
  if (isAnyModalOpen()) {
    if (!isClickInsideModal(e.target)) {
      e.preventDefault();
      return;
    }
    return;
  }

  if (isPauseMenuOpen()) return;
  if (isClickOnControlButton(e.target)) return;

  if (e.button === 0 && !state.isShopOpen) {
    state.keys['mouse0'] = true;
    player.isCharging = true;
    player.chargeTime = 0;
  }
}

/**
 * Обработка отпускания кнопки мыши (выполнение атаки)
 * 
 * @param {MouseEvent} e - Событие отпускания мыши
 * @returns {void}
 */
export function handleMouseUp(e) {
  // Если открыто модальное окно — пропускаем клики вне окна
  if (isAnyModalOpen()) {
    if (!isClickInsideModal(e.target)) {
      e.preventDefault();
      return;
    }
    return;
  }

  if (isPauseMenuOpen()) return;
  if (isClickOnControlButton(e.target)) return;

  if (e.button === 0 && player.isCharging) {
    state.keys['mouse0'] = false;
    player.isCharging = false;
    player.isAttacking = true;
    player.attackTimer = 10;
    
    // Определяем, была ли атака заряжена (более 30 кадров)
    let isStrong = player.chargeTime > 30;
    executeAttack(isStrong);
  }
}

/**
 * Инициализация обработчиков мыши
 * 
 * @returns {void}
 */
export function initMouseHandlers() {
  window.addEventListener('mousemove', updateMousePosition);
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  
  // Блокировка контекстного меню
  window.addEventListener('contextmenu', e => {
    e.preventDefault();
  });
}

/**
 * Инициализация обработчика потери фокуса окна
 * Сбрасывает все нажатые клавиши и состояние зарядки атаки.
 * 
 * @returns {void}
 */
export function initBlurHandler() {
  window.addEventListener('blur', () => {
    state.keys = {};
    state.keys['mouse0'] = false;
    player.isCharging = false;
    player.chargeTime = 0;
  });
}