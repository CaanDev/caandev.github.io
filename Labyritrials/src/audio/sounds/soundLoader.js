/**
 * @fileoverview Ленивая загрузка звуковых эффектов
 * @module audio/sounds/soundLoader
 */

import { getSoundConfig, getPreloadSounds } from './soundConfig.js';
import { logger } from '../../utils/logger.js';

/**
 * @class SoundLoader
 * @description Управляет загрузкой и кэшированием звуковых эффектов
 */
class SoundLoader {
  constructor() {
    /** @type {Map<string, Audio>} - Кэш загруженных звуков */
    this.cache = new Map();
    /** @type {Set<string>} - Звуки в процессе загрузки */
    this.loading = new Set();
    /** @type {Set<string>} - Загруженные звуки */
    this.loaded = new Set();
    /** @type {boolean} - Инициализирован ли лоадер */
    this.initialized = false;
    /** @type {number} - Максимальное количество звуков в кэше */
    this.maxCacheSize = 100;
  }

  /**
   * Инициализация лоадера (предзагрузка критических звуков)
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    const preloadKeys = getPreloadSounds();
    if (preloadKeys.length > 0) {
      await Promise.allSettled(
        preloadKeys.map(key => this.loadSound(key))
      );
    }

    this.initialized = true;
  }

  /**
   * Загрузка звука по ключу (ленивая)
   * @param {string} key - Ключ звука (например, 'interactions.wallDestroy')
   * @returns {Promise<Audio|null>} - Загруженный Audio или null
   */
  async loadSound(key) {
    // Уже загружен
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Уже загружается
    if (this.loading.has(key)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.loaded.has(key)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(key) || null);
          }
        }, 50);
      });
    }

    const config = getSoundConfig(key);
    if (!config) {
      logger.warn(`⚠️ Звук "${key}" не найден в конфигурации`);
      return null;
    }

    this.loading.add(key);

    try {
      const audio = new Audio(config.path);
      audio.volume = config.volume || 0.3;
      audio.preload = 'auto';

      // Ожидаем загрузки (или ошибки)
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', (e) => {
          // Некоторые браузеры могут не поддерживать canplaythrough для OGG
          if (audio.readyState >= 2) {
            resolve();
          } else {
            reject(e);
          }
        }, { once: true });
        audio.load();
      });

      // Проверяем размер кэша
      if (this.cache.size >= this.maxCacheSize) {
        this._evictOldest();
      }

      this.cache.set(key, audio);
      this.loaded.add(key);
      this.loading.delete(key);

      return audio;

    } catch (error) {
      this.loading.delete(key);
      // Не выводим ошибку для каждого звука, только если их мало
      if (this.loading.size < 5) {
        logger.warn(`⚠️ Не удалось загрузить звук "${key}":`, error);
      }
      return null;
    }
  }

  /**
   * Вытеснение самого старого звука из кэша
   * @private
   */
  _evictOldest() {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      const audio = this.cache.get(oldestKey);
      if (audio) {
        try {
          audio.pause();
          audio.src = '';
          audio.load();
        } catch (e) {
          // Игнорируем
        }
      }
      this.cache.delete(oldestKey);
      this.loaded.delete(oldestKey);
    }
  }

  /**
   * Получение звука из кэша (без загрузки)
   * @param {string} key - Ключ звука
   * @returns {Audio|null} - Звук или null
   */
  getSound(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Проверка, загружен ли звук
   * @param {string} key - Ключ звука
   * @returns {boolean} - true, если звук загружен
   */
  isLoaded(key) {
    return this.loaded.has(key);
  }

  /**
   * Получение всех загруженных звуков (итерируемый объект)
   * @returns {Map<string, Audio>} - Карта загруженных звуков
   */
  getAllLoaded() {
    return this.cache;
  }

  /**
   * Очистка кэша (кроме предзагруженных)
   * @param {boolean} keepPreload - Сохранять ли предзагруженные звуки
   * @returns {void}
   */
  clearCache(keepPreload = true) {
    const preloadKeys = getPreloadSounds();

    for (const [key, audio] of this.cache) {
      if (keepPreload && preloadKeys.includes(key)) continue;

      try {
        audio.pause();
        audio.src = '';
        audio.load();
      } catch (e) {
        // Игнорируем
      }

      this.cache.delete(key);
      this.loaded.delete(key);
    }
  }

  /**
   * Полная очистка кэша
   * @returns {void}
   */
  clearAll() {
    this.clearCache(false);
  }

  /**
   * Получение количества загруженных звуков
   * @returns {number} - Количество загруженных звуков
   */
  getLoadedCount() {
    return this.loaded.size;
  }

  /**
   * Получение количества звуков в кэше
   * @returns {number} - Количество звуков в кэше
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Предзагрузка звуков по списку ключей
   * @param {string[]} keys - Массив ключей звуков
   * @returns {Promise<void>}
   */
  async preloadSounds(keys) {
    const toLoad = keys.filter(key => !this.isLoaded(key));
    if (toLoad.length === 0) return;

    await Promise.allSettled(
      toLoad.map(key => this.loadSound(key))
    );
  }
}

/** @type {SoundLoader} - Экземпляр лоадера звуков */
export const soundLoader = new SoundLoader();