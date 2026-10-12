/**
 * @fileoverview Контроллер диалогового окна с NPC.
 * Управляет открытием, отображением строк и закрытием диалога.
 * 
 * @module systems/dialogs/dialogManager
 */

import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { registerModalOpen, registerModalClose } from '../ui/modalManager.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';

/** @type {boolean} - Открыто ли окно диалога */
let isDialogOpen = false;

/** @type {Array<string>} - Текущие строки диалога */
let currentLines = [];

/** @type {number} - Текущий индекс строки */
let currentLineIndex = 0;

/** @type {Function|null} - Колбэк после завершения диалога */
let onCompleteCallback = null;

/** @type {Function|null} - Резолвер промиса (для await) */
let resolvePromise = null;

/** @type {boolean} - Режим выбора (true — кнопки Да/Нет) */
let isChoiceMode = false;

/** @type {number|null} - ID таймера anti-spam блокировки */
let blockTimer = null;

/** @type {number} - Задержка anti-spam (мс) */
const ANTI_SPAM_DELAY = 300;

/**
 * Внутренняя функция открытия диалога (после загрузки шаблона)
 * 
 * @param {Object} config - Конфигурация диалога
 * @param {string} config.speaker - Имя NPC
 * @param {Array<string>} config.lines - Массив строк
 * @param {boolean} [config.isChoice=false] - Режим выбора
 * @param {string} [config.yesText] - Текст кнопки "Да"
 * @param {string} [config.noText] - Текст кнопки "Нет"
 * @param {Function} [config.onComplete] - Колбэк после завершения
 * @returns {Promise<boolean>} - true для обычного диалога, результат выбора для choice
 * @private
 */
async function doOpenDialog(config) {
  const {
    speaker = 'Неизвестный',
    lines = [],
    isChoice = false,
    yesText = 'Принять',
    noText = 'Отказаться',
    onComplete = null,
  } = config;

  const popup = document.getElementById('dialog-ui');
  if (!popup) {
    console.error('❌ Окно dialog-ui не найдено в DOM!');
    return false;
  }

  // Сохранение состояния
  isDialogOpen = true;
  isChoiceMode = isChoice;
  currentLines = lines;
  currentLineIndex = 0;
  onCompleteCallback = onComplete;

  // Принудительная остановка сердцебиения
  audio.sound.stopLowHPSound();

  // Установка имени NPC
  const speakerEl = document.getElementById('dialog-speaker-name');
  if (speakerEl) speakerEl.textContent = speaker;

  // Настройка кнопок (текст)
  const yesBtn = document.getElementById('dialog-choice-yes');
  const noBtn = document.getElementById('dialog-choice-no');
  if (yesBtn) yesBtn.textContent = yesText;
  if (noBtn) noBtn.textContent = noText;

  // Изначально показываются кнопки (Продолжить или Да/Нет)
  // в зависимости от того, сколько строк и в каком режиме открыт диалог
  updateFooterButtons();

  // Показ окна
  popup.style.display = 'flex';
  registerModalOpen('dialog');

  // Остановка игрового цикла
  Game.pauseTime();
  audio.setGameState(false);
  audio.pause();
  if (Game.isRunning) Game.stopLoop();

  // Отображение первой строки
  displayCurrentLine();

  // Настройка обработчиков
  setupHandlers();

  // Возврат промиса
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

/**
 * Обновление видимости кнопок в футере диалога.
 * 
 * @returns {void}
 * @private
 */
function updateFooterButtons() {
  const continueWrapper = document.getElementById('dialog-continue-wrapper');
  const choiceWrapper = document.getElementById('dialog-choice-wrapper');

  if (!continueWrapper || !choiceWrapper) return;

  // Проверка: последняя ли это строка
  const isAtLastLine = currentLineIndex >= currentLines.length - 1;
  // Выбор отображается только если режим выбора и последняя строка
  const shouldShowChoice = isChoiceMode && isAtLastLine;

  if (shouldShowChoice) {
    continueWrapper.style.display = 'none';
    choiceWrapper.style.display = 'flex';
  } else {
    continueWrapper.style.display = 'flex';
    choiceWrapper.style.display = 'none';
  }
}

/**
 * Отображение текущей строки диалога
 * 
 * @returns {void}
 * @private
 */
function displayCurrentLine() {
  const textEl = document.getElementById('dialog-text');
  if (!textEl) return;

  const line = currentLines[currentLineIndex] || '';
  textEl.innerHTML = line;

  // Обновление кнопок в зависимости от текущей строки
  updateFooterButtons();

  // Anti-spam: блокировка кнопок на 300 мс
  const footer = document.getElementById('dialog-footer');
  if (footer) {
    footer.classList.add('locked');
    if (blockTimer) clearTimeout(blockTimer);
    blockTimer = setTimeout(() => {
      footer.classList.remove('locked');
      blockTimer = null;
    }, ANTI_SPAM_DELAY);
  }
}

/**
 * Переход к следующей строке
 * 
 * @returns {void}
 * @private
 */
function nextLine() {
  // Anti-spam
  const footer = document.getElementById('dialog-footer');
  if (footer && footer.classList.contains('locked')) return;

  // Если это режим выбора и игрок на последней строке - кнопки Да/Нет уже показаны.
  // Кнопка "Продолжить" не должна ничего делать.
  if (isChoiceMode && currentLineIndex >= currentLines.length - 1) return;

  currentLineIndex++;

  // Если строки закончились - закрытие окна
  if (currentLineIndex >= currentLines.length) {
    closeDialog(true);
    return;
  }

  displayCurrentLine();
}

/**
 * Настройка обработчиков кнопок и клавиатуры
 * 
 * @returns {void}
 * @private
 */
function setupHandlers() {
  // Кнопка "Продолжить"
  const continueBtn = document.getElementById('dialog-continue-btn');
  if (continueBtn) {
    const newBtn = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(newBtn, continueBtn);
    newBtn.addEventListener('click', nextLine);
  }

  // Кнопка "Принять"
  const yesBtn = document.getElementById('dialog-choice-yes');
  if (yesBtn) {
    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    newYes.addEventListener('click', () => {
      if (document.getElementById('dialog-footer')?.classList.contains('locked')) return;
      closeDialog(true);
    });
  }

  // Кнопка "Отказаться"
  const noBtn = document.getElementById('dialog-choice-no');
  if (noBtn) {
    const newNo = noBtn.cloneNode(true);
    noBtn.parentNode.replaceChild(newNo, noBtn);
    newNo.addEventListener('click', () => {
      if (document.getElementById('dialog-footer')?.classList.contains('locked')) return;
      closeDialog(false);
    });
  }

  // Клавиатура
  const keyHandler = (e) => {
    // Space - листает диалог вперёд
    if (e.key === ' ') {
      e.preventDefault();
      nextLine();
      return;
    }

    // Escape - закрывает диалог только в обычном режиме (без выбора)
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isChoiceMode) return;
      closeDialog(false);
      return;
    }
  };

  document.addEventListener('keydown', keyHandler);
  // Сохраняется для очистки
  const popup = document.getElementById('dialog-ui');
  if (popup) popup._keyHandler = keyHandler;
}

/**
 * Закрытие окна диалога
 * 
 * @param {boolean} result - Результат (true — завершено, false — прервано)
 * @returns {void}
 * @private
 */
function closeDialog(result) {
  const popup = document.getElementById('dialog-ui');
  if (!popup) return;

  // Очистка таймера
  if (blockTimer) {
    clearTimeout(blockTimer);
    blockTimer = null;
  }

  // Очистка клавиатуры
  if (popup._keyHandler) {
    document.removeEventListener('keydown', popup._keyHandler);
    popup._keyHandler = null;
  }

  // Скрытие окна
  popup.style.display = 'none';
  registerModalClose('dialog');

  // Сброс состояния
  isDialogOpen = false;
  isChoiceMode = false;

  // Колбэк завершения
  if (onCompleteCallback) {
    try {
      onCompleteCallback(result);
    } catch (err) {
      console.error('Ошибка в onComplete диалога:', err);
    }
    onCompleteCallback = null;
  }

  // Возобновление игры
  Game.resumeTime();
  audio.setGameState(true);
  audio.resume();
  if (!Game.isRunning) Game.startLoop();

  // Разрешение промиса
  if (resolvePromise) {
    resolvePromise(result);
    resolvePromise = null;
  }

  // Сброс строк
  currentLines = [];
  currentLineIndex = 0;
}

// ============================================================
// ПУБЛИЧНЫЙ API
// ============================================================

/**
 * Открыть простой линейный диалог
 * 
 * @param {Object} config - Конфигурация
 * @param {string} config.speaker - Имя NPC
 * @param {Array<string>} config.lines - Массив строк
 * @param {Function} [config.onComplete] - Колбэк после завершения
 * @returns {Promise<boolean>} - true если диалог завершён, false если прерван
 */
export async function openDialog(config) {
  if (isDialogOpen) {
    console.warn('⚠️ Диалог уже открыт');
    return false;
  }

  // Загрузка шаблона
  if (!isTemplateLoaded('dialog')) await loadTemplateIfNeeded('dialog');
  if (!isTemplateInitialized('dialog')) await initTemplateHandlers('dialog');

  return doOpenDialog({
    speaker: config.speaker,
    lines: config.lines,
    isChoice: false,
    onComplete: config.onComplete,
  });
}

/**
 * Открыть диалог с выбором (Да/Нет).
 * 
 * Кнопки выбора показываются ТОЛЬКО на последней строке диалога.
 * Все строки до последней листаются кнопкой "Продолжить ▶".
 * 
 * @param {Object} config - Конфигурация
 * @param {string} config.speaker - Имя NPC
 * @param {Array<string>} config.lines - Массив строк
 * @param {string} [config.yesText] - Текст кнопки "Да"
 * @param {string} [config.noText] - Текст кнопки "Нет"
 * @returns {Promise<boolean>} - true если выбран "Да", false если "Нет"
 */
export async function openDialogWithChoice(config) {
  if (isDialogOpen) {
    console.warn('⚠️ Диалог уже открыт');
    return false;
  }

  // Загрузка шаблона
  if (!isTemplateLoaded('dialog')) await loadTemplateIfNeeded('dialog');
  if (!isTemplateInitialized('dialog')) await initTemplateHandlers('dialog');

  return doOpenDialog({
    speaker: config.speaker,
    lines: config.lines,
    isChoice: true,
    yesText: config.yesText || 'Принять',
    noText: config.noText || 'Отказаться',
  });
}

/**
 * Проверка, открыт ли диалог
 * 
 * @returns {boolean} - true если диалог открыт
 */
export function isAnyDialogOpen() {
  return isDialogOpen;
}

/**
 * Принудительное закрытие диалога
 * 
 * @returns {void}
 */
export function forceCloseDialog() {
  if (isDialogOpen) closeDialog(false);
}