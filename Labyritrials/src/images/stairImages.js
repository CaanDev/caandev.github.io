/**
 * @fileoverview Конфигурация изображений для ступенек (порталов на следующий уровень)
 * @module images/stairImages
 */

// ============================================================
// СТУПЕНЬКИ (ПОРТАЛЫ НА СЛЕДУЮЩИЙ УРОВЕНЬ)
// ============================================================

/**
 * @constant {Object} STAIRS_IMAGES
 * @description Изображения ступенек для разных биомов
 */
export const STAIRS_IMAGES = {
  /** @type {string[]} - Биом Cave (уровни 1-5) */
  cave: [
    'assets/images/stairs/stairsToNextLvlCave-1.png',
    'assets/images/stairs/stairsToNextLvlCave-2.png',
  ],
  /** @type {string[]} - Биом Ice (уровни 6-10) */
  ice: [
    'assets/images/stairs/stairsToNextLvlIce-1.png',
    'assets/images/stairs/stairsToNextLvlIce-2.png',
  ],
  /** @type {string[]} - Биом Sand (уровни 11-15) */
  sand: [
    'assets/images/stairs/stairsToNextLvlSand-1.png',
    'assets/images/stairs/stairsToNextLvlSand-2.png',
  ],
};

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

/**
 * @constant {Object} STAIR_IMAGES_REGISTRATION
 * @description Объект для регистрации всех изображений ступенек в загрузчике
 */
export const STAIR_IMAGES_REGISTRATION = {
  stairsCave1: 'assets/images/stairs/stairsToNextLvlCave-1.png',
  stairsCave2: 'assets/images/stairs/stairsToNextLvlCave-2.png',
  stairsIce1: 'assets/images/stairs/stairsToNextLvlIce-1.png',
  stairsIce2: 'assets/images/stairs/stairsToNextLvlIce-2.png',
  stairsSand1: 'assets/images/stairs/stairsToNextLvlSand-1.png',
  stairsSand2: 'assets/images/stairs/stairsToNextLvlSand-2.png',
};

/**
 * Получение случайного изображения ступенек для биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {number} [seed] - Seed для детерминированного выбора (опционально)
 * @returns {string|null} - Путь к изображению или null
 */
export function getRandomStairImage(biome, seed = null) {
  const images = STAIRS_IMAGES[biome];
  if (!images || images.length === 0) return null;
  
  let index;
  if (seed !== null) {
    // Детерминированный выбор на основе seed
    const hash = (seed * 31 + 17) % 1000;
    index = hash % images.length;
  } else {
    index = Math.floor(Math.random() * images.length);
  }
  
  return images[index];
}

/**
 * Получение ключа для регистрации изображения по пути
 * 
 * @param {string} path - Путь к изображению
 * @returns {string|null} - Ключ изображения или null
 */
export function getStairImageKey(path) {
  for (const [key, value] of Object.entries(STAIR_IMAGES_REGISTRATION)) {
    if (value === path) {
      return key;
    }
  }
  return null;
}