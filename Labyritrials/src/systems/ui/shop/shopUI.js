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

/**
 * Инициализация обработчиков магазина
 * 
 * @returns {void}
 */
export function initShopHandlers() {
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
    closeBtn.addEventListener('click', closeShop);
  }

  // ===== ВКЛАДКИ =====
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
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