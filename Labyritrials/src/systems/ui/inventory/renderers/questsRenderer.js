/**
 * @fileoverview Рендеринг списка заданий в инвентаре.
 * @module systems/ui/inventory/renderers/questsRenderer
 */

import { 
  getActiveQuests, 
  getCompletedQuests, 
  getQuestData,
  getQuestProgress,
} from '../../../quests/index.js';
import { getSpriteWithSize } from '../../../../sprites/index.js';

/**
 * Категории заданий
 */
const QUEST_CATEGORIES = {
  collection: {
    id: 'collection',
    label: 'Сбор',
    cssClass: 'category-collection',
    spriteName: 'questCollection',
    fallbackEmoji: '🎒',
  },
  exploration: {
    id: 'exploration',
    label: 'Исследование',
    cssClass: 'category-exploration',
    spriteName: 'questExploration',
    fallbackEmoji: '🗺️',
  },
};

/** @type {Map<string, string>} - Кэш data URL для спрайтов категорий */
const categorySpriteCache = new Map();

/**
 * Получение HTML-иконки категории задания (спрайт или эмодзи-fallback).
 * 
 * @param {string} categoryId - ID категории ('collection' | 'exploration')
 * @param {number} [size=40] - Размер иконки в пикселях
 * @returns {string} - HTML-строка для вставки в DOM
 */
function getCategoryIconHTML(categoryId, size = 40) {
  const category = QUEST_CATEGORIES[categoryId] || QUEST_CATEGORIES.collection;
  const cacheKey = `${category.spriteName}_${size}`;
  // Проверка кэша
  if (categorySpriteCache.has(cacheKey)) return categorySpriteCache.get(cacheKey);
  // Попытка получить спрайт
  const sprite = getSpriteWithSize(category.spriteName, size);
  
  if (sprite && sprite.texture) {
    // Рендеринг спрайта в dataURL
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
                       class="quest-category-icon" 
                       alt="${category.label}" 
                       width="${size}" 
                       height="${size}" 
                       style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:auto;display:block;">`;
    
    categorySpriteCache.set(cacheKey, html);
    return html;
  }
  
  // Fallback: эмодзи
  const fallbackHTML = `<span class="quest-category-emoji" style="font-size:${Math.round(size * 0.85)}px;line-height:1;">${category.fallbackEmoji}</span>`;
  categorySpriteCache.set(cacheKey, fallbackHTML);
  return fallbackHTML;
}

/**
 * Рендеринг списка заданий.
 * Показывает активные и завершённые задания.
 * 
 * @returns {void}
 */
export function renderQuestsList() {
  const container = document.getElementById('inventory-quests-list');
  if (!container) return;
  const activeQuests = getActiveQuests();
  const completedQuests = getCompletedQuests();

  // Если нет ни активных, ни завершённых - показывается заглушка
  if (activeQuests.length === 0 && completedQuests.length === 0) {
    container.innerHTML = `
      <div class="inventory-quests-empty">
        <div class="inventory-quests-empty-icon">📜</div>
        <div>Нет активных заданий</div>
      </div>
    `;
    return;
  }

  let html = '';

  // Активные задания
  for (const activeQuest of activeQuests) {
    const questData = getQuestData(activeQuest.id);
    if (!questData) continue;
    html += renderQuestItem(questData, { status: 'active' });
  }

  // Завершённые задания
  for (const completedId of completedQuests) {
    const questData = getQuestData(completedId);
    if (!questData) continue;
    html += renderQuestItem(questData, { status: 'completed' });
  }

  container.innerHTML = html;
}

/**
 * Рендеринг одной карточки задания.
 * 
 * @param {Object} questData - Данные задания из QUESTS_DATA
 * @param {Object} options - Опции
 * @param {string} options.status - 'active' или 'completed'
 * @returns {string} - HTML
 * @private
 */
function renderQuestItem(questData, { status }) {
  const isCompleted = status === 'completed';
  // Прогресс (только для активных)
  const progress = isCompleted ? null : getQuestProgress(questData.id);
  const current = progress?.current || 0;
  const max = progress?.max || questData.target.count;
  const percent = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  // Категория задания
  const category = QUEST_CATEGORIES[questData.category] || QUEST_CATEGORIES.collection;
  const iconHTML = getCategoryIconHTML(questData.category, 40);

  // Классы: базовый + категория + статус
  const classes = [
    'inventory-quest-item',
    category.cssClass,
    status,
  ].join(' ');

  // Прогресс-блок
  let progressHtml = '';
  if (isCompleted) {
    progressHtml = `
      <div class="inventory-quest-progress">
        <div class="inventory-quest-status">✓ Выполнено</div>
      </div>
    `;
  } else {
    progressHtml = `
      <div class="inventory-quest-progress">
        <div class="inventory-quest-progress-text">${current} / ${max}</div>
        <div class="inventory-quest-progress-bar">
          <div class="inventory-quest-progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="${classes}">
      <div class="inventory-quest-icon">${iconHTML}</div>
      <div class="inventory-quest-info">
        <div class="inventory-quest-category">${category.label}</div>
        <div class="inventory-quest-title">${questData.title || 'Задание'}</div>
        <div class="inventory-quest-description">${questData.briefDescription || ''}</div>
      </div>
      ${progressHtml}
    </div>
  `;
}

/**
 * Очистка кэша спрайтов категорий.
 * Полезно при смене биома или перезагрузке атласов.
 * 
 * @returns {void}
 */
export function clearQuestCategoryCache() {
  categorySpriteCache.clear();
}