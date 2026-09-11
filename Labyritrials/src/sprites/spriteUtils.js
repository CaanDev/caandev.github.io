/**
 * @fileoverview Утилиты для работы со спрайтами: обрезание пустых пикселей,
 * кэширование эффективных границ, масштабирование с сохранением пропорций.
 * @module sprites/spriteUtils
 */

import { logger } from '../utils/logger.js';
import { getSprite, getRandomSprite } from './spriteLoader.js';

/** @type {Map<string, Object>} - Кэш эффективных границ спрайтов */
const effectiveBoundsCache = new Map();

/** @type {Map<string, {texture: HTMLImageElement, sx: number, sy: number, sw: number, sh: number}>} - Кэш обрезанных спрайтов */
const croppedSpriteCache = new Map();

/** @type {Map<string, Object>} - Кэш спрайтов с размерами */
const spriteWithSizeCache = new Map();

/** @type {number} - Максимальный размер кэша спрайтов с размерами */
const MAX_SPRITE_CACHE_SIZE = 500;

/**
 * Получение эффективных границ спрайта (без пустых пикселей)
 * 
 * @param {string} spriteName - Имя спрайта
 * @param {number} [threshold=10] - Порог прозрачности (0-255)
 * @returns {Object|null} - { x, y, w, h, offsetX, offsetY, originalW, originalH, hasPadding }
 */
export function getEffectiveBounds(spriteName, threshold = 10) {
  // Проверка кэша
  if (effectiveBoundsCache.has(spriteName)) return effectiveBoundsCache.get(spriteName);

  const sprite = getSprite(spriteName);
  if (!sprite) {
    logger.warn(`⚠️ Спрайт "${spriteName}" не найден в getEffectiveBounds`);
    return null;
  }

  const { texture, x, y, w, h } = sprite;

  // Создание временного canvas для анализа
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(texture, x, y, w, h, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Поиск границ с пикселями
  let minX = w,
    maxX = 0,
    minY = h,
    maxY = 0;
  let hasPixels = false;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const alpha = data[(py * w + px) * 4 + 3];
      if (alpha > threshold) {
        hasPixels = true;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }

  // Если спрайт полностью пустой
  if (!hasPixels) {
    const result = {
      x: x,
      y: y,
      w: w,
      h: h,
      offsetX: 0,
      offsetY: 0,
      originalW: w,
      originalH: h,
      hasPadding: false,
      isEmpty: true
    };
    effectiveBoundsCache.set(spriteName, result);
    return result;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const hasPadding = minX > 0 || maxX < w - 1 || minY > 0 || maxY < h - 1;

  const result = {
    // Координаты в текстуре
    x: x + minX,
    y: y + minY,
    w: cropW,
    h: cropH,
    // Смещения внутри оригинального кадра
    offsetX: minX,
    offsetY: minY,
    originalW: w,
    originalH: h,
    hasPadding: hasPadding,
    isEmpty: false
  };

  effectiveBoundsCache.set(spriteName, result);
  return result;
}

/**
 * Получение обрезанного спрайта для отрисовки
 * 
 * @param {string} spriteName - Имя спрайта
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {Object|null} - { texture, sx, sy, sw, sh, hasPadding, isEmpty, originalW, originalH }
 */
export function getCroppedSprite(spriteName, threshold = 10) {
  const cacheKey = `${spriteName}_${threshold}`;
  
  if (croppedSpriteCache.has(cacheKey)) return croppedSpriteCache.get(cacheKey);

  const sprite = getSprite(spriteName);
  if (!sprite) {
    console.warn(`⚠️ Спрайт "${spriteName}" не найден в getCroppedSprite`);
    return null;
  }

  const bounds = getEffectiveBounds(spriteName, threshold);
  if (!bounds) {
    console.warn(`⚠️ Не удалось получить границы для "${spriteName}"`);
    return null;
  }

  const result = {
    texture: sprite.texture,
    sx: bounds.x,
    sy: bounds.y,
    sw: bounds.w,
    sh: bounds.h,
    hasPadding: bounds.hasPadding,
    isEmpty: bounds.isEmpty,
    originalW: bounds.originalW,
    originalH: bounds.originalH
  };

  croppedSpriteCache.set(cacheKey, result);
  return result;
}

/**
 * Получение спрайта с готовыми размерами для отрисовки (с сохранением пропорций)
 * 
 * @param {string} spriteName - Имя спрайта
 * @param {number} targetSize - Целевой размер (максимальная ширина/высота)
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {Object|null} - { texture, sx, sy, sw, sh, drawW, drawH, offsetX, offsetY, targetSize }
 */
export function getSpriteWithSize(spriteName, targetSize, threshold = 10) {
  // Ключ кэша
  const cacheKey = `${spriteName}_${targetSize}_${threshold}`;
  
  // Проверка кэша
  if (spriteWithSizeCache.has(cacheKey)) return spriteWithSizeCache.get(cacheKey);

  const sprite = getCroppedSprite(spriteName, threshold);
  if (!sprite || sprite.isEmpty) return null;

  let result;

  // Если размер совпадает с оригинальным - используется оригинал без масштабирования
  if (sprite.sw === targetSize && sprite.sh === targetSize) {
    result = {
      texture: sprite.texture,
      sx: sprite.sx,
      sy: sprite.sy,
      sw: sprite.sw,
      sh: sprite.sh,
      drawW: sprite.sw,
      drawH: sprite.sh,
      offsetX: 0,
      offsetY: 0,
      targetSize: targetSize,
    };
  } else {
    // Вычисление масштаба для сохранения пропорций
    const scale = Math.min(
      targetSize / sprite.sw,
      targetSize / sprite.sh
    );
    
    const drawW = Math.round(sprite.sw * scale);
    const drawH = Math.round(sprite.sh * scale);
    const offsetX = Math.round((targetSize - drawW) / 2);
    const offsetY = Math.round((targetSize - drawH) / 2);
    
    result = {
      texture: sprite.texture,
      sx: sprite.sx,
      sy: sprite.sy,
      sw: sprite.sw,
      sh: sprite.sh,
      drawW: drawW,
      drawH: drawH,
      offsetX: offsetX,
      offsetY: offsetY,
      targetSize: targetSize,
    };
  }

  // Кэширование перед возвратом
  if (spriteWithSizeCache.size < MAX_SPRITE_CACHE_SIZE) spriteWithSizeCache.set(cacheKey, result);
  
  return result;
}

/**
 * Очистка кэша спрайтов с размерами
 * @param {boolean} keepFrequent - Сохранять часто используемые спрайты
 */
export function clearSpriteSizeCache(keepFrequent = true) {
  if (keepFrequent) {
    // Удаляются только старые записи (первые 50% кэша)
    const keys = Array.from(spriteWithSizeCache.keys());
    const toRemove = Math.floor(keys.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      spriteWithSizeCache.delete(keys[i]);
    }
  } else {
    spriteWithSizeCache.clear();
  }
}

/**
 * Отрисовка спрайта с сохранением пропорций
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {string} spriteName - Имя спрайта
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @param {number} targetSize - Целевой размер
 * @param {number} [alpha=1] - Прозрачность
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {boolean} - true, если спрайт был отрисован
 */
export function drawSpriteScaled(ctx, spriteName, x, y, targetSize, alpha = 1, threshold = 10) {
  const sprite = getSpriteWithSize(spriteName, targetSize, threshold);
  
  if (!sprite) return false;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    x + sprite.offsetX, y + sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  ctx.restore();
  return true;
}

/**
 * Получение случайного обрезанного спрайта из группы
 * 
 * @param {string} group - Группа (например, 'wall')
 * @param {string} biome - Биом (cave, ice, sand)
 * @param {number} seed - Seed для выбора
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {Object|null}
 */
export function getRandomCroppedSprite(group, biome, seed = 0, threshold = 10) {
  const spriteName = getRandomSprite(group, biome, seed);
  if (!spriteName) return null;
  return getCroppedSprite(spriteName, threshold);
}

/**
 * Получение размера спрайта для отрисовки с учётом масштабирования
 * 
 * @param {string} spriteName - Имя спрайта
 * @param {number} cellSize - Размер клетки
 * @param {number} [threshold=10] - Порог прозрачности
 * @returns {Object|null} - { drawSize, scale, offsetX, offsetY }
 */
export function getSpriteRenderSize(spriteName, cellSize, threshold = 10) {
  const sprite = getSprite(spriteName);
  if (!sprite) return null;

  const bounds = getEffectiveBounds(spriteName, threshold);
  if (!bounds) return null;

  // Если спрайт пустой - используется оригинальный размер
  const spriteSize = bounds.isEmpty ? sprite.w : bounds.w;
  // Масштабирование относительно оригинального размера
  const scale = cellSize / sprite.w;
  const drawSize = spriteSize * scale;

  // Смещение для центрирования
  const offsetX = (cellSize - drawSize) / 2;
  const offsetY = (cellSize - drawSize) / 2;

  return {
    drawSize,
    scale,
    offsetX,
    offsetY,
    bounds,
    hasPadding: bounds.hasPadding
  };
}

/**
 * Очистка кэша обрезанных спрайтов
 */
export function clearSpriteUtilsCache() {
  effectiveBoundsCache.clear();
  croppedSpriteCache.clear();
  spriteWithSizeCache.clear();
}

/**
 * Получение статистики кэша
 */
export function getSpriteUtilsStats() {
  return {
    effectiveBounds: effectiveBoundsCache.size,
    croppedSprites: croppedSpriteCache.size,
    spriteWithSize: spriteWithSizeCache.size,
  };
}

/**
 * Визуализация обрезанного спрайта (для отладки)
 * @param {string} spriteName - Имя спрайта
 * @param {number} scale - Масштаб
 */
export function debugCroppedSprite(spriteName, scale = 2) {
  const sprite = getSprite(spriteName);
  if (!sprite) {
    console.error(`❌ Спрайт "${spriteName}" не найден`);
    return;
  }

  const bounds = getEffectiveBounds(spriteName);
  const cropped = getCroppedSprite(spriteName);

  // Удаляются старые
  document.querySelectorAll('.sprite-debug').forEach(el => el.remove());

  // Оригинал
  const canvas1 = document.createElement('canvas');
  canvas1.className = 'sprite-debug';
  canvas1.width = sprite.w * scale;
  canvas1.height = sprite.h * scale;
  canvas1.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    border: 2px solid #f1c40f;
    border-radius: 4px;
    background: #1a1a2e;
    z-index: 9999;
    image-rendering: pixelated;
  `;
  const ctx1 = canvas1.getContext('2d');
  ctx1.imageSmoothingEnabled = false;
  ctx1.drawImage(sprite.texture, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, canvas1.width, canvas1.height);
  document.body.appendChild(canvas1);

  // Обрезанный
  if (cropped && !cropped.isEmpty) {
    const canvas2 = document.createElement('canvas');
    canvas2.className = 'sprite-debug';
    canvas2.width = cropped.sw * scale;
    canvas2.height = cropped.sh * scale;
    canvas2.style.cssText = `
      position: fixed;
      top: ${10 + sprite.h * scale + 10}px;
      right: 10px;
      border: 2px solid #2ecc71;
      border-radius: 4px;
      background: #1a1a2e;
      z-index: 9999;
      image-rendering: pixelated;
    `;
    const ctx2 = canvas2.getContext('2d');
    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(cropped.texture, cropped.sx, cropped.sy, cropped.sw, cropped.sh, 0, 0, canvas2.width, canvas2.height);
    document.body.appendChild(canvas2);

    // Информация
    const info = document.createElement('div');
    info.className = 'sprite-debug';
    info.style.cssText = `
      position: fixed;
      top: ${10 + sprite.h * scale + 10 + cropped.sh * scale + 10}px;
      right: 10px;
      color: #f1c40f;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: rgba(0,0,0,0.8);
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #f1c40f;
      z-index: 9999;
      max-width: 300px;
    `;
    info.innerHTML = `
      <b>${spriteName}</b><br>
      Оригинал: ${sprite.w}×${sprite.h}<br>
      Обрезан: ${cropped.sw}×${cropped.sh}<br>
      Пустых пикселей: ${bounds.hasPadding ? '✅ есть' : '❌ нет'}<br>
      Жёлтая — оригинал, Зелёная — обрезанный
    `;
    document.body.appendChild(info);
  }

  console.log(`✅ Спрайт "${spriteName}" визуализирован`);
  console.log(`📐 Оригинал: ${sprite.w}×${sprite.h}, Обрезан: ${cropped ? cropped.sw + '×' + cropped.sh : 'нет'}`);
}

export default {
  getEffectiveBounds,
  getCroppedSprite,
  getSpriteWithSize,
  clearSpriteSizeCache,
  clearSpriteUtilsCache,
  getSpriteUtilsStats,
  getRandomCroppedSprite,
};