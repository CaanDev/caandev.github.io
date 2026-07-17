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
import { getAllNotes, getNoteById } from '../../data/notes.js';

/** @type {boolean} - Открыта ли библиотека */
let bookshelfOpen = false;

/**
 * Открытие библиотеки
 * 
 * Приостанавливает игру, скрывает игровой UI и отображает окно библиотеки
 * со списком всех записок.
 * 
 * @returns {void}
 */
export function openBookshelf() {
  if (bookshelfOpen) return;
  
  const ui = document.getElementById('bookshelf-ui');
  if (!ui) {
    console.warn('❌ bookshelf-ui не найдено в DOM!');
    return;
  }
  
  bookshelfOpen = true;
  
  // ===== ПАУЗА ИГРЫ =====
  Game.stopLoop();
  Game.pauseTime();
  audio.pause();
  audio.isGameActive = false;
  
  // ===== СКРЫТИЕ UI =====
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  // ===== ОТОБРАЖЕНИЕ БИБЛИОТЕКИ =====
  renderBookshelf();
  ui.style.display = 'flex';
  
  // ===== НАСТРОЙКА КНОПКИ ЗАКРЫТИЯ =====
  const closeBtn = document.getElementById('bookshelf-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeBookshelf);
  }
}

/**
 * Закрытие библиотеки
 * 
 * Скрывает окно библиотеки и возобновляет игру.
 * 
 * @returns {void}
 */
export function closeBookshelf() {
  const ui = document.getElementById('bookshelf-ui');
  if (ui) {
    ui.style.display = 'none';
  }
  
  bookshelfOpen = false;
  
  // ===== ВОЗОБНОВЛЕНИЕ ИГРЫ =====
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
 * Отображает все записки с указанием уровня и статуса (найдена/не найдена).
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
  
  // Обновляем статистику
  if (foundCountEl) foundCountEl.textContent = foundNotes.length;
  if (totalCountEl) totalCountEl.textContent = allNotes.length;
  
  // Сортировка записок по уровню, затем по ID
  const sortedNotes = [...allNotes].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.id - b.id;
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
    console.warn(`📜 Записка #${noteId} не найдена!`);
    return;
  }
  
  // Проверяем, найдена ли записка
  const foundNotes = state.notes.found || [];
  if (!foundNotes.includes(noteId)) {
    console.warn(`📜 Записка #${noteId} ещё не найдена!`);
    return;
  }
  
  // Закрываем библиотеку
  closeBookshelf();
  
  // Открываем окно с запиской (с задержкой для плавности)
  setTimeout(() => {
    import('../input/keyboard.js').then(module => {
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
      
      noteWindow.style.display = 'flex';
      
      const closeBtn = document.getElementById('note-reader-close');
      if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', () => {
          module.closeNoteWindow();
        });
      }
    });
  }, 200);
};