/**
 * @fileoverview Рендеринг снаряжения в инвентаре (сетка + слоты)
 * @module systems/ui/inventory/renderers/equipmentRenderer
 */

import { state, player } from '../../../../core/config/index.js';
import { 
  updateDescriptionForItem, 
  clearDescription, 
  setLastSelectedItem 
} from './descriptionRenderer.js';
import { getItemIconHTML } from './utils.js';
import { EQUIPMENT_CONFIG } from '../inventoryData.js';

/**
 * Рендеринг сетки снаряжения
 */
export function renderEquipmentGrid() {
  const grid = document.getElementById('inventory-equipment-grid');
  if (!grid) return;
  
  // Получаем всё снаряжение (и экипированное, и нет)
  const equipmentItems = player.inventory?.items?.equipment || [];

  if (equipmentItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--color-text-dark); font-size: 14px;">
        Нет снаряжения
      </div>
    `;
    return;
  }

  let html = '';
  
  for (const itemId of equipmentItems) {
    const config = EQUIPMENT_CONFIG[itemId];
    if (!config) continue;
    
    const iconHTML = getItemIconHTML(itemId);
    // Проверяем, экипирован ли предмет (в любом слоте)
    const isEquipped = Object.values(player.inventory?.equipped || {}).includes(itemId);
    
    let classes = 'inventory-item-cell';
    if (isEquipped) classes += ' equipped active';
    
    html += `
      <div class="${classes}" 
           data-item="${itemId}" 
           data-owned="true"
           data-name="${config.name}"
           data-desc="${config.desc || ''}"
           data-is-equipped="${isEquipped}">
        <span class="item-icon">${iconHTML}</span>
      </div>
    `;
  }
  
  grid.innerHTML = html;
  
  // Добавляем обработчики
  grid.querySelectorAll('.inventory-item-cell').forEach(el => {
    const itemId = el.dataset.item;
    const config = EQUIPMENT_CONFIG[itemId];
    const isEquipped = el.dataset.isEquipped === 'true';
    
    if (config) {
      el.addEventListener('mouseenter', () => {
        setLastSelectedItem(itemId);
        updateDescriptionForItem(itemId);
      });
      
      el.addEventListener('click', () => {
        if (!player.inventory) return;
        if (!player.inventory.equipped) {
          player.inventory.equipped = { item1: null, item2: null, item3: null };
        }
        if (!player.inventory.items) {
          player.inventory.items = { equipment: [] };
        }
        if (!player.inventory.items.equipment) {
          player.inventory.items.equipment = [];
        }
        
        if (isEquipped) {
          // Снимаем предмет
          const slot = Object.keys(player.inventory.equipped).find(
            key => player.inventory.equipped[key] === itemId
          );
          if (slot) {
            delete player.inventory.equipped[slot];
          }
        } else {
          // Ищем первый свободный слот
          const slots = ['item1', 'item2', 'item3'];
          let freeSlot = null;
          
          for (const s of slots) {
            if (!player.inventory.equipped[s]) {
              freeSlot = s;
              break;
            }
          }
          
          if (freeSlot) {
            // Если есть свободный слот — экипируем туда
            player.inventory.equipped[freeSlot] = itemId;
          }
        }
        
        // Обновляем рендеринг
        if (window._inventoryRefreshCallback) {
          window._inventoryRefreshCallback();
        }
      });
    }
  });
}

/**
 * Рендеринг слотов снаряжения
 */
export function renderEquipmentSlots() {
  const equipmentSlots = ['item1', 'item2', 'item3'];
  
  for (const slotId of equipmentSlots) {
    const slot = document.querySelector(`.inventory-slot-equipment[data-slot="${slotId}"]`);
    if (slot) {
      const icon = slot.querySelector('.inventory-slot-icon');
      if (icon) {
        // Проверяем, есть ли предмет в этом слоте
        const equippedItems = player.inventory?.equipped || {};
        const itemId = equippedItems[slotId] || null;
        
        if (itemId) {
          const config = EQUIPMENT_CONFIG[itemId];
          const iconHTML = config ? getItemIconHTML(itemId) : '📦';
          
          icon.innerHTML = iconHTML;
          icon.style.fontSize = '';
          icon.style.color = '';
          icon.style.opacity = '1';
          slot.classList.remove('empty');
          slot.classList.add('has-item');
        } else {
          icon.textContent = '+';
          icon.style.fontSize = '28px';
          icon.style.color = 'var(--color-text-dark)';
          icon.style.opacity = '0.6';
          slot.classList.add('empty');
          slot.classList.remove('has-item');
        }
        
        // Клонируем слот для удаления старых обработчиков
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);
        
        // Добавляем обработчик клика — снятие предмета
        newSlot.addEventListener('click', () => {
          const equippedItems = player.inventory?.equipped || {};
          const currentItemId = equippedItems[slotId] || null;
          
          if (currentItemId) {
            // Снимаем предмет со слота
            delete player.inventory.equipped[slotId];
            
            if (window._inventoryRefreshCallback) {
              window._inventoryRefreshCallback();
            }
          }
        });
        
        // Добавляем обработчик наведения для описания
        newSlot.addEventListener('mouseenter', () => {
          const equippedItems = player.inventory?.equipped || {};
          const itemId = equippedItems[slotId] || null;
          
          if (itemId) {
            setLastSelectedItem(itemId);
            updateDescriptionForItem(itemId);
          } else {
            clearDescription();
          }
        });
      }
    }
  }
}