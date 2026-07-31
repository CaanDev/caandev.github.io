// images/inventoryImages.js

/**
 * @fileoverview Конфигурация изображений для инвентаря
 * @module images/inventoryImages
 */

/**
 * Пути ко всем изображениям инвентаря
 */
export const INVENTORY_IMAGES = {
  // === ОРУЖИЕ (weapon/) ===
  staffDefault: 'assets/images/inventory/weapon/staffDefault.png',
  staffThunder: 'assets/images/inventory/weapon/staffThunder.png',
  staffVampire: 'assets/images/inventory/weapon/staffVampire.png',
  fireball: 'assets/images/inventory/weapon/fireball.png',
  
  // === СНАРЯЖЕНИЕ (equipment/) ===
  talismanFire: 'assets/images/inventory/equipment/talismanFire.png',

  // === ПРЕДМЕТЫ (items/) ===
  mapLevel: 'assets/images/inventory/items/mapLevel.png',
  mapLevelIce: 'assets/images/inventory/items/mapLevelIce.png',
};

/**
 * Маппинг ID оружия → ключ изображения
 */
export const WEAPON_IMAGE_MAP = {
  default: 'staffDefault',
  stun: 'staffThunder',
  vampire: 'staffVampire',
  fireball: 'fireball',
};

/**
 * Получение ключа изображения для оружия
 * @param {string} weaponId - ID оружия ('default', 'stun', 'vampire', 'fireball')
 * @returns {string} - Ключ изображения
 */
export function getWeaponImageKey(weaponId) {
  return WEAPON_IMAGE_MAP[weaponId] || 'staffDefault';
}

/**
 * Получение пути к изображению для оружия
 * @param {string} weaponId - ID оружия
 * @returns {string} - Путь к изображению
 */
export function getWeaponImagePath(weaponId) {
  const key = getWeaponImageKey(weaponId);
  return INVENTORY_IMAGES[key] || INVENTORY_IMAGES.staffDefault;
}

/**
 * Получение ключа изображения для карты в зависимости от биома
 * @param {string} biome - ID биома ('cave', 'ice', 'sand', 'treasure')
 * @returns {string} - Ключ изображения карты
 */
export function getMapImageKey(biome) {
  if (biome === 'ice') {
    return 'mapLevelIce';
  }
  return 'mapLevel';
}

/**
 * Получение пути к изображению карты в зависимости от биома
 * @param {string} biome - ID биома ('cave', 'ice', 'sand', 'treasure')
 * @returns {string} - Путь к изображению карты
 */
export function getMapImagePath(biome) {
  const key = getMapImageKey(biome);
  return INVENTORY_IMAGES[key] || INVENTORY_IMAGES.mapLevel;
}