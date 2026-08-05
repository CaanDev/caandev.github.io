/**
 * @fileoverview Конфигурация изображений для объектов в мире
 * @module images/objectImages
 */

 import { state } from '../core/config/index.js';

// ============================================================
// ФАКЕЛЫ
// ============================================================

export const TORCH_IMAGES = {
  // ===== БИОМЫ (по уровням) =====
  cave: {
    1: ['assets/images/objects/torches/biomes/cave/torchCaveLvl1.png'],
    2: ['assets/images/objects/torches/biomes/cave/torchCaveLvl2.png'],
    3: ['assets/images/objects/torches/biomes/cave/torchCaveLvl3.png'],
    4: ['assets/images/objects/torches/biomes/cave/torchCaveLvl4.png'],
  },
  ice: {
    6: ['assets/images/objects/torches/biomes/ice/torchIceLvl6.png'],
    7: ['assets/images/objects/torches/biomes/ice/torchIceLvl7.png'],
    8: ['assets/images/objects/torches/biomes/ice/torchIceLvl8.png'],
    9: ['assets/images/objects/torches/biomes/ice/torchIceLvl9.png'],
  },
  sand: {
    11: ['assets/images/objects/torches/biomes/sand/torchSandLvl11.png'],
    12: ['assets/images/objects/torches/biomes/sand/torchSandLvl12.png'],
    13: ['assets/images/objects/torches/biomes/sand/torchSandLvl13.png'],
    14: ['assets/images/objects/torches/biomes/sand/torchSandLvl14.png'],
  },
  
  // ===== КОМНАТЫ =====
  shrine: [
    'assets/images/objects/torches/rooms/torchShrineRoom.png',
  ],
  trap: [
    'assets/images/objects/torches/rooms/torchTrapRoom.png',
  ],
  treasure: [
    'assets/images/objects/torches/rooms/torchTreasureRoom.png',
  ],
  safe: [
    'assets/images/objects/torches/rooms/torchSafeRoom.png',
  ],
  
  // ===== БОСС-АРЕНЫ =====
  boss5: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl5.png',
  ],
  boss10: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl10.png',
  ],
  boss15: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl15.png',
  ],
};

// ============================================================
// ЛОВУШКИ
// ============================================================

export const TRAP_IMAGES = {
  explosion: 'assets/images/objects/traps/trapExplosion.png',
  ice: 'assets/images/objects/traps/trapIce.png',
  acid: 'assets/images/objects/traps/trapAcid.png',
  lightning: 'assets/images/objects/traps/trapLightning.png',
  psionic: 'assets/images/objects/traps/trapPsionic.png',
};

// ============================================================
// АЛТАРИ (СВЯТИЛИЩА)
// ============================================================

export const ALTAR_IMAGES = {
  // Биом Cave
  cave: {
    active: 'assets/images/objects/altars/altarCaveActive.png',
    activated: 'assets/images/objects/altars/altarCaveActivated.png',
  },
  // Биом Ice
  ice: {
    active: 'assets/images/objects/altars/altarIceActive.png',
    activated: 'assets/images/objects/altars/altarIceActivated.png',
  },
  // Биом Sand
  sand: {
    active: 'assets/images/objects/altars/altarSandActive.png',
    activated: 'assets/images/objects/altars/altarSandActivated.png',
  },
};

// ============================================================
// ЛАВКА ТОРГОВЦА
// ============================================================

export const SHOP_STAND_IMAGE = 'assets/images/objects/shopStand.png';

// ============================================================
// КНИЖНЫЕ ПОЛКИ
// ============================================================

export const BOOKSHELF_IMAGE = 'assets/images/objects/bookshelf.png';

/**
 * Получение изображения факела для биома и уровня
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {number} level - Номер уровня
 * @returns {string|null} - Путь к изображению или null
 */
export function getTorchImageForBiome(biome, level) {
  const biomeData = TORCH_IMAGES[biome];
  if (!biomeData) return null;
  
  const levelData = biomeData[level];
  if (!levelData || levelData.length === 0) return null;
  
  return levelData[0];
}

/**
 * Получение случайного изображения факела
 * 
 * @param {string} type - Тип факела
 * @returns {string} - Путь к изображению
 */
export function getRandomTorchImage(type = 'normal') {
  // Для биомов используем специальную логику
  if (type === 'cave' || type === 'ice' || type === 'sand') {
    // Защита от undefined state
    const level = state?.gameLevel || 1;
    const image = getTorchImageForBiome(type, level);
    if (image) return image;
  }
  
  const images = TORCH_IMAGES[type];
  if (!images || images.length === 0) {
    // Fallback: если нет изображений для типа
    const fallback = TORCH_IMAGES.cave?.[1];
    if (fallback && fallback.length > 0) {
      return fallback[0];
    }
    // Последний fallback
    return 'assets/images/objects/torches/rooms/torchSafeRoom.png';
  }
  
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * Получение изображения ловушки по типу
 * 
 * @param {string} type - Тип ловушки ('explosion', 'ice', 'acid', 'lightning', 'psionic')
 * @returns {string} - Путь к изображению ловушки
 */
export function getTrapImage(type) {
  return TRAP_IMAGES[type] || TRAP_IMAGES.explosion;
}

/**
 * Получение изображения алтаря
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {boolean} activated - Активирован ли алтарь
 * @returns {string|null} - Путь к изображению или null
 */
export function getAltarImage(biome, activated = false) {
  const biomeData = ALTAR_IMAGES[biome];
  if (!biomeData) return null;
  
  const key = activated ? 'activated' : 'active';
  return biomeData[key] || null;
}

/**
 * Получение биома для алтаря на основе состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand')
 */
export function getAltarBiome(state) {
  // В комнате с алтарём используем биом текущего уровня
  if (state.inShrineRoom) {
    return state.currentBiome || 'cave';
  }
  return state.currentBiome || 'cave';
}

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

export const OBJECT_IMAGES = {
  // ===== ФАКЕЛЫ: БИОМЫ =====
  // Cave (уровни 1-4)
  torchCaveLvl1: 'assets/images/objects/torches/biomes/cave/torchCaveLvl1.png',
  torchCaveLvl2: 'assets/images/objects/torches/biomes/cave/torchCaveLvl2.png',
  torchCaveLvl3: 'assets/images/objects/torches/biomes/cave/torchCaveLvl3.png',
  torchCaveLvl4: 'assets/images/objects/torches/biomes/cave/torchCaveLvl4.png',
  
  // Ice (уровни 6-9)
  torchIceLvl6: 'assets/images/objects/torches/biomes/ice/torchIceLvl6.png',
  torchIceLvl7: 'assets/images/objects/torches/biomes/ice/torchIceLvl7.png',
  torchIceLvl8: 'assets/images/objects/torches/biomes/ice/torchIceLvl8.png',
  torchIceLvl9: 'assets/images/objects/torches/biomes/ice/torchIceLvl9.png',
  
  // Sand (уровни 11-14)
  torchSandLvl11: 'assets/images/objects/torches/biomes/sand/torchSandLvl11.png',
  torchSandLvl12: 'assets/images/objects/torches/biomes/sand/torchSandLvl12.png',
  torchSandLvl13: 'assets/images/objects/torches/biomes/sand/torchSandLvl13.png',
  torchSandLvl14: 'assets/images/objects/torches/biomes/sand/torchSandLvl14.png',

  // ===== ФАКЕЛЫ: КОМНАТЫ =====
  torchShrine: 'assets/images/objects/torches/rooms/torchShrineRoom.png',
  torchTrap: 'assets/images/objects/torches/rooms/torchTrapRoom.png',
  torchTreasure: 'assets/images/objects/torches/rooms/torchTreasureRoom.png',
  torchSafe: 'assets/images/objects/torches/rooms/torchSafeRoom.png',

  // ===== ФАКЕЛЫ: БОСС-АРЕНЫ =====
  torchBoss5: 'assets/images/objects/torches/bossArena/torchBossArenaLvl5.png',
  torchBoss10: 'assets/images/objects/torches/bossArena/torchBossArenaLvl10.png',
  torchBoss15: 'assets/images/objects/torches/bossArena/torchBossArenaLvl15.png',

  // ===== ЛОВУШКИ =====
  trapExplosion: 'assets/images/objects/traps/trapExplosion.png',
  trapIce: 'assets/images/objects/traps/trapIce.png',
  trapAcid: 'assets/images/objects/traps/trapAcid.png',
  trapLightning: 'assets/images/objects/traps/trapLightning.png',
  trapPsionic: 'assets/images/objects/traps/trapPsionic.png',

  // ===== АЛТАРИ =====
  altarCaveActive: 'assets/images/objects/altars/altarCaveActive.png',
  altarCaveActivated: 'assets/images/objects/altars/altarCaveActivated.png',
  altarIceActive: 'assets/images/objects/altars/altarIceActive.png',
  altarIceActivated: 'assets/images/objects/altars/altarIceActivated.png',
  altarSandActive: 'assets/images/objects/altars/altarSandActive.png',
  altarSandActivated: 'assets/images/objects/altars/altarSandActivated.png',

  // Лавка торговца
  shopStand: 'assets/images/objects/shopStand.png',
  // Книжные полки
  bookshelf: 'assets/images/objects/bookshelf.png',
};