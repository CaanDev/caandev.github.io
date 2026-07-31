/**
 * @fileoverview Рендеринг описания предмета в инвентаре
 * @module systems/ui/inventory/renderers/descriptionRenderer
 */

import { player } from '../../../../core/config/index.js';
import { WEAPON_CONFIG, EQUIPMENT_CONFIG, ITEM_CONFIG } from '../inventoryData.js';

/** @type {string|null} - ID последнего выбранного предмета для описания */
let lastSelectedItem = null;

/**
 * Проверка, экипирован ли предмет снаряжения
 * @param {string} itemId - ID предмета
 * @returns {boolean}
 */
function isEquipmentEquipped(itemId) {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes(itemId);
}

/**
 * Обновление описания оружия
 * @param {string} weaponId - ID оружия
 */
export function updateDescription(weaponId) {
  const config = WEAPON_CONFIG[weaponId];
  if (!config) {
    clearDescription();
    return;
  }
  
  const isOwned = 
    (config.isRanged && (player.ownedRangedWeapons || []).includes(weaponId)) ||
    (!config.isRanged && (player.ownedMeleeWeapons || []).includes(weaponId));
  
  if (!isOwned) {
    clearDescription();
    return;
  }
  
  const isEquipped = 
    (config.isRanged && player.rangedWeapon === weaponId) ||
    (!config.isRanged && player.meleeWeapon === weaponId);
  
  let title = config.name || 'Неизвестное оружие';
  
  if (isEquipped) {
    title += ' <span class="equipped-status">(Экипировано)</span>';
  }
  
  let subText = '';
  
  if (config.effects && config.effects.length > 0) {
    subText += `Эффекты: ${config.effects.join(', ')}`;
  }
  
  if (config.desc) {
    if (subText) subText += ' | ';
    subText += config.desc;
  }
  
  showDescription(title, subText);
}

/**
 * Обновление описания предмета (универсальное)
 * @param {string} itemId - ID предмета
 */
export function updateDescriptionForItem(itemId) {
  // Проверяем сначала снаряжение, потом предметы
  const config = EQUIPMENT_CONFIG[itemId] || ITEM_CONFIG[itemId];
  if (!config) {
    clearDescription();
    return;
  }
  
  let title = config.name || 'Неизвестный предмет';
  
  // Проверяем, экипирован ли предмет (для снаряжения)
  if (config.type === 'equipment' && isEquipmentEquipped(itemId)) {
    title += ' <span class="equipped-status">(Экипировано)</span>';
  }
  
  let subText = config.desc || '';
  
  showDescription(title, subText);
}

/**
 * Показ описания
 * @param {string} title - Заголовок (может содержать HTML)
 * @param {string} subText - Подзаголовок
 */
function showDescription(title, subText) {
  const descContainer = document.getElementById('inventory-description');
  if (!descContainer) return;
  
  const titleEl = document.getElementById('inv-desc-title');
  const subEl = document.getElementById('inv-desc-sub');
  
  descContainer.classList.add('visible');
  
  if (titleEl) titleEl.innerHTML = title.trim();
  if (subEl) {
    subEl.textContent = subText;
    subEl.style.color = '';
  }
  
  lastSelectedItem = title;
}

/**
 * Очистка описания
 */
export function clearDescription() {
  const descContainer = document.getElementById('inventory-description');
  if (descContainer) {
    descContainer.classList.remove('visible');
  }
  lastSelectedItem = null;
}

/**
 * Получение последнего выбранного предмета
 * @returns {string|null} - ID или название предмета
 */
export function getLastSelectedItem() {
  return lastSelectedItem;
}

/**
 * Установка последнего выбранного предмета
 * @param {string} itemId - ID предмета
 */
export function setLastSelectedItem(itemId) {
  lastSelectedItem = itemId;
}