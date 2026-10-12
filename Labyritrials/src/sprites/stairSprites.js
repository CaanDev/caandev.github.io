/**
 * @fileoverview Функции для работы со спрайтами ступенек
 * @module sprites/stairSprites
 */

import { getCroppedSprite } from './spriteUtils.js';

/**
 * Получение имени спрайта ступенек для биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {number} seed - Seed для детерминированного выбора
 * @param {string} [group='stairs'] - Группа спрайтов ('stairs' или 'collapsedStairs')
 * @returns {string} - Имя спрайта
 */
export function getStairSpriteName(biome, seed = 0, group = 'stairs') {
  const variants = {
    cave: {
      stairs: ['stairsCave1', 'stairsCave2'],
      collapsedStairs: ['collapsedStairsCave1', 'collapsedStairsCave2'],
    },
    ice: {
      stairs: ['stairsIce1', 'stairsIce2'],
      collapsedStairs: ['collapsedStairsIce1', 'collapsedStairsIce2'],
    },
    sand: {
      stairs: ['stairsSand1', 'stairsSand2'],
      collapsedStairs: ['collapsedStairsSand1', 'collapsedStairsSand2'],
    },
  };
  
  const biomeVariants = variants[biome] || variants.cave;
  const available = biomeVariants[group] || biomeVariants.stairs;
  
  if (seed !== undefined && seed !== null) {
    const hash = (seed * 31 + 17) % 1000;
    const index = hash % available.length;
    return available[index];
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Получение обрезанного спрайта ступенек
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {number} seed - Seed для детерминированного выбора
 * @returns {Object|null} - Обрезанный спрайт или null
 */
export function getStairSprite(biome, seed = 0) {
  const spriteName = getStairSpriteName(biome, seed);
  return spriteName ? getCroppedSprite(spriteName) : null;
}