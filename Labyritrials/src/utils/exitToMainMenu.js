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
import { showConfirm } from '../systems/ui/confirm.js';
import { clearAllCaches } from './cache.js';

/**
 * Выход в главное меню
 * 
 * @param {boolean} [skipConfirm=false] - Пропустить подтверждение выхода
 * @returns {boolean} - true, если выход выполнен; false, если отменён пользователем
 */
export async function exitToMainMenu(skipConfirm = false) {
  // Подтверждение выхода (если не пропущено)
  if (!skipConfirm) {
    const confirmed = await showConfirm(
      'Выйти в главное меню?\nВесь несохранённый прогресс будет потерян!',
      { title: 'Выход в меню', yesText: 'Выйти', noText: 'Остаться' }
    );
    
    if (!confirmed) {
      resetAllKeys();
      
      // Проверка, открыто ли меню паузы
      const pauseMenu = document.getElementById('pause-menu');
      if (pauseMenu && pauseMenu.style.display === 'none') {
        // Если меню паузы было закрыто, значит пауза уже снята
        // Ничего дополнительно не делается
      }
      
      return false;
    }
  }

  // Сброс ввода
  resetAllKeys();
  // Остановка игры
  Game.stopLoop();
  // Сброс состояния
  resetGameFull();
  
  // Скрытие всех UI элементов
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
  
  // Показ главного меню
  const startScreen = document.getElementById('start-screen-ui');
  if (startScreen) {
    startScreen.style.display = 'flex';
    startScreen.classList.remove('fade-out-screen');
  }
  
  // Обновление информации о сохранении
  if (typeof window.updateSaveInfoOnStartScreen === 'function') {
    setTimeout(() => {
      window.updateSaveInfoOnStartScreen();
    }, 50);
  }
  
  // Очистка состояния
  state.isShopOpen = false;
  // Отключение звуковых эффектов
  audio.sound.isMuted = true;
  audio.sound._updateAllVolumes();
  // Очистка кэшей
  clearAllCaches();

  // Включение музыки меню
  setTimeout(() => {
    audio.forcePlayMusic('menu');
  }, 50);

  return true;
}