/**
 * @fileoverview Основной UI магазина.
 * Управляет открытием, закрытием, переключением вкладок,
 * инициализацией обработчиков и обновлением интерфейса магазина.
 * 
 * @module systems/ui/shop/shopUI
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { audio } from '../../../audio/audioManager.js';
import { Game } from '../../../core/game.js';
import { getRandomSpeech, updateShopkeeperSpeech } from './shopSpeech.js';
import { SPEECH } from './shopSpeech.js';
import { isTemplateInitialized } from '../../../utils/htmlLoader.js';
import {
  updateBuyHpStatus,
  updateBuyDamageStatus,
  updateMapStatus,
  updateVampireStaffStatus,
  updateStunStaffStatus,
  updateDefaultStaffStatus,
  updateFireballStatus,
} from './shopStatus.js';
import {
  initBuyHpHandler,
  initBuyDamageHandler,
  initBuyMapHandler,
  initBuyVampireStaffHandler,
  initBuyStunStaffHandler,
  initBuyDefaultStaffHandler,
  initBuyFireballHandler,
} from './shopHandlers.js';

/** @type {string} - Текущая активная вкладка магазина */
let currentShopTab = 'upgrades';

/** @type {boolean} - Инициализированы ли обработчики магазина */
let shopHandlersInitialized = false;

/**
 * Внутренняя функция инициализации обработчиков магазина
 * 
 * @returns {void}
 * @private
 */
function doInitShopHandlers() {
  if (shopHandlersInitialized) return;
  
  // ===== ОТКРЫТИЕ МАГАЗИНА — ПРИВЕТСТВЕННАЯ РЕЧЬ =====
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) {
    const observer = new MutationObserver(() => {
      if (shopUI.style.display === 'flex' || shopUI.style.display === 'block') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.welcome));
      }
    });
    observer.observe(shopUI, { attributes: true, attributeFilter: ['style'] });
  }

  // ===== ЗАКРЫТИЕ МАГАЗИНА =====
  const closeBtn = document.getElementById('shop-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeShop);
  }

  // ===== ВКЛАДКИ =====
  document.querySelectorAll('.shop-tab').forEach(tab => {
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    newTab.addEventListener('click', () => {
      const tabId = newTab.dataset.tab;
      switchShopTab(tabId);
    });
  });

  // ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ПОКУПОК =====
  initBuyHpHandler(updateShopUI);
  initBuyDamageHandler(updateShopUI);
  initBuyMapHandler(updateShopUI);
  initBuyVampireStaffHandler(updateShopUI);
  initBuyStunStaffHandler(updateShopUI);
  initBuyDefaultStaffHandler(updateShopUI);
  initBuyFireballHandler(updateShopUI);

  // ===== ПЕРВОНАЧАЛЬНОЕ ОБНОВЛЕНИЕ UI =====
  updateShopUI();
  
  shopHandlersInitialized = true;
}

/**
 * Инициализация обработчиков магазина
 * 
 * Проверяет, инициализирован ли шаблон магазина, и настраивает обработчики.
 * 
 * @returns {void}
 */
export function initShopHandlers() {
  // Проверяем, что шаблон магазина загружен и инициализирован
  if (!isTemplateInitialized('shop')) {
    console.warn('⚠️ Шаблон shop не инициализирован, пропускаем настройку обработчиков');
    return;
  }
  
  doInitShopHandlers();
}

/**
 * Переключение вкладки магазина
 * 
 * @param {string} tabId - ID вкладки ('upgrades', 'weapons', 'items')
 * @returns {void}
 * @private
 */
function switchShopTab(tabId) {
  currentShopTab = tabId;
  
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  document.querySelectorAll('.shop-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `shop-tab-${tabId}`);
  });
}

/**
 * Закрытие магазина
 * 
 * @returns {void}
 * @private
 */
function closeShop() {
  state.isShopOpen = false;
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'none';
  
  updateShopkeeperSpeech(getRandomSpeech(SPEECH.close));
  
  // Возобновление игры
  Game.resumeTime();
  audio.isGameActive = true;
  audio.resume();
}

/**
 * Обновление UI магазина
 * 
 * @returns {void}
 * @private
 */
function updateShopUI() {
  const shopUI = document.getElementById('shop-ui');
  if (!shopUI || shopUI.style.display !== 'block') return;

  // ===== ОБНОВЛЕНИЕ ЗОЛОТА =====
  const goldEl = document.getElementById('shop-gold');
  if (goldEl) goldEl.textContent = player.gold;

  // ===== ОБНОВЛЕНИЕ СТОИМОСТИ =====
  const hpCost = document.getElementById('hp-cost');
  if (hpCost) hpCost.textContent = player.hpCost;

  const dmgCost = document.getElementById('dmg-cost');
  if (dmgCost) dmgCost.textContent = player.dmgCost;

  // ===== ОБНОВЛЕНИЕ СТАТУСОВ =====
  updateBuyHpStatus();
  updateBuyDamageStatus();
  updateMapStatus();
  updateVampireStaffStatus();
  updateStunStaffStatus();
  updateDefaultStaffStatus();
  updateFireballStatus();
}

/**
 * Обновление UI магазина из внешних источников
 * 
 * @returns {void}
 */
export function updateShopUIForExternal() {
  updateShopUI();
}