/**
 * @fileoverview UI библиотеки (книжные полки).
 * Управляет открытием и закрытием окна библиотеки,
 * отображением списка найденных записок и чтением записок.
 * 
 * @module systems/ui/bookshelfUI
 */

import { state } from '../../core/config/index.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { logger } from '../../utils/logger.js';
import { getAllNotes, getNoteById } from '../../data/notes.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';

/** @type {boolean} - Открыта ли библиотека */
let bookshelfOpen = false;

/**
 * Инициализация обработчиков библиотеки
 * 
 * @returns {void}
 */
export function initBookshelfHandlers() {
  const closeBtn = document.getElementById('bookshelf-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeBookshelf);
  }
}

/**
 * Внутренняя функция открытия библиотеки (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function doOpenBookshelf() {
  const ui = document.getElementById('bookshelf-ui');
  if (!ui) {
    logger.warn('❌ bookshelf-ui не найдено в DOM!');
    return;
  }
  
  bookshelfOpen = true;
  
  Game.stopLoop();
  Game.pauseTime();
  audio.pause();
  audio.isGameActive = false;
  registerModalOpen('bookshelf');
  
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  renderBookshelf();
  ui.style.display = 'flex';
}

/**
 * Открытие библиотеки
 * 
 * @returns {void}
 */
export function openBookshelf() {
  if (bookshelfOpen) return;
  
  if (!isTemplateLoaded('bookshelf')) {
    loadTemplateIfNeeded('bookshelf').then(() => {
      initTemplateHandlers('bookshelf').then(() => {
        doOpenBookshelf();
      });
    });
    return;
  }
  
  if (!isTemplateInitialized('bookshelf')) {
    initTemplateHandlers('bookshelf').then(() => {
      doOpenBookshelf();
    });
    return;
  }
  
  doOpenBookshelf();
}

/**
 * Закрытие библиотеки
 * 
 * @returns {void}
 */
export function closeBookshelf() {
  const ui = document.getElementById('bookshelf-ui');
  if (ui) {
    ui.style.display = 'none';
  }
  
  bookshelfOpen = false;
  registerModalClose('bookshelf');
  
  audio.isGameActive = true;
  audio.resume();
  Game.resumeTime();
  
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'block';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';
  
  Game.startLoop();
}

/**
 * Проверка, открыта ли библиотека
 * 
 * @returns {boolean} - true, если библиотека открыта
 */
export function isBookshelfOpen() {
  return bookshelfOpen;
}

/**
 * Рендер списка записок в библиотеке
 * 
 * @returns {void}
 * @private
 */
function renderBookshelf() {
  const container = document.getElementById('bookshelf-list');
  const foundCountEl = document.getElementById('bookshelf-found-count');
  const totalCountEl = document.getElementById('bookshelf-total-count');
  
  if (!container) return;
  
  const allNotes = getAllNotes();
  const foundNotes = state.notes.found || [];
  
  if (foundCountEl) foundCountEl.textContent = foundNotes.length;
  if (totalCountEl) totalCountEl.textContent = allNotes.length;
  
  const sortedNotes = [...allNotes].sort((a, b) => {
    const aFound = foundNotes.includes(a.id);
    const bFound = foundNotes.includes(b.id);
    
    if (aFound && !bFound) return -1;
    if (!aFound && bFound) return 1;
    
    if (aFound && bFound) {
      const aIndex = foundNotes.indexOf(a.id);
      const bIndex = foundNotes.indexOf(b.id);
      return bIndex - aIndex;
    }
    
    return a.level - b.level;
  });
  
  let html = '';
  
  for (const note of sortedNotes) {
    const isFound = foundNotes.includes(note.id);
    const level = note.level;
    
    let icon = '📖';
    let title = note.title;
    let statusIcon = '';
    let className = 'bookshelf-item';
    let clickHandler = '';
    
    if (isFound) {
      className += ' found';
      clickHandler = `onclick="window.openNoteFromBookshelf(${note.id})"`;
    } else {
      className += ' locked';
      icon = '❓';
      title = '???';
      statusIcon = '🔒';
      clickHandler = '';
    }
    
    html += `
      <div class="${className}" ${clickHandler} data-note-id="${note.id}">
        <span class="bookshelf-icon">${icon}</span>
        <div class="bookshelf-info">
          <div class="bookshelf-title">${title}</div>
        </div>
        <span class="bookshelf-level">Ур. ${level}</span>
        <span class="bookshelf-status">${statusIcon}</span>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

/**
 * Открытие записки из библиотеки (глобальная функция для onclick)
 * 
 * @param {number} noteId - ID записки
 * @returns {void}
 */
window.openNoteFromBookshelf = function(noteId) {
  const note = getNoteById(noteId);
  if (!note) {
    logger.warn(`📜 Записка #${noteId} не найдена!`);
    return;
  }
  
  const foundNotes = state.notes.found || [];
  if (!foundNotes.includes(noteId)) {
    logger.warn(`📜 Записка #${noteId} ещё не найдена!`);
    return;
  }
  
  closeBookshelf();
  
  setTimeout(() => {
    import('../input/keyboard.js').then(module => {
      if (!isTemplateLoaded('noteWindow')) {
        loadTemplateIfNeeded('noteWindow').then(() => {
          initTemplateHandlers('noteWindow').then(() => {
            showNoteFromBookshelf(note, foundNotes, module);
          });
        });
        return;
      }
      
      if (!isTemplateInitialized('noteWindow')) {
        initTemplateHandlers('noteWindow').then(() => {
          showNoteFromBookshelf(note, foundNotes, module);
        });
        return;
      }
      
      showNoteFromBookshelf(note, foundNotes, module);
    });
  }, 200);
};

/**
 * Показ записки из библиотеки
 * 
 * @param {Object} note - Объект записки
 * @param {number[]} foundNotes - Массив найденных записок
 * @param {Object} module - Модуль keyboard
 * @returns {void}
 * @private
 */
function showNoteFromBookshelf(note, foundNotes, module) {
  const noteWindow = document.getElementById('note-reader');
  if (!noteWindow) return;
  
  const titleEl = document.getElementById('note-reader-title');
  const textEl = document.getElementById('note-reader-text');
  const countEl = document.getElementById('note-reader-count');
  
  if (titleEl) titleEl.textContent = note.title || `Записка #${note.id}`;
  if (textEl) {
    const formattedText = (note.text || 'Текст записки отсутствует...')
      .replace(/\n/g, '<br>');
    textEl.innerHTML = formattedText;
  }
  if (countEl) countEl.textContent = `${foundNotes.length}/12`;
  
  module.pauseGameForNote();
  registerModalOpen('note');
  
  noteWindow.style.display = 'flex';
}