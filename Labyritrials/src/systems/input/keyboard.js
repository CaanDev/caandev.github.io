/**
 * @fileoverview Обработка ввода с клавиатуры.
 * Управляет всеми клавиатурными событиями: движение, взаимодействие,
 * открытие меню, запуск огненного шара, чтение записок.
 * 
 * @module systems/input/keyboard
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { audio } from '../../audio/audioManager.js';
import { Game } from '../../core/game.js';
import { getNoteById } from '../../data/notes.js';
import { shootFireball } from './fireball.js';
import { isPauseMenuOpen } from '../../game/pauseMenu.js';
import { updateProgress } from '../achievements/index.js';
import { openBookshelf } from '../ui/bookshelfUI.js';
import { isAnyModalOpen } from '../ui/modalManager.js';
import { loadTemplateIfNeeded, isTemplateLoaded } from '../../utils/htmlLoader.js';
import { summonWisps } from '../../entities/objects/willOTheWisps/index.js';

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
 * Обработка нажатия клавиши
 * 
 * @param {KeyboardEvent} e - Событие клавиатуры
 * @returns {void}
 */
export function handleKeyDown(e) {
  // Если открыто любое модальное окно - блокировка всех клавиш
  // (включая Escape - модалки закрываются только через кнопку)
  if (isAnyModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (!e.key) return;

  // Если открыта пауза - блокировка всех клавиш
  // (Escape в паузе ничего не делает, только кнопка "Продолжить")
  if (isPauseMenuOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // Escape: открытие паузы (только если игра активна)
  if (e.key === 'Escape') {
    e.preventDefault();

    // Если открыт экран перехода уровня или смерти - игнорируется
    const levelUpUI = document.getElementById('level-up-ui');
    const gameOverUI = document.getElementById('game-over-ui');
    if (levelUpUI?.style.display === 'block' || gameOverUI?.style.display === 'block') return;
    // Если игрок мёртв - игнорируется
    if (player.hp <= 0) return;

    // Если игра активна - открывает паузу
    if (isGameActive()) {
      import('../../game/pauseMenu.js').then(module => {
        module.openPauseMenu();
      });
    }
    return;
  }

  // Движение и взаимодействие
  let k = e.key.toLowerCase();
  let mappedKey = keyMap[k] || k;
  state.keys[mappedKey] = true;

  // Клавиша E: взаимодействие
  if (mappedKey === 'e') {
    e.preventDefault();
    
    // На босс-уровне разрешён только призыв огоньков
    if (state.isBossLevel) {
      summonWisps();
      return;
    }
    
    // Обработка через менеджер взаимодействий
    import('../../entities/player/interactions/index.js').then(module => {
      module.handleInteraction().then(handled => {
        // Если ничего не обработано - призыв огоньков
        if (!handled) summonWisps();
      });
    });
  }
}

/**
 * Обработка отпускания клавиши
 * 
 * @param {KeyboardEvent} e - Событие клавиатуры
 * @returns {void}
 */
export function handleKeyUp(e) {
  // Если открыто любое модальное окно - блокировка всех клавиш
  if (isAnyModalOpen()) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (!e.key) return;

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

    if (isPauseMenuOpen()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    let k = e.key.toLowerCase();
    let mappedKey = keyMap[k] || k;

    // Q - огненный шар (обрабатывается отдельно от handleKeyDown)
    if (mappedKey === 'q') {
      e.preventDefault();
      shootFireball();
      return;
    }

    // Всё остальное - в основной обработчик
    handleKeyDown(e);
  });

  window.addEventListener('keyup', handleKeyUp);
}

/**
 * Сброс состояния всех клавиш
 * 
 * @returns {void}
 */
export function resetAllKeys() {
  if (!state.keys) return;
  for (const key in state.keys) state.keys[key] = false;
  state.keys['mouse0'] = false;

  if (player) {
    player.isCharging = false;
    player.chargeTime = 0;
    player.isAttacking = false;
    player.attackTimer = 0;
    player.attackExecuted = false;
    player.isMoving = false;
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
  if (!note) return;

  // Принудительная остановка сердцебиения
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });

  // Воспроизведение звука чтения записки
  audio.playSound('interactions.noteRead');

  // Регистрирация открытия модального окна
  const { registerModalOpen } = await import('../ui/modalManager.js');
  registerModalOpen('note');

  if (!isTemplateLoaded('noteWindow')) await loadTemplateIfNeeded('noteWindow');

  if (!state.notes.found.includes(noteId)) {
    state.notes.found.push(noteId);
    updateProgress('notes_found', 1);
  }

  if (state.notes.positions && state.notes.positions[noteId]) delete state.notes.positions[noteId];

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
  const noteReaderEl = document.getElementById('note-reader');
  if (!noteReaderEl) {
    logger.warn('❌ Окно note-reader не найдено в DOM!');
    return;
  }

  const titleEl = document.getElementById('note-reader-title');
  const textEl = document.getElementById('note-reader-text');
  const countEl = document.getElementById('note-reader-count');

  if (titleEl) titleEl.textContent = note.title || `Записка #${note.id}`;
  if (textEl) {
    const formattedText = (note.text || 'Текст записки отсутствует...').replace(/\n/g, '<br>');
    textEl.innerHTML = formattedText;
  }
  if (countEl) countEl.textContent = `${state.notes.found.length}/12`;

  pauseGameForNote();
  noteReaderEl.style.display = 'flex';
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
  audio.setGameState(false);

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
  const noteReaderEl = document.getElementById('note-reader');
  if (noteReaderEl) noteReaderEl.style.display = 'none';

  // Регистрация закрытия модального окна
  const { registerModalClose } = await import('../ui/modalManager.js');
  registerModalClose('note');

  // Если остались другие открытые модальные окна - игра остаётся на паузе, возобновление не выполняется.
  if (isAnyModalOpen()) return;
  resumeGameAfterNote();
}

/**
 * Возобновление игры после закрытия записки
 * 
 * @returns {void}
 * @private
 */
function resumeGameAfterNote() {
  audio.setGameState(true);
  audio.resume();
  Game.resumeTime();

  const ui = document.getElementById('ui');
  if (ui) ui.style.display = 'block';
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';

  Game.startLoop();
}