/**
 * @fileoverview Загрузка HTML-шаблонов с поддержкой инкрементальной загрузки.
 * Критические шаблоны загружаются сразу, остальные — по требованию.
 * 
 * @module utils/htmlLoader
 */

import { logger } from './logger.js';

/** @type {string} - Путь к папке с HTML-шаблонами */
const HTML_PATH = 'views/';

/** @type {Set<string>} - Имена загруженных шаблонов */
const loadedTemplates = new Set();

/** @type {Map<string, string>} - Кэш содержимого загруженных шаблонов */
const templateCache = new Map();

/** @type {Set<string>} - Имена шаблонов, которые загружаются в данный момент */
const loadingTemplates = new Set();

/** @type {Map<string, boolean>} - Флаги инициализации для каждого шаблона */
const initializedTemplates = new Map();

/**
 * Маппинг имени шаблона к пути с подпапкой
 * @type {Object<string, string>}
 */
const TEMPLATE_MAP = {
  // screens/
  'intro': 'screens/intro',
  'menu': 'screens/menu',
  
  // components/
  'ui': 'components/ui',
  'notification': 'components/notification',
  'noteWindow': 'components/noteWindow',
  
  // windows/
  'achievements': 'windows/achievements',
  'settings': 'windows/settings',
  'shop': 'windows/shop',
  'bookshelf': 'windows/bookshelf',
  'pause': 'windows/pause',
  'gameOver': 'windows/gameOver',
  'levelUp': 'windows/levelUp',
  'final': 'windows/final'
};

/**
 * Критические шаблоны, которые загружаются сразу при старте
 * @type {string[]}
 */
const ESSENTIAL_TEMPLATES = [
  'screens/intro',      // Заставка с историей
  'screens/menu',       // Главное меню
  'components/ui',      // Игровой интерфейс
  'windows/gameOver',   // Экран смерти (нужен мгновенно)
  'components/notification', // Уведомления о достижениях (нужны всегда)
  'windows/shop',
];

/**
 * Загрузка одного HTML-шаблона
 * 
 * @param {string} name - Имя шаблона (без расширения .html)
 * @returns {Promise<string>} - HTML-содержимое шаблона или пустая строка при ошибке
 */
async function loadTemplate(name) {
  try {
    // Используем маппинг для определения пути
    const mappedName = TEMPLATE_MAP[name] || name;
    const response = await fetch(`${HTML_PATH}${mappedName}.html`);
    
    if (!response.ok) {
      throw new Error(`Не удалось загрузить шаблон: ${name} (${response.status})`);
    }
    return await response.text();
  } catch (error) {
    logger.error(`❌ Ошибка загрузки шаблона ${name}:`, error);
    return '';
  }
}

/**
 * Вставка загруженных шаблонов в DOM
 * 
 * @param {string[]} htmlContents - Массив HTML-строк
 * @param {string[]} names - Имена шаблонов (для отладки)
 * @returns {void}
 */
function insertTemplatesIntoDOM(htmlContents, names) {
  const container = document.body;
  
  // Добавляем CSS-эмодзи (всегда)
  const emojiContainer = document.createElement('div');
  emojiContainer.innerHTML = `
    <span id="css-monster-1" class="monster-emoji-1" style="display:none;"></span>
    <span id="css-monster-2" class="monster-emoji-2" style="display:none;"></span>
    <span id="css-monster-3" class="monster-emoji-3" style="display:none;"></span>
    <span id="css-monster-4" class="monster-emoji-4" style="display:none;"></span>
    <span id="css-player" class="player-emoji" style="display:none;"></span>
  `;
  container.appendChild(emojiContainer);
  
  // Добавляем Canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  container.appendChild(canvas);
  
  // Вставляем загруженные шаблоны
  for (let i = 0; i < htmlContents.length; i++) {
    const html = htmlContents[i];
    if (html && html.trim().length > 0) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      while (wrapper.firstChild) {
        container.appendChild(wrapper.firstChild);
      }
    }
  }
}

/**
 * Инициализация обработчиков для конкретного шаблона
 * 
 * @param {string} name - Имя шаблона
 * @returns {Promise<boolean>} - true, если инициализация выполнена
 */
export async function initTemplateHandlers(name) {
  // Если уже инициализирован — пропускаем
  if (initializedTemplates.get(name)) return true;
  
  let success = false;
  
  switch (name) {
    case 'pause':
      const { initPauseMenu } = await import('../game/pauseMenu.js');
      initPauseMenu();
      success = true;
      break;
      
    case 'settings':
      const { initSettings } = await import('../systems/ui/settings/index.js');
      initSettings();
      success = true;
      break;
      
    case 'achievements':
      const { initAchievementsUI } = await import('../systems/achievements/index.js');
      initAchievementsUI();
      success = true;
      break;
      
    case 'shop':
      const { initShopHandlers } = await import('../systems/ui/shop/index.js');
      if (typeof initShopHandlers === 'function') {
        initShopHandlers();
      }
      success = true;
      break;
      
    case 'final':
      const { setupFinalScreenButtons } = await import('../game/finalScreen.js');
      setupFinalScreenButtons();
      success = true;
      break;
      
    case 'levelUp':
      // Инициализируется при показе через setupContinueButton()
      success = true;
      break;
      
    case 'noteWindow':
      setupNoteWindowCloseHandler();
      success = true;
      break;
      
    case 'bookshelf':
      const { initBookshelfHandlers } = await import('../systems/ui/bookshelfUI.js');
      initBookshelfHandlers();
      success = true;
      break;
      
    case 'intro':
    case 'menu':
    case 'ui':
    case 'gameOver':
    case 'notification':
      // Эти шаблоны не требуют инициализации обработчиков
      success = true;
      break;
      
    default:
      logger.warn(`⚠️ Нет обработчиков для шаблона: ${name}`);
      success = false;
  }
  
  if (success) {
    initializedTemplates.set(name, true);
  }
  
  return success;
}

/**
 * Настройка обработчика закрытия окна записки
 * 
 * @returns {void}
 */
function setupNoteWindowCloseHandler() {
  const closeBtn = document.getElementById('note-reader-close');
  if (closeBtn) {
    // Удаляем старые обработчики, чтобы избежать дублирования
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', () => {
      import('../systems/input/keyboard.js').then(module => {
        module.closeNoteWindow();
      });
    });
  }
}

/**
 * Загрузка только критических шаблонов
 * 
 * @returns {Promise<Object>} - Результат загрузки
 */
export async function loadEssentialTemplates() {
  const results = [];
  const errors = [];
  
  for (const name of ESSENTIAL_TEMPLATES) {
    const html = await loadTemplate(name);
    if (html && html.trim().length > 0) {
      results.push(html);
      loadedTemplates.add(name);
      templateCache.set(name, html);
    } else {
      errors.push(name);
    }
  }
  
  // Вставляем загруженные шаблоны в DOM
  insertTemplatesIntoDOM(results, ESSENTIAL_TEMPLATES);
  
  // Инициализируем обработчики для критических шаблонов
  for (const name of ESSENTIAL_TEMPLATES) {
    // Извлекаем имя без пути для инициализации
    const shortName = name.includes('/') ? name.split('/').pop() : name;
    await initTemplateHandlers(shortName);
  }
  
  return {
    success: errors.length === 0,
    loaded: results.length,
    total: ESSENTIAL_TEMPLATES.length,
    errors: errors
  };
}

/**
 * Загрузка шаблона по требованию (с кэшированием)
 * 
 * @param {string} name - Имя шаблона
 * @returns {Promise<string|null>} - HTML-содержимое или null при ошибке
 */
export async function loadTemplateIfNeeded(name) {
  // Уже загружен — возвращаем из кэша
  if (loadedTemplates.has(name)) {
    return templateCache.get(name) || null;
  }
  
  // Уже загружается — ждём
  if (loadingTemplates.has(name)) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (loadedTemplates.has(name)) {
          clearInterval(checkInterval);
          resolve(templateCache.get(name) || null);
        }
      }, 50);
    });
  }
  
  // Загружаем
  loadingTemplates.add(name);
  
  const html = await loadTemplate(name);
  loadingTemplates.delete(name);
  
  if (html && html.trim().length > 0) {
    loadedTemplates.add(name);
    templateCache.set(name, html);
    
    // Вставляем в DOM
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
    
    // ===== ВАЖНО: Инициализируем обработчики ПОСЛЕ вставки в DOM =====
    // Извлекаем имя без пути для инициализации
    const shortName = name.includes('/') ? name.split('/').pop() : name;
    await initTemplateHandlers(shortName);
    
    return html;
  } else {
    logger.warn(`⚠️ Не удалось загрузить шаблон: ${name}.html`);
    return null;
  }
}

/**
 * Проверка, загружен ли шаблон
 * 
 * @param {string} name - Имя шаблона
 * @returns {boolean} - true, если шаблон загружен
 */
export function isTemplateLoaded(name) {
  return loadedTemplates.has(name);
}

/**
 * Проверка, инициализирован ли шаблон
 * 
 * @param {string} name - Имя шаблона
 * @returns {boolean} - true, если шаблон инициализирован
 */
export function isTemplateInitialized(name) {
  return initializedTemplates.get(name) || false;
}

/**
 * Получение кэшированного содержимого шаблона
 * 
 * @param {string} name - Имя шаблона
 * @returns {string|null} - HTML-содержимое или null
 */
export function getTemplateContent(name) {
  return templateCache.get(name) || null;
}