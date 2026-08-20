/**
 * @fileoverview Конфигурация изображений для полов
 * @module images/floorImages
 */

import { state } from '../core/config/index.js';

// ============================================================
// ПУТИ К ИЗОБРАЖЕНИЯМ ПОЛОВ
// ============================================================

export const FLOOR_IMAGES = {
  // === БИОМЫ ===
  cave: {
    floor: 'assets/images/floors/floorCave.png',
  },
  ice: {
    floor: 'assets/images/floors/floorSnow.png',
    iceFloor: 'assets/images/floors/floorSnowWithIce.png',
  },
  sand: {
    floor: 'assets/images/floors/floorSand.png',
  },
};

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

export const FLOOR_IMAGES_REGISTRATION = {
  floorCave: 'assets/images/floors/floorCave.png',
  floorSand: 'assets/images/floors/floorSand.png',
  floorSnow: 'assets/images/floors/floorSnow.png',
  floorSnowIce: 'assets/images/floors/floorSnowWithIce.png',
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение ключа изображения для пола
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {boolean} [isIceFloor=false] - Использовать замёрзший пол (только для ice)
 * @returns {string} - Ключ изображения
 */
export function getFloorImageKey(biome, isIceFloor = false) {
  if (biome === 'ice' && isIceFloor) {
    return 'floorSnowIce';
  }
  
  switch (biome) {
    case 'cave':
      return 'floorCave';
    case 'ice':
      return 'floorSnow';
    case 'sand':
      return 'floorSand';
    default:
      return 'floorCave';
  }
}

/**
 * Получение пути к изображению пола
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {boolean} [isIceFloor=false] - Использовать замёрзший пол (только для ice)
 * @returns {string} - Путь к изображению
 */
export function getFloorImagePath(biome, isIceFloor = false) {
  const key = getFloorImageKey(biome, isIceFloor);
  return FLOOR_IMAGES_REGISTRATION[key] || FLOOR_IMAGES_REGISTRATION.floorCave;
}

/**
 * Получение биома на основе текущего состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand')
 */
export function getBiomeForFloor(state) {
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  
  // В тайных комнатах используем биом текущего уровня
  if (isInSecretRoom) {
    return state.currentBiome || 'cave';
  }
  
  return state.currentBiome || 'cave';
}

/**
 * Проверка, является ли клетка замёрзшей
 * 
 * @param {number} x - Координата X в сетке
 * @param {number} y - Координата Y в сетке
 * @param {number} seed - Seed для детерминированного выбора
 * @returns {boolean} - true, если клетка должна быть замёрзшей
 */
export function isIceFloorCell(x, y, seed) {
  // Используем seed для детерминированного выбора
  const hash = ((x * 31 + y * 17 + seed * 13) % 100) / 100;
  return hash < 0.08; // ~8% клеток — замёрзшие
}

/**
 * Получение изображения пола для клетки
 * 
 * @param {number} x - Координата X в сетке
 * @param {number} y - Координата Y в сетке
 * @param {string} biome - ID биома
 * @param {number} seed - Seed для детерминированного выбора
 * @returns {string} - Ключ изображения пола
 */
export function getFloorImageForCell(x, y, biome, seed) {
  // Только в биоме Ice могут быть замёрзшие клетки
  if (biome === 'ice') {
    const isIce = isIceFloorCell(x, y, seed);
    if (isIce) {
      return 'floorSnowIce';
    }
  }
  
  return getFloorImageKey(biome);
}