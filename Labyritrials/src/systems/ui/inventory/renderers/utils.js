/**
 * @fileoverview Вспомогательные функции для рендеринга инвентаря
 * @module systems/ui/inventory/renderers/utils
 */

import { state } from '../../../../core/config/index.js';
import { getSpriteWithSize } from '../../../../sprites/index.js';
import { getInventorySize } from '../../../../core/config/index.js';
import { WEAPON_CONFIG, EQUIPMENT_CONFIG, ITEM_CONFIG } from '../inventoryData.js';

/**
 * Маппинг ID оружия -> имя спрайта в атласе
 */
const WEAPON_SPRITE_MAP = {
  default: 'invStaffDefault',
  stun: 'invStaffThunder',
  vampire: 'invStaffVampire',
  fireball: 'invFireball',
};

/**
 * Маппинг ID снаряжения -> имя спрайта в атласе
 */
const EQUIPMENT_SPRITE_MAP = {
  talismanFire: 'invTalismanFire',
  talismanMimicHunter: 'invTalismanMimicHunter',
};

/**
 * Маппинг ID предметов -> имя спрайта в атласе
 */
const ITEM_SPRITE_MAP = {
  map: 'invMapLevel',
  mapLevel: 'invMapLevel',
  mapLevelIce: 'invMapLevelIce',
  mapLevelSand: 'invMapLevelSand',
};

/** @type {Map<string, string>} - Кэш data URL для спрайтов */
const spriteDataUrlCache = new Map();

/**
 * Получение data URL для спрайта
 * @param {string} spriteName - Имя спрайта
 * @param {number} size - Размер иконки
 * @returns {string|null} - Data URL или null
 */
function getSpriteDataUrl(spriteName, size) {
  const cacheKey = `${spriteName}_${size}`;
  
  if (spriteDataUrlCache.has(cacheKey)) return spriteDataUrlCache.get(cacheKey);
  
  const sprite = getSpriteWithSize(spriteName, size);
  if (!sprite) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    sprite.offsetX, sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  const dataUrl = canvas.toDataURL('image/png');
  spriteDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Получение имени спрайта для оружия
 * @param {string} weaponId - ID оружия
 * @returns {string} - Имя спрайта
 */
function getWeaponSpriteName(weaponId) {
  return WEAPON_SPRITE_MAP[weaponId] || 'invStaffDefault';
}

/**
 * Получение имени спрайта для предмета
 * @param {string} itemId - ID предмета
 * @returns {string|null} - Имя спрайта или null
 */
function getItemSpriteName(itemId) {
  if (EQUIPMENT_SPRITE_MAP[itemId]) return EQUIPMENT_SPRITE_MAP[itemId];
  if (ITEM_SPRITE_MAP[itemId]) return ITEM_SPRITE_MAP[itemId];
  return null;
}

/**
 * Получение имени спрайта для карты в зависимости от биома
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {string} - Имя спрайта карты
 */
function getMapSpriteName(biome) {
  if (biome === 'ice') return 'invMapLevelIce';
  if (biome === 'sand') return 'invMapLevelSand';
  return 'invMapLevel';
}

/**
 * Получение HTML для иконки оружия
 * @param {string} weaponId - ID оружия
 * @param {number} [size] - Размер иконки (по умолчанию из SPRITE_SIZES)
 * @returns {string} - HTML для отображения иконки
 */
export function getWeaponIconHTML(weaponId, size) {
  const config = WEAPON_CONFIG[weaponId];
  if (!config) return '❓';
  
  const spriteSize = size || getInventorySize('weapon');
  const spriteName = getWeaponSpriteName(weaponId);
  const dataUrl = getSpriteDataUrl(spriteName, spriteSize);
  
  if (dataUrl) {
    return `<img src="${dataUrl}" 
                 class="item-icon-img" 
                 style="width:${spriteSize}px;height:${spriteSize}px;object-fit:contain;image-rendering:auto;">`;
  }
  
  return config.icon || '❓';
}

/**
 * Получение HTML для иконки оружия в основном слоте (увеличенный размер)
 * @param {string} weaponId - ID оружия
 * @param {number} [size] - Размер иконки (по умолчанию 80px)
 * @returns {string} - HTML для отображения иконки
 */
export function getWeaponSlotIconHTML(weaponId, size = 80) {
  const config = WEAPON_CONFIG[weaponId];
  if (!config) return '❓';
  
  const spriteName = getWeaponSpriteName(weaponId);
  const dataUrl = getSpriteDataUrl(spriteName, size);
  
  if (dataUrl) {
    return `<img src="${dataUrl}" 
                 class="item-icon-img item-slot-icon" 
                 style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:auto;">`;
  }
  
  return config.icon || '❓';
}

/**
 * Получение HTML для иконки снаряжения
 * @param {string} equipmentId - ID снаряжения
 * @param {number} [size] - Размер иконки (по умолчанию из SPRITE_SIZES)
 * @returns {string} - HTML для отображения иконки
 */
export function getEquipmentIconHTML(equipmentId, size) {
  const config = EQUIPMENT_CONFIG[equipmentId];
  if (!config) return '❓';
  
  const spriteSize = size || getInventorySize('equipment');
  const spriteName = getItemSpriteName(equipmentId);
  
  if (spriteName) {
    const dataUrl = getSpriteDataUrl(spriteName, spriteSize);
    if (dataUrl) {
      return `<img src="${dataUrl}" 
                   class="item-icon-img" 
                   style="width:${spriteSize}px;height:${spriteSize}px;object-fit:contain;image-rendering:auto;">`;
    }
  }
  
  return config.icon || '❓';
}

/**
 * Получение HTML для иконки предмета
 * @param {string} itemId - ID предмета
 * @param {number} [size] - Размер иконки (по умолчанию из SPRITE_SIZES)
 * @returns {string} - HTML для отображения иконки
 */
export function getItemIconHTML(itemId, size) {
  // Проверяем снаряжение
  const equipConfig = EQUIPMENT_CONFIG[itemId];
  if (equipConfig) return getEquipmentIconHTML(itemId, size);
  
  const config = ITEM_CONFIG[itemId];
  if (!config) return '❓';
  
  const spriteSize = size || getInventorySize('item');
  
  // Особый случай: карта (зависит от биома)
  if (itemId === 'map' || itemId === 'mapLevel' || itemId === 'mapLevelIce' || itemId === 'mapLevelSand') {
    const biome = state.currentBiome || 'cave';
    const spriteName = getMapSpriteName(biome);
    const dataUrl = getSpriteDataUrl(spriteName, spriteSize);
    
    if (dataUrl) {
      return `<img src="${dataUrl}" 
                   class="item-icon-img" 
                   style="width:${spriteSize}px;height:${spriteSize}px;object-fit:contain;image-rendering:auto;">`;
    }
    return '🗺️';
  }
  
  // Обычные предметы
  const spriteName = getItemSpriteName(itemId);
  if (spriteName) {
    const dataUrl = getSpriteDataUrl(spriteName, spriteSize);
    if (dataUrl) {
      return `<img src="${dataUrl}" 
                   class="item-icon-img" 
                   style="width:${spriteSize}px;height:${spriteSize}px;object-fit:contain;image-rendering:auto;">`;
    }
  }
  
  return config.icon || '❓';
}

/**
 * Очистка кэша data URL
 */
export function clearSpriteDataUrlCache() {
  spriteDataUrlCache.clear();
}