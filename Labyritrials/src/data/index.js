/**
 * @fileoverview Точка входа для данных игры.
 * Экспортирует все данные: записки, оружие, предметы.
 * 
 * @module data/index
 */

// ============================================================
// ЗАПИСКИ
// ============================================================

export {
  NOTES_DATA,
  getNotesForLevel,
  getNoteById,
  getAllNotes,
  isBossLevel
} from './notes.js';

// ============================================================
// ОРУЖИЕ
// ============================================================

export {
  WEAPONS_DATA,
  getWeaponData,
  getAllWeapons,
  getWeaponsByCategory,
  getMeleeWeapons,
  getRangedWeapons,
  getBuyableWeapons,
  isDefaultWeapon,
  isRangedWeapon,
  getWeaponPrice,
  getWeaponMinLevel
} from './weapons.js';

// ============================================================
// ПРЕДМЕТЫ
// ============================================================

export {
  ITEMS_DATA,
  getItemData,
  getAllItems,
  getItemsByType,
  getBuyableItems,
  getBuyableEquipment,
  isPersistentItem,
  isOneTimeUseItem,
  getItemPrice,
  getItemMinLevel,
  getMapImageKeyByBiome,
  isItemHiddenInShop
} from './items.js';