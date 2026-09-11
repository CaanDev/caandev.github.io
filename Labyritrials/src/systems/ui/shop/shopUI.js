/**
 * @fileoverview Основной UI магазина
 * @module systems/ui/shop/shopUI
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { logger, isTemplateInitialized, formatNumber } from '../../../utils/index.js';
import { audio } from '../../../audio/audioManager.js';
import { Game } from '../../../core/game.js';
import { getRandomSpeech, updateShopkeeperSpeech } from './shopSpeech.js';
import { SPEECH } from './shopSpeech.js';
import { getSpriteWithSize } from '../../../sprites/index.js';
import { getShopSize } from '../../../core/config/index.js';
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
  updateBuyStaminaStatus,
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
  initBuyStaminaHandler,
} from './shopHandlers.js';
import { registerModalOpen, registerModalClose } from '../modalManager.js';

/** @type {string} - Текущая активная вкладка магазина */
let currentShopTab = 'upgrades';

/** @type {boolean} - Инициализированы ли обработчики магазина */
let shopHandlersInitialized = false;

/**
 * Маппинг ID товара -> имя спрайта в атласе
 */
const SHOP_SPRITE_MAP = {
  // Улучшения
  'buy-hp': 'shopBoostHp',
  'buy-dmg': 'shopBoostDmg',
  'buy-stamina': 'shopBoostStamina',
  
  // Оружие
  'buy-sword-stun': 'invStaffThunder',
  'buy-sword-vamp': 'invStaffVampire',
  'buy-fireball': 'invFireball',
  
  // Предметы
  'buy-map': 'invMapLevel',
  'buy-talisman-fire': 'invTalismanFire',
};

/**
 * Маппинг ID товара -> эмодзи (запасной вариант)
 */
const SHOP_EMOJI_MAP = {
  'buy-hp': '❤️',
  'buy-dmg': '⚔️',
  'buy-stamina': '⚡',
  'buy-sword-stun': '⚡',
  'buy-sword-vamp': '🦇',
  'buy-fireball': '🔥',
  'buy-map': '🗺️',
  'buy-talisman-fire': '🔥',
};

/** @type {string|null} - Кэш data URL для золотой монеты */
let goldCoinDataUrl = null;

/** @type {string|null} - Кэш data URL для стопки золота */
let goldStackDataUrl = null;

/**
 * Получение data URL для золотой монеты
 * @param {number} spriteSize - Размер иконки
 * @returns {string|null}
 */
function getGoldCoinDataUrl(spriteSize) {
  if (goldCoinDataUrl) return goldCoinDataUrl;
  
  const sprite = getSpriteWithSize('shopGoldCoin', spriteSize);
  if (!sprite) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = spriteSize;
  canvas.height = spriteSize;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, spriteSize, spriteSize);
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    sprite.offsetX, sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  goldCoinDataUrl = canvas.toDataURL('image/png');
  return goldCoinDataUrl;
}

/**
 * Получение data URL для стопки золота
 * @param {number} spriteSize - Размер иконки
 * @returns {string|null}
 */
function getGoldStackDataUrl(spriteSize) {
  if (goldStackDataUrl) return goldStackDataUrl;
  
  const sprite = getSpriteWithSize('shopStackGold', spriteSize);
  if (!sprite) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = spriteSize;
  canvas.height = spriteSize;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, spriteSize, spriteSize);
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    sprite.offsetX, sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  goldStackDataUrl = canvas.toDataURL('image/png');
  return goldStackDataUrl;
}

/**
 * Вспомогательная функция: добавляет или обновляет иконку золота у элемента цены
 * 
 * @param {HTMLElement} element - Элемент с ценой
 * @param {string} dataUrl - Data URL изображения монеты
 * @param {number} spriteSize - Размер иконки
 * @returns {void}
 */
function addGoldIconToPrice(element, dataUrl, spriteSize) {
  if (!element) return;
  
  // Проверка, является ли сам элемент .shop-price
  let container = element;
  
  // Если элемент не .shop-price, поиск его родителя с классом .shop-price
  if (!element.classList.contains('shop-price')) {
    const parent = element.closest('.shop-price');
    if (parent) container = parent;
    else {
      // Если не найден .shop-price, используется сам элемент
      container = element;
    }
  }
  
  // Проверка, есть ли уже изображение в контейнере
  let existingImg = container.querySelector('img');
  
  if (existingImg) {
    if (existingImg.src !== dataUrl) existingImg.src = dataUrl;
    return;
  }
  
  // Если элемент - это span с ценой, а контейнер - .shop-price,
  // очистка текста только у span, а иконка добавляется в .shop-price
  if (container !== element && element.tagName === 'SPAN') {
    // Очистка текста от эмодзи
    let text = element.textContent || '';
    const cleanText = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    element.textContent = cleanText;
  } else {
    // Очистка текста от эмодзи
    let text = container.textContent || '';
    const cleanText = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    container.textContent = cleanText;
  }
  
  // Добавление иконки в контейнер
  const imgElement = document.createElement('img');
  imgElement.src = dataUrl;
  imgElement.alt = '';
  imgElement.style.width = `${spriteSize}px`;
  imgElement.style.height = `${spriteSize}px`;
  imgElement.style.objectFit = 'contain';
  imgElement.style.verticalAlign = 'middle';
  imgElement.style.marginLeft = '4px';
  imgElement.style.imageRendering = 'pixelated';
  container.appendChild(imgElement);
}

/**
 * Обновление иконки товара через спрайт
 * 
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} spriteName - Имя спрайта в атласе
 * @param {string} defaultEmoji - Эмодзи по умолчанию (запасной план)
 * @param {number} [size] - Размер иконки (по умолчанию из SPRITE_SIZES)
 * @returns {void}
 */
export function updateShopItemImage(itemElement, spriteName, defaultEmoji, size) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const spriteSize = size || getShopSize('item');
  const sprite = getSpriteWithSize(spriteName, spriteSize);
  
  if (sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = spriteSize;
    canvas.height = spriteSize;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, spriteSize, spriteSize);
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      sprite.offsetX, sprite.offsetY,
      sprite.drawW, sprite.drawH
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    
    iconContainer.innerHTML = '';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    
    const imgElement = document.createElement('img');
    imgElement.src = dataUrl;
    imgElement.alt = spriteName;
    imgElement.className = 'shop-item-icon';
    imgElement.style.width = `${spriteSize}px`;
    imgElement.style.height = `${spriteSize}px`;
    imgElement.style.objectFit = 'contain';
    imgElement.style.imageRendering = 'auto';
    
    iconContainer.appendChild(imgElement);
    return;
  }
  
  // Fallback: эмодзи
  iconContainer.innerHTML = defaultEmoji;
  iconContainer.style.display = '';
  iconContainer.style.fontSize = '28px';
}

/**
 * Обновление иконки карты в магазине с учётом биома
 * @param {HTMLElement} itemElement - Элемент товара
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @param {number} [size] - Размер иконки
 * @returns {void}
 */
function updateShopMapImage(itemElement, defaultEmoji, size) {
  if (!itemElement) return;
  
  const iconContainer = itemElement.querySelector('.shop-icon');
  if (!iconContainer) return;
  
  const spriteSize = size || getShopSize('item');
  const biome = state.currentBiome || 'cave';
  const spriteName = biome === 'ice' ? 'invMapLevelIce' : 
                     biome === 'sand' ? 'invMapLevelSand' : 'invMapLevel';
  const sprite = getSpriteWithSize(spriteName, spriteSize);
  
  if (sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = spriteSize;
    canvas.height = spriteSize;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, spriteSize, spriteSize);
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      sprite.offsetX, sprite.offsetY,
      sprite.drawW, sprite.drawH
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    
    iconContainer.innerHTML = '';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    
    const imgElement = document.createElement('img');
    imgElement.src = dataUrl;
    imgElement.alt = 'map';
    imgElement.className = 'shop-item-icon';
    imgElement.style.width = `${spriteSize}px`;
    imgElement.style.height = `${spriteSize}px`;
    imgElement.style.objectFit = 'contain';
    imgElement.style.imageRendering = 'auto';
    
    iconContainer.appendChild(imgElement);
    return;
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
  
  goldAmount.textContent = formatNumber(player.gold);
  
  const iconContainer = goldDisplay.querySelector('.shop-gold-icon');
  if (iconContainer) {
    const spriteSize = getShopSize('stackGold');
    const dataUrl = getGoldStackDataUrl(spriteSize);
    
    if (dataUrl) {
      iconContainer.innerHTML = '';
      const imgElement = document.createElement('img');
      imgElement.src = dataUrl;
      imgElement.alt = 'Gold';
      imgElement.style.width = `${spriteSize}px`;
      imgElement.style.height = `${spriteSize}px`;
      imgElement.style.objectFit = 'contain';
      imgElement.style.verticalAlign = 'middle';
      iconContainer.appendChild(imgElement);
    }
  }
}

/**
 * Обновление цен с использованием данных из src/data/
 * 
 * @returns {void}
 */
export function updateShopPrices() {
  const spriteSize = getShopSize('goldCoin');
  const dataUrl = getGoldCoinDataUrl(spriteSize);
  
  if (!dataUrl) return;
  
  // Все элементы цен
  const priceElements = [
    document.getElementById('hp-cost'),
    document.getElementById('dmg-cost'),
    document.getElementById('stamina-cost'),
    document.getElementById('vamp-price'),
    document.getElementById('stun-price'),
    document.getElementById('fireball-price'),
    document.getElementById('map-price'),
    document.getElementById('talisman-fire-price'),
  ];
  
  for (const el of priceElements) {
    if (!el) continue;
    
    // Обновление текста цены
    let priceText = '';
    const id = el.id;
    
    if (id === 'hp-cost') priceText = player.hpCost;
    else if (id === 'dmg-cost') priceText = player.dmgCost;
    else if (id === 'stamina-cost') {
      const maxUpgrades = 7;
      const currentUpgrades = player.staminaUpgradeCount || 0;
      if (currentUpgrades < maxUpgrades) priceText = player.staminaUpgradeCost || 150;
      else {
        // Если достигнут максимум - цена не обновляется
        continue;
      }
    } else if (id === 'vamp-price') {
      if (!player.ownedMeleeWeapons.includes('vampire')) priceText = getWeaponPrice('vampire'); else continue;
    } else if (id === 'stun-price') {
      if (!player.ownedMeleeWeapons.includes('stun')) priceText = getWeaponPrice('stun'); else continue;
    } else if (id === 'fireball-price') {
      if (!player.ownedRangedWeapons.includes('fireball')) priceText = getWeaponPrice('fireball'); else continue;
    } else if (id === 'map-price') {
      if (!player.hasMap) priceText = getItemPrice('map'); else continue;
    } else if (id === 'talisman-fire-price') {
      const itemData = getItemData('talismanFire');
      if (itemData) {
        const isOwned = player.inventory?.items?.equipment?.includes('talismanFire') || false;
        if (!isOwned) priceText = itemData.price; else continue;
      } else continue;
    }
    
    // Установка текста цены
    el.textContent = formatNumber(priceText);
    // Добавление иконки золота
    addGoldIconToPrice(el, dataUrl, spriteSize);
  }
}

/**
 * Обновление всех иконок в магазине
 */
export function updateAllShopIcons() {
  const shopUI = document.getElementById('shop-ui');
  if (!shopUI || shopUI.style.display === 'none') return;
  
  // Обычные товары (улучшения)
  const upgradeElements = ['buy-hp', 'buy-dmg', 'buy-stamina'];
  for (const elementId of upgradeElements) {
    const element = document.getElementById(elementId);
    if (element) {
      const spriteName = SHOP_SPRITE_MAP[elementId];
      const emoji = SHOP_EMOJI_MAP[elementId];
      if (spriteName) updateShopItemImage(element, spriteName, emoji);
    }
  }
  
  // Предметы
  // Карта (с учётом биома)
  const mapBtn = document.getElementById('buy-map');
  if (mapBtn) updateShopMapImage(mapBtn, '🗺️');

  // Огненный талисман (только если доступен)
  const talismanBtn = document.getElementById('buy-talisman-fire');
  if (talismanBtn) {
    if (!isItemHiddenInShop('talismanFire', state.gameLevel)) {
      talismanBtn.style.display = 'flex';
      updateShopItemImage(talismanBtn, 'invTalismanFire', '🔥');
    } else {
      talismanBtn.style.display = 'none';
    }
  }
  
  // Оружие
  const stunBtn = document.getElementById('buy-sword-stun');
  if (stunBtn) updateShopItemImage(stunBtn, 'invStaffThunder', '⚡');
  
  const vampBtn = document.getElementById('buy-sword-vamp');
  if (vampBtn) updateShopItemImage(vampBtn, 'invStaffVampire', '🦇');
  
  const fireballBtn = document.getElementById('buy-fireball');
  if (fireballBtn) updateShopItemImage(fireballBtn, 'invFireball', '🔥');
  
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
        // Принудительная остановка сердцебиения
        import('../../../audio/audioManager.js').then(({ audio }) => {
          audio.sound.stopLowHPSound();
        });

        // Обновление видимости талисмана
        updateTalismanVisibilityInShop();
        
        // Проверка, есть ли новые товары
        if (hasNewItems()) updateShopkeeperSpeech(getRandomSpeech(SPEECH.newItems));
        else updateShopkeeperSpeech(getRandomSpeech(SPEECH.welcome));

        updateShopUI();
        updateShopPrices();
        updateAllShopIcons();
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
  initBuyStaminaHandler(updateShopUI);

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
export function closeShop() {
  state.isShopOpen = false;
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'none';
  registerModalClose('shop');
  
  updateShopkeeperSpeech(getRandomSpeech(SPEECH.close));

  import('../../../save/saveSystem.js').then(module => {
    module.saveGame();
  });

  // Сброс клавиш
  import('../../input/index.js').then(({ resetAllKeys }) => {
    resetAllKeys();
  });
  
  Game.startLoop();
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
  
  if (isItemHiddenInShop('talismanFire', state.gameLevel)) talismanBtn.style.display = 'none';
  else talismanBtn.style.display = 'flex';
}

/**
 * Обновление UI магазина
 * 
 * @returns {void}
 * @private
 */
function updateShopUI() {
  if (!state.isShopOpen) return;

  const hpCostEl = document.getElementById('hp-cost');
  const dmgCostEl = document.getElementById('dmg-cost');
  const goldEl = document.getElementById('shop-gold');
  
  if (!hpCostEl || !dmgCostEl || !goldEl) {
    setTimeout(() => {
      if (state.isShopOpen) updateShopUI();
    }, 50);
    return;
  }

  goldEl.textContent = formatNumber(player.gold);
  hpCostEl.textContent = formatNumber(player.hpCost);
  dmgCostEl.textContent = formatNumber(player.dmgCost);

  updateTalismanVisibilityInShop();

  updateBuyHpStatus();
  updateBuyDamageStatus();
  updateBuyStaminaStatus();
  updateMapStatus();
  updateVampireStaffStatus();
  updateStunStaffStatus();
  updateFireballStatus();
  updateTalismanFireStatus();
  
  updateShopPrices();
  updateAllShopIcons();
}

/**
 * Обновление UI магазина из внешних источников
 * 
 * @returns {void}
 */
export function updateShopUIForExternal() {
  if (!state.isShopOpen) return;
  updateShopUI();
  updateShopPrices();
  updateAllShopIcons();
}