/**
 * @fileoverview Точка входа для системы инвентаря
 * @module systems/ui/inventory/index
 */

import { Game } from '../../../core/game.js';
import { audio } from '../../../audio/audioManager.js';
import { isPauseMenuOpen } from '../../../game/pauseMenu.js';
import { isSettingsOpen } from '../settings/index.js';
import { isAchievementsOpen } from '../../achievements/ui.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from '../modalManager.js';
import { renderInventory, setRefreshCallback, switchInventoryTab } from './renderers/index.js';
import { getInitialInventory } from './inventoryData.js';
import { syncMap } from './inventoryUtils.js';

const MODAL_ID = 'inventory';

/** @type {boolean} - Открыт ли инвентарь */
let isInventoryOpen = false;

/**
 * Проверка, открыт ли инвентарь
 * @returns {boolean}
 */
export function getInventoryState() {
  return isInventoryOpen;
}

/**
 * Закрытие инвентаря с сохранением
 * @returns {void}
 */
export function closeInventory() {
  const inventoryUI = document.getElementById('inventory-ui');
  if (!inventoryUI) return;
  
  isInventoryOpen = false;
  inventoryUI.style.display = 'none';
  registerModalClose(MODAL_ID);
  
  // Сохранение игры при закрытии инвентаря
  import('../../../save/saveSystem.js').then(({ saveGame }) => {
    saveGame();
  });
  
  // Возобновление игры
  Game.resumeTime();
  
  audio.isGameActive = true;
  audio.resume();
  
  if (!Game.isRunning) Game.startLoop();
}

/**
 * Открытие инвентаря
 * @returns {void}
 */
export function openInventory() {
  // Проверка, не открыты ли другие окна
  if (isPauseMenuOpen()) return;
  if (isSettingsOpen()) return;
  if (isAchievementsOpen()) return;
  
  // Загрузка шаблона (если нужно)
  if (!isTemplateLoaded('inventory')) {
    loadTemplateIfNeeded('inventory').then(() => {
      initTemplateHandlers('inventory').then(() => {
        showInventory();
      });
    });
    return;
  }
  
  if (!isTemplateInitialized('inventory')) {
    initTemplateHandlers('inventory').then(() => {
      showInventory();
    });
    return;
  }
  
  showInventory();
}

/**
 * Внутренняя функция показа инвентаря
 * @private
 */
function showInventory() {
  const inventoryUI = document.getElementById('inventory-ui');
  if (!inventoryUI) return;

  // Принудительная остановка сердцебиения
  import('../../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });
  
  isInventoryOpen = true;
  inventoryUI.style.display = 'flex';
  registerModalOpen(MODAL_ID);
  
  // Останавка игры
  Game.pauseTime();
  
  audio.isGameActive = false;
  audio.pause();
  
  if (Game.isRunning) Game.stopLoop();
  
  // Синхронизация карты
  syncMap();
  
  // Установка колбэка для обновления
  setRefreshCallback(() => {
    renderInventory();
    if (Game.updateUI) Game.updateUI();
  });
  
  // Рендеринг инвентаря (по умолчанию вкладка "Экипировка")
  renderInventory();
  // Настройка кнопки закрытия
  setupCloseButton();
  // Настройка вкладок
  setupTabs();
}

/**
 * Настройка вкладок инвентаря
 * @returns {void}
 */
function setupTabs() {
  document.querySelectorAll('.inventory-tab').forEach(tab => {
    // Удаление старых обработчиков
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    
    newTab.addEventListener('click', () => {
      const tabId = newTab.dataset.tab;
      switchInventoryTab(tabId);
    });
  });
}

/**
 * Настройка кнопки закрытия
 * @returns {void}
 */
function setupCloseButton() {
  const closeBtn = document.getElementById('inventory-close-btn');
  if (!closeBtn) {
    setTimeout(setupCloseButton, 100);
    return;
  }
  
  // Удаление старых обработчиков
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // Добавление новых обработчиков
  newCloseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeInventory();
  });
}

/**
 * Переключение инвентаря (открыть/закрыть)
 * @returns {void}
 */
export function toggleInventory() {
  if (isInventoryOpen) closeInventory(); else openInventory();
}

/**
 * Инициализация системы инвентаря
 * @returns {void}
 */
export function initInventory() {
  // Синхронизация карты при старте
  syncMap();
  
  // Кнопка открытия в HUD
  const btn = document.getElementById('inventory-toggle-btn');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleInventory();
    });
  }
  
  // Закрытие по клику на оверлей
  const inventoryUI = document.getElementById('inventory-ui');
  if (inventoryUI) {
    inventoryUI.addEventListener('click', (e) => {
      if (e.target === inventoryUI) closeInventory();
    });
  }
}

/**
 * Обработчик клавиатуры для инвентаря (только для открытия)
 * @param {KeyboardEvent} e
 * @returns {void}
 */
export function handleInventoryKey(e) {
  const key = e.key.toLowerCase();
  if (key === 'i' || key === 'ш') {
    if (isPauseMenuOpen()) return;
    if (isSettingsOpen()) return;
    if (isAchievementsOpen()) return;
    
    e.preventDefault();
    toggleInventory();
  }
}