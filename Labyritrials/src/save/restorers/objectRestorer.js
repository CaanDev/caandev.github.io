/**
 * @fileoverview Восстановление данных объектов (ловушки, артефакты, сундуки, алтари, предметы).
 * 
 * @module save/restorers/objectRestorer
 */

import { state } from '../../core/config/index.js';
import { 
  ITEM_IMAGES, 
  getRandomGoldImage, 
  getRandomArtifactImage, 
  getRandomPotionImage 
} from '../../images/itemImages.js';

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
        // Если у сундука нет ключей картинок — генерируем их
        const chest = {
          x: c.x,
          y: c.y,
          type: c.type,
          opened: c.opened,
          countedForAchievement: c.countedForAchievement || false
        };
        
        // Для сундуков с золотом — добавляем ключ картинки
        if (c.type === 'gold' && !c.goldImageKey) {
          const imagePath = getRandomGoldImage();
          const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
          chest.goldImageKey = cacheKey;
          chest.goldImagePath = imagePath;
        } else if (c.type === 'gold' && c.goldImageKey) {
          chest.goldImageKey = c.goldImageKey;
          chest.goldImagePath = c.goldImagePath;
        }
        
        // Для сундуков с артефактами — добавляем ключ картинки
        if (c.type === 'artifact' && !c.artifactImageKey) {
          const imagePath = getRandomArtifactImage();
          const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
          chest.artifactImageKey = cacheKey;
          chest.artifactImagePath = imagePath;
        } else if (c.type === 'artifact' && c.artifactImageKey) {
          chest.artifactImageKey = c.artifactImageKey;
          chest.artifactImagePath = c.artifactImagePath;
        }
        
        // Для сундуков с зельем
        if (c.type === 'potion_chest' && !c.potionImageKey) {
          const imagePath = getRandomPotionImage();
          const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
          chest.potionImageKey = cacheKey;
          chest.potionImagePath = imagePath;
        } else if (c.type === 'potion_chest' && c.potionImageKey) {
          chest.potionImageKey = c.potionImageKey;
          chest.potionImagePath = c.potionImagePath;
        }
        
        return chest;
      })
    : [];
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