/**
 * @fileoverview Рендеринг предметов в инвентаре
 * @module systems/ui/inventory/renderers/itemsRenderer
 */

import { player } from '../../../../core/config/index.js';
import { updateDescriptionForItem, setLastSelectedItem } from './descriptionRenderer.js';
import { getItemIconHTML } from './utils.js';
import { ITEM_CONFIG } from '../inventoryData.js';
import { syncMap, getMaxInventoryCells } from '../inventoryUtils.js';

/**
 * Рендеринг сетки предметов
 */
export function renderItemGrid() {
  const grid = document.getElementById('inventory-item-grid');
  if (!grid) return;
  
  // Синхронизация карты перед рендерингом
  syncMap();
  
  const availableItems = player.inventory?.items?.available || [];
  const counts = player.inventory?.items?.counts || {};
  
  // Максимальное количество ячеек
  const maxCells = getMaxInventoryCells();
  
  // Если нет предметов - рендеринг пустых ячеек
  let html = '';
  
  if (availableItems.length === 0) {
    // Рендеринг maxCells пустых ячеек
    for (let i = 0; i < maxCells; i++) {
      html += `<div class="inventory-item-cell empty"></div>`;
    }
    grid.innerHTML = html;
    return;
  }
  
  // Обрезка списка до maxCells
  const displayedItems = availableItems.slice(0, maxCells);
  
  // Рендеринг предметов + пустые ячейки до maxCells
  for (let i = 0; i < maxCells; i++) {
    if (i < displayedItems.length) {
      // Заполненная ячейка
      const itemId = displayedItems[i];
      const config = ITEM_CONFIG[itemId];
      if (!config) {
        // Если конфиг не найден - ячейка считается пустой
        html += `<div class="inventory-item-cell empty"></div>`;
        continue;
      }
      
      const iconHTML = getItemIconHTML(itemId);
      const count = counts[itemId] || 0;
      const showCount = config.stackable && count > 1;
      const isFull = config.maxStack && count >= config.maxStack;
      const countBadge = showCount ? `<span class="item-count-badge${isFull ? ' full' : ''}">x${count}</span>` : '';
      
      html += `
        <div class="inventory-item-cell"  
             data-item="${itemId}" 
             data-owned="true"
             data-count="${count}"
             data-name="${config.name}"
             data-desc="${config.desc || ''}">
          <span class="item-icon">${iconHTML}</span>
          ${countBadge}
        </div>
      `;
    } else {
      // Пустая ячейка (плейсхолдер)
      html += `<div class="inventory-item-cell empty"></div>`;
    }
  }
  
  grid.innerHTML = html;
  
  // Обработчики - только для заполненных ячеек
  grid.querySelectorAll('.inventory-item-cell[data-item]').forEach(el => {
    const itemId = el.dataset.item;
    const config = ITEM_CONFIG[itemId];
    if (!config) return;

    el.addEventListener('mouseenter', () => {
      setLastSelectedItem(itemId);
      updateDescriptionForItem(itemId);
    });

    el.addEventListener('click', () => {
      grid.querySelectorAll('.inventory-item-cell').forEach(cell => {
        cell.classList.remove('active');
      });
      if (!el.classList.contains('active')) {
        el.classList.add('active');
        setLastSelectedItem(itemId);
        updateDescriptionForItem(itemId);
      } else {
        setLastSelectedItem(null);
      }
    });
  });
}