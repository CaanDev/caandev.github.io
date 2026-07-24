/**
 * @fileoverview UI окна настроек.
 * Управляет открытием, закрытием, инициализацией и обновлением
 * пользовательского интерфейса настроек.
 * 
 * @module systems/ui/settings/settingsUI
 */

import { audio } from '../../../audio/audioManager.js';
import { loadSettings, getSettings, saveSettings } from './settingsManager.js';
import { updateFpsLimit, updateFpsVisibility } from './settingsFps.js';
import { initSliders, initToggles, initSelects, initButtons } from './settingsControls.js';
import { updateFpsDisplay, shouldSkipFrame, getFrameInterval } from './settingsFps.js';
import { loadTemplateIfNeeded, isTemplateLoaded } from '../../../utils/htmlLoader.js';

/** @type {boolean} - Открыты ли настройки */
let settingsOpen = false;
/** @type {string} - Текущая активная вкладка */
let currentTab = 'audio';

/**
 * Проверка, открыты ли настройки
 * 
 * @returns {boolean} - true, если настройки открыты
 */
export function isSettingsOpen() {
  return settingsOpen;
}

/**
 * Переключение вкладки настроек
 * 
 * @param {string} tabId - ID вкладки ('audio', 'graphics', 'save')
 * @returns {void}
 */
export function switchSettingsTab(tabId) {
  currentTab = tabId;
  
  // Обновляем классы у вкладок
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  // Обновляем классы у содержимого
  document.querySelectorAll('.settings-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `settings-tab-${tabId}`);
  });
}

/**
 * Внутренняя функция открытия настроек (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function showSettings() {
  const settingsUI = document.getElementById('settings-ui');
  if (!settingsUI) return;

  settingsOpen = true;
  loadSettings();
  updateSettingsUI();
  settingsUI.style.display = 'flex';

  // Устанавливаем активную вкладку по умолчанию
  switchSettingsTab('audio');

  // ===== ПАУЗА ИГРЫ =====
  import('../../../core/game.js').then(({ Game }) => {
    if (Game.isRunning) {
      Game.stopLoop();
    }
  });

  // ===== ПАУЗА МУЗЫКИ =====
  if (!audio.isMainMenu) {
    audio.pause();
  }
}

/**
 * Открытие окна настроек
 * 
 * @returns {void}
 */
export function openSettings() {
  // ==== ЗАГРУЗКА ШАБЛОНА НАСТРОЕК (ЕСЛИ НУЖНО) =====
  if (!isTemplateLoaded('settings')) {
    loadTemplateIfNeeded('settings').then(() => {
      // Инициализируем обработчики ПОСЛЕ вставки в DOM
      initSettingsHandlers();
      showSettings();
    });
    return;
  }
  
  showSettings();
}

/**
 * Закрытие окна настроек
 * 
 * @returns {void}
 */
export function closeSettings() {
  const settingsUI = document.getElementById('settings-ui');
  if (!settingsUI) return;

  const settings = getSettings();
  settingsOpen = false;
  settingsUI.style.display = 'none';

  // ===== ВОЗОБНОВЛЕНИЕ МУЗЫКИ =====
  if (!audio.isMainMenu && settings.musicEnabled) {
    audio.resume();
  }

  // ===== ВОЗОБНОВЛЕНИЕ ИГРЫ =====
  import('../../../core/game.js').then(({ Game }) => {
    if (!Game.isRunning) {
      Game.startLoop();
    }
  });
}

/**
 * Обновление UI настроек в соответствии с текущими значениями
 * 
 * @returns {void}
 * @private
 */
function updateSettingsUI() {
  const settings = getSettings();
  
  const musicSlider = document.getElementById('settings-music-volume');
  const soundSlider = document.getElementById('settings-sound-volume');

  // ===== СЛАЙДЕРЫ =====
  if (musicSlider) {
    musicSlider.value = settings.musicVolume;
    document.getElementById('settings-music-value').textContent = `${settings.musicVolume}%`;
  }
  if (soundSlider) {
    soundSlider.value = settings.soundVolume;
    document.getElementById('settings-sound-value').textContent = `${settings.soundVolume}%`;
  }

  // ===== ПЕРЕКЛЮЧАТЕЛИ =====
  const musicToggle = document.getElementById('settings-music-toggle');
  const soundToggle = document.getElementById('settings-sound-toggle');
  const fpsToggle = document.getElementById('settings-show-fps');
  const fpsLimitSelect = document.getElementById('settings-fps-limit');
  const vsyncToggle = document.getElementById('settings-vsync-toggle');
  const smoothingToggle = document.getElementById('settings-smoothing-toggle');

  if (musicToggle) musicToggle.checked = settings.musicEnabled;
  if (soundToggle) soundToggle.checked = settings.soundEnabled;
  if (fpsToggle) fpsToggle.checked = settings.showFps;
  if (fpsLimitSelect) fpsLimitSelect.value = settings.fpsLimit;
  if (vsyncToggle) vsyncToggle.checked = settings.vsyncEnabled;
  if (smoothingToggle) smoothingToggle.checked = settings.smoothingEnabled;
}

/**
 * Инициализация обработчиков настроек (вкладки + кнопка закрытия)
 * 
 * @returns {void}
 */
export function initSettingsHandlers() {
  // ===== ВКЛАДКИ =====
  document.querySelectorAll('.settings-tab').forEach(tab => {
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    newTab.addEventListener('click', () => {
      const tabId = newTab.dataset.tab;
      switchSettingsTab(tabId);
    });
  });

  // ===== КНОПКА ЗАКРЫТИЯ =====
  const closeBtn = document.getElementById('settings-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeSettings);
  }
}

/**
 * Инициализация системы настроек
 * 
 * Загружает настройки, применяет их, настраивает обработчики
 * и отслеживает изменения видимости UI для FPS-счётчика.
 * 
 * @returns {void}
 */
export function initSettings() {
  const settings = loadSettings();

  // ===== ПРИМЕНЕНИЕ НАСТРОЕК =====
  updateFpsLimit();

  audio.setMusicEnabled(settings.musicEnabled);
  audio.setMusicVolume(settings.musicVolume / 100);

  if (settings.soundEnabled) {
    audio.sound.isMuted = false;
    audio.setSoundVolume(settings.soundVolume / 100);
  } else {
    audio.sound.isMuted = true;
    audio.setSoundVolume(0);
  }
  audio.sound.updateVolume();

  if (settings.showFps) {
    updateFpsVisibility();
  }

  // ===== ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ УПРАВЛЕНИЯ =====
  initSliders();
  initToggles();
  initSelects();
  initButtons();

  // ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ВКЛАДОК =====
  // (если шаблон уже загружен)
  if (document.querySelector('.settings-tab')) {
    initSettingsHandlers();
  }

  // ===== ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЯ ВИДИМОСТИ UI =====
  const observer = new MutationObserver(() => {
    updateFpsVisibility();
  });

  const introScreen = document.getElementById('intro-screen');
  const startScreen = document.getElementById('start-screen-ui');
  const gameUI = document.getElementById('ui');
  const pauseMenu = document.getElementById('pause-menu');

  if (introScreen) {
    observer.observe(introScreen, { attributes: true, attributeFilter: ['style'] });
  }
  if (startScreen) {
    observer.observe(startScreen, { attributes: true, attributeFilter: ['style'] });
  }
  if (gameUI) {
    observer.observe(gameUI, { attributes: true, attributeFilter: ['style'] });
  }
  if (pauseMenu) {
    observer.observe(pauseMenu, { attributes: true, attributeFilter: ['style'] });
  }
}

// ===== РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ =====
export { updateFpsDisplay, shouldSkipFrame, getFrameInterval, updateFpsLimit };