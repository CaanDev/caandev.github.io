/**
 * @fileoverview Хранилище сохранений в localStorage.
 * Управляет сохранением, загрузкой, проверкой и удалением игровых сохранений.
 * 
 * @module save/saveStorage
 */

import { formatPlayTime } from './timeFormatter.js';
import { COLORS } from '../core/config/colors.js';

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
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  console.log('💾 Игра сохранена!');
}

/**
 * Загрузка данных игры из localStorage
 * 
 * @returns {Object|null} - Загруженные данные или null, если сохранение отсутствует или повреждено
 */
export function loadFromLocalStorage() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const save = JSON.parse(raw);
    if (isSaveExpired(save.saveDate)) {
      deleteSave();
      return null;
    }
    return save;
  } catch {
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
  } catch {
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
  } catch {
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
    notification.style.position = 'fixed';
    notification.style.bottom = '80px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'rgba(46, 204, 113, 0.95)';
    notification.style.color = COLORS.player.shadow;
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.fontFamily = 'Courier New, monospace';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '14px';
    notification.style.zIndex = '999';
    notification.style.pointerEvents = 'none';
    notification.style.userSelect = 'none';
    notification.style.transition = 'opacity 0.3s ease';
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
  console.log('🗑️ Все данные игры удалены (включая записки)');
}