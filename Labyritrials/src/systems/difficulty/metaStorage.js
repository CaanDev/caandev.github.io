/**
 * @fileoverview Сохранение метапрогресса в localStorage.
 * Метапрогресс живёт вне игрового сохранения - переживает смерти, удаление save, перезапуск забега.
 * 
 * @module systems/difficulty/metaStorage
 */

import { state } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';

/** @type {string} - Ключ для хранения метапрогресса */
const META_KEY = 'labirithria_meta';

/**
 * Загрузка метапрогресса из localStorage.
 * Вызывать при инициализации игры.
 * 
 * @returns {void}
 */
export function loadMetaProgress() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state.metaProgress = { recentDeaths: data.recentDeaths || 0, };
    } else {
      state.metaProgress = { recentDeaths: 0 };
    }
  } catch (e) {
    logger.warn('⚠️ Не удалось загрузить метапрогресс:', e);
    state.metaProgress = { recentDeaths: 0 };
  }
}

/**
 * Сохранение метапрогресса в localStorage.
 * Вызывать при каждом изменении recentDeaths.
 * 
 * @returns {void}
 */
export function saveMetaProgress() {
  try {
    const data = { recentDeaths: state.metaProgress?.recentDeaths || 0, };
    localStorage.setItem(META_KEY, JSON.stringify(data));
  } catch (e) {
    logger.warn('⚠️ Не удалось сохранить метапрогресс:', e);
  }
}

/**
 * Полная очистка метапрогресса.
 * Используется при сбросе всех данных игры.
 * 
 * @returns {void}
 */
export function clearMetaProgress() {
  try {
    localStorage.removeItem(META_KEY);
  } catch (e) {
    logger.warn('⚠️ Не удалось очистить метапрогресс:', e);
  }
}