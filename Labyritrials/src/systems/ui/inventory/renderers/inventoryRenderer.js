/**
 * @fileoverview Основной рендерер инвентаря — координатор всех частей
 * @module systems/ui/inventory/renderers/inventoryRenderer
 */

import { renderWeaponGrid, renderRangedGrid, renderWeaponSlots } from './weaponsRenderer.js';
import { renderEquipmentGrid, renderEquipmentSlots } from './equipmentRenderer.js';
import { renderItemGrid } from './itemsRenderer.js';
import { getLastSelectedItem, updateDescription, clearDescription } from './descriptionRenderer.js';
import { renderQuestsList } from './questsRenderer.js';

/**
 * Устанавливаем колбэк обновления для дочерних модулей
 */
window._inventoryRefreshCallback = null;

/**
 * Рендеринг всего инвентаря
 */
export function renderInventory() {
  // Рендеринг сеток
  renderWeaponGrid();
  renderRangedGrid();
  renderEquipmentGrid();
  renderItemGrid();
  
  // Рендеринг слотов
  renderWeaponSlots();
  renderEquipmentSlots();

  // Рендеринг списка заданий
  renderQuestsList();
  
  // Восстановление описания, если был выбран предмет
  const lastSelected = getLastSelectedItem();
  if (lastSelected) updateDescription(lastSelected);
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
 * @param {string} tabId - ID вкладки ('equipment', 'items' или 'quests')
 */
export function switchInventoryTab(tabId) {
  // Обновление активной вкладки
  document.querySelectorAll('.inventory-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  // Отображение нужного содержимого
  document.querySelectorAll('.inventory-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `inventory-tab-${tabId}`);
  });
  
  // Очистка описания при переключении вкладки
  clearDescription();
  
  // Скрытие блока описания на вкладке "Задания"
  const descContainer = document.getElementById('inventory-description');
  if (descContainer) {
    if (tabId === 'quests') descContainer.style.display = 'none';
    else descContainer.style.display = '';
  }
  
  // При переключении на вкладку предметов обновляется их отображение
  if (tabId === 'items') renderItemGrid();
  // При переключении на вкладку заданий обновляется их отображение
  if (tabId === 'quests') renderQuestsList();
}