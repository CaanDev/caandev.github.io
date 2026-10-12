/**
 * @fileoverview Вспомогательные функции для работы с инвентарём
 * @module systems/ui/inventory/inventoryUtils
 */

import { player } from '../../../core/config/index.js';
import { ITEM_CONFIG } from './inventoryData.js';

/**
 * Удаление карты из инвентаря игрока
 * @returns {void}
 */
export function removeMapFromInventory() {
  if (player.inventory && player.inventory.items && player.inventory.items.available) {
    const index = player.inventory.items.available.indexOf('map');
    if (index !== -1) player.inventory.items.available.splice(index, 1);
  }
}

/**
 * Добавление карты в инвентарь игрока
 * @returns {void}
 */
export function addMapToInventory() {
  if (!player.inventory) player.inventory = { items: { equipped: {}, available: [] } };
  if (!player.inventory.items) player.inventory.items = { equipped: {}, available: [] };
  if (!player.inventory.items.available) player.inventory.items.available = [];
  if (!player.inventory.items.available.includes('map')) player.inventory.items.available.push('map');
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
  if (player.hasMap) addMapToInventory(); else removeMapFromInventory();
}

// ============================================================
// РАСШИРЕНИЕ ИНВЕНТАРЯ
// ============================================================

/**
 * Получение максимального количества ячеек для предметов
 * Базовая строка = 6 ячеек
 * Каждое расширение = +6 ячеек
 * Максимум = 3 расширения = 18 ячеек
 * 
 * @returns {number} - Количество ячеек (6, 12, 18)
 */
export function getMaxInventoryCells() {
  const expansions = Math.min(player.inventoryExpansions || 0, 3);
  return 6 * (1 + expansions);
}

/**
 * Проверка, есть ли свободная ячейка в инвентаре
 * 
 * @returns {boolean} - true, если можно добавить новый предмет
 */
export function hasFreeInventoryCell() {
  const available = player.inventory?.items?.available || [];
  const maxCells = getMaxInventoryCells();
  return available.length < maxCells;
}

/**
 * Проверка, можно ли добавить предмет в инвентарь
 * Учитывает стекируемые предметы (например, крылья)
 * 
 * @param {string} itemId - ID предмета
 * @param {number} [count=1] - Количество (для стекируемых)
 * @returns {boolean} - true, если можно добавить
 */
export function canAddItemToInventory(itemId, count = 1) {
  const config = ITEM_CONFIG[itemId];
  if (!config) return false;
  
  const available = player.inventory?.items?.available || [];
  const counts = player.inventory?.items?.counts || {};
  const maxCells = getMaxInventoryCells();
  
  // Если предмет уже в инвентаре (для стекируемых) - проверка места в стеке
  if (config.stackable && available.includes(itemId)) {
    const currentCount = counts[itemId] || 0;
    const maxStack = config.maxStack || 99;
    return currentCount + count <= maxStack;
  }
  
  // Если предмет нестекируемый и уже в инвентаре - нельзя добавить второй
  if (available.includes(itemId)) return false;

  // Новый предмет - нужна свободная ячейка
  return available.length < maxCells;
}

/**
 * Добавление предмета в инвентарь
 * 
 * @param {string} itemId - ID предмета
 * @param {number} [count=1] - Количество
 * @returns {boolean} - true, если добавлен
 */
export function addItemToInventory(itemId, count = 1) {
  const config = ITEM_CONFIG[itemId];
  if (!config) return false;
  if (!canAddItemToInventory(itemId, count)) return false;
  
  if (!player.inventory) player.inventory = { items: {} };
  if (!player.inventory.items) player.inventory.items = {};
  if (!player.inventory.items.available) player.inventory.items.available = [];
  if (!player.inventory.items.counts) player.inventory.items.counts = {};
  
  const available = player.inventory.items.available;
  const counts = player.inventory.items.counts;
  
  if (!available.includes(itemId)) available.push(itemId);
  if (config.stackable) counts[itemId] = (counts[itemId] || 0) + count; else counts[itemId] = 1;
  
  return true;
}

/**
 * Удаление предмета из инвентаря
 * 
 * @param {string} itemId - ID предмета
 * @param {number} [count=1] - Количество для удаления
 * @returns {boolean} - true, если удалён
 */
export function removeItemFromInventory(itemId, count = 1) {
  const available = player.inventory?.items?.available || [];
  const counts = player.inventory?.items?.counts || {};
  if (!available.includes(itemId)) return false;
  const config = ITEM_CONFIG[itemId];
  
  if (config?.stackable) {
    const currentCount = counts[itemId] || 0;
    const newCount = currentCount - count;
    
    if (newCount > 0) {
      counts[itemId] = newCount;
    } else {
      delete counts[itemId];
      const index = available.indexOf(itemId);
      if (index !== -1) available.splice(index, 1);
    }
  } else {
    delete counts[itemId];
    const index = available.indexOf(itemId);
    if (index !== -1) available.splice(index, 1);
  }
  
  return true;
}