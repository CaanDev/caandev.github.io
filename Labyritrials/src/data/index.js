/**
 * @fileoverview Точка входа для данных игры.
 * Экспортирует все данные: записки, оружие, предметы, монстры, боссы, биомы, события, достижения.
 * 
 * @module data/index
 */

// ============================================================
// БИОМЫ
// ============================================================

export {
  BIOMES_DATA,
  getBiomeData,
  getBiomeByLevel,
  getBiomeConfig,
  getFloorColorForBiome,
  getMonsterTypesForBiome,
  getMonsterTypesByLevel,
  getTrapTypesForBiome,
  getTrapTypesByLevel,
  getEventTypesForBiome,
  getEventTypesByLevel
} from './biomes.js';

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

// ============================================================
// МОНСТРЫ
// ============================================================

export {
  MONSTERS_DATA,
  getMonsterData,
  getAllMonsters,
  getMonstersByBiome,
  getMonstersByLevel,
  getMonsterMinLevel
} from './monsters.js';

// ============================================================
// БОССЫ
// ============================================================

export {
  BOSSES_DATA,
  getBossData,
  getBossByLevel,
  isBossLevel as isBossLevelData,
  getBossNameByLevel,
  getBossEmojiByLevel,
  getBossTypeByLevel
} from './bosses.js';

// ============================================================
// СОБЫТИЯ
// ============================================================

export {
  EVENTS_DATA,
  getEventData,
  getAllEvents,
  getEventsByCategory,
  getEventName,
  getEventColor,
  getEventIcon
} from './events.js';

// ============================================================
// ДОСТИЖЕНИЯ
// ============================================================

export {
  ACHIEVEMENTS_DATA,
  CATEGORIES_DATA,
  getAchievementData,
  getAllAchievements,
  getAchievementsByCategory,
  getCategories,
  getTotalAchievementsCount
} from './achievements.js';

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