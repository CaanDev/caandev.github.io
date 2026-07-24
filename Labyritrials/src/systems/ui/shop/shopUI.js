/**
 * @fileoverview Основной UI магазина
 * @module systems/ui/shop/shopUI
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { logger } from '../../../utils/logger.js';
import { audio } from '../../../audio/audioManager.js';
import { Game } from '../../../core/game.js';
import { getRandomSpeech, updateShopkeeperSpeech } from './shopSpeech.js';
import { SPEECH } from './shopSpeech.js';
import { isTemplateInitialized } from '../../../utils/htmlLoader.js';
import { getImage, isImageLoaded } from '../../../utils/imageLoader.js';
import { SHOP_IMAGES, SHOP_ITEM_IMAGES, SHOP_ICON_MAP } from '../../../images/shopImages.js';
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
 * Обновление иконки товара (замена эмодзи на изображение)
 * 
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} itemKey - Ключ товара (из SHOP_ITEM_IMAGES)
 * @param {string} defaultEmoji - Эмодзи по умолчанию (запасной план)
 * @returns {void}
 */
export function updateShopItemImage(itemElement, itemKey, defaultEmoji) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const imagePath = SHOP_ITEM_IMAGES[itemKey];
  
  // Находим ключ в SHOP_IMAGES по пути (это ключ, под которым изображение загружено в кэш)
  const cacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === imagePath);
  
  if (cacheKey && isImageLoaded(cacheKey)) {
    const img = getImage(cacheKey);
    if (img) {
      iconContainer.innerHTML = '';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      
      const imgElement = document.createElement('img');
      imgElement.src = img.src;
      imgElement.alt = itemKey;
      imgElement.className = 'shop-item-icon';
      imgElement.style.width = '36px';
      imgElement.style.height = '36px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.imageRendering = 'pixelated';
      
      iconContainer.appendChild(imgElement);
      return;
    }
  }
  
  // Fallback: эмодзи
  iconContainer.innerHTML = defaultEmoji;
  iconContainer.style.display = '';
  iconContainer.style.fontSize = '28px';
}

/**
 * Обновление золота в магазине
 * 
 * @returns {void}
 */
export function updateShopGoldDisplay() {
  const goldDisplay = document.querySelector('.shop-gold-display');
  if (!goldDisplay) return;
  
  const goldAmount = document.getElementById('shop-gold');
  if (!goldAmount) return;
  
  // Обновляем сумму
  goldAmount.textContent = player.gold;
  
  // Обновляем иконку золота (если есть изображение)
  const iconContainer = goldDisplay.querySelector('.shop-gold-icon');
  if (iconContainer) {
    const imageKey = SHOP_IMAGES.stackOfGold;
    const cacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === imageKey);
    
    if (cacheKey && isImageLoaded(cacheKey)) {
      const img = getImage(cacheKey);
      if (img) {
        iconContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.alt = 'Gold';
        imgElement.style.width = '24px';
        imgElement.style.height = '24px';
        imgElement.style.objectFit = 'contain';
        imgElement.style.verticalAlign = 'middle';
        iconContainer.appendChild(imgElement);
      }
    }
  }
}

/**
 * Обновление цен
 * 
 * @returns {void}
 */
export function updateShopPrices() {
  const priceElements = document.querySelectorAll('.shop-price');
  const imageKey = SHOP_IMAGES.goldCoin;
  const cacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === imageKey);
  const hasGoldCoin = cacheKey && isImageLoaded(cacheKey);
  const goldImg = hasGoldCoin ? getImage(cacheKey) : null;
  
  for (const el of priceElements) {
    // Получаем весь текст внутри элемента (включая эмодзи)
    const fullText = el.textContent || '';
    // Удаляем все эмодзи и лишние пробелы, оставляем только цифры
    const cleanText = fullText.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    
    // Проверяем, есть ли в тексте цифры
    const priceMatch = cleanText.match(/\d+/);
    if (!priceMatch) continue;
    
    const priceText = priceMatch[0];
    
    // Очищаем элемент
    el.innerHTML = '';
    
    // Добавляем текст цены
    const span = document.createElement('span');
    span.textContent = priceText;
    el.appendChild(span);
    
    // Добавляем изображение монеты
    if (hasGoldCoin && goldImg) {
      const imgElement = document.createElement('img');
      imgElement.src = goldImg.src;
      imgElement.alt = '';
      imgElement.style.width = '16px';
      imgElement.style.height = '16px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.verticalAlign = 'middle';
      imgElement.style.marginLeft = '4px';
      imgElement.style.imageRendering = 'pixelated';
      el.appendChild(imgElement);
    }
  }
}

/**
 * Обновление всех иконок в магазине
 * 
 * @returns {void}
 */
export function updateAllShopIcons() {
  // Проверяем, что магазин открыт
  const shopUI = document.getElementById('shop-ui');
  if (!shopUI || shopUI.style.display === 'none') return;
  
  // Обновляем иконки товаров
  for (const [elementId, config] of Object.entries(SHOP_ICON_MAP)) {
    const element = document.getElementById(elementId);
    if (element) {
      updateShopItemImage(element, config.key, config.defaultEmoji);
    }
  }
  
  // Обновляем золото
  updateShopGoldDisplay();
  
  // Обновляем цены
  updateShopPrices();
}

/**
 * Внутренняя функция инициализации обработчиков магазина
 * 
 * @returns {void}
 * @private
 */
function doInitShopHandlers() {
  if (shopHandlersInitialized) return;
  
  // ===== ОТКРЫТИЕ МАГАЗИНА =====
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) {
    const observer = new MutationObserver(() => {
      if (shopUI.style.display === 'flex' || shopUI.style.display === 'block') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.welcome));
        setTimeout(updateAllShopIcons, 50);
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
 * @returns {void}
 */
export function initShopHandlers() {
  doInitShopHandlers();
}

/**
 * Переключение вкладки магазина
 * 
 * @param {string} tabId - ID вкладки
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
  
  setTimeout(updateAllShopIcons, 50);
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

  // Сохранение при закрытии окна магазина
  import('../../../save/saveSystem.js').then(module => {
    module.saveGame();
  });
  
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
  
  // ===== ОБНОВЛЕНИЕ ИКОНОК =====
  updateAllShopIcons();
}

/**
 * Обновление UI магазина из внешних источников
 * 
 * @returns {void}
 */
export function updateShopUIForExternal() {
  updateShopUI();
}