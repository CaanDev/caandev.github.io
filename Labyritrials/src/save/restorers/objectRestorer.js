/**
 * @fileoverview Восстановление данных объектов (ловушки, артефакты, сундуки, алтари, предметы).
 * 
 * @module save/restorers/objectRestorer
 */

import { state } from '../../core/config/index.js';
import { getRandomSprite } from '../../sprites/spriteLoader.js';

/**
 * Восстановление данных о ловушках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTrapsData(save) {
  state.traps = (save.traps && Array.isArray(save.traps)) ? save.traps : [];
}

/**
 * Восстановление данных об артефактах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreArtifactsData(save) {
  state.artifacts = (save.artifacts && Array.isArray(save.artifacts)) ? save.artifacts : [];
}

/**
 * Восстановление данных о сундуках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreChestsData(save) {
  state.chests = (save.chests && Array.isArray(save.chests))
    ? save.chests.map(c => {
        const chest = {
          x: c.x,
          y: c.y,
          type: c.type,
          opened: c.opened,
          countedForAchievement: c.countedForAchievement || false
        };
        
        // Золото
        if (c.type === 'gold') {
          chest.goldSpriteName = c.goldSpriteName || getRandomSprite('gold', c.goldBiome || 'cave') || 'goldCave1';
          chest.goldBiome = c.goldBiome || 'cave';
        }
        
        // Артефакты
        if (c.type === 'artifact') {
          chest.artifactSpriteName = c.artifactSpriteName || getRandomSprite('artifact', c.artifactBiome || 'cave') || 'artifactCave1';
          chest.artifactBiome = c.artifactBiome || 'cave';
        }
        
        // Зелья
        if (c.type === 'potion_chest') {
          chest.potionSpriteName = c.potionSpriteName || getRandomSprite('potion', c.potionBiome || 'cave') || 'potionCave1';
          chest.potionBiome = c.potionBiome || 'cave';
        }
        
        return chest;
      })
    : [];
}

/**
 * Восстановление данных о мимиках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreMimicsData(save) {
  if (save.mimics && Array.isArray(save.mimics)) {
    state.mimics = save.mimics.map(m => ({
      x: m.x, y: m.y, gridX: m.gridX, gridY: m.gridY,
      type: m.type || 'mimic',
      opened: m.opened || false,
      isDead: m.isDead || false,
      hp: m.hp || 100,
      maxHp: m.maxHp || 100,
      countedForAchievement: m.countedForAchievement || false,
      lastHitTime: m.lastHitTime || 0,
      lastAttackTime: m.lastAttackTime || 0,
      hpBarVisible: m.hpBarVisible || false,
      biome: m.biome || 'cave'
    }));
  } else {
    state.mimics = [];
  }
}

/**
 * Восстановление данных о святилищах (алтарях)
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreShrinesData(save) {
  state.shrines = (save.shrines && Array.isArray(save.shrines)) ? save.shrines : [];
}

/**
 * Восстановление данных о предметах на полу
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreLootData(save) {
  state.lootItems = (save.lootItems && Array.isArray(save.lootItems)) ? save.lootItems : [];
}