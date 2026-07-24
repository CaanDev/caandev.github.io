/**
 * @fileoverview Хранилище сохранений в localStorage.
 * 
 * @module save/saveStorage
 */

import { logger } from '../utils/logger.js';
import { compressData, decompressData, compressWithStats, isCompressed } from '../utils/compression.js';
import { formatPlayTime } from './timeFormatter.js';
import { deleteNotesStorage } from './notesStorage.js';

/** @type {string} - Ключ для хранения сохранения в localStorage */
const SAVE_KEY = 'labirithria_save';
/** @type {number} - Максимальный возраст сохранения (30 дней) */
const SAVE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/**
 * Сохранение данных игры в localStorage
 * 
 * @param {Object} data - Данные для сохранения
 * @returns {void}
 */
export function saveToLocalStorage(data) {
  try {
    const result = compressWithStats(data);
    localStorage.setItem(SAVE_KEY, result.compressed);
    logger.save(`💾 Игра сохранена! (${result.originalSize} байт)`);
  } catch (e) {
    logger.error('❌ Ошибка сохранения:', e);
  }
}

/**
 * Загрузка данных игры из localStorage
 * 
 * @returns {Object|null} - Загруженные данные или null
 */
export function loadFromLocalStorage() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    logger.save('📀 Данные загружены');
    return data;
  } catch (e) {
    logger.error('❌ Ошибка загрузки сохранения:', e);
    return null;
  }
}

/**
 * Проверка, не истекло ли сохранение
 * 
 * @param {number} saveDate - Дата сохранения в миллисекундах
 * @returns {boolean} - true, если сохранение истекло
 * @private
 */
function isSaveExpired(saveDate) {
  return Date.now() - saveDate > SAVE_MAX_AGE;
}

/**
 * Удаление сохранения из localStorage
 * 
 * @returns {void}
 */
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  logger.save('🗑️ Сохранение удалено');
}

/**
 * Проверка наличия валидного сохранения в localStorage
 * 
 * @returns {boolean} - true, если сохранение существует и валидно
 */
export function hasSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  try {
    const save = JSON.parse(raw);
    
    if (!save) return false;

    if (isSaveExpired(save.saveDate)) {
      deleteSave();
      return false;
    }

    const hp = save.hp;
    if (hp === undefined || hp === null || isNaN(hp) || hp <= 0) {
      deleteSave();
      return false;
    }

    if (!save.gameLevel || !save.maxHp) {
      deleteSave();
      return false;
    }

    return true;
  } catch (e) {
    deleteSave();
    return false;
  }
}

/**
 * Получение информации о сохранении
 * 
 * @returns {Object|null} - Информация о сохранении или null
 */
export function getSaveInfo() {
  const rawSave = localStorage.getItem(SAVE_KEY);
  if (!rawSave) return null;

  try {
    const save = JSON.parse(rawSave);
    
    if (!save || save.hp === undefined || save.hp <= 0 || !save.gameLevel) {
      deleteSave();
      return null;
    }

    const playTime = save.gameStats?.playTime || 0;
    const formattedTime = formatPlayTime(playTime);

    return {
      level: save.gameLevel,
      gold: save.gold || 0,
      damage: save.baseDamage || 0,
      hp: save.hp || 0,
      maxHp: save.maxHp || 0,
      monsters: save.monsters ? save.monsters.length : 0,
      date: new Date(save.saveDate).toLocaleString(),
      playTime: playTime,
      playTimeFormatted: formattedTime
    };
  } catch (e) {
    deleteSave();
    return null;
  }
}

/**
 * Показ уведомления о сохранении
 * 
 * @returns {void}
 */
export function showSaveNotification() {
  let notification = document.getElementById('save-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'save-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(46, 204, 113, 0.95);
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 14px;
      z-index: 999;
      pointer-events: none;
      user-select: none;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
  }

  notification.textContent = `💾 Сохранено!`;
  notification.style.opacity = '1';
  notification.style.display = 'block';

  if (notification._timeout) {
    clearTimeout(notification._timeout);
  }

  notification._timeout = setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.display = 'none';
      }
    }, 500);
  }, 2000);
}

/**
 * Удаление всех данных игры (сохранение + записки)
 * 
 * @returns {void}
 */
export function deleteAllSaveData() {
  localStorage.removeItem(SAVE_KEY);
  deleteNotesStorage();
  logger.save('🗑️ Все данные игры удалены (включая записки)');
}