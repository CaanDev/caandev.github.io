/**
 * @fileoverview Конфигурация изображений для магазина
 * @module config/shopImages
 */

/**
 * Пути ко всем изображениям магазина
 */
export const SHOP_IMAGES = {
  // === ОБЩИЕ ===
  goldCoin: 'assets/images/shop/goldCoin.png',
  stackOfGold: 'assets/images/shop/stackOfGoldCoins.png',
  
  // === УЛУЧШЕНИЯ (improvements/) ===
  hpUpgrade: 'assets/images/shop/improvements/heartOfHealth.png',
  damageUpgrade: 'assets/images/shop/improvements/damageIncrease.png',
  
  // === ПРЕДМЕТЫ (items/) ===
  map: 'assets/images/shop/items/map.png',
  
  // === ОРУЖИЕ (weapon/) ===
  staffDefault: 'assets/images/shop/weapon/staffDefault.png',
  staffThunder: 'assets/images/shop/weapon/staffThunder.png',
  staffVampire: 'assets/images/shop/weapon/staffVampire.png',
  fireball: 'assets/images/shop/weapon/fireball.png',
};

/**
 * Маппинг товаров к изображениям (для быстрого доступа)
 */
export const SHOP_ITEM_IMAGES = {
  // Улучшения
  'hp': SHOP_IMAGES.hpUpgrade,
  'dmg': SHOP_IMAGES.damageUpgrade,
  
  // Предметы
  'map': SHOP_IMAGES.map,
  
  // Оружие
  'default': SHOP_IMAGES.staffDefault,
  'stun': SHOP_IMAGES.staffThunder,
  'vampire': SHOP_IMAGES.staffVampire,
  'fireball': SHOP_IMAGES.fireball,
};

/**
 * Маппинг для отображения иконок в HTML-элементах
 */
export const SHOP_ICON_MAP = {
  'buy-hp': { key: 'hp', defaultEmoji: '❤️' },
  'buy-dmg': { key: 'dmg', defaultEmoji: '⚔️' },
  'buy-map': { key: 'map', defaultEmoji: '🗺️' },
  'buy-default-staff': { key: 'default', defaultEmoji: '🧙' },
  'buy-sword-stun': { key: 'stun', defaultEmoji: '⚡' },
  'buy-sword-vamp': { key: 'vampire', defaultEmoji: '🦇' },
  'buy-fireball': { key: 'fireball', defaultEmoji: '🔥' },
};