/**
 * @fileoverview Меню паузы.
 * Управляет открытием/закрытием меню паузы, сохранением игры и выходом в главное меню.
 * 
 * @module game/pauseMenu
 */

import { Game } from '../core/game.js';
import { state, player } from '../core/config/index.js';
import { formatPlayTime } from '../save/timeFormatter.js';
import { openAchievementsWindow } from '../systems/achievements/index.js';
import { audio } from '../audio/audioManager.js';
import { exitToMainMenu } from '../utils/exitToMainMenu.js';
import { resetAllKeys } from '../systems/input/index.js';

/** @type {boolean} - Открыто ли меню паузы */
let isPaused = false;
/** @type {HTMLElement|null} - Кнопка возобновления */
let resumeBtn = null;
/** @type {HTMLElement|null} - Кнопка сохранения */
let saveBtn = null;
/** @type {HTMLElement|null} - Кнопка достижений */
let achievementsBtn = null;
/** @type {HTMLElement|null} - Кнопка выхода */
let exitBtn = null;

/**
 * Обновление статистики в меню паузы
 * 
 * @returns {void}
 */
function updatePauseStats() {
  document.getElementById('pause-level').textContent = state.gameLevel;
  document.getElementById('pause-hp').textContent = Math.floor(player.hp);
  document.getElementById('pause-maxhp').textContent = player.maxHp;
  document.getElementById('pause-gold').textContent = player.gold;
  document.getElementById('pause-damage').textContent = player.baseDamage;
  
  const playTime = state.gameStats?.playTime || 0;
  document.getElementById('pause-time').textContent = formatPlayTime(playTime);
}

/**
 * Открытие меню паузы
 * 
 * @returns {void}
 */
export function openPauseMenu() {
  if (isPaused) return;
  if (state.isShopOpen) return;
  if (player.hp <= 0) return;

  const gameUI = document.getElementById('ui');
  if (!gameUI || gameUI.style.display === 'none') return;
  
  const pauseMenu = document.getElementById('pause-menu');
  if (!pauseMenu) return;
  
  isPaused = true;
  
  Game.stopLoop();
  updatePauseStats();
  pauseMenu.style.display = 'flex';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  audio.pause();
  audio.isGameActive = false;
}

/**
 * Закрытие меню паузы
 * 
 * @returns {void}
 */
export function closePauseMenu() {
  if (!isPaused) return;
  const pauseMenu = document.getElementById('pause-menu');
  if (!pauseMenu) return;
  
  isPaused = false;
  pauseMenu.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';
  
  Game.startLoop();
  
  audio.isGameActive = true;
  audio.resume();
}

/**
 * Сохранение игры из меню паузы
 * 
 * @returns {Promise<void>}
 * @private
 */
async function saveGameFromPause() {
  const saveBtn = document.getElementById('pause-save-btn');
  const originalText = saveBtn.textContent;
  
  try {
    saveBtn.textContent = '⏳ Сохранение...';
    saveBtn.disabled = true;
    
    const { saveGame } = await import('../save/saveSystem.js');
    saveGame();
    
    saveBtn.textContent = '✅ Сохранено!';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    saveBtn.textContent = '❌ Ошибка!';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  }
}

/**
 * Обработка выхода в главное меню из паузы
 * 
 * @returns {void}
 * @private
 */
function handleExitToMainMenu() {
  // ===== ЗАКРЫТИЕ ПАУЗЫ =====
  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) pauseMenu.style.display = 'none';
  
  isPaused = false;
  
  // ===== ОЧИСТКА КЛАВИШ =====
  resetAllKeys();
  
  // ===== ПОКАЗ UI =====
  const ui = document.getElementById('ui');
  if (ui) ui.style.display = 'block';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';
  
  // ===== ЗАПУСК ИГРОВОГО ЦИКЛА =====
  Game.startLoop();
  
  // ===== ВОЗОБНОВЛЕНИЕ МУЗЫКИ =====
  audio.isGameActive = true;
  audio.resume();
  
  // ===== ВЫЗОВ ВЫХОДА В МЕНЮ =====
  const result = exitToMainMenu();
}

/**
 * Инициализация меню паузы
 * 
 * @returns {void}
 */
export function initPauseMenu() {
  resumeBtn = document.getElementById('pause-resume-btn');
  saveBtn = document.getElementById('pause-save-btn');
  achievementsBtn = document.getElementById('pause-achievements-btn');
  exitBtn = document.getElementById('pause-exit-btn');
  
  // ===== КНОПКА "ПРОДОЛЖИТЬ" =====
  if (resumeBtn) {
    const newResumeBtn = resumeBtn.cloneNode(true);
    resumeBtn.parentNode.replaceChild(newResumeBtn, resumeBtn);
    newResumeBtn.addEventListener('click', closePauseMenu);
    resumeBtn = newResumeBtn;
  }
  
  // ===== КНОПКА "СОХРАНИТЬ" =====
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.addEventListener('click', saveGameFromPause);
    saveBtn = newSaveBtn;
  }
  
  // ===== КНОПКА "ВЫЙТИ" =====
  if (exitBtn) {
    const newExitBtn = exitBtn.cloneNode(true);
    exitBtn.parentNode.replaceChild(newExitBtn, exitBtn);
    newExitBtn.addEventListener('click', handleExitToMainMenu);
    exitBtn = newExitBtn;
  }

  // ===== КНОПКА "ДОСТИЖЕНИЯ" =====
  if (achievementsBtn) {
    const newAchievementsBtn = achievementsBtn.cloneNode(true);
    achievementsBtn.parentNode.replaceChild(newAchievementsBtn, achievementsBtn);
    newAchievementsBtn.addEventListener('click', () => {
      closePauseMenu();
      setTimeout(openAchievementsWindow, 100);
    });
    achievementsBtn = newAchievementsBtn;
  }
}

/**
 * Проверка, открыто ли меню паузы
 * 
 * @returns {boolean} - true, если меню паузы открыто
 */
export function isPauseMenuOpen() {
  return isPaused;
}