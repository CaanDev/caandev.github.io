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
import { INVENTORY_IMAGES, WEAPON_IMAGE_MAP } from '../../../images/inventoryImages.js';
import { 
  getWeaponPrice, 
  getWeaponMinLevel, 
  getItemPrice, 
  getItemMinLevel, 
  getMapImageKeyByBiome, 
  ITEMS_DATA, 
  getItemData,
  isItemHiddenInShop
} from '../../../data/index.js';
import {
  updateBuyHpStatus,
  updateBuyDamageStatus,
  updateMapStatus,
  updateVampireStaffStatus,
  updateStunStaffStatus,
  updateFireballStatus,
  updateTalismanFireStatus,
} from './shopStatus.js';
import {
  initBuyHpHandler,
  initBuyDamageHandler,
  initBuyMapHandler,
  initBuyVampireStaffHandler,
  initBuyStunStaffHandler,
  initBuyFireballHandler,
  initBuyTalismanFireHandler,
} from './shopHandlers.js';
import { registerModalOpen, registerModalClose } from '../modalManager.js';

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
      imgElement.style.width = '50px';
      imgElement.style.height = '50px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.imageRendering = 'auto';
      
      iconContainer.appendChild(imgElement);
      return;
    }
  }
  
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
  
  goldAmount.textContent = player.gold;
  
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
 * Обновление иконки оружия в магазине
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} weaponId - ID оружия ('default', 'stun', 'vampire', 'fireball')
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @returns {void}
 */
export function updateShopWeaponImage(itemElement, weaponId, defaultEmoji) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const imageKey = WEAPON_IMAGE_MAP[weaponId] || 'staffDefault';
  const imagePath = INVENTORY_IMAGES[imageKey];
  
  if (imagePath && isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      iconContainer.innerHTML = '';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      
      const imgElement = document.createElement('img');
      imgElement.src = img.src;
      imgElement.alt = weaponId;
      imgElement.className = 'shop-item-icon';
      imgElement.style.width = '50px';
      imgElement.style.height = '50px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.imageRendering = 'auto';
      
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
 * Обновление иконки снаряжения в магазине
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} itemId - ID предмета
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @returns {void}
 */
function updateShopEquipmentImage(itemElement, itemId, defaultEmoji) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const imageKey = 'talismanFire';
  const imagePath = INVENTORY_IMAGES[imageKey];
  
  if (imagePath && isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      iconContainer.innerHTML = '';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      
      const imgElement = document.createElement('img');
      imgElement.src = img.src;
      imgElement.alt = itemId;
      imgElement.className = 'shop-item-icon';
      imgElement.style.width = '50px';
      imgElement.style.height = '50px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.imageRendering = 'auto';
      
      iconContainer.appendChild(imgElement);
      return;
    }
  }
  
  iconContainer.innerHTML = defaultEmoji;
  iconContainer.style.display = '';
  iconContainer.style.fontSize = '28px';
}

/**
 * Обновление иконки карты в магазине с учётом биома
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @returns {void}
 */
function updateShopMapImage(itemElement, defaultEmoji) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const biome = state.currentBiome || 'cave';
  const imageKey = getMapImageKeyByBiome(biome);
  const imagePath = INVENTORY_IMAGES[imageKey];
  
  if (imagePath && isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      iconContainer.innerHTML = '';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      
      const imgElement = document.createElement('img');
      imgElement.src = img.src;
      imgElement.alt = 'map';
      imgElement.className = 'shop-item-icon';
      imgElement.style.width = '50px';
      imgElement.style.height = '50px';
      imgElement.style.objectFit = 'contain';
      imgElement.style.imageRendering = 'auto';
      
      iconContainer.appendChild(imgElement);
      return;
    }
  }
  
  iconContainer.innerHTML = defaultEmoji;
  iconContainer.style.display = '';
  iconContainer.style.fontSize = '28px';
}

/**
 * Обновление цен с использованием данных из src/data/
 * 
 * @returns {void}
 */
export function updateShopPrices() {
  const hpCostEl = document.getElementById('hp-cost');
  const dmgCostEl = document.getElementById('dmg-cost');
  
  const imageKey = SHOP_IMAGES.goldCoin;
  const cacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === imageKey);
  const hasGoldCoin = cacheKey && isImageLoaded(cacheKey);
  const goldImg = hasGoldCoin ? getImage(cacheKey) : null;
  
  function replaceEmojiWithImage(element) {
    if (!element) return;
    
    const existingImg = element.querySelector('img');
    if (existingImg) return;
    
    let text = element.textContent || '';
    const cleanText = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    
    element.innerHTML = '';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = cleanText;
    element.appendChild(textSpan);
    
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
      element.appendChild(imgElement);
    }
  }
  
  if (hpCostEl) {
    hpCostEl.textContent = player.hpCost;
    const parentEl = hpCostEl.parentElement;
    if (parentEl && parentEl.classList.contains('shop-price')) {
      const oldImg = parentEl.querySelector('img');
      if (oldImg) oldImg.remove();
      
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
        parentEl.appendChild(imgElement);
      }
    }
  }
  
  if (dmgCostEl) {
    dmgCostEl.textContent = player.dmgCost;
    const parentEl = dmgCostEl.parentElement;
    if (parentEl && parentEl.classList.contains('shop-price')) {
      const oldImg = parentEl.querySelector('img');
      if (oldImg) oldImg.remove();
      
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
        parentEl.appendChild(imgElement);
      }
    }
  }
  
  // Цены на оружие
  const vampPriceEl = document.getElementById('vamp-price');
  if (vampPriceEl && !player.ownedMeleeWeapons.includes('vampire')) {
    vampPriceEl.textContent = getWeaponPrice('vampire');
    replaceEmojiWithImage(vampPriceEl);
  }
  
  const stunPriceEl = document.getElementById('stun-price');
  if (stunPriceEl && !player.ownedMeleeWeapons.includes('stun')) {
    stunPriceEl.textContent = getWeaponPrice('stun');
    replaceEmojiWithImage(stunPriceEl);
  }
  
  const fireballPriceEl = document.getElementById('fireball-price');
  if (fireballPriceEl && !player.ownedRangedWeapons.includes('fireball')) {
    fireballPriceEl.textContent = getWeaponPrice('fireball');
    replaceEmojiWithImage(fireballPriceEl);
  }
  
  // Цена на карту
  const mapPriceEl = document.getElementById('map-price');
  if (mapPriceEl && !player.hasMap) {
    mapPriceEl.textContent = getItemPrice('map');
    replaceEmojiWithImage(mapPriceEl);
  }

  // Цена на огненный талисман
  const talismanPriceEl = document.getElementById('talisman-fire-price');
  if (talismanPriceEl) {
    const itemData = getItemData('talismanFire');
    if (itemData) {
      const isOwned = player.inventory?.items?.equipment?.includes('talismanFire') || false;
      if (!isOwned) {
        talismanPriceEl.textContent = itemData.price;
        replaceEmojiWithImage(talismanPriceEl);
      }
    }
  }
}

/**
 * Обновление всех иконок в магазине
 */
export function updateAllShopIcons() {
  const shopUI = document.getElementById('shop-ui');
  if (!shopUI || shopUI.style.display === 'none') return;
  
  // === ОБЫЧНЫЕ ТОВАРЫ (улучшения) ===
  const upgradeElements = ['buy-hp', 'buy-dmg'];
  for (const elementId of upgradeElements) {
    const element = document.getElementById(elementId);
    if (element) {
      const config = SHOP_ICON_MAP[elementId];
      if (config) {
        updateShopItemImage(element, config.key, config.defaultEmoji);
      }
    }
  }
  
  // === ПРЕДМЕТЫ ===
  // Карта (с учётом биома)
  const mapBtn = document.getElementById('buy-map');
  if (mapBtn) {
    updateShopMapImage(mapBtn, '🗺️');
  }

  // Огненный талисман (только если доступен)
  const talismanBtn = document.getElementById('buy-talisman-fire');
  if (talismanBtn) {
    // Проверяем, должен ли талисман быть скрыт
    if (!isItemHiddenInShop('talismanFire', state.gameLevel)) {
      talismanBtn.style.display = 'flex';
      updateShopEquipmentImage(talismanBtn, 'talismanFire', '🔥');
    } else {
      talismanBtn.style.display = 'none';
    }
  }
  
  // === ОРУЖИЕ ===
  const stunBtn = document.getElementById('buy-sword-stun');
  if (stunBtn) {
    updateShopWeaponImage(stunBtn, 'stun', '⚡');
  }
  
  const vampBtn = document.getElementById('buy-sword-vamp');
  if (vampBtn) {
    updateShopWeaponImage(vampBtn, 'vampire', '🦇');
  }
  
  const fireballBtn = document.getElementById('buy-fireball');
  if (fireballBtn) {
    updateShopWeaponImage(fireballBtn, 'fireball', '🔥');
  }
  
  updateShopGoldDisplay();
  updateShopPrices();
}

/**
 * Проверка, есть ли новые предметы в магазине
 * @returns {boolean} - true, если есть хотя бы один новый предмет
 */
function hasNewItems() {
  const ownedItems = player.inventory?.items?.equipment || [];
  const ownedUtils = player.inventory?.items?.available || [];
  const allOwned = [...ownedItems, ...ownedUtils];
  
  for (const [id, data] of Object.entries(ITEMS_DATA)) {
    // Проверяем: предмет помечен как новый, доступен по уровню, не скрыт, ещё не куплен
    if (data.isNew && 
        data.minLevel <= state.gameLevel && 
        !isItemHiddenInShop(id, state.gameLevel) &&
        !allOwned.includes(id)) {
      return true;
    }
  }
  return false;
}

/**
 * Внутренняя функция инициализации обработчиков магазина
 * 
 * @returns {void}
 * @private
 */
function doInitShopHandlers() {
  if (shopHandlersInitialized) return;
  
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) {
    const observer = new MutationObserver(() => {
      if (shopUI.style.display === 'flex' || shopUI.style.display === 'block') {
        // Обновляем видимость талисмана
        updateTalismanVisibilityInShop();
        
        // Проверяем, есть ли новые товары
        if (hasNewItems()) {
          updateShopkeeperSpeech(getRandomSpeech(SPEECH.newItems));
        } else {
          updateShopkeeperSpeech(getRandomSpeech(SPEECH.welcome));
        }
        setTimeout(updateAllShopIcons, 50);
      }
    });
    observer.observe(shopUI, { attributes: true, attributeFilter: ['style'] });
  }

  const closeBtn = document.getElementById('shop-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeShop);
  }

  document.querySelectorAll('.shop-tab').forEach(tab => {
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    newTab.addEventListener('click', () => {
      const tabId = newTab.dataset.tab;
      switchShopTab(tabId);
    });
  });

  initBuyHpHandler(updateShopUI);
  initBuyDamageHandler(updateShopUI);
  initBuyVampireStaffHandler(updateShopUI);
  initBuyStunStaffHandler(updateShopUI);
  initBuyFireballHandler(updateShopUI);
  initBuyMapHandler(updateShopUI);
  initBuyTalismanFireHandler(updateShopUI);

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
  registerModalClose('shop');
  
  updateShopkeeperSpeech(getRandomSpeech(SPEECH.close));

  import('../../../save/saveSystem.js').then(module => {
    module.saveGame();
  });
  
  Game.resumeTime();
  audio.isGameActive = true;
  audio.resume();
}

/**
 * Обновление видимости талисмана в магазине
 * @returns {void}
 */
function updateTalismanVisibilityInShop() {
  const talismanBtn = document.getElementById('buy-talisman-fire');
  if (!talismanBtn) return;
  
  if (isItemHiddenInShop('talismanFire', state.gameLevel)) {
    talismanBtn.style.display = 'none';
  } else {
    talismanBtn.style.display = 'flex';
  }
}

/**
 * Обновление UI магазина
 * 
 * @returns {void}
 * @private
 */
function updateShopUI() {
  if (!state.isShopOpen) {
    return;
  }

  const hpCostEl = document.getElementById('hp-cost');
  const dmgCostEl = document.getElementById('dmg-cost');
  const goldEl = document.getElementById('shop-gold');
  
  if (!hpCostEl || !dmgCostEl || !goldEl) {
    setTimeout(() => {
      if (state.isShopOpen) {
        updateShopUI();
      }
    }, 50);
    return;
  }

  goldEl.textContent = player.gold;
  hpCostEl.textContent = player.hpCost;
  dmgCostEl.textContent = player.dmgCost;

  // Обновляем видимость талисмана
  updateTalismanVisibilityInShop();

  updateBuyHpStatus();
  updateBuyDamageStatus();
  updateMapStatus();
  updateVampireStaffStatus();
  updateStunStaffStatus();
  updateFireballStatus();
  updateTalismanFireStatus();
  
  updateAllShopIcons();
}

/**
 * Обновление UI магазина из внешних источников
 * 
 * @returns {void}
 */
export function updateShopUIForExternal() {
  if (!state.isShopOpen) {
    return;
  }
  updateShopUI();
}