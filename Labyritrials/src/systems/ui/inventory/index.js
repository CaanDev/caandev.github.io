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
  
  // СОХРАНЯЕМ ИГРУ ПРИ ЗАКРЫТИИ ИНВЕНТАРЯ
  import('../../../save/saveSystem.js').then(({ saveGame }) => {
    saveGame();
  });
  
  // Возобновляем игру
  Game.resumeTime();
  
  audio.isGameActive = true;
  audio.resume();
  
  if (!Game.isRunning) {
    Game.startLoop();
  }
}

/**
 * Открытие инвентаря
 * @returns {void}
 */
export function openInventory() {
  // Проверяем, не открыты ли другие окна
  if (isPauseMenuOpen()) return;
  if (isSettingsOpen()) return;
  if (isAchievementsOpen()) return;
  
  // ==== ЗАГРУЗКА ШАБЛОНА (ЕСЛИ НУЖНО) =====
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
  
  isInventoryOpen = true;
  inventoryUI.style.display = 'flex';
  registerModalOpen(MODAL_ID);
  
  // Останавливаем игру
  Game.pauseTime();
  
  audio.isGameActive = false;
  audio.pause();
  
  if (Game.isRunning) {
    Game.stopLoop();
  }
  
  // ===== СИНХРОНИЗАЦИЯ КАРТЫ =====
  syncMap();
  
  // Устанавливаем колбэк для обновления
  setRefreshCallback(() => {
    renderInventory();
    if (Game.updateUI) {
      Game.updateUI();
    }
  });
  
  // Рендерим инвентарь (по умолчанию вкладка "Экипировка")
  renderInventory();
  
  // Настраиваем кнопку закрытия
  setupCloseButton();
  
  // Настраиваем вкладки
  setupTabs();
}

/**
 * Настройка вкладок инвентаря
 * @returns {void}
 */
function setupTabs() {
  document.querySelectorAll('.inventory-tab').forEach(tab => {
    // Удаляем старые обработчики
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
  
  // Удаляем все старые обработчики
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // Добавляем новый обработчик
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
  if (isInventoryOpen) {
    closeInventory();
  } else {
    openInventory();
  }
}

/**
 * Инициализация системы инвентаря
 * @returns {void}
 */
export function initInventory() {
  // ===== СИНХРОНИЗАЦИЯ КАРТЫ ПРИ СТАРТЕ =====
  syncMap();
  
  // ===== КНОПКА ОТКРЫТИЯ В HUD =====
  const btn = document.getElementById('inventory-toggle-btn');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleInventory();
    });
  }
  
  // ===== ЗАКРЫТИЕ ПО КЛИКУ НА ОВЕРЛЕЙ =====
  const inventoryUI = document.getElementById('inventory-ui');
  if (inventoryUI) {
    inventoryUI.addEventListener('click', (e) => {
      if (e.target === inventoryUI) {
        closeInventory();
      }
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