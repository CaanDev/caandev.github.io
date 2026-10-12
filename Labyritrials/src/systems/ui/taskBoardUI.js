/**
 * @fileoverview UI доски заданий.
 * Управляет открытием/закрытием окна доски, отображением доступных заданий
 * и их взятием (без сдачи — сдача у NPC).
 * 
 * @module systems/ui/taskBoardUI
 */

import { state, player } from '../../core/config/index.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { logger } from '../../utils/logger.js';
import { getAllQuests, getQuestData } from '../../data/quests.js';
import { getNpcName } from '../../data/npcs.js';
import { RESEARCHER_STATES } from '../dialogs/npcStates.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';
import { isQuestActive, isQuestCompleted, startQuest } from '../quests/questManager.js';
import { getSpriteWithSize } from '../../sprites/index.js';

/** @type {boolean} - Открыта ли доска */
let taskBoardOpen = false;

/** @type {Map<string, string>} - Кэш data URL для иконок заданий */
const iconCache = new Map();

/**
 * Получение иконки задания (спрайт или эмодзи)
 * 
 * @param {string} categoryId - ID категории ('collection' | 'exploration')
 * @param {number} [size=40] - Размер иконки
 * @returns {string} - HTML для иконки
 * @private
 */
function getQuestIconHTML(categoryId, size = 40) {
  const iconMap = {
    collection: { sprite: 'questCollection', emoji: '🎒' },
    exploration: { sprite: 'questExploration', emoji: '🗺️' },
  };
  
  const icon = iconMap[categoryId] || iconMap.collection;
  const cacheKey = `${icon.sprite}_${size}`;
  
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);
  
  const sprite = getSpriteWithSize(icon.sprite, size);
  
  if (sprite && sprite.texture) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      sprite.offsetX, sprite.offsetY,
      sprite.drawW, sprite.drawH
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    const html = `<img src="${dataUrl}" 
                       class="taskboard-quest-icon-img" 
                       alt="${categoryId}" 
                       width="${size}" 
                       height="${size}" 
                       style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:auto;display:block;">`;
    
    iconCache.set(cacheKey, html);
    return html;
  }
  
  // Fallback: эмодзи
  const fallbackHTML = `<span class="taskboard-quest-emoji" style="font-size:${Math.round(size * 0.85)}px;line-height:1;">${icon.emoji}</span>`;
  iconCache.set(cacheKey, fallbackHTML);
  return fallbackHTML;
}

/**
 * Инициализация обработчиков доски заданий
 * 
 * @returns {void}
 */
export function initTaskBoardHandlers() {
  const closeBtn = document.getElementById('taskboard-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeTaskBoard);
  }
}

/**
 * Внутренняя функция открытия доски (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function doOpenTaskBoard() {
  const ui = document.getElementById('taskboard-ui');
  if (!ui) return;

  // Принудительная остановка сердцебиения
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });
  
  taskBoardOpen = true;
  
  Game.stopLoop();
  Game.pauseTime();
  audio.pause();
  audio.setGameState(false);
  registerModalOpen('taskBoard');
  
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  renderTaskBoard();
  ui.style.display = 'flex';
}

/**
 * Открытие доски заданий
 * 
 * @returns {void}
 */
export function openTaskBoard() {
  if (taskBoardOpen) return;
  
  if (!isTemplateLoaded('taskBoard')) {
    loadTemplateIfNeeded('taskBoard').then(() => {
      initTemplateHandlers('taskBoard').then(() => {
        doOpenTaskBoard();
      });
    });
    return;
  }
  
  if (!isTemplateInitialized('taskBoard')) {
    initTemplateHandlers('taskBoard').then(() => {
      doOpenTaskBoard();
    });
    return;
  }
  
  doOpenTaskBoard();
}

/**
 * Закрытие доски заданий
 * 
 * @returns {void}
 */
export function closeTaskBoard() {
  const ui = document.getElementById('taskboard-ui');
  if (ui) ui.style.display = 'none';
  
  taskBoardOpen = false;
  registerModalClose('taskBoard');
  
  audio.setGameState(true);
  audio.resume();
  Game.resumeTime();
  
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'block';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'flex';
  
  Game.startLoop();
}

/**
 * Проверка, открыта ли доска
 * 
 * @returns {boolean} - true, если доска открыта
 */
export function isTaskBoardOpen() {
  return taskBoardOpen;
}

/**
 * Получение списка заданий, доступных на доске
 * Показывает только те, что:
 * - Помечены флагом `fromBoard: true` в questsData
 * - Не активны (не взяты)
 * - Не завершены
 * 
 * @returns {Array} - Массив доступных заданий
 * @private
 */
function getAvailableBoardQuests() {
  const allQuests = getAllQuests();
  const available = [];
  
  for (const questData of allQuests) {
    // Пропуск заданий без флага fromBoard
    if (!questData.fromBoard) continue;
    
    // Пропуск активных и завершённых
    if (isQuestActive(questData.id)) continue;
    if (isQuestCompleted(questData.id)) continue;

    // Специальные условия для задания от Астрид
    if (questData.id === 'researcherWisps') {
      // Задание появляется только если игрок поговорил с Астрид в безопасной комнате
      if (state.npcState?.researcher !== RESEARCHER_STATES.WAITING_FOR_QUEST_BOARD) continue;
      // И если у игрока нет "Блуждающих огней"
      const hasWispsItem = player.inventory?.items?.equipment?.includes('willOTheWisps') || false;
      if (hasWispsItem) continue;
    }
    
    available.push(questData);
  }
  
  return available;
}

/**
 * Рендер доски заданий
 * 
 * @returns {void}
 * @private
 */
function renderTaskBoard() {
  const container = document.getElementById('taskboard-list');
  const emptyContainer = document.getElementById('taskboard-empty');
  if (!container) return;
  
  const availableQuests = getAvailableBoardQuests();
  
  if (availableQuests.length === 0) {
    container.innerHTML = '';
    if (emptyContainer) emptyContainer.style.display = 'flex';
    return;
  }
  
  if (emptyContainer) emptyContainer.style.display = 'none';
  
  let html = '';
  for (const quest of availableQuests) {
    html += renderBoardQuestItem(quest);
  }
  
  container.innerHTML = html;
  
  // Навешиваем обработчики на кнопки "Взять"
  container.querySelectorAll('.taskboard-quest-take').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const questId = btn.dataset.questId;
      handleTakeQuest(questId);
    });
  });
}

/**
 * Рендер одного задания на доске
 * 
 * @param {Object} questData - Данные задания
 * @returns {string} - HTML
 * @private
 */
function renderBoardQuestItem(questData) {
  const category = questData.category || 'collection';
  const iconHTML = getQuestIconHTML(category, 40);
  const giverName = getNpcName(questData.giver);
  
  return `
    <div class="taskboard-quest-item" data-quest-id="${questData.id}">
      <div class="taskboard-quest-icon">${iconHTML}</div>
      <div class="taskboard-quest-info">
        <div class="taskboard-quest-category">${getCategoryLabel(category)}</div>
        <div class="taskboard-quest-title">${questData.title || 'Задание'}</div>
        <div class="taskboard-quest-description">${questData.briefDescription || ''}</div>
        <div class="taskboard-quest-giver">📌 Выдаёт: ${giverName}</div>
      </div>
      <div class="taskboard-quest-actions">
        <button class="taskboard-quest-take" data-quest-id="${questData.id}">Взять</button>
      </div>
    </div>
  `;
}

/**
 * Получение метки категории
 * 
 * @param {string} categoryId - ID категории
 * @returns {string} - Название категории
 * @private
 */
function getCategoryLabel(categoryId) {
  const labels = {
    collection: 'Сбор',
    exploration: 'Исследование',
  };
  return labels[categoryId] || 'Задание';
}

/**
 * Обработка взятия задания с доски
 * 
 * @param {string} questId - ID задания
 * @returns {void}
 * @private
 */
function handleTakeQuest(questId) {
  const success = startQuest(questId);
  
  if (success) {
    audio.playSound('interactions.equip');
    logger.game(`📋 Задание "${questId}" взято с доски`);
    
    // Перерисовка доски (задание пропадёт из списка)
    renderTaskBoard();
  } else {
    logger.warn(`⚠️ Не удалось взять задание "${questId}"`);
  }
}