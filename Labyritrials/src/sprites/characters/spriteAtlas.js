/**
 * @fileoverview Загрузчик и хранилище спрайт-листов
 * @module sprites/SpriteAtlas
 */

import { getAnimationConfig } from './spriteConfig.js';
import { logger } from '../../utils/logger.js';

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
    /** @type {string} - Текущий пол персонажа ('male' или 'female') */
    this.gender = 'male';
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
   * Установка пола персонажа
   * @param {string} gender - 'male' или 'female'
   * @returns {void}
   */
  setGender(gender) {
    if (gender === 'male' || gender === 'female') {
      this.gender = gender;
      // Очистка кэша при смене пола
      this.spriteCache.clear();
    }
  }

  /**
   * Получение текущего пола
   * @returns {string}
   */
  getGender() {
    return this.gender;
  }

  /**
   * Внутренняя загрузка всех текстур
   * @param {Function} onProgress - Колбэк прогресса
   * @returns {Promise<void>}
   * @private
   */
  async _doLoad(onProgress) {
    // Загрузка спрайт-листов для обоих полов
    const states = ['idle', 'walk', 'attack'];
    const genders = ['male', 'female'];
    
    const configs = [];
    for (const gender of genders) {
      for (const state of states) {
        const config = getAnimationConfig(state);
        if (config) {
          // Путь к файлу зависит от пола
          const path = `assets/spritesheets/characters/${gender}/${state}.webp`;
          const fallback = `assets/spritesheets/characters/${gender}/${state}.png`;
          configs.push({
            key: `${gender}_${state}`,
            path: path,
            fallback: fallback,
            config: config,
          });
        }
      }
    }

    const total = configs.length;
    let loaded = 0;

    for (const { key, path, fallback, config } of configs) {
      try {
        const loadedImg = await this._loadImage(path, fallback);
        this.textures.set(key, loadedImg);
        loaded++;
        if (onProgress) onProgress((loaded / total) * 100);
      } catch (err) {
        logger.error(`❌ Ошибка загрузки спрайт-листа ${key}:`, err);
        loaded++;
        if (onProgress) onProgress((loaded / total) * 100);
      }
    }

    // Очистка кэша нарезанных спрайтов после загрузки
    this.spriteCache.clear();
  }

  /**
   * Загрузка одного изображения
   * @param {string} src - Путь к изображению
   * @param {string} fallback - Запасной путь
   * @returns {Promise<HTMLImageElement>}
   * @private
   */
  _loadImage(src, fallback) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Попытка использования fallback
        if (fallback) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => reject(new Error(`Не удалось загрузить: ${src} и ${fallback}`));
          fallbackImg.src = fallback;
        } else {
          reject(new Error(`Не удалось загрузить: ${src}`));
        }
      };
      img.src = src;
    });
  }

  /**
   * Получение текстуры для состояния и пола
   * @param {string} state - Название состояния ('idle', 'walk', 'attack')
   * @param {string} gender - Пол ('male' или 'female')
   * @returns {HTMLImageElement|null} - Текстура или null
   */
  getTexture(state, gender = null) {
    const actualGender = gender || this.gender;
    const key = `${actualGender}_${state}`;
    return this.textures.get(key) || null;
  }

  /**
   * Получение нарезанных спрайтов для состояния и пола
   * @param {string} state - Название состояния ('idle', 'walk', 'attack')
   * @param {string} gender - Пол ('male' или 'female')
   * @returns {Object|null} - Объект с данными спрайтов или null
   */
  getSprites(state, gender = null) {
    const actualGender = gender || this.gender;
    const cacheKey = `${actualGender}_${state}`;
    
    if (this.spriteCache.has(cacheKey)) return this.spriteCache.get(cacheKey);

    const texture = this.getTexture(state, actualGender);
    if (!texture) {
      logger.warn(`⚠️ Текстура ${actualGender}_${state} не загружена`);
      return null;
    }

    const config = getAnimationConfig(state);
    if (!config) return null;

    const sprites = this._sliceTexture(texture, config);
    this.spriteCache.set(cacheKey, sprites);
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

    // Нарезка всех кадров
    const allFrames = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * frameWidth;
        const y = row * frameHeight;
        allFrames.push({ x, y, w: frameWidth, h: frameHeight });
      }
    }

    // Группировка по направлениям
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
   * @param {string} gender - Пол ('male' или 'female')
   * @returns {Object|null} - Данные кадра {x, y, w, h} или null
   */
  getFrame(state, directionIndex, frameIndex, gender = null) {
    const sprites = this.getSprites(state, gender);
    if (!sprites) return null;

    const dirFrames = sprites.directions[directionIndex];
    if (!dirFrames) return null;

    const frame = dirFrames[frameIndex % dirFrames.length];
    return frame || null;
  }

  /**
   * Проверка, загружено ли состояние для пола
   * @param {string} state - Название состояния
   * @param {string} gender - Пол ('male' или 'female')
   * @returns {boolean} - true, если загружено
   */
  isLoaded(state, gender = null) {
    const actualGender = gender || this.gender;
    const key = `${actualGender}_${state}`;
    return this.textures.has(key);
  }
}

/** @type {SpriteAtlas|null} - Синглтон атласа */
let atlasInstance = null;

/**
 * Получение экземпляра SpriteAtlas
 * @returns {SpriteAtlas} - Экземпляр атласа
 */
export function getSpriteAtlas() {
  if (!atlasInstance) atlasInstance = new SpriteAtlas();
  return atlasInstance;
}

export const spriteAtlas = getSpriteAtlas();