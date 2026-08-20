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
  
  // Всегда обновляем направление, даже если длина < 10
  if (length > 5) {
    player.targetX = mouseWorldX;
    player.targetY = mouseWorldY;
    player.dirX = dx / length;
    player.dirY = dy / length;
  } else {
    // Если курсор слишком близко к игроку — используем последнее направление
    if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) {
      player.dirX = player.lastMoveDirX;
      player.dirY = player.lastMoveDirY;
    }
  }
  
  // Всегда обновляем последнее направление при движении мыши
  player.lastMoveDirX = player.dirX;
  player.lastMoveDirY = player.dirY;
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
    
    // Обновляем направление при клике
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;
    const camX = canvas.width / 2 - player.px;
    const camY = canvas.height / 2 - player.py;
    const mouseWorldX = mouseScreenX - camX;
    const mouseWorldY = mouseScreenY - camY;
    
    const dx = mouseWorldX - player.px;
    const dy = mouseWorldY - player.py;
    const length = Math.hypot(dx, dy);
    
    if (length > 10) {
      player.dirX = dx / length;
      player.dirY = dy / length;
      // ВСЕГДА обновляем lastMoveDir при клике
      player.lastMoveDirX = player.dirX;
      player.lastMoveDirY = player.dirY;
    } else {
      // Если клик прямо на игрока — используем последнее направление
      if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) {
        // lastMoveDir уже есть, ничего не делаем
      } else {
        // Если нет последнего направления — юг
        player.lastMoveDirX = 0;
        player.lastMoveDirY = 1;
      }
    }
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

    // Проверка выносливости
    const isStrong = player.chargeTime > 30;
    const staminaCost = isStrong ? 35 : 20;

    if (player.stamina < staminaCost) {
      // Недостаточно выносливости — не запускаем анимацию атаки
      state.damageTexts.push({
        x: player.px,
        y: player.py - 60,
        text: '⚡ Недостаточно выносливости!',
        color: '#ffcc00',
        size: 20,
        life: 40,
        speedy: 0.5
      });
      return;
    }

    // Запускаем атаку
    player.isAttacking = true;
    player.attackTimer = 50;
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
    if (player) player.isMoving = false;
  });
}