/**
 * @fileoverview Рендеринг оружия в инвентаре (сетка + слоты)
 * @module systems/ui/inventory/renderers/weaponsRenderer
 */

import { player } from '../../../../core/config/index.js';
import { WEAPON_CONFIG } from '../inventoryData.js';
import { 
  updateDescription, 
  clearDescription, 
  setLastSelectedItem 
} from './descriptionRenderer.js';
import { getWeaponIconHTML } from './utils.js';

/**
 * Рендеринг сетки ближнего оружия
 */
export function renderWeaponGrid() {
  const grid = document.getElementById('inventory-weapon-grid');
  if (!grid) return;
  
  const ownedWeapons = player.ownedMeleeWeapons || ['default'];
  
  let html = '';
  
  const allWeapons = ['default', 'stun', 'vampire'];
  
  const sortedWeapons = [...allWeapons].sort((a, b) => {
    const aOwned = ownedWeapons.includes(a);
    const bOwned = ownedWeapons.includes(b);
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return allWeapons.indexOf(a) - allWeapons.indexOf(b);
  });
  
  for (const weaponId of sortedWeapons) {
    const config = WEAPON_CONFIG[weaponId];
    if (!config) continue;
    
    const isOwned = ownedWeapons.includes(weaponId);
    const isEquipped = player.meleeWeapon === weaponId;
    
    let classes = 'inventory-item-cell';
    if (!isOwned) classes += ' locked';
    if (isEquipped) classes += ' equipped active';
    
    const iconHTML = isOwned ? getWeaponIconHTML(weaponId) : '';
    
    html += `
      <div class="${classes}" 
           data-weapon="${weaponId}" 
           data-type="melee" 
           data-owned="${isOwned}"
           data-name="${config.name}"
           data-effects="${config.effects ? config.effects.join(', ') : 'Нет'}"
           data-desc="${config.desc || ''}"
           data-is-equipped="${isEquipped}">
        <span class="item-icon">${iconHTML}</span>
      </div>
    `;
  }
  
  grid.innerHTML = html;
  
  grid.querySelectorAll('.inventory-item-cell').forEach(el => {
    const isOwned = el.dataset.owned === 'true';
    
    if (isOwned) {
      el.addEventListener('mouseenter', () => {
        const weaponId = el.dataset.weapon;
        if (weaponId) {
          setLastSelectedItem(weaponId);
          updateDescription(weaponId);
        }
      });
    }
    
    if (isOwned) {
      el.addEventListener('click', () => {
        const weaponId = el.dataset.weapon;
        if (weaponId) {
          // ===== ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ОРУЖИЯ =====
          // 1. Если кликаем на уже экипированное оружие (не default) — снимаем его
          if (player.meleeWeapon === weaponId && weaponId !== 'default') {
            player.meleeWeapon = 'default';
          } 
          // 2. Если кликаем на default, а экипировано другое — переключаем на default
          else if (weaponId === 'default' && player.meleeWeapon !== 'default') {
            player.meleeWeapon = 'default';
          } 
          // 3. Если кликаем на другое оружие (не default) — экипируем его
          else if (weaponId !== 'default' && player.meleeWeapon !== weaponId) {
            player.meleeWeapon = weaponId;
          }
          // 4. Если кликаем на уже экипированное default — ничего не делаем
          
          if (window._inventoryRefreshCallback) {
            window._inventoryRefreshCallback();
          }
        }
      });
    }
  });
}

/**
 * Рендеринг сетки дальнего оружия
 */
export function renderRangedGrid() {
  const grid = document.getElementById('inventory-ranged-grid');
  if (!grid) return;
  
  const ownedRanged = player.ownedRangedWeapons || [];
  
  let html = '';
  
  const allRanged = ['fireball'];
  
  const sortedRanged = [...allRanged].sort((a, b) => {
    const aOwned = ownedRanged.includes(a);
    const bOwned = ownedRanged.includes(b);
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return allRanged.indexOf(a) - allRanged.indexOf(b);
  });
  
  for (const weaponId of sortedRanged) {
    const config = WEAPON_CONFIG[weaponId];
    if (!config) continue;
    
    const isOwned = ownedRanged.includes(weaponId);
    const isEquipped = player.rangedWeapon === weaponId;
    
    let classes = 'inventory-item-cell';
    if (!isOwned) classes += ' locked';
    if (isEquipped) classes += ' equipped active';
    
    const iconHTML = isOwned ? getWeaponIconHTML(weaponId) : '';
    
    html += `
      <div class="${classes}" 
           data-weapon="${weaponId}" 
           data-type="ranged" 
           data-owned="${isOwned}"
           data-name="${config.name}"
           data-effects="${config.effects ? config.effects.join(', ') : 'Нет'}"
           data-desc="${config.desc || ''}"
           data-is-equipped="${isEquipped}">
        <span class="item-icon">${iconHTML}</span>
      </div>
    `;
  }
  
  grid.innerHTML = html;
  
  grid.querySelectorAll('.inventory-item-cell').forEach(el => {
    const isOwned = el.dataset.owned === 'true';
    
    if (isOwned) {
      el.addEventListener('mouseenter', () => {
        const weaponId = el.dataset.weapon;
        if (weaponId) {
          setLastSelectedItem(weaponId);
          updateDescription(weaponId);
        }
      });
    }
    
    if (isOwned) {
      el.addEventListener('click', () => {
        const weaponId = el.dataset.weapon;
        if (weaponId) {
          // Логика для дальнего оружия (проще — просто переключаем)
          if (player.rangedWeapon === weaponId) {
            player.rangedWeapon = null;
          } else {
            player.rangedWeapon = weaponId;
          }
          if (window._inventoryRefreshCallback) {
            window._inventoryRefreshCallback();
          }
        }
      });
    }
  });
}

/**
 * Рендеринг слотов оружия
 */
export function renderWeaponSlots() {
  // ===== ОСНОВНОЕ ОРУЖИЕ (нельзя снять) =====
  const primarySlot = document.querySelector('.inventory-slot-primary');
  if (primarySlot) {
    const icon = primarySlot.querySelector('.inventory-slot-icon');
    if (icon) {
      const weaponId = player.meleeWeapon || 'default';
      const iconHTML = getWeaponIconHTML(weaponId);
      icon.innerHTML = iconHTML;
      icon.style.fontSize = '';
      icon.style.color = '';
      icon.style.opacity = '';
      primarySlot.classList.remove('empty');
      primarySlot.classList.add('has-item');
      
      // Удаляем старый обработчик
      const newPrimarySlot = primarySlot.cloneNode(true);
      primarySlot.parentNode.replaceChild(newPrimarySlot, primarySlot);
      
      // Добавляем обработчик для показа описания
      newPrimarySlot.addEventListener('click', () => {
        const weaponId = player.meleeWeapon || 'default';
        setLastSelectedItem(weaponId);
        updateDescription(weaponId);
      });
      
      // Перезаписываем переменную для дальнейшего использования
      const updatedPrimarySlot = document.querySelector('.inventory-slot-primary');
      if (updatedPrimarySlot) {
        updatedPrimarySlot.addEventListener('mouseenter', () => {
          const weaponId = player.meleeWeapon || 'default';
          setLastSelectedItem(weaponId);
          updateDescription(weaponId);
        });
      }
    }
  }
  
  // ===== ВТОРОЕ ОРУЖИЕ (можно снять) =====
  const secondarySlot = document.querySelector('.inventory-slot-secondary');
  if (secondarySlot) {
    const icon = secondarySlot.querySelector('.inventory-slot-icon');
    if (icon) {
      const weaponId = player.rangedWeapon;
      if (weaponId) {
        const iconHTML = getWeaponIconHTML(weaponId);
        icon.innerHTML = iconHTML;
        icon.style.fontSize = '';
        icon.style.color = '';
        icon.style.opacity = '';
        secondarySlot.classList.remove('empty');
        secondarySlot.classList.add('has-item');
      } else {
        icon.textContent = '+';
        icon.style.fontSize = '28px';
        icon.style.color = 'var(--color-text-dark)';
        icon.style.opacity = '0.6';
        secondarySlot.classList.add('empty');
        secondarySlot.classList.remove('has-item');
      }
      
      // Клонируем слот для удаления старых обработчиков
      const newSecondarySlot = secondarySlot.cloneNode(true);
      secondarySlot.parentNode.replaceChild(newSecondarySlot, secondarySlot);
      
      // Добавляем обработчик клика — снятие оружия
      newSecondarySlot.addEventListener('click', () => {
        if (player.rangedWeapon) {
          player.rangedWeapon = null;
          if (window._inventoryRefreshCallback) {
            window._inventoryRefreshCallback();
          }
        }
      });
      
      // Добавляем обработчик наведения для описания
      newSecondarySlot.addEventListener('mouseenter', () => {
        if (player.rangedWeapon) {
          setLastSelectedItem(player.rangedWeapon);
          updateDescription(player.rangedWeapon);
        } else {
          clearDescription();
        }
      });
    }
  }
}