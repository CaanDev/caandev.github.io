/**
 * @fileoverview Утилиты для работы с данными сохранения.
 * 
 * @module utils/compression
 */

import { logger } from './logger.js';

/**
 * Подготовка данных для сохранения (просто JSON)
 * 
 * @param {Object} data - Данные для сохранения
 * @returns {string} - JSON строка
 */
export function compressData(data) {
  return JSON.stringify(data);
}

/**
 * Восстановление данных из JSON
 * 
 * @param {string} compressed - JSON строка
 * @returns {Object|null} - Восстановленные данные или null
 */
export function decompressData(compressed) {
  if (!compressed || typeof compressed !== 'string') {
    return null;
  }
  
  try {
    return JSON.parse(compressed);
  } catch (e) {
    logger.error('❌ Ошибка восстановления данных:', e.message);
    return null;
  }
}

/**
 * Проверка, сжаты ли данные (всегда false)
 * 
 * @param {string} data - Данные для проверки
 * @returns {boolean} - false
 */
export function isCompressed(data) {
  return false;
}

/**
 * Получение размера данных в байтах
 * 
 * @param {string} data - Строка для измерения
 * @returns {number} - Размер в байтах
 */
export function getDataSize(data) {
  return new Blob([data]).size;
}

/**
 * Подготовка данных с отображением статистики
 * 
 * @param {Object} data - Данные для сохранения
 * @returns {Object} - Результат
 */
export function compressWithStats(data) {
  const json = JSON.stringify(data);
  const size = getDataSize(json);
  
  return {
    compressed: json,
    originalSize: size,
    compressedSize: size,
    ratio: '0%'
  };
}