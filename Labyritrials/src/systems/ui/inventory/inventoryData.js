/**
 * @fileoverview Данные инвентаря (адаптер для UI)
 * @module systems/ui/inventory/inventoryData
 */

import { WEAPONS_DATA, ITEMS_DATA } from '../../../data/index.js';

// ============================================================
// КОНФИГУРАЦИЯ ОРУЖИЯ (прокси к данным)
// ============================================================

export const WEAPON_CONFIG = {};

// Преобразуем WEAPONS_DATA в формат, ожидаемый UI
for (const [id, data] of Object.entries(WEAPONS_DATA)) {
  WEAPON_CONFIG[id] = {
    id: data.id,
    name: data.name,
    icon: data.icon,
    damage: data.damage,
    effects: data.effects || [],
    desc: data.desc,
    isRanged: data.isRanged,
    unlocked: data.isDefault,
    category: data.category,
  };
}

// ============================================================
// КОНФИГУРАЦИЯ СНАРЯЖЕНИЯ (адаптер для UI)
// ============================================================

export const EQUIPMENT_CONFIG = {};

// Преобразуем ITEMS_DATA в формат снаряжения
for (const [id, data] of Object.entries(ITEMS_DATA)) {
  if (data.type !== 'equipment') continue;
  
  EQUIPMENT_CONFIG[id] = {
    id: data.id,
    name: data.name,
    icon: data.icon,
    desc: data.desc,
    type: data.type,
    slot: data.slot || 'item1',
    stackable: data.stackable,
    maxStack: data.maxStack,
    persistent: data.persistent,
    isNew: data.isNew || false,
  };
}

// ============================================================
// КОНФИГУРАЦИЯ ПРЕДМЕТОВ (прокси к данным)
// ============================================================

export const ITEM_CONFIG = {};

// Преобразуем ITEMS_DATA в формат, ожидаемый UI
// Фильтруем только предметы, НЕ являющиеся снаряжением
for (const [id, data] of Object.entries(ITEMS_DATA)) {
  if (data.type === 'equipment') continue;
  
  ITEM_CONFIG[id] = {
    id: data.id,
    name: data.name,
    icon: data.icon,
    desc: data.desc,
    type: data.type,
    stackable: data.stackable,
    maxStack: data.maxStack,
  };
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export function getWeaponConfig(weaponId) {
  return WEAPON_CONFIG[weaponId];
}

export function getEquipmentConfig(equipmentId) {
  return EQUIPMENT_CONFIG[equipmentId];
}

export function getItemConfig(itemId) {
  return ITEM_CONFIG[itemId];
}

export function isWeapon(id) {
  return !!WEAPON_CONFIG[id];
}

export function isEquipment(id) {
  return !!EQUIPMENT_CONFIG[id];
}

export function isItem(id) {
  return !!ITEM_CONFIG[id];
}

export function getItemName(id) {
  if (WEAPON_CONFIG[id]) return WEAPON_CONFIG[id].name;
  if (ITEM_CONFIG[id]) return ITEM_CONFIG[id].name;
  if (EQUIPMENT_CONFIG[id]) return EQUIPMENT_CONFIG[id].name;
  return `Неизвестный предмет #${id}`;
}

export function getItemDesc(id) {
  if (WEAPON_CONFIG[id]) return WEAPON_CONFIG[id].desc;
  if (ITEM_CONFIG[id]) return ITEM_CONFIG[id].desc;
  if (EQUIPMENT_CONFIG[id]) return EQUIPMENT_CONFIG[id].desc;
  return 'Неизвестный предмет';
}

// ============================================================
// НАЧАЛЬНЫЕ ДАННЫЕ ИНВЕНТАРЯ
// ============================================================

export function getInitialInventory() {
  return {
    primary: 'default',
    secondary: null,
    availableWeapons: ['default'],
    availableRanged: [],
    items: {
      equipped: {
        item1: null,
        item2: null,
        item3: null,
      },
      available: [],
      equipment: [],
    },
  };
}