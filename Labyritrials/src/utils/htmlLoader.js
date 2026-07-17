/**
 * @fileoverview Загрузка HTML-шаблонов.
 * Асинхронно загружает все HTML-файлы интерфейса и встраивает их в DOM.
 * 
 * @module utils/htmlLoader
 */

/** @type {string} - Путь к папке с HTML-шаблонами */
const HTML_PATH = 'html/';

/**
 * Загрузка одного HTML-шаблона
 * 
 * @param {string} name - Имя шаблона (без расширения .html)
 * @returns {Promise<string>} - HTML-содержимое шаблона или пустая строка при ошибке
 */
export async function loadTemplate(name) {
  try {
    const response = await fetch(`${HTML_PATH}${name}.html`);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить шаблон: ${name} (${response.status})`);
    }
    return await response.text();
  } catch (error) {
    console.error(`❌ Ошибка загрузки шаблона ${name}:`, error);
    return '';
  }
}

/**
 * Загрузка всех HTML-шаблонов игры
 * 
 * Загружает следующие шаблоны:
 * - intro, menu, pause, ui, gameOver, levelUp,
 * - shop, settings, achievements, noteWindow, bookshelf, final
 * 
 * После загрузки добавляет в DOM:
 * - Элементы для CSS-эмодзи монстров и игрока
 * - Canvas для игры
 * - Все загруженные шаблоны
 * 
 * @returns {Promise<Object>} - Результат загрузки
 * @returns {boolean} success - Все ли шаблоны загружены
 * @returns {number} loaded - Количество загруженных шаблонов
 * @returns {number} total - Общее количество шаблонов
 * @returns {string[]} errors - Список имён шаблонов с ошибками
 */
export async function loadAllTemplates() {
  const templates = [
    'intro',
    'menu',
    'pause',
    'ui',
    'gameOver',
    'levelUp',
    'shop',
    'settings',
    'achievements',
    'noteWindow',
    'bookshelf',
    'final'
  ];
  
  const errors = [];
  const results = [];
  
  const rawResults = await Promise.all(
    templates.map(name => loadTemplate(name))
  );
  
  for (let i = 0; i < templates.length; i++) {
    const html = rawResults[i];
    if (html && html.trim().length > 0) {
      results.push(html);
    } else {
      errors.push(templates[i]);
      results.push('');
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ Не загружено ${errors.length} шаблонов:`, errors.join(', '));
  }
  
  const container = document.body;
  
  // ===== ДОБАВЛЕНИЕ CSS-ЭМОДЗИ =====
  const emojiContainer = document.createElement('div');
  emojiContainer.innerHTML = `
    <span id="css-monster-1" class="monster-emoji-1" style="display:none;"></span>
    <span id="css-monster-2" class="monster-emoji-2" style="display:none;"></span>
    <span id="css-monster-3" class="monster-emoji-3" style="display:none;"></span>
    <span id="css-monster-4" class="monster-emoji-4" style="display:none;"></span>
    <span id="css-player" class="player-emoji" style="display:none;"></span>
  `;
  container.appendChild(emojiContainer);
  
  // ===== ДОБАВЛЕНИЕ CANVAS =====
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  container.appendChild(canvas);
  
  // ===== ВСТАВКА ЗАГРУЖЕННЫХ ШАБЛОНОВ =====
  for (let i = 0; i < templates.length; i++) {
    const html = results[i];
    if (html && html.trim().length > 0) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      while (wrapper.firstChild) {
        container.appendChild(wrapper.firstChild);
      }
    }
  }
  
  return {
    success: errors.length === 0,
    loaded: results.filter(r => r && r.trim().length > 0).length,
    total: templates.length,
    errors: errors
  };
}