/**
 * @fileoverview Вспомогательные функции для работы с инвентарём
 * @module systems/ui/inventory/inventoryUtils
 */

import { player } from '../../../core/config/index.js';

/**
 * Удаление карты из инвентаря игрока
 * @returns {void}
 */
export function removeMapFromInventory() {
  if (player.inventory && player.inventory.items && player.inventory.items.available) {
    const index = player.inventory.items.available.indexOf('map');
    if (index !== -1) {
      player.inventory.items.available.splice(index, 1);
    }
  }
}

/**
 * Добавление карты в инвентарь игрока
 * @returns {void}
 */
export function addMapToInventory() {
  if (!player.inventory) {
    player.inventory = { items: { equipped: {}, available: [] } };
  }
  if (!player.inventory.items) {
    player.inventory.items = { equipped: {}, available: [] };
  }
  if (!player.inventory.items.available) {
    player.inventory.items.available = [];
  }
  
  if (!player.inventory.items.available.includes('map')) {
    player.inventory.items.available.push('map');
  }
}

/**
 * Проверка, есть ли карта в инвентаре
 * @returns {boolean}
 */
export function hasMapInInventory() {
  return player.inventory?.items?.available?.includes('map') || false;
}

/**
 * Синхронизация карты (hasMap и инвентарь)
 * @returns {void}
 */
export function syncMap() {
  if (player.hasMap) {
    addMapToInventory();
  } else {
    removeMapFromInventory();
  }
}