// systems/ui/settings/settingsUI.js

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
import { registerModalOpen, registerModalClose } from '../modalManager.js';

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
  
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
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

  // Принудительная остановка сердцебиения игрока
  import('../../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });

  settingsOpen = true;
  loadSettings();
  updateSettingsUI();
  settingsUI.style.display = 'flex';
  registerModalOpen('settings');

  switchSettingsTab('audio');

  import('../../../core/game.js').then(({ Game }) => {
    if (Game.isRunning) {
      Game.stopLoop();
    }
  });

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
  if (!isTemplateLoaded('settings')) {
    loadTemplateIfNeeded('settings').then(() => {
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
  registerModalClose('settings');

  if (!audio.isMainMenu && settings.musicEnabled) {
    audio.resume();
  }

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

  if (musicSlider) {
    musicSlider.value = settings.musicVolume;
    document.getElementById('settings-music-value').textContent = `${settings.musicVolume}%`;
  }
  if (soundSlider) {
    soundSlider.value = settings.soundVolume;
    document.getElementById('settings-sound-value').textContent = `${settings.soundVolume}%`;
  }

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
  
  // ===== ПРОКРУТКА ВКЛАДОК =====
  initTabsScrolling();

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
 * @returns {void}
 */
export function initSettings() {
  const settings = loadSettings();

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

  initSliders();
  initToggles();
  initSelects();
  initButtons();

  if (document.querySelector('.settings-tab')) {
    initSettingsHandlers();
  }

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

/**
 * Инициализация обработчиков вкладок (прокрутка колёсиком + тапы)
 * 
 * @returns {void}
 * @private
 */
function initTabsScrolling() {
  const tabsWrapper = document.querySelector('.settings-tabs-wrapper');
  const tabsContainer = document.querySelector('.settings-tabs');
  if (!tabsWrapper || !tabsContainer) return;
  
  // ===== 1. ПРОКРУТКА КОЛЁСИКОМ МЫШИ =====
  tabsContainer.addEventListener('wheel', (e) => {
    if (tabsContainer.scrollWidth > tabsContainer.clientWidth) {
      e.preventDefault();
      tabsContainer.scrollLeft += e.deltaY;
      updateTabsScrollState(tabsWrapper, tabsContainer);
    }
  }, { passive: false });
  
  // ===== 2. ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ =====
  updateTabsScrollState(tabsWrapper, tabsContainer);
  
  // ===== 3. ОБНОВЛЕНИЕ ПРИ РЕСАЙЗЕ И ПРОКРУТКЕ =====
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateTabsScrollState(tabsWrapper, tabsContainer);
    }, 100);
  });
  
  tabsContainer.addEventListener('scroll', () => {
    updateTabsScrollState(tabsWrapper, tabsContainer);
  });

  // ===== 4. ТАЧ-ПРОКРУТКА (свайп по вкладкам) =====
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isDragging = false;
  let startScrollLeft = 0;

  tabsContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchCurrentX = touch.clientX;
    startScrollLeft = tabsContainer.scrollLeft;
    isDragging = false;
  }, { passive: true });

  tabsContainer.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    touchCurrentX = touch.clientX;
    const deltaX = touchCurrentX - touchStartX;
    
    if (Math.abs(deltaX) > 10) {
      isDragging = true;
      e.preventDefault();
      tabsContainer.scrollLeft = startScrollLeft - deltaX;
      updateTabsScrollState(tabsWrapper, tabsContainer);
    }
  }, { passive: false });

  tabsContainer.addEventListener('touchend', (e) => {
    if (isDragging) {
      e.preventDefault();
      const target = e.target;
      if (target && target.closest) {
        const tab = target.closest('.settings-tab');
        if (tab) {
          tab.style.pointerEvents = 'none';
          setTimeout(() => {
            tab.style.pointerEvents = '';
          }, 100);
        }
      }
    }
    isDragging = false;
  }, { passive: false });
}

/**
 * Обновление состояния прокрутки вкладок (градиенты)
 * 
 * @param {HTMLElement} tabsWrapper - Обёртка вкладок
 * @param {HTMLElement} tabsContainer - Контейнер с вкладками
 * @returns {void}
 * @private
 */
function updateTabsScrollState(tabsWrapper, tabsContainer) {
  if (!tabsWrapper || !tabsContainer) return;
  
  const canScrollRight = tabsContainer.scrollWidth > tabsContainer.clientWidth;
  const isAtStart = tabsContainer.scrollLeft <= 5;
  const isAtEnd = tabsContainer.scrollLeft >= tabsContainer.scrollWidth - tabsContainer.clientWidth - 5;
  
  // Правое затенение (есть контент справа)
  tabsWrapper.classList.toggle('can-scroll-right', canScrollRight && !isAtEnd);
  
  // Левое затенение (есть контент слева)
  tabsWrapper.classList.toggle('can-scroll-left', canScrollRight && !isAtStart);
}

export { updateFpsDisplay, shouldSkipFrame, getFrameInterval, updateFpsLimit };