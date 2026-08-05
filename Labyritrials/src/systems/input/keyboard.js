/**
 * @fileoverview Обработка ввода с клавиатуры.
 * Управляет всеми клавиатурными событиями: движение, взаимодействие,
 * открытие меню, запуск огненного шара, чтение записок.
 * 
 * @module systems/input/keyboard
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { logger } from '../../utils/logger.js';
import { audio } from '../../audio/audioManager.js';
import { Game } from '../../core/game.js';
import { getNoteById } from '../../data/notes.js';
import { shootFireball } from './fireball.js';
import { isPauseMenuOpen } from '../../game/pauseMenu.js';
import { isSettingsOpen } from '../ui/settings/index.js';
import { updateProgress } from '../../systems/achievements/index.js';
import { isAchievementsOpen } from '../../systems/achievements/ui.js';
import { openBookshelf } from '../ui/bookshelfUI.js';
import { isAnyModalOpen } from '../ui/modalManager.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';

/**
 * @namespace keyMap
 * @description Маппинг клавиш для русской раскладки
 * @private
 */
const keyMap = {
  'ц': 'w', 'ф': 'a', 'ы': 's', 'в': 'd',
  'Ц': 'w', 'Ф': 'a', 'Ы': 's', 'В': 'd',
  'у': 'e', 'У': 'e',
  'й': 'q', 'Й': 'q'
};

/**
 * Проверка, активна ли игра
 * 
 * @returns {boolean} - true, если игра активна и не заблокирована модальными окнами
 * @private
 */
function isGameActive() {
  const gameUI = document.getElementById('ui');
  if (!gameUI || gameUI.style.display === 'none') return false;

  const levelUpUI = document.getElementById('level-up-ui');
  const gameOverUI = document.getElementById('game-over-ui');
  const finalScreenUI = document.getElementById('final-screen-ui');
  const startScreenUI = document.getElementById('start-screen-ui');

  if (levelUpUI?.style.display === 'block') return false;
  if (gameOverUI?.style.display === 'block') return false;
  if (finalScreenUI?.style.display === 'flex') return false;
  if (startScreenUI?.style.display === 'flex') return false;

  if (player.hp <= 0) return false;

  return true;
}

/**
 * Проверка, открыто ли модальное окно
 * 
 * @returns {boolean} - true, если открыты настройки или достижения
 * @private
 */
function isModalOpen() {
  return isSettingsOpen() || isAchievementsOpen();
}

/**
 * Обработка нажатия клавиши
 * 
 * @param {KeyboardEvent} e - Событие клавиатуры
 * @returns {void}
 */
export function handleKeyDown(e) {
  // Если открыто любое модальное окно — блокируем все клавиши
  if (isAnyModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (!e.key) return;

  if (isModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (isPauseMenuOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // ===== ESCAPE: закрытие модальных окон и открытие паузы =====
  if (e.key === 'Escape') {
    e.preventDefault();

    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && settingsModal.style.display === 'flex') {
      settingsModal.style.display = 'none';
      return;
    }

    const levelUpUI = document.getElementById('level-up-ui');
    const gameOverUI = document.getElementById('game-over-ui');
    if (levelUpUI?.style.display === 'block' || gameOverUI?.style.display === 'block') {
      return;
    }

    if (player.hp <= 0) return;

    if (isGameActive()) {
      import('../../game/pauseMenu.js').then(module => {
        module.openPauseMenu();
      });
    }
    return;
  }

  // ===== ДВИЖЕНИЕ И ВЗАИМОДЕЙСТВИЕ =====
  let k = e.key.toLowerCase();
  let mappedKey = keyMap[k] || k;
  state.keys[mappedKey] = true;

  // Клавиша E: взаимодействие
  if (mappedKey === 'e') {
    if (state.isBossLevel) return;

    if (isNearBookshelf()) {
      e.preventDefault();
      openBookshelf();
      return;
    }

    if (state.showNotePrompt && state.notePromptId) {
      e.preventDefault();
      openNoteWindow(state.notePromptId);
      return;
    }

    handleShopToggle();
  }
}

/**
 * Обработка отпускания клавиши
 * 
 * @param {KeyboardEvent} e - Событие клавиатуры
 * @returns {void}
 */
export function handleKeyUp(e) {
  // Если открыто любое модальное окно — блокируем все клавиши
  if (isAnyModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (!e.key) return;

  if (isModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (isPauseMenuOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  let k = e.key.toLowerCase();
  let mappedKey = keyMap[k] || k;
  state.keys[mappedKey] = false;
}

/**
 * Открытие/закрытие магазина
 * 
 * @returns {Promise<void>}
 * @private
 */
async function handleShopToggle() {
  if (CONFIG.shopPos.x < 0 || CONFIG.shopPos.y < 0) return;

  let distToShop = Math.hypot(
    player.px - (CONFIG.shopPos.x * CONFIG.cellSize + CONFIG.cellSize / 2),
    player.py - (CONFIG.shopPos.y * CONFIG.cellSize + CONFIG.cellSize / 2)
  );

  if (distToShop < CONFIG.cellSize) {
    // ===== ЗАГРУЗКА ШАБЛОНА МАГАЗИНА (ЕСЛИ НУЖНО) =====
    if (!isTemplateLoaded('shop')) {
      await loadTemplateIfNeeded('shop');
    }

    // ===== ИМПОРТ МОДУЛЯ МАГАЗИНА =====
    const shopModule = await import('../ui/shop/index.js');
    
    // ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ =====
    if (shopModule.initShopHandlers) {
      shopModule.initShopHandlers();
    }

    state.isShopOpen = !state.isShopOpen;
    const shopUI = document.getElementById('shop-ui');
    if (shopUI) shopUI.style.display = state.isShopOpen ? 'block' : 'none';

    if (state.isShopOpen) {
      // Регистрируем открытие модального окна
      const { registerModalOpen } = await import('../ui/modalManager.js');
      registerModalOpen('shop');
      
      // Обновляем UI магазина (включая изображения)
      if (shopModule.updateShopUIForExternal) {
        setTimeout(shopModule.updateShopUIForExternal, 50);
      }
      Game.pauseTime();
      audio.pause();
      audio.isGameActive = false;
    } else {
      const { registerModalClose } = await import('../ui/modalManager.js');
      registerModalClose('shop');
      
      Game.resumeTime();
      audio.isGameActive = true;
      audio.resume();
    }

    if (state.isShopOpen) {
      Game.updateUI();
    }
  }
}

/**
 * Проверка, находится ли игрок на клетке с полками с книгами
 * 
 * @returns {boolean} - true, если игрок рядом с полками
 * @private
 */
function isNearBookshelf() {
  if (!state.bookshelves || state.bookshelves.length === 0) return false;
  
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  
  for (const shelf of state.bookshelves) {
    const dist = Math.hypot(playerGridX - shelf.x, playerGridY - shelf.y);
    if (dist <= 0.6) {
      return true;
    }
  }
  return false;
}

/**
 * Инициализация обработчиков клавиатуры
 * 
 * @returns {void}
 */
export function initKeyboardHandlers() {
  window.addEventListener('keydown', e => {
    if (isAnyModalOpen()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isModalOpen()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isPauseMenuOpen()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    let k = e.key.toLowerCase();
    let mappedKey = keyMap[k] || k;

    if (mappedKey === 'q') {
      e.preventDefault();
      shootFireball();
    }
  });

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

/**
 * Сброс состояния всех клавиш
 * 
 * @returns {void}
 */
export function resetAllKeys() {
  if (!state.keys) return;

  for (const key in state.keys) {
    state.keys[key] = false;
  }

  state.keys['mouse0'] = false;

  if (player) {
    player.isCharging = false;
    player.chargeTime = 0;
    player.isAttacking = false;
    player.attackTimer = 0;
    player.attackExecuted = false;
  }
}

/**
 * Открытие окна с запиской
 * 
 * @param {number} noteId - ID записки
 * @returns {Promise<void>}
 */
export async function openNoteWindow(noteId) {
  const note = getNoteById(noteId);
  if (!note) {
    logger.warn(`📜 Записка #${noteId} не найдена!`);
    return;
  }

  // Регистрируем открытие модального окна
  const { registerModalOpen } = await import('../ui/modalManager.js');
  registerModalOpen('note');

  if (!isTemplateLoaded('noteWindow')) {
    await loadTemplateIfNeeded('noteWindow');
  }

  if (!state.notes.found.includes(noteId)) {
    state.notes.found.push(noteId);
    updateProgress('notes_found', 1);
  }

  if (state.notes.positions && state.notes.positions[noteId]) {
    delete state.notes.positions[noteId];
  }

  if (state.notePromptX !== null && state.notePromptY !== null) {
    const cell = state.grid[state.notePromptY]?.[state.notePromptX];
    if (cell) {
      cell.hasNote = false;
      cell.noteId = null;
    }
  }

  state.showNotePrompt = false;
  state.notePromptId = null;
  state.notePromptX = null;
  state.notePromptY = null;

  showNoteWindow(note);

  import('../../save/saveSystem.js').then(({ saveGame }) => {
    saveGame();
  });
}

/**
 * Показ окна с запиской
 * 
 * @param {Object} note - Объект записки
 * @returns {void}
 * @private
 */
function showNoteWindow(note) {
  const window = document.getElementById('note-reader');
  if (!window) {
    logger.warn('❌ Окно note-reader не найдено в DOM!');
    return;
  }

  const titleEl = document.getElementById('note-reader-title');
  const textEl = document.getElementById('note-reader-text');
  const countEl = document.getElementById('note-reader-count');

  if (titleEl) titleEl.textContent = note.title || `Записка #${note.id}`;
  if (textEl) {
    const formattedText = (note.text || 'Текст записки отсутствует...')
      .replace(/\n/g, '<br>');
    textEl.innerHTML = formattedText;
  }
  if (countEl) countEl.textContent = `${state.notes.found.length}/12`;

  pauseGameForNote();

  window.style.display = 'flex';
}

/**
 * Пауза игры при открытии записки
 * 
 * @returns {void}
 */
export function pauseGameForNote() {
  Game.stopLoop();
  Game.pauseTime();
  audio.pause();
  audio.isGameActive = false;

  const ui = document.getElementById('ui');
  if (ui) ui.style.display = 'none';

  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
}

/**
 * Закрытие окна с запиской
 * 
 * @returns {Promise<void>}
 */
export async function closeNoteWindow() {
  const window = document.getElementById('note-reader');
  if (window) {
    window.style.display = 'none';
  }

  // Регистрируем закрытие модального окна
  const { registerModalClose } = await import('../ui/modalManager.js');
  registerModalClose('note');

  resumeGameAfterNote();
}

/**
 * Возобновление игры после закрытия записки
 * 
 * @returns {void}
 * @private
 */
function resumeGameAfterNote() {
  audio.isGameActive = true;
  audio.resume();
  Game.resumeTime();

  const ui = document.getElementById('ui');
  if (ui) ui.style.display = 'block';

  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';

  Game.startLoop();
}