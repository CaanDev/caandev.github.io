/**
 * @fileoverview Загрузчик спрайт-атласов из JSON
 * @module sprites/spriteAtlasLoader
 */

import { logger } from '../utils/logger.js';

/** @type {Map<string, Object>} - Кэш загруженных атласов */
const atlasCache = new Map();

/** @type {Map<string, HTMLImageElement>} - Кэш текстур */
const textureCache = new Map();

/** @type {Object} - Все загруженные спрайты { name: { sheet, x, y, w, h } } */
let spriteMap = {};

/**
 * Конфигурация вероятностей для разных типов спрайтов
 * @type {Object}
 */
const SPRITE_PROBABILITIES = {
  floor: {
    ice: {
      'floorSnow': 0.85,
      'floorSnowIce': 0.15,
    },
  },
};

/**
 * Загрузка всех атласов
 * @param {Function} onProgress - Колбэк прогресса
 * @returns {Promise<void>}
 */
export async function loadAllAtlases(onProgress = null) {
  const manifestUrl = 'assets/spritesheets/atlas/index.json';
  
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const manifest = await response.json();
    
    const parts = manifest.parts;
    const total = Object.keys(parts).length;
    let loaded = 0;
    
    for (const [name, part] of Object.entries(parts)) {
      // Удаление "atlas/" из url, если есть
      let url = part.url;
      if (url.startsWith('atlas/')) url = url.substring(6);
      await loadAtlas(url);
      loaded++;
      if (onProgress) onProgress((loaded / total) * 100);
    }
  } catch (err) {
    logger.error('❌ Ошибка загрузки манифеста атласов:', err);
  }
}

/**
 * Загрузка одного атласа
 * @param {string} url - Путь к JSON-файлу атласа (относительно atlas/)
 * @returns {Promise<Object>}
 */
export async function loadAtlas(url) {
  if (atlasCache.has(url)) return atlasCache.get(url);
  
  try {
    const fullUrl = `assets/spritesheets/atlas/${url}`;
    const response = await fetch(fullUrl);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    
    // Загрузка всех текстур из атласа
    for (const [sheetId, sheet] of Object.entries(data.sheets)) {
      const path = `assets/spritesheets/${sheet.path}`;
      const fallback = `assets/spritesheets/${sheet.fallback}`;
      
      await loadTexture(sheetId, path, fallback);
    }
    
    // Сбор всех спрайтов в плоский объект
    for (const [name, sprite] of Object.entries(data.sprites)) {
      spriteMap[name] = sprite;
    }
    
    atlasCache.set(url, data);
    return data;
  } catch (err) {
    logger.error(`❌ Ошибка загрузки атласа ${url}:`, err);
    return null;
  }
}

/**
 * Загрузка текстуры
 * @param {string} sheetId - ID листа
 * @param {string} path - Основной путь (.webp)
 * @param {string} fallback - Запасной путь (.png)
 * @returns {Promise<HTMLImageElement>}
 */
function loadTexture(sheetId, path, fallback) {
  return new Promise((resolve) => {
    if (textureCache.has(sheetId)) {
      resolve(textureCache.get(sheetId));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      textureCache.set(sheetId, img);
      resolve(img);
    };
    
    img.onerror = () => {
      // Попытка использования fallback
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        textureCache.set(sheetId, fallbackImg);
        resolve(fallbackImg);
      };
      fallbackImg.onerror = () => {
        logger.warn(`⚠️ Не удалось загрузить текстуру ${sheetId}`);
        // Создание заглушки
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 75, 75);
        
        const placeholder = new Image();
        placeholder.src = canvas.toDataURL();
        textureCache.set(sheetId, placeholder);
        resolve(placeholder);
      };
      fallbackImg.src = fallback;
    };
    
    img.src = path;
  });
}

/**
 * Получение спрайта по имени
 * @param {string} name - Имя спрайта
 * @returns {Object|null} - { sheet, x, y, w, h, texture }
 */
export function getSprite(name) {
  const sprite = spriteMap[name];
  if (!sprite) return null;
  
  const texture = textureCache.get(sprite.sheet);
  if (!texture) return null;
  
  return {
    ...sprite,
    texture
  };
}

/**
 * Получение случайного спрайта из группы с учётом вероятностей
 * @param {string} group - Группа (например, 'wall', 'floor', 'wallCracked')
 * @param {string} biome - Биом (cave, ice, sand, safeRoom, trapRoom, shrineRoom, treasureRoom, boss)
 * @param {number} seed - Seed для детерминированного выбора
 * @returns {string|null} - Имя спрайта или null
 */
export function getRandomSprite(group, biome, seed = 0) {
  const allKeys = Object.keys(spriteMap);
  
  // Проверка специальных вероятностей
  if (SPRITE_PROBABILITIES[group] && SPRITE_PROBABILITIES[group][biome]) {
    const probs = SPRITE_PROBABILITIES[group][biome];
    const entries = Object.entries(probs);
    
    // Проверка, что все спрайты существуют
    const available = entries.filter(([key]) => allKeys.includes(key));
    
    if (available.length > 0) {
      // Выбор случайного спрайта с учётом вероятностей
      const rand = seededRandom(seed, 0);
      let cumulative = 0;
      for (const [key, prob] of available) {
        cumulative += prob;
        if (rand < cumulative) return key;
      }
      // Если ничего не подошло - возврат первого доступного
      return available[0][0];
    }
  }
  
  // Специальная логика для комнат
  const specialBiomes = ['safeRoom', 'trapRoom', 'shrineRoom', 'treasureRoom', 'boss'];
  
  if (specialBiomes.includes(biome)) {
    const prefix = biome === 'safeRoom' ? 'safe' :
                   biome === 'trapRoom' ? 'trap' :
                   biome === 'shrineRoom' ? 'shrine' :
                   biome === 'treasureRoom' ? 'treasure' :
                   'boss';
    
    const matches = allKeys.filter(name => {
      if (group === 'wall') return name.startsWith(`${prefix}Wall`) && !name.includes('Cracked');
      if (group === 'wallCracked') return name.startsWith(`${prefix}Cracked`);
      return name.startsWith(`${prefix}${group}`);
    });
    
    if (matches.length > 0) {
      const idx = Math.floor(seed * matches.length) % matches.length;
      return matches[idx];
    }
    
    // Fallback: если не найдено в специальном атласе, пробуется обычный биом
    return getRandomSpriteFromBiome(group, 'cave', seed);
  }
  
  // Обычные биомы
  return getRandomSpriteFromBiome(group, biome, seed);
}

/**
 * Внутренняя функция для поиска спрайтов в обычных биомах
 * @param {string} group - Группа
 * @param {string} biome - Биом (cave, ice, sand)
 * @param {number} seed - Seed
 * @returns {string|null}
 */
function getRandomSpriteFromBiome(group, biome, seed = 0) {
  const capBiome = biome.charAt(0).toUpperCase() + biome.slice(1);
  const allKeys = Object.keys(spriteMap);
  
  // Специальная логика для полов (без вероятностей)
  if (group === 'floor') {
    const matches = allKeys.filter(name => {
      if (biome === 'ice') return name.startsWith('floorSnow') || name.startsWith('floorSnowIce');
      return name.startsWith(`floor${capBiome}`);
    });
    
    if (matches.length === 0) {
      const fallback = allKeys.filter(name => name.startsWith('floorCave'));
      if (fallback.length === 0) return null;
      const idx = Math.floor(seed * fallback.length) % fallback.length;
      return fallback[idx];
    }
    
    const idx = Math.floor(seed * matches.length) % matches.length;
    return matches[idx];
  }
  
  // Стандартная логика для остальных групп
  const matches = allKeys.filter(name => {
    if (group === 'wall') return name.startsWith(`wall${capBiome}`) && !name.includes('Cracked');
    if (group === 'wallCracked') return name.startsWith(`wall${capBiome}`) && name.includes('Cracked');
    return name.startsWith(`${group}${capBiome}`);
  });
  
  if (matches.length === 0) {
    // Fallback на Cave
    const fallback = allKeys.filter(name => {
      if (group === 'wall') return name.startsWith('wallCave') && !name.includes('Cracked');
      if (group === 'wallCracked') return name.startsWith('wallCave') && name.includes('Cracked');
      return name.startsWith(`${group}Cave`);
    });
    if (fallback.length === 0) return null;
    const idx = Math.floor(seed * fallback.length) % fallback.length;
    return fallback[idx];
  }
  
  const idx = Math.floor(seed * matches.length) % matches.length;
  return matches[idx];
}

/**
 * Получение всех спрайтов из категории
 * @param {string} category - Категория (например, 'wall')
 * @param {string} biome - Биом (cave, ice, sand)
 * @returns {Array}
 */
export function getSpritesByCategory(category, biome) {
  const capBiome = biome.charAt(0).toUpperCase() + biome.slice(1);
  const prefix = `${category}${capBiome}`;
  const matches = Object.keys(spriteMap).filter(name => name.startsWith(prefix));
  
  return matches.map(name => getSprite(name)).filter(Boolean);
}

/**
 * Очистка кэша
 */
export function clearAtlasCache() {
  atlasCache.clear();
  textureCache.clear();
  spriteMap = {};
}

/**
 * Получение данных спрайта (прокси к getSprite)
 * @param {string} name - Имя спрайта
 * @returns {Object|null}
 */
export function getSpriteData(name) {
  return getSprite(name);
}

/**
 * Получение изображения листа
 * @param {string} sheetId - ID листа
 * @returns {HTMLImageElement|null}
 */
export function getSheetImage(sheetId) {
  return textureCache.get(sheetId) || null;
}

/**
 * Получение спрайта по псевдониму (из aliases)
 * @param {string} alias - Псевдоним (например, 'wall.cave')
 * @param {number} seed - Seed для выбора
 * @returns {Object|null}
 */
export function getSpriteByAlias(alias, seed = 0) {
  // Поиск в aliases из загруженных атласов
  for (const [url, atlas] of atlasCache) {
    if (atlas.aliases) {
      const parts = alias.split('.');
      let current = atlas.aliases;
      for (const part of parts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (current && Array.isArray(current)) {
        const idx = Math.floor(seed * current.length) % current.length;
        return getSprite(current[idx]);
      }
    }
  }
  return null;
}

/**
 * Получение всех спрайтов по псевдониму
 * @param {string} alias - Псевдоним
 * @returns {Array}
 */
export function getSpritesByAlias(alias) {
  const result = [];
  for (const [url, atlas] of atlasCache) {
    if (atlas.aliases) {
      const parts = alias.split('.');
      let current = atlas.aliases;
      for (const part of parts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (current && Array.isArray(current)) {
        for (const name of current) {
          const sprite = getSprite(name);
          if (sprite) result.push(sprite);
        }
      }
    }
  }
  return result;
}

/**
 * Проверка, загружен ли атлас
 * @param {string} url - URL атласа
 * @returns {boolean}
 */
export function isAtlasLoaded(url) {
  return atlasCache.has(url);
}

/**
 * Получение статистики загрузки атласов
 * @returns {Object}
 */
export function getAtlasStats() {
  return {
    totalAtlases: atlasCache.size,
    totalTextures: textureCache.size,
    totalSprites: Object.keys(spriteMap).length,
    loadedAtlases: Array.from(atlasCache.keys()),
    loadedTextures: Array.from(textureCache.keys()),
  };
}

/**
 * Очистка кэша спрайтов
 */
export function clearSpriteCache() {
  atlasCache.clear();
  textureCache.clear();
  spriteMap = {};
}

/**
 * Получение всех ключей спрайтов
 * @returns {string[]}
 */
export function getSpriteKeys() {
  return Object.keys(spriteMap);
}

/**
 * Получение карты псевдонимов
 * @returns {Object}
 */
export function getAliasMap() {
  const result = {};
  for (const [url, atlas] of atlasCache) {
    if (atlas.aliases) {
      for (const [key, value] of Object.entries(atlas.aliases)) {
        result[`${url}/${key}`] = value;
      }
    }
  }
  return result;
}

/**
 * Проверка наличия спрайта
 * @param {string} name - Имя спрайта
 * @returns {boolean}
 */
export function hasSprite(name) {
  return !!spriteMap[name];
}

/**
 * Получение случайного числа на основе seed
 * @param {number} seed - Seed
 * @param {number} index - Дополнительный индекс для разнообразия
 * @returns {number} - Случайное число от 0 до 1
 */
function seededRandom(seed, index = 0) {
  const x = Math.sin(seed * 127.1 + index * 311.7 + 43758.5453);
  return x - Math.floor(x);
}

/**
 * Отладка спрайта
 * @param {string} name - Имя спрайта
 */
export function debugSprite(name) {
  const sprite = getSprite(name);
  if (sprite) {
    logger.debug(`🔍 Спрайт "${name}":`, {
      sheet: sprite.sheet,
      x: sprite.x,
      y: sprite.y,
      w: sprite.w,
      h: sprite.h,
      textureLoaded: !!sprite.texture,
    });
  } else {
    logger.debug(`❌ Спрайт "${name}" не найден`);
  }
}

/**
 * Очистка всех кэшей спрайтов (вызывается при смене уровня)
 */
export function clearAllSpriteCaches() {
  // Очистка кэша spriteUtils
  try {
    import('./spriteUtils.js').then(({ clearSpriteUtilsCache }) => {
      clearSpriteUtilsCache();
    }).catch(() => {});
  } catch {}
  
  // Очистка кэша стен
  try {
    import('../systems/rendering/maze/walls/wallRenderer.js').then(({ clearWallSpriteCache }) => {
      if (typeof clearWallSpriteCache === 'function') clearWallSpriteCache(false);
    }).catch(() => {});
  } catch {}
  
  // Очистка кэша пола
  try {
    import('../systems/rendering/maze/floors/floorRenderer.js').then(({ clearFloorSpriteCache }) => {
      if (typeof clearFloorSpriteCache === 'function') clearFloorSpriteCache(false);
    }).catch(() => {});
  } catch {}
}