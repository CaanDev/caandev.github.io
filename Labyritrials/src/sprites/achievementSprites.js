/**
 * @fileoverview Работа со спрайтами достижений из атласа
 * @module sprites/achievementSprites
 */

import { getSprite } from './spriteLoader.js';
import { getSpriteWithSize } from './spriteUtils.js';
import { logger } from '../utils/logger.js';

/**
 * @namespace ACHIEVEMENT_SPRITE_MAP
 * @description Маппинг ID достижений -> имена спрайтов в атласе
 */
export const ACHIEVEMENT_SPRITE_MAP = {
  // Боевые (Combat)
  first_kill: 'achFirstKill',
  monster_slayer: 'achMonsterSlayer',
  monster_massacre: 'achMonsterMassacre',
  monster_legend: 'achMonsterLegend',
  boss_hunter_5: 'achBossHunter5',
  boss_hunter_10: 'achBossHunter10',
  boss_hunter_15: 'achBossHunter15',
  boss_conqueror: 'achBossConqueror',
  fire_mage: 'achFireMage',
  vampire_lord: 'achVampireLord',
  thunderer: 'achThunderer',
  
  // Исследовательские (Exploration)
  explorer: 'achExplorer',
  cartographer: 'achCartographer',
  treasure_hunter: 'achTreasureHunter',
  mystic: 'achMystic',
  daredevil: 'achDaredevil',
  adventurer: 'achAdventurer',
  
  // Коллекционные (Collection)
  gold_finder: 'achGoldFinder',
  gold_hoarder: 'achGoldHoarder',
  gold_millionaire: 'achGoldMillionaire',
  collector: 'achCollector',
  artifactor: 'achArtifactor',
  fully_equipped: 'achFullyEquipped',
  story_collector: 'achStoryCollector',
  
  // Выживание (Survival)
  survivor: 'achSurvivor',
  veteran: 'achVeteran',
  labyrinth_master: 'achLabyrinthMaster',
  iron_man: 'achIronMan',
  
  // Скрытые (Secret)
  secret_meeting: 'achSecretMeeting',
  potion_glutton: 'achPotionGlutton',
  dodge_master: 'achDodgeMaster',
  unlucky: 'achUnlucky',
  cleaner: 'achCleaner',
  trap_master: 'achTrapMaster',
  shadow: 'achShadow',
  mimic_paranoid: 'achMimicParanoid',
};

/**
 * @namespace ACHIEVEMENT_CATEGORY_MAP
 * @description Маппинг категорий -> группы спрайтов
 */
export const ACHIEVEMENT_CATEGORY_MAP = {
  combat: 'combat',
  exploration: 'exploration',
  collection: 'collection',
  survival: 'survival',
  secret: 'secret',
};

/**
 * Получение имени спрайта для достижения
 * 
 * @param {string} achievementId - ID достижения
 * @returns {string|null} - Имя спрайта или null, если не найдено
 */
export function getAchievementSpriteName(achievementId) {
  return ACHIEVEMENT_SPRITE_MAP[achievementId] || null;
}

/**
 * Получение спрайта достижения (обрезанного)
 * 
 * @param {string} achievementId - ID достижения
 * @returns {Object|null} - Обрезанный спрайт или null
 */
export function getAchievementSprite(achievementId) {
  const spriteName = getAchievementSpriteName(achievementId);
  if (!spriteName) {
    logger.debug(`⚠️ Спрайт для достижения "${achievementId}" не найден`);
    return null;
  }
  
  return getSprite(spriteName);
}

/**
 * Получение спрайта достижения с готовыми размерами для отрисовки
 * 
 * @param {string} achievementId - ID достижения
 * @param {number} targetSize - Целевой размер
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {Object|null} - Спрайт с размерами или null
 */
export function getAchievementSpriteWithSize(achievementId, targetSize, threshold = 10) {
  const spriteName = getAchievementSpriteName(achievementId);
  if (!spriteName) {
    logger.debug(`⚠️ Спрайт для достижения "${achievementId}" не найден`);
    return null;
  }
  
  return getSpriteWithSize(spriteName, targetSize, threshold);
}

/**
 * Получение HTML для иконки достижения (спрайт или эмодзи)
 * 
 * @param {string} achievementId - ID достижения
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @param {number} [size=30] - Размер иконки в пикселях
 * @param {string} [className='achievement-icon-img'] - CSS-класс
 * @returns {string} - HTML-строка для вставки
 */
export function getAchievementIconHTML(achievementId, defaultEmoji = '🏆', size = 30, className = 'achievement-icon-img') {
  const sprite = getAchievementSpriteWithSize(achievementId, size);
  
  if (!sprite) return defaultEmoji;
  
  // Создание canvas для рендеринга спрайта в изображение
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Очистка канвас
  ctx.clearRect(0, 0, size, size);
  
  // Отрисовка спрайта с центрированием
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    sprite.offsetX, sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  const dataUrl = canvas.toDataURL('image/png');
  return `<img src="${dataUrl}" class="${className}" alt="${achievementId}" width="${size}" height="${size}" style="object-fit:contain;image-rendering:auto;width:${size}px;height:${size}px;">`;
}

/**
 * Получение всех спрайтов достижений
 * 
 * @returns {Object} - Объект { achievementId: spriteData }
 */
export function getAllAchievementSprites() {
  const result = {};
  
  for (const [id, spriteName] of Object.entries(ACHIEVEMENT_SPRITE_MAP)) {
    const sprite = getSprite(spriteName);
    if (sprite) result[id] = sprite;
  }
  
  return result;
}

/**
 * Получение размера спрайта достижения
 * 
 * @param {string} achievementId - ID достижения
 * @returns {{width: number, height: number}|null} - Размеры спрайта или null
 */
export function getAchievementSpriteSize(achievementId) {
  const sprite = getAchievementSprite(achievementId);
  if (!sprite) return null;
  
  return {
    width: sprite.w,
    height: sprite.h,
  };
}

/**
 * Проверка, загружен ли спрайт для достижения
 * 
 * @param {string} achievementId - ID достижения
 * @returns {boolean} - true, если спрайт загружен
 */
export function isAchievementSpriteLoaded(achievementId) {
  const spriteName = getAchievementSpriteName(achievementId);
  if (!spriteName) return false;
  
  const sprite = getSprite(spriteName);
  return sprite !== null && sprite.texture !== null;
}

/**
 * Предзагрузка всех спрайтов достижений
 * 
 * @param {Function} onProgress - Колбэк прогресса
 * @returns {Promise<void>}
 */
export async function preloadAchievementSprites(onProgress = null) {
  const spriteNames = Object.values(ACHIEVEMENT_SPRITE_MAP);
  const total = spriteNames.length;
  let loaded = 0;
  
  for (const name of spriteNames) {
    const sprite = getSprite(name);
    if (sprite && sprite.texture) {
      loaded++;
      if (onProgress) onProgress((loaded / total) * 100);
    } else {
      loaded++;
      if (onProgress) onProgress((loaded / total) * 100);
    }
  }
}

export default {
  ACHIEVEMENT_SPRITE_MAP,
  ACHIEVEMENT_CATEGORY_MAP,
  getAchievementSpriteName,
  getAchievementSprite,
  getAchievementSpriteWithSize,
  getAchievementIconHTML,
  getAllAchievementSprites,
  getAchievementSpriteSize,
  isAchievementSpriteLoaded,
  preloadAchievementSprites,
};