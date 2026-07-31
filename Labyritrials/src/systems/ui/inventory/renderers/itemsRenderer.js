/**
 * @fileoverview Рендеринг предметов в инвентаре
 * @module systems/ui/inventory/renderers/itemsRenderer
 */

import { state, player } from '../../../../core/config/index.js';
import { 
  updateDescriptionForItem, 
  setLastSelectedItem 
} from './descriptionRenderer.js';
import { getItemIconHTML } from './utils.js';
import { ITEM_CONFIG } from '../inventoryData.js';
import { syncMap } from '../inventoryUtils.js';

/**
 * Рендеринг сетки предметов
 */
export function renderItemGrid() {
  const grid = document.getElementById('inventory-item-grid');
  if (!grid) return;

  // На босс-уровнях предметы не отображаются
  if (state.isBossLevel) {
    grid.innerHTML = '';
    return;
  }
  
  // Синхронизируем карту перед рендерингом
  syncMap();
  
  const availableItems = player.inventory?.items?.available || [];
  
  // Если нет предметов — показываем сообщение
  if (availableItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px 20px; color: var(--color-text-dark); font-size: 14px;">
        Нет предметов
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // Проходим по всем доступным предметам
  for (const itemId of availableItems) {
    const config = ITEM_CONFIG[itemId];
    if (!config) continue;
    
    const iconHTML = getItemIconHTML(itemId);
    
    html += `
      <div class="inventory-item-cell active"  
           data-item="${itemId}" 
           data-owned="true"
           data-name="${config.name}"
           data-desc="${config.desc || ''}">
        <span class="item-icon">${iconHTML}</span>
      </div>
    `;
  }
  
  grid.innerHTML = html;
  
  // Добавляем обработчики для каждой ячейки
  grid.querySelectorAll('.inventory-item-cell').forEach(el => {
    const itemId = el.dataset.item;
    const config = ITEM_CONFIG[itemId];
    
    if (config) {
      // При наведении показываем описание
      el.addEventListener('mouseenter', () => {
        setLastSelectedItem(itemId);
        updateDescriptionForItem(itemId);
      });
    }
  });
}