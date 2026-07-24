/**
 * @fileoverview Конфигурация изображений для стен
 * @module images/wallImages
 */

// ============================================================
// ПУТИ К ИЗОБРАЖЕНИЯМ СТЕН
// ============================================================

export const WALL_IMAGES = {
  // === CAVE BIOME ===
  cave: {
    wall: [
      'assets/images/walls/cave/wall-1.png',
      'assets/images/walls/cave/wall-2.png',
      'assets/images/walls/cave/wall-3.png',
    ],
    cracked: [
      'assets/images/walls/cave/wallCracked-1.png',
      'assets/images/walls/cave/wallCracked-2.png',
      'assets/images/walls/cave/wallCracked-3.png',
      'assets/images/walls/cave/wallCracked-4.png',
      'assets/images/walls/cave/wallCracked-5.png',
    ],
  },
  
  // === ICE BIOME ===
  ice: {
    wall: [
      'assets/images/walls/ice/wall-1.png',
      'assets/images/walls/ice/wall-2.png',
      'assets/images/walls/ice/wall-3.png',
    ],
    cracked: [
      'assets/images/walls/ice/wallCracked-1.png',
      'assets/images/walls/ice/wallCracked-2.png',
    ],
  },
  
  // === SAND BIOME ===
  sand: {
    wall: [
      'assets/images/walls/sand/wall-1.png',
      'assets/images/walls/sand/wall-2.png',
    ],
    cracked: [
      'assets/images/walls/sand/wallCracked-1.png',
      'assets/images/walls/sand/wallCracked-2.png',
    ],
  },
  
  // === BOSS ARENA ===
  boss: {
    wall: 'assets/images/walls/bossArena/wallBossArena.png',
    cracked: null, // На босс-аренах нет разрушаемых стен
  },
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение случайного изображения стены для биома
 * 
 * @param {string} biomeId - ID биома ('cave', 'ice', 'sand', 'boss')
 * @param {boolean} isCracked - Разрушаемая ли стена
 * @param {string} [bossType] - Тип босса (для босс-арен, пока не используется)
 * @returns {string|null} - Путь к изображению или null, если изображений нет
 */
export function getWallImage(biomeId, isCracked = false, bossType = null, seed = 0) {
  // Босс-арена
  if (biomeId === 'boss' || biomeId === 'bossArena') {
    return WALL_IMAGES.boss.wall;
  }
  
  // Для тайных комнат и безопасной комнаты — возвращаем null
  const secretRooms = ['treasure', 'shrine', 'trap', 'safe'];
  if (secretRooms.includes(biomeId)) {
    return null;
  }
  
  const biome = WALL_IMAGES[biomeId];
  if (!biome) return null;
  
  const images = isCracked ? biome.cracked : biome.wall;
  if (!images || images.length === 0) return null;
  
  // Используем seed для детерминированного выбора
  const index = Math.floor(seed * images.length) % images.length;
  return images[index];
}

/**
 * Получение всех изображений стен для биома (для предварительной загрузки)
 * 
 * @param {string} biomeId - ID биома
 * @returns {string[]} - Массив путей к изображениям
 */
export function getAllWallImagesForBiome(biomeId) {
  const biome = WALL_IMAGES[biomeId];
  if (!biome) return [];
  
  return [...(biome.wall || []), ...(biome.cracked || [])];
}

/**
 * Получение всех изображений стен для регистрации в загрузчике
 * 
 * @returns {Object} - Объект { ключ: путь } для всех стен
 */
export function getAllWallImagesForRegistration() {
  const result = {};
  
  for (const [biomeId, biome] of Object.entries(WALL_IMAGES)) {
    for (const [type, images] of Object.entries(biome)) {
      const imageArray = Array.isArray(images) ? images : [images];
      for (let i = 0; i < imageArray.length; i++) {
        const path = imageArray[i];
        if (path) {
          const key = `${biomeId}_${type}_${i}`;
          result[key] = path;
        }
      }
    }
  }
  
  return result;
}