/**
 * @fileoverview Загрузчик и кэш изображений
 * @module utils/imageLoader
 */

import { logger } from './logger.js';

/** @type {Map<string, HTMLImageElement>} - Кэш загруженных изображений */
const imageCache = new Map();

/** @type {Map<string, string>} - Карта путей к изображениям */
const imagePaths = new Map();

/** @type {number} - Количество загруженных изображений */
let loadedCount = 0;

/** @type {number} - Общее количество изображений для загрузки */
let totalCount = 0;

/** @type {Function|null} - Колбэк прогресса загрузки */
let progressCallback = null;

/**
 * Регистрация изображения для загрузки
 * 
 * @param {string} key - Уникальный ключ изображения
 * @param {string} path - Путь к файлу
 * @returns {void}
 */
export function registerImage(key, path) {
  if (!imagePaths.has(key)) {
    imagePaths.set(key, path);
    totalCount++;
  }
}

/**
 * Регистрация нескольких изображений
 * 
 * @param {Object} imageMap - Объект { key: 'path/to/image.png' }
 * @returns {void}
 */
export function registerImages(imageMap) {
  for (const [key, path] of Object.entries(imageMap)) {
    registerImage(key, path);
  }
}

/**
 * Загрузка одного изображения
 * 
 * @param {string} key - Ключ изображения
 * @param {string} path - Путь к файлу
 * @returns {Promise<HTMLImageElement>} - Промис с загруженным изображением
 */
function loadSingleImage(key, path) {
  return new Promise((resolve) => {
    // Если уже загружено — возвращаем из кэша
    if (imageCache.has(key)) {
      loadedCount++;
      updateProgress();
      resolve(imageCache.get(key));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      imageCache.set(key, img);
      loadedCount++;
      updateProgress();
      resolve(img);
    };
    
    img.onerror = () => {
      logger.warn(`⚠️ Не удалось загрузить: ${key} (${path})`);
      // Создаём заглушку
      const fallbackImg = createFallbackImage(key);
      imageCache.set(key, fallbackImg);
      loadedCount++;
      updateProgress();
      resolve(fallbackImg);
    };
    
    img.src = path;
  });
}

/**
 * Обновление прогресса загрузки
 * 
 * @returns {void}
 * @private
 */
function updateProgress() {
  if (progressCallback && totalCount > 0) {
    const progress = (loadedCount / totalCount) * 100;
    progressCallback(Math.min(100, progress));
  }
}

/**
 * Создание заглушки для отсутствующего изображения
 * 
 * @param {string} key - Ключ изображения
 * @returns {HTMLImageElement} - Canvas-изображение-заглушка
 * @private
 */
function createFallbackImage(key) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Генерируем цвет на основе ключа
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  // Рисуем цветной фон
  ctx.fillStyle = `hsl(${hue}, 50%, 25%)`;
  ctx.fillRect(0, 0, 64, 64);
  
  // Рисуем рамку
  ctx.strokeStyle = `hsl(${hue}, 60%, 40%)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 60, 60);
  
  // Рисуем вопросительный знак
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 34);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

/**
 * Загрузка всех зарегистрированных изображений
 * 
 * @param {Function} onProgress - Колбэк прогресса (0-100)
 * @returns {Promise<void>}
 */
export async function loadAllImages(onProgress = null) {
  progressCallback = onProgress;
  loadedCount = 0;
  
  if (totalCount === 0) {
    logger.info('ℹ️ Нет изображений для загрузки');
    if (onProgress) onProgress(100);
    return;
  }
  
  const promises = [];
  for (const [key, path] of imagePaths) {
    promises.push(loadSingleImage(key, path));
  }
  
  await Promise.all(promises);
  if (onProgress) onProgress(100);
}

/**
 * Получение загруженного изображения по ключу
 * 
 * @param {string} key - Ключ изображения
 * @returns {HTMLImageElement|null} - Изображение или null
 */
export function getImage(key) {
  return imageCache.get(key) || null;
}

/**
 * Проверка, загружено ли изображение
 * 
 * @param {string} key - Ключ изображения
 * @returns {boolean} - true, если изображение загружено
 */
export function isImageLoaded(key) {
  return imageCache.has(key);
}

/**
 * Очистка кэша изображений
 * 
 * @returns {void}
 */
export function clearImageCache() {
  imageCache.clear();
  imagePaths.clear();
  loadedCount = 0;
  totalCount = 0;
}

/**
 * Получение количества загруженных изображений
 * 
 * @returns {number}
 */
export function getLoadedCount() {
  return loadedCount;
}

/**
 * Получение общего количества изображений
 * 
 * @returns {number}
 */
export function getTotalCount() {
  return totalCount;
}

export { imageCache };

/**
 * Принудительная загрузка изображения в кэш
 * 
 * @param {string} key - Ключ изображения
 * @param {string} path - Путь к файлу
 * @returns {Promise<HTMLImageElement>} - Промис с загруженным изображением
 */
export function forceLoadImage(key, path) {
  return new Promise((resolve) => {
    // Проверяем, есть ли уже в кэше
    if (imageCache.has(key)) {
      resolve(imageCache.get(key));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      imageCache.set(key, img);
      loadedCount++;
      resolve(img);
    };
    img.onerror = () => {
      // Создаём заглушку
      const fallbackImg = createFallbackImage(key);
      imageCache.set(key, fallbackImg);
      loadedCount++;
      resolve(fallbackImg);
    };
    img.src = path;
  });
}

/**
 * Принудительная загрузка нескольких изображений
 * 
 * @param {Object} imageMap - Объект { key: 'path/to/image.png' }
 * @returns {Promise<void>}
 */
export async function forceLoadImages(imageMap) {
  const promises = [];
  for (const [key, path] of Object.entries(imageMap)) {
    promises.push(forceLoadImage(key, path));
  }
  await Promise.all(promises);
}