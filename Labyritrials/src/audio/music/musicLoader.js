/**
 * @fileoverview Ленивая загрузка музыкальных треков
 * @module audio/music/musicLoader
 */

import { getTrackConfig, getPreloadTracks } from './musicConfig.js';
import { logger } from '../../utils/logger.js';

/**
 * @class MusicLoader
 * @description Управляет загрузкой и кэшированием музыкальных треков
 */
class MusicLoader {
  constructor() {
    /** @type {Map<string, Audio>} - Кэш загруженных треков */
    this.cache = new Map();
    /** @type {Set<string>} - Треки в процессе загрузки */
    this.loading = new Set();
    /** @type {Set<string>} - Загруженные треки */
    this.loaded = new Set();
    /** @type {boolean} - Инициализирован ли лоадер */
    this.initialized = false;
  }

  /**
   * Инициализация лоадера (предзагрузка критических треков)
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    const preloadKeys = getPreloadTracks();
    if (preloadKeys.length > 0) {
      await Promise.allSettled(
        preloadKeys.map(key => this.loadTrack(key))
      );
    }

    this.initialized = true;
  }

  /**
   * Загрузка трека по ключу (ленивая)
   * @param {string} key - Ключ трека
   * @returns {Promise<Audio|null>} - Загруженный Audio или null
   */
  async loadTrack(key) {
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

    const config = getTrackConfig(key);
    if (!config) {
      logger.warn(`⚠️ Трек "${key}" не найден в конфигурации`);
      return null;
    }

    this.loading.add(key);

    try {
      const audio = new Audio(config.path);
      audio.loop = config.loop !== undefined ? config.loop : true;
      audio.volume = config.volume || 0.4;
      audio.preload = 'auto';

      // Ожидаем загрузки
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', (e) => {
          // Некоторые браузеры могут не поддерживать canplaythrough для OGG
          // Пробуем alternative событие
          if (audio.readyState >= 2) {
            resolve();
          } else {
            reject(e);
          }
        }, { once: true });
        audio.load();
      });

      this.cache.set(key, audio);
      this.loaded.add(key);
      this.loading.delete(key);

      return audio;

    } catch (error) {
      this.loading.delete(key);
      logger.warn(`⚠️ Не удалось загрузить трек "${key}":`, error);
      return null;
    }
  }

  /**
   * Получение трека из кэша (без загрузки)
   * @param {string} key - Ключ трека
   * @returns {Audio|null} - Трек или null
   */
  getTrack(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Проверка, загружен ли трек
   * @param {string} key - Ключ трека
   * @returns {boolean} - true, если трек загружен
   */
  isLoaded(key) {
    return this.loaded.has(key);
  }

  /**
   * Получение всех загруженных треков
   * @returns {Map<string, Audio>} - Карта загруженных треков
   */
  getAllLoaded() {
    return this.cache;
  }

  /**
   * Очистка кэша (кроме предзагруженных)
   * @param {boolean} keepPreload - Сохранять ли предзагруженные треки
   * @returns {void}
   */
  clearCache(keepPreload = true) {
    const preloadKeys = getPreloadTracks();

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
   * Получение количества загруженных треков
   * @returns {number} - Количество загруженных треков
   */
  getLoadedCount() {
    return this.loaded.size;
  }

  /**
   * Получение количества треков в кэше
   * @returns {number} - Количество треков в кэше
   */
  getCacheSize() {
    return this.cache.size;
  }
}

/** @type {MusicLoader} - Экземпляр лоадера музыки */
export const musicLoader = new MusicLoader();