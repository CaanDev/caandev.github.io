/**
 * @fileoverview Основной рендерер инвентаря — координатор всех частей
 * @module systems/ui/inventory/renderers/inventoryRenderer
 */

import { renderWeaponGrid, renderRangedGrid, renderWeaponSlots } from './weaponsRenderer.js';
import { renderEquipmentGrid, renderEquipmentSlots } from './equipmentRenderer.js';
import { renderItemGrid } from './itemsRenderer.js';
import { getLastSelectedItem, updateDescription, clearDescription } from './descriptionRenderer.js';

/**
 * Устанавливаем колбэк обновления для дочерних модулей
 */
window._inventoryRefreshCallback = null;

/**
 * Рендеринг всего инвентаря
 */
export function renderInventory() {
  // Рендерим сетки
  renderWeaponGrid();
  renderRangedGrid();
  renderEquipmentGrid();
  renderItemGrid();
  
  // Рендерим слоты
  renderWeaponSlots();
  renderEquipmentSlots();
  
  // Восстанавливаем описание, если был выбран предмет
  const lastSelected = getLastSelectedItem();
  if (lastSelected) {
    updateDescription(lastSelected);
  }
}

/**
 * Установка колбэка для обновления UI после изменений
 * @param {Function} callback - Функция обновления
 */
export function setRefreshCallback(callback) {
  window._inventoryRefreshCallback = callback;
}

/**
 * Переключение вкладки инвентаря
 * @param {string} tabId - ID вкладки ('equipment' или 'items')
 */
export function switchInventoryTab(tabId) {
  // Обновляем активную вкладку
  document.querySelectorAll('.inventory-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  // Показываем нужное содержимое
  document.querySelectorAll('.inventory-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `inventory-tab-${tabId}`);
  });
  
  // Очищаем описание при переключении вкладки
  clearDescription();
  
  // При переключении на вкладку предметов обновляем их отображение
  if (tabId === 'items') {
    renderItemGrid();
  }
}