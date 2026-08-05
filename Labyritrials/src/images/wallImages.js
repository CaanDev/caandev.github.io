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
      'assets/images/walls/biomes/cave/wall-1.png',
      'assets/images/walls/biomes/cave/wall-2.png',
      'assets/images/walls/biomes/cave/wall-3.png',
    ],
    cracked: [
      'assets/images/walls/biomes/cave/wallCracked-1.png',
      'assets/images/walls/biomes/cave/wallCracked-2.png',
      'assets/images/walls/biomes/cave/wallCracked-3.png',
      'assets/images/walls/biomes/cave/wallCracked-4.png',
      'assets/images/walls/biomes/cave/wallCracked-5.png',
    ],
  },
  
  // === ICE BIOME ===
  ice: {
    wall: [
      'assets/images/walls/biomes/ice/wall-1.png',
      'assets/images/walls/biomes/ice/wall-2.png',
      'assets/images/walls/biomes/ice/wall-3.png',
    ],
    cracked: [
      'assets/images/walls/biomes/ice/wallCracked-1.png',
      'assets/images/walls/biomes/ice/wallCracked-2.png',
    ],
  },
  
  // === SAND BIOME ===
  sand: {
    wall: [
      'assets/images/walls/biomes/sand/wall-1.png',
      'assets/images/walls/biomes/sand/wall-2.png',
    ],
    cracked: [
      'assets/images/walls/biomes/sand/wallCracked-1.png',
      'assets/images/walls/biomes/sand/wallCracked-2.png',
    ],
  },
  
  // === BOSS ARENA ===
  boss: {
    wall: 'assets/images/walls/bossArena/wallBossArena.png',
    wallLvl5: 'assets/images/walls/bossArena/wallBossArenaLvl5.png',
    wallLvl10: 'assets/images/walls/bossArena/wallBossArenaLvl10.png',
    wallLvl15: 'assets/images/walls/bossArena/wallBossArenaLvl15.png',
    cracked: null, // На босс-аренах нет разрушаемых стен
  },
  
  // === КОМНАТЫ ===
  safeRoom: {
    wall: [
      'assets/images/walls/rooms/safeRoom/wall-1.png',
      'assets/images/walls/rooms/safeRoom/wall-2.png',
      'assets/images/walls/rooms/safeRoom/wall-3.png',
      'assets/images/walls/rooms/safeRoom/wall-4.png',
      'assets/images/walls/rooms/safeRoom/wall-5.png',
      'assets/images/walls/rooms/safeRoom/wall-6.png',
      'assets/images/walls/rooms/safeRoom/wall-7.png',
    ],
    cracked: null, // В безопасной комнате нет разрушаемых стен
  },

  trapRoom: {
    wall: [
      'assets/images/walls/rooms/trapRoom/wall-1.png',
      'assets/images/walls/rooms/trapRoom/wall-2.png',
      'assets/images/walls/rooms/trapRoom/wall-3.png',
      'assets/images/walls/rooms/trapRoom/wall-4.png',
      'assets/images/walls/rooms/trapRoom/wall-5.png',
      'assets/images/walls/rooms/trapRoom/wall-6.png',
      'assets/images/walls/rooms/trapRoom/wall-7.png',
    ],
    cracked: null, // В комнате-ловушке нет разрушаемых стен
  },

  shrineRoom: {
    wall: [
      'assets/images/walls/rooms/shrineRoom/wall-1.png',
      'assets/images/walls/rooms/shrineRoom/wall-2.png',
      'assets/images/walls/rooms/shrineRoom/wall-3.png',
      'assets/images/walls/rooms/shrineRoom/wall-4.png',
      'assets/images/walls/rooms/shrineRoom/wall-5.png',
      'assets/images/walls/rooms/shrineRoom/wall-6.png',
      'assets/images/walls/rooms/shrineRoom/wall-7.png',
      'assets/images/walls/rooms/shrineRoom/wall-8.png',
      'assets/images/walls/rooms/shrineRoom/wall-9.png',
    ],
    cracked: null, // В комнате с алтарём нет разрушаемых стен
  },
  
  treasureRoom: {
    wall: [
      'assets/images/walls/rooms/treasureRoom/wall-1.png',
      'assets/images/walls/rooms/treasureRoom/wall-2.png',
      'assets/images/walls/rooms/treasureRoom/wall-3.png',
      'assets/images/walls/rooms/treasureRoom/wall-4.png',
      'assets/images/walls/rooms/treasureRoom/wall-5.png',
      'assets/images/walls/rooms/treasureRoom/wall-6.png',
      'assets/images/walls/rooms/treasureRoom/wall-7.png',
    ],
    cracked: [
      'assets/images/walls/rooms/treasureRoom/wallCracked-1.png',
      'assets/images/walls/rooms/treasureRoom/wallCracked-2.png',
      'assets/images/walls/rooms/treasureRoom/wallCracked-3.png',
      'assets/images/walls/rooms/treasureRoom/wallCracked-4.png',
    ],
  },
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение случайного изображения стены для биома
 * 
 * @param {string} biomeId - ID биома
 * @param {boolean} isCracked - Разрушаемая ли стена
 * @param {string|null} [bossType] - Тип босса (для босс-арен)
 * @param {number} [seed=0] - Seed для детерминированного выбора
 * @returns {string|null} - Путь к изображению или null, если изображений нет
 */
export function getWallImage(biomeId, isCracked = false, bossType = null, seed = 0) {
  // Босс-арена
  if (biomeId === 'boss' || biomeId === 'bossArena') {
    // Определяем уровень босса из состояния игры
    let bossLevel = 5; // по умолчанию
    
    // Пытаемся получить уровень из глобального состояния
    if (typeof state !== 'undefined' && state.gameLevel) {
      bossLevel = Math.floor(state.gameLevel / 5) * 5;
      if (bossLevel === 0) bossLevel = 5;
    }
    
    // Выбираем изображение в зависимости от уровня
    switch (bossLevel) {
      case 5:
        return WALL_IMAGES.boss.wallLvl5 || WALL_IMAGES.boss.wall;
      case 10:
        return WALL_IMAGES.boss.wallLvl10 || WALL_IMAGES.boss.wall;
      case 15:
        return WALL_IMAGES.boss.wallLvl15 || WALL_IMAGES.boss.wall;
      default:
        return WALL_IMAGES.boss.wall;
    }
  }
  
  // Сокровищница — поддерживаем разрушаемые стены
  if (biomeId === 'treasureRoom') {
    const biome = WALL_IMAGES.treasureRoom;
    if (!biome) return null;
    
    const images = isCracked ? biome.cracked : biome.wall;
    if (!images || images.length === 0) return null;
    
    const index = Math.floor(seed * images.length) % images.length;
    return images[index];
  }
  
  // Безопасная комната, комната-ловушка, комната с алтарём — разрушаемых стен нет
  if (biomeId === 'safeRoom' || biomeId === 'trapRoom' || biomeId === 'shrineRoom') {
    const biome = WALL_IMAGES[biomeId];
    if (!biome) return null;
    
    const images = biome.wall;
    if (!images || images.length === 0) return null;
    
    const index = Math.floor(seed * images.length) % images.length;
    return images[index];
  }
  
  // Обычные биомы
  const biome = WALL_IMAGES[biomeId];
  if (!biome) return null;
  
  const images = isCracked ? biome.cracked : biome.wall;
  if (!images || images.length === 0) {
    // Если нет изображений для cracked — возвращаем обычную стену
    if (isCracked && biome.wall && biome.wall.length > 0) {
      const index = Math.floor(seed * biome.wall.length) % biome.wall.length;
      return biome.wall[index];
    }
    return null;
  }
  
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
  
  const result = [];
  if (biome.wall) {
    result.push(...(Array.isArray(biome.wall) ? biome.wall : [biome.wall]));
  }
  if (biome.cracked) {
    result.push(...(Array.isArray(biome.cracked) ? biome.cracked : [biome.cracked]));
  }
  return result;
}

/**
 * Получение всех изображений стен для регистрации в загрузчике
 * 
 * @returns {Object} - Объект { ключ: путь } для всех стен
 */
export function getAllWallImagesForRegistration() {
  const result = {};
  
  for (const [biomeId, biome] of Object.entries(WALL_IMAGES)) {
    // ===== ОСОБАЯ ОБРАБОТКА ДЛЯ БОСС-АРЕН =====
    if (biomeId === 'boss' || biomeId === 'bossArena') {
      if (biome.wallLvl5) {
        result['boss_wall_5'] = biome.wallLvl5;
      }
      if (biome.wallLvl10) {
        result['boss_wall_10'] = biome.wallLvl10;
      }
      if (biome.wallLvl15) {
        result['boss_wall_15'] = biome.wallLvl15;
      }
      if (biome.wall) {
        result['boss_wall_0'] = biome.wall;
      }
      continue;
    }
    
    // ===== ОСТАЛЬНЫЕ БИОМЫ =====
    for (const [type, images] of Object.entries(biome)) {
      if (!images) continue;
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