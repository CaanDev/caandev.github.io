/**
 * @fileoverview Вспомогательные функции для рендеринга инвентаря
 * @module systems/ui/inventory/renderers/utils
 */

import { state } from '../../../../core/config/index.js';
import { getImage, isImageLoaded } from '../../../../utils/imageLoader.js';
import { WEAPON_IMAGE_MAP } from '../../../../images/inventoryImages.js';
import { WEAPON_CONFIG, EQUIPMENT_CONFIG, ITEM_CONFIG } from '../inventoryData.js';
import { getMapImageKeyByBiome } from '../../../../data/index.js';

/**
 * Получение изображения для оружия
 * @param {string} weaponId - ID оружия
 * @returns {string} - HTML для отображения иконки
 */
export function getWeaponIconHTML(weaponId) {
  const config = WEAPON_CONFIG[weaponId];
  if (!config) return '❓';
  
  const imageKey = WEAPON_IMAGE_MAP[weaponId] || 'staffDefault';
  
  if (isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      return `<img src="${img.src}" class="item-icon-img">`;
    }
  }
  
  return config.icon || '❓';
}

/**
 * Получение HTML для иконки предмета
 * @param {string} itemId - ID предмета
 * @returns {string} - HTML для отображения иконки
 */
export function getItemIconHTML(itemId) {
  // Проверяем сначала в EQUIPMENT_CONFIG, потом в ITEM_CONFIG
  const config = EQUIPMENT_CONFIG[itemId] || ITEM_CONFIG[itemId];
  if (!config) return '❓';
  
  // ===== ОСОБАЯ ЛОГИКА ДЛЯ КАРТЫ =====
  if (itemId === 'map') {
    const biome = state.currentBiome || 'cave';
    const imageKey = getMapImageKeyByBiome(biome);
    
    if (isImageLoaded(imageKey)) {
      const img = getImage(imageKey);
      if (img) {
        return `<img src="${img.src}" class="item-icon-img">`;
      }
    }
    return '🗺️';
  }
  
  // ===== ДЛЯ СНАРЯЖЕНИЯ С ИЗОБРАЖЕНИЕМ =====
  // Проверяем, есть ли ключ изображения
  const imageKey = config.imageKey || itemId;
  if (isImageLoaded(imageKey)) {
    const img = getImage(imageKey);
    if (img) {
      return `<img src="${img.src}" class="item-icon-img">`;
    }
  }
  
  // Для остальных предметов — эмодзи из конфига
  return config.icon || '❓';
}