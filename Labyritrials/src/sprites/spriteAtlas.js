/**
 * @fileoverview Загрузчик и хранилище спрайт-листов
 * @module sprites/SpriteAtlas
 */

import { getSpriteConfig } from './spriteConfig.js';
import { getImage, isImageLoaded, forceLoadImage } from '../utils/imageLoader.js';
import { logger } from '../utils/logger.js';

/**
 * @class SpriteAtlas
 * @description Управляет загрузкой и нарезкой спрайт-листов
 */
export class SpriteAtlas {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} - Загруженные текстуры */
    this.textures = new Map();
    /** @type {Map<string, Object>} - Кэш нарезанных спрайтов */
    this.spriteCache = new Map();
    /** @type {boolean} - Загружены ли все текстуры */
    this.loaded = false;
    /** @type {Promise|null} - Промис загрузки */
    this.loadPromise = null;
  }

  /**
   * Загрузка всех спрайт-листов
   * @param {Function} onProgress - Колбэк прогресса (0-100)
   * @returns {Promise<void>}
   */
  async loadAll(onProgress = null) {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._doLoad(onProgress);
    await this.loadPromise;
    this.loaded = true;
    return;
  }

  /**
   * Внутренняя загрузка всех текстур
   * @param {Function} onProgress - Колбэк прогресса
   * @returns {Promise<void>}
   * @private
   */
  async _doLoad(onProgress) {
    const configs = [
      { key: 'idle', config: getSpriteConfig('idle') },
      { key: 'walk', config: getSpriteConfig('walk') },
      { key: 'attack', config: getSpriteConfig('attack') },
    ];

    const total = configs.length;
    let loaded = 0;

    for (const { key, config } of configs) {
      try {
        // Проверяем, не загружено ли уже через imageLoader
        const img = getImage(key);
        if (img && isImageLoaded(key)) {
          this.textures.set(key, img);
          loaded++;
          if (onProgress) onProgress((loaded / total) * 100);
          continue;
        }

        // Загружаем изображение
        const loadedImg = await forceLoadImage(key, config.path);
        this.textures.set(key, loadedImg);
        loaded++;
        if (onProgress) onProgress((loaded / total) * 100);

      } catch (err) {
        logger.error(`❌ Ошибка загрузки спрайт-листа ${key}:`, err);
        loaded++;
        if (onProgress) onProgress((loaded / total) * 100);
      }
    }

    // Очищаем кэш нарезанных спрайтов после загрузки
    this.spriteCache.clear();
  }

  /**
   * Получение нарезанных спрайтов для состояния
   * @param {string} state - Название состояния ('idle', 'walk', 'attack')
   * @returns {Object|null} - Объект с данными спрайтов или null
   */
  getSprites(state) {
    if (this.spriteCache.has(state)) {
      return this.spriteCache.get(state);
    }

    const texture = this.textures.get(state);
    if (!texture) {
      logger.warn(`⚠️ Текстура ${state} не загружена`);
      return null;
    }

    const config = getSpriteConfig(state);
    if (!config) return null;

    const sprites = this._sliceTexture(texture, config);
    this.spriteCache.set(state, sprites);
    return sprites;
  }

  /**
   * Нарезка текстуры на отдельные кадры
   * @param {HTMLImageElement} texture - Исходная текстура
   * @param {Object} config - Конфигурация состояния
   * @returns {Object} - Объект с кадрами по направлениям
   * @private
   */
  _sliceTexture(texture, config) {
    const { frameWidth, frameHeight, columns, rows, framesPerDirection, totalDirections } = config;
    
    const result = {
      frameWidth,
      frameHeight,
      framesPerDirection,
      totalDirections,
      directions: [],
    };

    // Нарезаем все кадры
    const allFrames = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * frameWidth;
        const y = row * frameHeight;
        allFrames.push({ x, y, w: frameWidth, h: frameHeight });
      }
    }

    // Группируем по направлениям
    // ВАЖНО: каждая строка = одно направление
    for (let dir = 0; dir < totalDirections; dir++) {
      const startIdx = dir * framesPerDirection;
      const dirFrames = allFrames.slice(startIdx, startIdx + framesPerDirection);
      result.directions.push(dirFrames);
    }

    return result;
  }

  /**
   * Получение конкретного кадра
   * @param {string} state - Название состояния
   * @param {number} directionIndex - Индекс направления (0-7)
   * @param {number} frameIndex - Индекс кадра в направлении
   * @returns {Object|null} - Данные кадра {x, y, w, h} или null
   */
  getFrame(state, directionIndex, frameIndex) {
    const sprites = this.getSprites(state);
    if (!sprites) return null;

    const dirFrames = sprites.directions[directionIndex];
    if (!dirFrames) return null;

    const frame = dirFrames[frameIndex % dirFrames.length];
    return frame || null;
  }

  /**
   * Получение текстуры для состояния
   * @param {string} state - Название состояния
   * @returns {HTMLImageElement|null} - Текстура или null
   */
  getTexture(state) {
    return this.textures.get(state) || null;
  }

  /**
   * Проверка, загружено ли состояние
   * @param {string} state - Название состояния
   * @returns {boolean} - true, если загружено
   */
  isLoaded(state) {
    return this.textures.has(state);
  }
}

/** @type {SpriteAtlas|null} - Синглтон атласа */
let atlasInstance = null;

/**
 * Получение экземпляра SpriteAtlas
 * @returns {SpriteAtlas} - Экземпляр атласа
 */
export function getSpriteAtlas() {
  if (!atlasInstance) {
    atlasInstance = new SpriteAtlas();
  }
  return atlasInstance;
}

export const spriteAtlas = getSpriteAtlas();