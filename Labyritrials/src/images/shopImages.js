/**
 * @fileoverview Конфигурация изображений для магазина
 * @module config/shopImages
 */

import { INVENTORY_IMAGES } from './inventoryImages.js';

/**
 * Пути ко всем изображениям магазина
 */
export const SHOP_IMAGES = {
  // === ОБЩИЕ ===
  goldCoin: 'assets/images/shop/goldCoin.png',
  stackOfGold: 'assets/images/shop/stackOfGoldCoins.png',
  
  // === УЛУЧШЕНИЯ (improvements/) ===
  hpUpgrade: 'assets/images/shop/improvements/boostHP.png',
  damageUpgrade: 'assets/images/shop/improvements/boostDMG.png',
  staminaUpgrade: 'assets/images/shop/improvements/boostStamina.png',
  
  // === ПРЕДМЕТЫ ===
  map: INVENTORY_IMAGES.mapLevel,
};

/**
 * Маппинг товаров к изображениям (для быстрого доступа)
 */
export const SHOP_ITEM_IMAGES = {
  // Улучшения
  'hp': SHOP_IMAGES.hpUpgrade,
  'dmg': SHOP_IMAGES.damageUpgrade,
  'stamina': SHOP_IMAGES.staminaUpgrade,
  
  // Карта
  'map': SHOP_IMAGES.map,
};

/**
 * Маппинг для отображения иконок в HTML-элементах
 */
export const SHOP_ICON_MAP = {
  'buy-hp': { key: 'hp', defaultEmoji: '❤️' },
  'buy-dmg': { key: 'dmg', defaultEmoji: '⚔️' },
  'buy-stamina': { key: 'stamina', defaultEmoji: '⚡' },
  'buy-map': { key: 'map', defaultEmoji: '🗺️' },
};