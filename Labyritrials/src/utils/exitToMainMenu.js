/**
 * @fileoverview Функция выхода в главное меню.
 * Выполняет полную очистку состояния игры и переход на стартовый экран.
 * 
 * @module utils/exitToMainMenu
 */

import { Game } from '../core/game.js';
import { audio } from '../audio/audioManager.js';
import { state } from '../core/config/state.js';
import { resetGameFull } from '../core/config/functions.js';
import { resetAllKeys } from '../systems/input/index.js';
import { clearAllCaches } from './cache.js';

/**
 * Выход в главное меню
 * 
 * Функция выполняет следующие шаги:
 * 1. Запрашивает подтверждение у пользователя
 * 2. Останавливает игровой цикл
 * 3. Сбрасывает состояние игры
 * 4. Скрывает все UI элементы
 * 5. Показывает главное меню
 * 6. Очищает кэши
 * 7. Включает музыку меню
 * 
 * @returns {boolean} - true, если выход выполнен; false, если отменён пользователем
 */
export function exitToMainMenu() {
  // ===== ПОДТВЕРЖДЕНИЕ ВЫХОДА =====
  if (!confirm('Выйти в главное меню? Весь несохранённый прогресс будет потерян!')) {
    resetAllKeys();
    
    // Проверяем, открыто ли меню паузы
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu && pauseMenu.style.display === 'none') {
      // Если меню паузы было закрыто, значит пауза уже снята
      // Ничего дополнительно не делаем
    }
    
    return false;
  }

  // ===== СБРОС ВВОДА =====
  resetAllKeys();
  
  // ===== ОСТАНОВКА ИГРЫ =====
  Game.stopLoop();
  
  // ===== СБРОС СОСТОЯНИЯ =====
  resetGameFull();
  
  // ===== СКРЫТИЕ ВСЕХ UI ЭЛЕМЕНТОВ =====
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'none';
  
  const levelUpUI = document.getElementById('level-up-ui');
  if (levelUpUI) levelUpUI.style.display = 'none';
  
  const gameOverUI = document.getElementById('game-over-ui');
  if (gameOverUI) gameOverUI.style.display = 'none';
  
  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) pauseMenu.style.display = 'none';
  
  const settingsUI = document.getElementById('settings-ui');
  if (settingsUI) settingsUI.style.display = 'none';
  
  // ===== ПОКАЗ ГЛАВНОГО МЕНЮ =====
  const startScreen = document.getElementById('start-screen-ui');
  if (startScreen) {
    startScreen.style.display = 'flex';
    startScreen.classList.remove('fade-out-screen');
  }
  
  // ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ О СОХРАНЕНИИ =====
  if (typeof window.updateSaveInfoOnStartScreen === 'function') {
    setTimeout(() => {
      window.updateSaveInfoOnStartScreen();
    }, 50);
  }
  
  // ===== ОЧИСТКА СОСТОЯНИЯ =====
  state.isShopOpen = false;
  
  // ===== ОТКЛЮЧЕНИЕ ЗВУКОВЫХ ЭФФЕКТОВ =====
  audio.sound.isMuted = true;
  audio.sound._updateAllVolumes();

  // ===== ОЧИСТКА КЭШЕЙ =====
  clearAllCaches();

  // ===== ВКЛЮЧЕНИЕ МУЗЫКИ МЕНЮ =====
  setTimeout(() => {
    audio.forcePlayMusic('menu');
  }, 50);

  return true;
}