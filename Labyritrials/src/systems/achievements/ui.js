/**
 * @fileoverview UI для системы достижений.
 * Управляет отображением уведомлений, окна достижений,
 * рендерингом списка и взаимодействием с пользователем.
 * 
 * @module systems/achievements/ui
 */

import { 
  getAchievementState, 
  getAllAchievementsState,
  getAchievementsByCategoryState,
  getAchievementsStats,
  resetAchievements,
  isHidden,
  isUnlocked,
  getUnlocked
} from './manager.js';
import { CATEGORIES_DATA as CATEGORIES, getTotalAchievementsCount } from '../../data/achievements.js';
import { logger } from '../../utils/logger.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from '../ui/modalManager.js';
import { showConfirm } from '../ui/confirm.js';
import { getAchievementIconHTML as getSpriteIconHTML } from '../../sprites/achievementSprites.js';

/** @type {number|null} - Таймаут скрытия уведомления */
let notificationTimeout = null;
/** @type {string[]} - Очередь уведомлений */
let notificationQueue = [];
/** @type {boolean} - Показывается ли уведомление в данный момент */
let isNotificationShowing = false;
/** @type {boolean} - Открыто ли окно достижений */
let achievementsOpen = false;

/**
 * Получение иконки для отображения (спрайт из атласа или эмодзи)
 * 
 * @param {string} id - ID достижения
 * @param {string} defaultEmoji - Эмодзи по умолчанию
 * @returns {string} - HTML для иконки
 * @private
 */
function getAchievementIconHTML(id, defaultEmoji) {
  return getSpriteIconHTML(id, defaultEmoji, 30, 'achievement-icon-img');
}

/**
 * Показ уведомления о разблокировке достижения
 * 
 * @param {string} id - ID достижения
 * @returns {void}
 */
export function showAchievementNotification(id) {
  const achievement = getAchievementState(id);
  if (!achievement) return;
  
  const notification = document.getElementById('achievement-notification');
  if (!notification) {
    logger.warn('⚠️ Элемент уведомления не найден в DOM');
    return;
  }
  
  notificationQueue.push(id);
  
  if (!isNotificationShowing) showNextNotification();
}

/**
 * Показ следующего уведомления из очереди
 * 
 * @returns {void}
 * @private
 */
function showNextNotification() {
  if (notificationQueue.length === 0) {
    isNotificationShowing = false;
    return;
  }
  
  isNotificationShowing = true;
  const id = notificationQueue.shift();
  const achievement = getAchievementState(id);
  if (!achievement) {
    isNotificationShowing = false;
    showNextNotification();
    return;
  }
  
  const notification = document.getElementById('achievement-notification');
  const nameEl = document.getElementById('notification-achievement-name');
  const iconEl = notification?.querySelector('.notification-icon');
  
  if (!notification || !nameEl) {
    logger.warn('⚠️ Элементы уведомления не найдены');
    isNotificationShowing = false;
    showNextNotification();
    return;
  }
  
  nameEl.textContent = achievement.name;
  
  // Использование спрайта для иконки уведомления
  if (iconEl) {
    const spriteHTML = getSpriteIconHTML(id, '🏆', 30, 'notification-icon-img');
    iconEl.innerHTML = spriteHTML;
  }
  
  notification.style.display = 'flex';
  notification.classList.remove('hiding');
  notification.classList.remove('hidden');
  
  if (notificationTimeout) clearTimeout(notificationTimeout);
  
  notificationTimeout = setTimeout(() => {
    hideNotification();
  }, 3500);
}

/**
 * Скрытие текущего уведомления
 * 
 * @returns {void}
 * @private
 */
function hideNotification() {
  const notification = document.getElementById('achievement-notification');
  if (!notification) return;
  
  notification.classList.add('hiding');
  
  setTimeout(() => {
    notification.style.display = 'none';
    notification.classList.remove('hiding');
    isNotificationShowing = false;
    showNextNotification();
  }, 400);
}

/**
 * Внутренняя функция открытия окна достижений (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function showAchievementsWindow() {
  const window = document.getElementById('achievements-ui');
  if (!window) {
    logger.warn('⚠️ Окно достижений не найдено');
    return;
  }

  import('./manager.js').then(module => {
    module.forceLoadAchievements();
  });

  // Принудительная остановка сердцебиения игрока
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });
  
  achievementsOpen = true;
  window.style.display = 'flex';
  registerModalOpen('achievements');
  currentCategory = 'all';

  document.querySelectorAll('.achievements-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === 'all');
  });
  
  renderAchievements('all');
  updateCategoryStats('all');
  
  import('../../core/game.js').then(({ Game }) => {
    if (Game && Game.isRunning) Game.stopLoop();
  });
  
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.pause();
  });
}

/**
 * Открытие окна достижений
 * 
 * @returns {void}
 */
export function openAchievementsWindow() {
  if (!isTemplateLoaded('achievements')) {
    loadTemplateIfNeeded('achievements').then(() => {
      showAchievementsWindow();
    });
    return;
  }
  
  if (!isTemplateInitialized('achievements')) {
    initTemplateHandlers('achievements').then(() => {
      showAchievementsWindow();
    });
    return;
  }
  
  showAchievementsWindow();
}

/**
 * Закрытие окна достижений
 * 
 * @returns {void}
 */
export function closeAchievementsWindow() {
  const window = document.getElementById('achievements-ui');
  if (!window) return;
  
  achievementsOpen = false;
  window.style.display = 'none';
  registerModalClose('achievements');
  
  import('../../core/game.js').then(({ Game }) => {
    if (Game && !Game.isRunning) Game.startLoop();
  });
  
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.resume();
  });
}

/** @type {string} - Текущая категория для отображения */
let currentCategory = 'all';

/**
 * Переключение категории достижений
 * 
 * @param {string} categoryId - ID категории
 * @returns {void}
 */
export function switchCategory(categoryId) {
  currentCategory = categoryId;
  
  document.querySelectorAll('.achievements-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === categoryId);
  });
  
  renderAchievements(categoryId);
  updateCategoryStats(categoryId);
}

/**
 * Рендер списка достижений
 * 
 * @param {string} categoryId - ID категории ('all' для всех)
 * @returns {void}
 */
export function renderAchievements(categoryId) {
  const container = document.getElementById('achievements-list');
  if (!container) return;

  import('./manager.js').then(({ checkAchievements }) => {
    checkAchievements();
  });
  
  let achievements;
  achievements = (categoryId === 'all') ? getAllAchievementsState() : getAchievementsByCategoryState(categoryId);
  
  const unlockedList = getUnlocked();
  
  achievements.sort((a, b) => {
    const aUnlocked = a.unlocked;
    const bUnlocked = b.unlocked;
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    if (aUnlocked && bUnlocked) {
      const aIndex = unlockedList.indexOf(a.id);
      const bIndex = unlockedList.indexOf(b.id);
      return bIndex - aIndex;
    }
    
    const aProgress = a.current / a.max;
    const bProgress = b.current / b.max;
    if (aProgress !== bProgress) return bProgress - aProgress;
    
    const categoryOrder = ['combat', 'exploration', 'collection', 'survival', 'secret'];
    const aCatIndex = categoryOrder.indexOf(a.category);
    const bCatIndex = categoryOrder.indexOf(b.category);
    if (aCatIndex !== bCatIndex) return aCatIndex - bCatIndex;
    
    return a.name.localeCompare(b.name);
  });
  
  if (achievements.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--color-text-dark);">
        Нет достижений в этой категории
      </div>
    `;
    return;
  }
  
  let html = '';
  for (const ach of achievements) {
    html += renderAchievementItem(ach);
  }
  
  container.innerHTML = html;
}

/**
 * Рендер одного элемента достижения
 * 
 * @param {Object} ach - Объект достижения с состоянием
 * @returns {string} - HTML-строка элемента
 * @private
 */
function renderAchievementItem(ach) {
  const isUnlockedAch = ach.unlocked;
  const isHiddenAch = ach.hidden && !isUnlockedAch;
  const progressPercent = ach.progressPercent;
  
  let classes = 'achievement-item';
  if (isUnlockedAch) {
    classes += ' unlocked';
    classes += ` category-${ach.category}`;
  } else if (isHiddenAch) {
    classes += ' hidden';
  } else {
    classes += ' locked';
  }
  
  let iconHTML;
  let name = ach.name;
  let description = ach.description;
  let progressHtml = '';
  
  if (isHiddenAch) {
    iconHTML = '❓';
    name = '???';
    description = '??????????????????????????????????????';
  } else {
    iconHTML = getAchievementIconHTML(ach.id, ach.icon || '🏆');
  }
  
  if (!isUnlockedAch && !isHiddenAch && ach.maxProgress > 1) {
    const barWidth = Math.min(100, progressPercent);
    const progressText = `${Math.min(ach.current, ach.max)} / ${ach.max}`;
    progressHtml = `
      <div class="achievement-progress-right">
        <div class="achievement-progress-bar">
          <div class="achievement-progress-fill" style="width: ${barWidth}%;"></div>
        </div>
        <span class="achievement-progress-text">${progressText}</span>
      </div>
    `;
  }
  
  let checkHtml = '';
  if (isHiddenAch) checkHtml = `<span class="achievement-check">🔒</span>`;
  else if (!isUnlockedAch) checkHtml = `<span class="achievement-check">🔒</span>`;
  
  return `
    <div class="${classes}">
      <span class="achievement-icon">${iconHTML}</span>
      <div class="achievement-info">
        <div class="achievement-name">${name}</div>
        <div class="achievement-description">${description}</div>
      </div>
      ${progressHtml}
      ${checkHtml}
    </div>
  `;
}

/**
 * Обновление строки статистики для текущей категории
 * 
 * @param {string} categoryId - ID категории
 * @returns {void}
 */
export function updateCategoryStats(categoryId) {
  let achievements;
  achievements = (categoryId === 'all') ? getAllAchievementsState() : getAchievementsByCategoryState(categoryId);
  
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  
  const unlockedEl = document.getElementById('achievements-unlocked-count');
  const totalEl = document.getElementById('achievements-total-count');
  
  if (unlockedEl) unlockedEl.textContent = unlocked;
  if (totalEl) totalEl.textContent = total;
}

/**
 * Сброс достижений с двойным подтверждением
 * 
 * @returns {void}
 */
export async function confirmResetAchievements() {
  const stats = getAchievementsStats();
  
  if (stats.unlocked === 0) {
    alert('❌ Нет разблокированных достижений для сброса!');
    return;
  }
  
  // Первое подтверждение
  const confirm1 = await showConfirm(
    `Будет сброшено ${stats.unlocked} достижений.\nЭто действие НЕОБРАТИМО!`,
    { title: 'Сбросить достижения?', yesText: 'Продолжить', noText: 'Отмена' }
  );
  
  if (!confirm1) return;
  
  // Второе подтверждение
  const confirm2 = await showConfirm(
    `Все достижения и прогресс будут УДАЛЕНЫ НАВСЕГДА.\n\nВы уверены?`,
    { title: '⚠️ Последнее предупреждение', yesText: 'Удалить', noText: 'Отмена' }
  );
  
  if (!confirm2) return;
  
  resetAchievements();
  renderAchievements(currentCategory);
  updateCategoryStats(currentCategory);
  
  const container = document.getElementById('achievements-list');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--color-text-gold);">
        🗑️ Все достижения сброшены!
      </div>
    `;
  }
}

/**
 * Инициализация UI достижений
 * 
 * @returns {void} */
export function initAchievementsUI() {
  // Вкладки
  document.querySelectorAll('.achievements-tab').forEach(tab => {
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    newTab.addEventListener('click', () => {
      const category = newTab.dataset.category;
      switchCategory(category);
    });
  });
  
  // Кнопка закрытия
  const closeBtn = document.getElementById('achievements-close-btn');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeAchievementsWindow);
  }
  
  // Кнопка сброса
  const resetBtn = document.getElementById('achievements-reset-btn');
  if (resetBtn) {
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    newResetBtn.addEventListener('click', () => {
      confirmResetAchievements();
    });
  }
}

/**
 * Проверка, открыто ли окно достижений
 * 
 * @returns {boolean} - true, если окно достижений открыто
 */
export function isAchievementsOpen() {
  return achievementsOpen;
}