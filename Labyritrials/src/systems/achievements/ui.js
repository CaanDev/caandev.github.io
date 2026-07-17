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
  isUnlocked
} from './manager.js';
import { CATEGORIES, getTotalCount } from './config.js';

/** @type {number|null} - Таймаут скрытия уведомления */
let notificationTimeout = null;
/** @type {string[]} - Очередь уведомлений */
let notificationQueue = [];
/** @type {boolean} - Показывается ли уведомление в данный момент */
let isNotificationShowing = false;
/** @type {boolean} - Открыто ли окно достижений */
let achievementsOpen = false;

/**
 * Показ уведомления о разблокировке достижения
 * 
 * Добавляет достижение в очередь и показывает следующее уведомление.
 * 
 * @param {string} id - ID достижения
 * @returns {void}
 */
export function showAchievementNotification(id) {
  const achievement = getAchievementState(id);
  if (!achievement) return;
  
  // Добавляем в очередь
  notificationQueue.push(id);
  
  // Если уведомление не показывается, показываем следующее
  if (!isNotificationShowing) {
    showNextNotification();
  }
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
  
  if (!notification || !nameEl) {
    console.warn('⚠️ Элементы уведомления не найдены');
    isNotificationShowing = false;
    showNextNotification();
    return;
  }
  
  // Устанавливаем название
  nameEl.textContent = achievement.name;
  
  // Показываем уведомление
  notification.style.display = 'flex';
  notification.classList.remove('hiding');
  notification.classList.remove('hidden');
  
  // Убираем предыдущий таймаут
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  
  // Автоматическое скрытие через 3.5 секунды
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
    // Показываем следующее уведомление из очереди
    showNextNotification();
  }, 400);
}

/**
 * Открытие окна достижений
 * 
 * Приостанавливает игру и музыку, отображает окно с достижениями.
 * 
 * @returns {void}
 */
export function openAchievementsWindow() {
  const window = document.getElementById('achievements-ui');
  if (!window) {
    console.warn('⚠️ Окно достижений не найдено');
    return;
  }
  
  achievementsOpen = true;
  window.style.display = 'flex';
  currentCategory = 'all';

  // Обновляем активную вкладку
  document.querySelectorAll('.achievements-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === 'all');
  });
  
  // Обновляем содержимое
  renderAchievements('all');
  updateCategoryStats('all');
  
  // Приостанавливаем игру
  import('../../core/game.js').then(({ Game }) => {
    if (Game && Game.isRunning) {
      Game.stopLoop();
    }
  });
  
  // Останавливаем музыку
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.pause();
  });
}

/**
 * Закрытие окна достижений
 * 
 * Возобновляет игру и музыку.
 * 
 * @returns {void}
 */
export function closeAchievementsWindow() {
  const window = document.getElementById('achievements-ui');
  if (!window) return;
  
  achievementsOpen = false;
  window.style.display = 'none';
  
  // Возобновляем игру
  import('../../core/game.js').then(({ Game }) => {
    if (Game && !Game.isRunning) {
      Game.startLoop();
    }
  });
  
  // Возобновляем музыку
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
  
  // Обновляем активную вкладку
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

  // Проверяем достижения перед рендерингом
  import('./manager.js').then(({ checkAchievements }) => {
    checkAchievements();
  });
  
  let achievements;
  if (categoryId === 'all') {
    achievements = getAllAchievementsState();
  } else {
    achievements = getAchievementsByCategoryState(categoryId);
  }
  
  // Сортировка:
  // 1. Сначала разблокированные (по категориям)
  // 2. Потом заблокированные видимые (по прогрессу)
  // 3. В самом конце — скрытые (заблокированные)
  achievements.sort((a, b) => {
    // Сначала разблокированные
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    
    // Если оба разблокированы — сортируем по категории
    if (a.unlocked && b.unlocked) {
      const order = ['combat', 'exploration', 'collection', 'survival', 'secret'];
      return order.indexOf(a.category) - order.indexOf(b.category);
    }
    
    // Если оба заблокированы
    const aIsHidden = a.hidden === true;
    const bIsHidden = b.hidden === true;
    
    // Скрытые отправляем в конец
    if (aIsHidden && !bIsHidden) return 1;
    if (!aIsHidden && bIsHidden) return -1;
    
    // Оба видимые — сортируем по прогрессу (у кого больше — тот выше)
    return (b.current / b.max) - (a.current / a.max);
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
  const isCompleted = ach.isCompleted;
  
  let classes = 'achievement-item';
  if (isUnlockedAch) {
    classes += ' unlocked';
    classes += ` category-${ach.category}`;
  } else if (isHiddenAch) {
    classes += ' hidden';
  } else {
    classes += ' locked';
  }
  
  let icon = ach.icon || '🏆';
  let name = ach.name;
  let description = ach.description;
  let progressHtml = '';
  
  // Для скрытых достижений (заблокированных) показываем заглушку
  if (isHiddenAch) {
    icon = '❓';
    name = '???';
    description = '??????????????????????????????????????';
  }
  
  // Прогресс для незавершённых достижений
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
  
  // Правая иконка (замок)
  let checkHtml = '';
  if (isHiddenAch) {
    checkHtml = `<span class="achievement-check">🔒</span>`;
  } else if (!isUnlockedAch) {
    checkHtml = `<span class="achievement-check">🔒</span>`;
  }
  
  return `
    <div class="${classes}">
      <span class="achievement-icon">${icon}</span>
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
  if (categoryId === 'all') {
    achievements = getAllAchievementsState();
  } else {
    achievements = getAchievementsByCategoryState(categoryId);
  }
  
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
export function confirmResetAchievements() {
  const stats = getAchievementsStats();
  
  if (stats.unlocked === 0) {
    alert('❌ Нет разблокированных достижений для сброса!');
    return;
  }
  
  // Двойное подтверждение
  const confirm1 = confirm(
    `⚠️ ВЫ УВЕРЕНЫ?\n\n` +
    `Будет сброшено ${stats.unlocked} достижений.\n` +
    `Это действие НЕОБРАТИМО!\n\n` +
    `Нажмите "ОК" для продолжения.`
  );
  
  if (!confirm1) return;
  
  const confirm2 = confirm(
    `⚠️ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!\n\n` +
    `Все достижения и прогресс будут УДАЛЕНЫ НАВСЕГДА.\n\n` +
    `Вы уверены?`
  );
  
  if (!confirm2) return;
  
  // Сбрасываем
  resetAchievements();
  
  // Обновляем UI
  renderAchievements(currentCategory);
  updateCategoryStats(currentCategory);
  
  // Показываем сообщение
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
 * Настраивает вкладки, кнопки закрытия и сброса.
 * 
 * @returns {void}
 */
export function initAchievementsUI() {
  // Настройка вкладок
  document.querySelectorAll('.achievements-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      switchCategory(category);
    });
  });
  
  // Кнопка закрытия
  const closeBtn = document.getElementById('achievements-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAchievementsWindow);
  }
  
  // Кнопка сброса
  const resetBtn = document.getElementById('achievements-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', confirmResetAchievements);
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