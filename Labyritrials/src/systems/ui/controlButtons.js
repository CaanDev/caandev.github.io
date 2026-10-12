/**
 * @fileoverview Кнопки управления в правом нижнем углу экрана.
 * Создаёт и управляет кнопками: настройки, сохранение, выход в меню.
 * 
 * @module systems/ui/controlButtons
 */

import { player } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { openSettings } from './settings/index.js';
import { exitToMainMenu } from '../../utils/exitToMainMenu.js';

/** @type {boolean} - Инициализированы ли кнопки управления */
let controlButtonsInitialized = false;

/**
 * Инициализация кнопок управления
 * 
 * @returns {void}
 */
export function initControlButtons() {
  if (controlButtonsInitialized) return;
  controlButtonsInitialized = true;
  
  createControlButtons();
  updateControlButtonsVisibility();

  import('./settings/index.js').then(({ initSettings }) => {
    initSettings();
  });
}

/**
 * Создание кнопок управления
 * 
 * @returns {void}
 * @private
 */
function createControlButtons() {
  const oldSaveBtn = document.getElementById('manual-save-btn');
  if (oldSaveBtn) oldSaveBtn.remove();
  
  const container = document.createElement('div');
  container.id = 'control-buttons-container';
  
  // Кнопка настроек
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'settings-btn';
  settingsBtn.innerHTML = '⚙️';
  settingsBtn.title = 'Настройки';
  settingsBtn.disabled = false;
  settingsBtn.style.opacity = '1';
  settingsBtn.style.cursor = 'pointer';
  settingsBtn.addEventListener('click', openSettings);
  
  // Кнопка сохранения
  const saveBtn = document.createElement('button');
  saveBtn.id = 'manual-save-btn';
  saveBtn.innerHTML = '💾';
  saveBtn.title = 'Сохранить игру';
  
  // Кнопка выхода
  const exitBtn = document.createElement('button');
  exitBtn.id = 'exit-to-menu-btn';
  exitBtn.innerHTML = '🚪';
  exitBtn.title = 'Выйти в главное меню';
  exitBtn.addEventListener('click', async () => {
    await exitToMainMenu();
  });
  
  container.appendChild(settingsBtn);
  container.appendChild(saveBtn);
  container.appendChild(exitBtn);
  document.body.appendChild(container);
  initSaveHandler(saveBtn);
}

/**
 * Инициализация обработчика кнопки сохранения
 * 
 * @param {HTMLButtonElement} saveBtn - Кнопка сохранения
 * @returns {void}
 * @private
 */
function initSaveHandler(saveBtn) {
  let isSaving = false;
  
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) {
      logger.info('Сохранение уже выполняется, подождите...');
      return;
    }
    
    isSaving = true;
    
    import('../../save/saveSystem.js').then(({ saveGame }) => {
      saveGame();
      
      setTimeout(() => {
        isSaving = false;
      }, 1000);
    }).catch(err => {
      logger.error('Ошибка сохранения:', err);
      isSaving = false;
    });
  });
}

/**
 * Обновление видимости кнопок управления
 * 
 * Кнопки отображаются только когда игра активна и не открыты
 * модальные окна (пауза, магазин, переход уровня, смерть).
 * 
 * @returns {void}
 */
export function updateControlButtonsVisibility() {
  if (!controlButtonsInitialized) {
    initControlButtons();
    return;
  }
  
  const container = document.getElementById('control-buttons-container');
  if (!container) return;
  
  // Защита от NaN в HP
  const hp = (typeof player.hp === 'number' && !isNaN(player.hp)) ? player.hp : 0;
  
  const gameUI = document.getElementById('ui');
  const startScreen = document.getElementById('start-screen-ui');
  const gameOverUI = document.getElementById('game-over-ui');
  const levelUpUI = document.getElementById('level-up-ui');
  const shopUI = document.getElementById('shop-ui');
  const pauseMenu = document.getElementById('pause-menu');
  
  const isGameActive = gameUI && gameUI.style.display === 'block';
  const isStartScreenVisible = startScreen && startScreen.style.display !== 'none';
  const isGameOverVisible = gameOverUI && gameOverUI.style.display === 'block';
  const isLevelUpVisible = levelUpUI && levelUpUI.style.display === 'block';
  const isShopVisible = shopUI && shopUI.style.display === 'block';
  const isPauseVisible = pauseMenu && pauseMenu.style.display === 'flex';
  
  // Отображение кнопок, если игрок жив и игра активна
  if (hp > 0 && isGameActive && !isStartScreenVisible && !isGameOverVisible && !isLevelUpVisible && !isShopVisible && !isPauseVisible) container.style.display = 'flex';
  else container.style.display = 'none';
}

/**
 * Открытие меню настроек
 * 
 * @returns {void}
 */
export function openSettingsMenu() {
  openSettings();
}