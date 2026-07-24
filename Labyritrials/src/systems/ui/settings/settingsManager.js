/**
 * @fileoverview Менеджер настроек игры.
 * Управляет загрузкой, сохранением и применением пользовательских настроек.
 * 
 * @module systems/ui/settings/settingsManager
 */

import { logger } from '../../../utils/logger.js';
import { audio } from '../../../audio/audioManager.js';

/** @type {string} - Ключ для хранения настроек в localStorage */
const SETTINGS_KEY = 'labirithria_settings';

/**
 * @namespace DEFAULT_SETTINGS
 * @description Настройки по умолчанию
 */
export const DEFAULT_SETTINGS = {
  musicVolume: 40,
  soundVolume: 30,
  musicEnabled: true,
  soundEnabled: true,
  showFps: false,
  fpsLimit: 0,
  vsyncEnabled: true,
  smoothingEnabled: true,
};

/** @type {Object} - Текущие настройки */
let settings = { ...DEFAULT_SETTINGS };

/**
 * Загрузка настроек из localStorage
 * 
 * @returns {Object} - Загруженные настройки
 */
export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      settings = { ...DEFAULT_SETTINGS, ...parsed };
    } else {
      settings = { ...DEFAULT_SETTINGS };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
  return settings;
}

/**
 * Сохранение настроек в localStorage
 * 
 * @returns {void}
 */
export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    logger.warn('Не удалось сохранить настройки:', e);
  }
}

/**
 * Получение текущих настроек
 * 
 * @returns {Object} - Копия текущих настроек
 */
export function getSettings() {
  return { ...settings };
}

/**
 * Обновление одной настройки
 * 
 * @param {string} key - Ключ настройки
 * @param {*} value - Новое значение
 * @returns {void}
 */
export function updateSetting(key, value) {
  if (key in settings) {
    settings[key] = value;
    applySetting(key, value);
    saveSettings();
  }
}

/**
 * Переключение звука (вкл/выкл)
 * 
 * @param {boolean} enabled - Включён ли звук
 * @returns {void}
 * @private
 */
function toggleSound(enabled) {
  if (enabled) {
    audio.sound.isMuted = false;
    audio.setSoundVolume(settings.soundVolume / 100);
    audio.sound.updateVolume();
  } else {
    audio.sound.isMuted = true;
    audio.setSoundVolume(0);
    audio.sound.updateVolume();
  }
}

/**
 * Применение настройки VSync
 * 
 * @param {boolean} enabled - Включён ли VSync
 * @returns {void}
 * @private
 */
function applyVsyncSetting(enabled) {
  settings.vsyncEnabled = enabled;
  
  import('../../../core/game.js').then(({ Game }) => {
    if (Game.isRunning) {
      // Перезапуск игрового цикла для применения нового режима
      Game.stopLoop();
      Game.startLoop();
    }
  });
}

/**
 * Применение настройки к соответствующим системам
 * 
 * @param {string} key - Ключ настройки
 * @param {*} value - Новое значение
 * @returns {void}
 */
export function applySetting(key, value) {
  switch (key) {
    case 'musicVolume':
      audio.setMusicVolume(value / 100);
      break;
    case 'soundVolume':
      audio.setSoundVolume(value / 100);
      audio.sound.updateVolume();
      break;
    case 'musicEnabled':
      audio.setMusicEnabled(value);
      break;
    case 'soundEnabled':
      toggleSound(value);
      break;
    case 'showFps':
      // Обрабатывается в settingsFps
      break;
    case 'fpsLimit':
      // Обрабатывается в settingsFps
      break;
    case 'vsyncEnabled':
      applyVsyncSetting(value);
      break;
    case 'smoothingEnabled':
      // Настройка применяется в рендерере при каждом кадре
      // Дополнительных действий не требуется
      break;
    default:
      break;
  }
}