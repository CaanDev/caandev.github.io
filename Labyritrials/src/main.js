/**
 * @fileoverview Главный файл входа в игру.
 * Выполняет инициализацию всех систем: загрузку шаблонов, настройку аудио,
 * создание игрового мира, настройку UI и обработчиков событий.
 * 
 * @module main
 */

import { Input } from './systems/input/index.js';
import { Game } from './core/game.js';
import { audio } from './audio/audioManager.js';
import { initPauseMenu } from './game/pauseMenu.js';
import { initAchievements, initAchievementsUI, openAchievementsWindow } from './systems/achievements/index.js';
import { loadNotesFromStorage } from './save/notesStorage.js';
import { generateRandomSeed, setSeed } from './world/mazeGenerator.js';
import { resetGameFull } from './core/config/functions.js';
import { player, state } from './core/config/index.js';
import { loadEssentialTemplates } from './utils/htmlLoader.js';
import { showLoader, updateLoader, hideLoader } from './utils/gameLoader.js';
import { clearAllCaches } from './utils/cache.js';
import { openSettings, initSettings, getSettings } from './systems/ui/settings/index.js';

/** @type {boolean} - Флаг: находится ли игрок в секции сохранения */
let isInSaveSection = false;

/**
 * Обновление информации о сохранении на стартовом экране
 * 
 * @returns {Promise<void>}
 */
async function updateSaveInfo() {
  const saveInfo = document.getElementById('save-info');
  const loadSaveBtn = document.getElementById('load-save-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  
  if (!saveInfo) return;
  
  try {
    const { hasSave, getSaveInfo } = await import('./save/saveSystem.js');
    
    if (hasSave()) {
      const info = getSaveInfo();
      if (info) {
        saveInfo.innerHTML = `
          📀 <b>Найдено сохранение:</b><br>
          🎭 Уровень: ${info.level}<br>
          💰 Золото: ${info.gold}<br>
          ⚔️ Урон: ${info.damage}<br>
          ❤️ HP: ${info.hp} / ${info.maxHp}<br>
          ⏱️ Время: ${info.playTimeFormatted || '00:00'}<br>
          📅 ${info.date}
        `;
        saveInfo.style.display = 'block';
        if (loadSaveBtn) loadSaveBtn.style.display = 'block';
      }
    } else {
      saveInfo.innerHTML = `
        📀 <b>Нет сохранений</b><br>
        Начните новую игру, чтобы создать сохранение.
      `;
      saveInfo.style.display = 'block';
      if (loadSaveBtn) loadSaveBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Ошибка при проверке сохранения:', err);
    saveInfo.innerHTML = '❌ Ошибка при проверке сохранения';
    saveInfo.style.display = 'block';
  }
}

/**
 * Проверка наличия существующего сохранения
 * 
 * @returns {Promise<boolean>} - true, если сохранение существует
 */
async function checkExistingSave() {
  try {
    const { hasSave } = await import('./save/saveSystem.js');
    return hasSave();
  } catch {
    return false;
  }
}

/**
 * Запуск новой игры
 * 
 * @returns {Promise<void>}
 */
async function startNewGame() {
  showLoader('Создание новой игры...', '⚔️', 'Подготовка мира...', 0);
  
  try {
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 6;
      if (progress > 75) progress = 75;
      updateLoader(null, null, null, Math.min(75, progress));
    }, 150);
    
    // Удаляем старое сохранение
    const { deleteSave } = await import('./save/saveSystem.js');
    deleteSave();
    
    await import('./save/saveStorage.js').then(({ deleteSave: forceDelete }) => {
      forceDelete();
    });
    
    updateLoader('Генерация лабиринта...', '🗺️', 'Создание подземелий...', 50);
    
    // Полный сброс и генерация нового мира
    Game.fullReset();
    const { generateMaze } = await import('./world/maze.js');
    generateMaze(true);
    Game.updateUI();
    
    clearInterval(progressInterval);
    
    updateLoader('Подготовка к входу...', '🚪', 'Вход в лабиринт...', 90);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await transitionToGame();
    
    audio.setGameState(true);
    
    updateLoader('Готово!', '✅', 'Добро пожаловать в Лабиритрию!', 100);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    hideLoader(300);
    Game.startLoop();
    
  } catch (err) {
    console.error('Ошибка при создании новой игры:', err);
    hideLoader(0);
    alert('❌ Ошибка при создании новой игры!');
  }
}

/**
 * Отображение секции сохранения на стартовом экране
 * 
 * @returns {void}
 */
function showSaveSection() {
  const mainButtons = document.getElementById('main-buttons');
  const saveButtons = document.getElementById('save-buttons');
  const titleContainer = document.querySelector('.title-container');
  const versionText = document.querySelector('.version-text');

  if (mainButtons) mainButtons.style.display = 'none';
  if (titleContainer) titleContainer.style.display = 'none';
  if (versionText) versionText.style.display = 'none';
  if (saveButtons) saveButtons.style.display = 'flex';

  updateSaveInfo();
  isInSaveSection = true;
}

/**
 * Скрытие секции сохранения на стартовом экране
 * 
 * @returns {void}
 */
function hideSaveSection() {
  const mainButtons = document.getElementById('main-buttons');
  const saveButtons = document.getElementById('save-buttons');
  const titleContainer = document.querySelector('.title-container');
  const versionText = document.querySelector('.version-text');

  if (mainButtons) mainButtons.style.display = 'flex';
  if (titleContainer) titleContainer.style.display = '';
  if (versionText) versionText.style.display = '';
  if (saveButtons) saveButtons.style.display = 'none';

  isInSaveSection = false;
}

/**
 * Обновление информации о сохранении на стартовом экране
 * 
 * @returns {Promise<void>}
 */
async function updateSaveInfoOnStartScreen() {
  if (!isInSaveSection) return;
  await updateSaveInfo();
}

/**
 * Переход из меню в игру
 * 
 * @returns {Promise<void>}
 */
async function transitionToGame() {
  return new Promise((resolve) => {
    const startScreenElem = document.getElementById('start-screen-ui');
    const gameUI = document.getElementById('ui');
    
    if (gameUI) gameUI.style.display = 'block';
    
    audio.isMainMenu = false;
    audio.isGameActive = true;
    audio.sound.isMuted = false;
    audio.sound._updateAllVolumes();
    
    const settings = getSettings();
    
    if (settings.musicEnabled) {
      if (state.inSafeRoom) {
        audio.setMusicMode('safeRoom');
        if (!audio.music.isPlaying) {
          audio.music.play('safeRoom');
        }
      } else {
        audio.forcePlayMusic('game');
      }
    } else {
      audio.setMusicMode('game');
    }
    
    if (startScreenElem) {
      startScreenElem.classList.add('fade-out-screen');
      
      setTimeout(() => {
        startScreenElem.style.display = 'none';
        startScreenElem.classList.remove('fade-out-screen');
        resolve();
      }, 1500);
    } else {
      resolve();
    }
  });
}

/**
 * Настройка обработчика кнопки загрузки сохранения
 * 
 * @param {HTMLElement} loadSaveBtn - Кнопка загрузки
 * @returns {void}
 */
function setupLoadSaveHandler(loadSaveBtn) {
  if (!loadSaveBtn || !loadSaveBtn.parentNode) {
    console.warn('setupLoadSaveHandler: кнопка загрузки не найдена');
    return;
  }
  
  const newLoadBtn = loadSaveBtn.cloneNode(true);
  loadSaveBtn.parentNode.replaceChild(newLoadBtn, loadSaveBtn);
  
  newLoadBtn.addEventListener('click', async () => {
    showLoader('Загрузка сохранения...', '📀', 'Восстановление данных...', 0);
    
    try {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 8;
        if (progress > 80) progress = 80;
        updateLoader(null, null, null, Math.min(80, progress));
      }, 150);
      
      const { loadGame } = await import('./save/saveSystem.js');
      const success = await loadGame();
      
      clearInterval(progressInterval);
      
      if (success) {
        updateLoader('Восстановление мира...', '🌍', 'Подготовка игрового мира...', 90);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        Game.updateUI();
        await transitionToGame();
        
        updateLoader('Готово!', '✅', 'С возвращением!', 100);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        hideLoader(300);
        Game.startLoop();
      } else {
        hideLoader(0);
        alert('❌ Не удалось загрузить сохранение!');
        updateSaveInfo();
      }
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
      hideLoader(0);
      alert('❌ Ошибка при загрузке сохранения!');
    }
  });
}

/**
 * Настройка экрана заставки (интро)
 * 
 * @returns {void}
 */
function setupIntroScreen() {
  const introScreen = document.getElementById('intro-screen');
  const startScreen = document.getElementById('start-screen-ui');
  const continueBtn = document.getElementById('intro-continue-btn');

  const hasSeenIntro = localStorage.getItem('hasSeenIntro');
  
  if (hasSeenIntro === 'true') {
    if (introScreen) introScreen.style.display = 'none';
    if (startScreen) startScreen.style.display = 'flex';
    return;
  }
  
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      introScreen.classList.add('fade-out-intro');
      
      setTimeout(() => {
        introScreen.style.display = 'none';
        if (startScreen) startScreen.style.display = 'flex';
        localStorage.setItem('hasSeenIntro', 'true');
      }, 1500);
    });
  }
}

/**
 * Настройка кнопок стартового экрана
 * 
 * @returns {void}
 */
function setupStartScreenButtons() {
  const startBtn = document.getElementById('start-game-btn');
  const settingsBtn = document.getElementById('settings-menu-btn');
  const achievementsBtn = document.getElementById('achievements-menu-btn');
  const loadSaveBtn = document.getElementById('load-save-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const backBtn = document.getElementById('back-to-menu-btn');
  
  // ===== КНОПКА "НАЧАТЬ ИГРУ" =====
  if (startBtn) {
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    
    newStartBtn.addEventListener('click', () => {
      showSaveSection();
    });
  }
  
  // ===== КНОПКА "НАСТРОЙКИ" =====
  if (settingsBtn) {
    const newSettingsBtn = settingsBtn.cloneNode(true);
    settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
    
    newSettingsBtn.addEventListener('click', () => {
      import('./systems/ui/settings/index.js').then(module => {
        module.openSettings();
      });
    });
  }
  
  // ===== КНОПКА "ДОСТИЖЕНИЯ" =====
  if (achievementsBtn) {
    const newAchievementsBtn = achievementsBtn.cloneNode(true);
    achievementsBtn.parentNode.replaceChild(newAchievementsBtn, achievementsBtn);
    
    newAchievementsBtn.addEventListener('click', () => {
      import('./systems/achievements/index.js').then(module => {
        module.openAchievementsWindow();
      });
    });
  }
  
  // ===== КНОПКА "ЗАГРУЗИТЬ" =====
  if (loadSaveBtn) {
    setupLoadSaveHandler(loadSaveBtn);
  }
  
  // ===== КНОПКА "НОВАЯ ИГРА" =====
  if (newGameBtn) {
    const newNewGameBtn = newGameBtn.cloneNode(true);
    newGameBtn.parentNode.replaceChild(newNewGameBtn, newGameBtn);
    
    newNewGameBtn.addEventListener('click', async () => {
      if (await checkExistingSave()) {
        if (!confirm('⚠️ Начать новую игру? Весь текущий прогресс будет потерян!')) {
          return;
        }
      }
      startNewGame();
    });
  }
  
  // ===== КНОПКА "НАЗАД" =====
  if (backBtn) {
    const newBackBtn = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
    
    newBackBtn.addEventListener('click', () => {
      hideSaveSection();
    });
  }
}

/**
 * Настройка кнопки достижений в меню
 * 
 * @returns {void}
 */
function setupAchievementsMenuButton() {
  setTimeout(() => {
    const achievementsBtn = document.getElementById('achievements-menu-btn');
    if (achievementsBtn) {
      const newBtn = achievementsBtn.cloneNode(true);
      achievementsBtn.parentNode.replaceChild(newBtn, achievementsBtn);
      newBtn.addEventListener('click', openAchievementsWindow);
    }
  }, 100);
}

/**
 * Главная функция инициализации игры
 * 
 * @returns {Promise<void>}
 */
async function init() {
  showLoader('Загрузка игры...', '🔮', 'Подготовка к запуску...', 0);
  
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 90) progress = 90;
    updateLoader(null, null, null, Math.min(90, progress));
  }, 200);
  
  // Загрузка критических HTML-шаблонов (инкрементальная загрузка)
  updateLoader('Загрузка интерфейса...', '📄', 'Загрузка шаблонов...', 20);
  await loadEssentialTemplates();
  
  // Поиск холста
  updateLoader('Подготовка экрана...', '🎨', 'Инициализация графики...', 40);
  let canvas = document.getElementById('gameCanvas');
  let attempts = 0;
  while (!canvas && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 50));
    canvas = document.getElementById('gameCanvas');
    attempts++;
  }
  
  if (!canvas) {
    console.error('❌ Canvas не найден после загрузки шаблонов');
    hideLoader(0);
    return;
  }
  
  const ctx = canvas.getContext('2d');

  // Очистка кэшей
  clearAllCaches();

  // Инициализация аудио
  updateLoader('Загрузка музыки...', '🎵', 'Подготовка саундтрека...', 65);
  audio.init();
  audio.reset();

  audio.isMainMenu = true;
  audio.isGameActive = false;

  const settings = getSettings();
  
  if (settings.musicEnabled) {
    audio.forcePlayMusic('menu');
  } else {
    audio.setMusicMode('menu');
  }

  // Настройка холста
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  setSeed(null);

  updateLoader('Создание мира...', '🗺️', 'Генерация лабиринта...', 60);
  
  await new Promise(resolve => setTimeout(resolve, 300));

  // Инициализация всех систем
  Input.init();
  Game.init(ctx, canvas);
  initPauseMenu();
  setupStartScreenButtons();
  setupIntroScreen();

  // Инициализация достижений
  initAchievements();
  initAchievementsUI();
  setupAchievementsMenuButton();

  // Загрузка записок из хранилища
  const notesData = loadNotesFromStorage();
  if (notesData) {
    state.notes = {
      found: notesData.found || [],
      spawned: notesData.spawned || {},
      positions: notesData.positions || {}
    };
  } else {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  updateLoader('Завершение...', '✨', 'Подготовка к запуску...', 85);

  // Настройка финального экрана
  import('./game/finalScreen.js').then(module => {
    module.setupFinalScreenButtons();
  });

  // Блокировка масштабирования страницы
  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === '+' || key === '-' || key === '0' || key === '=') {
        e.preventDefault();
        return false;
      }
    }
  });

  clearInterval(progressInterval);
  updateLoader('Готово!', '✅', 'Добро пожаловать в Лабиритрию!', 100);
  
  setTimeout(() => {
    hideLoader(300);
  }, 500);
}

// ===== ЗАПУСК =====

/** @listens window#DOMContentLoaded */
window.addEventListener('DOMContentLoaded', init);

/** @type {Function} - Экспорт функции обновления информации о сохранении */
window.updateSaveInfoOnStartScreen = updateSaveInfoOnStartScreen;