/**
 * @fileoverview Менеджер достижений.
 * Управляет логикой проверки, разблокировки, прогресса и сохранения достижений.
 * 
 * @module systems/achievements/manager
 */

import { state } from '../../core/config/state.js';
import { ACHIEVEMENTS_LIST, getTotalCount } from './config.js';
import { showAchievementNotification } from './ui.js';
import { saveGame } from '../../save/saveSystem.js';
import { audio } from '../../audio/audioManager.js';

/** @type {string} - Ключ для хранения достижений в localStorage */
const ACHIEVEMENTS_STORAGE_KEY = 'labirithria_achievements';

/**
 * Загрузка достижений из localStorage
 * 
 * @returns {Object|null} - Загруженные данные или null при ошибке
 * @private
 */
function loadAchievementsFromStorage() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        unlocked: data.unlocked || [],
        progress: data.progress || {}
      };
    }
  } catch (e) {
    console.warn('⚠️ Не удалось загрузить достижения из localStorage:', e);
  }
  return null;
}

/**
 * Сохранение достижений в localStorage
 * 
 * @returns {void}
 * @private
 */
function saveAchievementsToStorage() {
  try {
    const data = {
      unlocked: state.achievements.unlocked || [],
      progress: state.achievements.progress || {}
    };
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('⚠️ Не удалось сохранить достижения в localStorage:', e);
  }
}

/**
 * Инициализация системы достижений
 * 
 * Загружает сохранённые достижения из localStorage или создаёт новую структуру.
 * Выполняет проверку достижений при старте.
 * 
 * @returns {void}
 */
export function initAchievements() {
  // Убеждаемся, что структура данных существует
  if (!state.achievements) {
    // Пытаемся загрузить из localStorage
    const saved = loadAchievementsFromStorage();
    if (saved) {
      state.achievements = saved;
    } else {
      state.achievements = {
        unlocked: [],
        progress: {}
      };
    }
  }
  
  // Проверяем достижения при старте
  checkAchievements();
}

/**
 * Получение текущего прогресса всех достижений
 * 
 * @returns {Object} - Объект с прогрессом достижений
 */
export function getProgress() {
  return state.achievements.progress || {};
}

/**
 * Получение списка разблокированных достижений
 * 
 * @returns {string[]} - Массив ID разблокированных достижений
 */
export function getUnlocked() {
  return state.achievements.unlocked || [];
}

/**
 * Обновление прогресса достижения
 * 
 * Добавляет значение к текущему прогрессу указанного ключа,
 * сохраняет изменения и проверяет достижения.
 * 
 * @param {string} key - Ключ прогресса (например, 'monsters_killed')
 * @param {number} value - Значение для добавления
 * @returns {void}
 */
export function updateProgress(key, value) {
  if (!state.achievements.progress) {
    state.achievements.progress = {};
  }
  
  const current = state.achievements.progress[key] || 0;
  state.achievements.progress[key] = current + value;
  
  // Сохраняем в localStorage
  saveAchievementsToStorage();
  
  // Проверяем достижения после обновления прогресса
  checkAchievements();
}

/**
 * Установка прогресса (для точных значений)
 * 
 * @param {string} key - Ключ прогресса
 * @param {number} value - Точное значение прогресса
 * @returns {void}
 */
export function setProgress(key, value) {
  if (!state.achievements.progress) {
    state.achievements.progress = {};
  }
  state.achievements.progress[key] = value;
  
  // Сохраняем в localStorage
  saveAchievementsToStorage();
  
  checkAchievements();
}

/**
 * Проверка всех достижений
 * 
 * Проходит по списку всех достижений, проверяет условия разблокировки
 * и разблокирует достижения, условия которых выполнены.
 * 
 * @returns {void}
 */
export function checkAchievements() {
  const progress = state.achievements.progress || {};
  const unlocked = state.achievements.unlocked || [];
  
  let hasNewUnlock = false;
  
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS_LIST)) {
    // Пропускаем уже разблокированные
    if (unlocked.includes(id)) continue;
    
    // Проверяем условие
    if (achievement.check(progress)) {
      unlockAchievement(id);
      hasNewUnlock = true;
    }
  }
  
  // Если были новые разблокировки, сохраняем
  if (hasNewUnlock) {
    saveAchievementsToStorage();
  }
}

/**
 * Разблокировка достижения
 * 
 * @param {string} id - ID достижения
 * @returns {void}
 */
export function unlockAchievement(id) {
  const achievement = ACHIEVEMENTS_LIST[id];
  if (!achievement) {
    console.warn(`⚠️ Достижение "${id}" не найдено`);
    return;
  }
  
  // Проверяем, не разблокировано ли уже
  if (state.achievements.unlocked.includes(id)) return;
  
  // Добавляем в список разблокированных
  state.achievements.unlocked.push(id);
  
  console.log(`🏆 Достижение разблокировано: ${achievement.name}`);
  
  // Показываем уведомление
  showAchievementNotification(id);

  // Воспроизводим звук
  try {
    audio.playSound('achievementCompleted', 0.8);
  } catch (e) {
    console.warn('⚠️ Не удалось воспроизвести звук достижения:', e);
  }
  
  // Сохраняем в localStorage
  saveAchievementsToStorage();
  
  // Сохраняем игру
  try {
    saveGame();
  } catch (e) {
    console.warn('⚠️ Не удалось сохранить достижение:', e);
  }
}

/**
 * Проверка, разблокировано ли достижение
 * 
 * @param {string} id - ID достижения
 * @returns {boolean} - true, если достижение разблокировано
 */
export function isUnlocked(id) {
  return (state.achievements.unlocked || []).includes(id);
}

/**
 * Получение статуса достижения
 * 
 * @param {string} id - ID достижения
 * @returns {Object|null} - Объект с данными достижения или null
 */
export function getAchievementState(id) {
  const achievement = ACHIEVEMENTS_LIST[id];
  if (!achievement) return null;
  
  const unlocked = isUnlocked(id);
  const progress = state.achievements.progress || {};
  const current = achievement.getProgress(progress);
  const max = achievement.maxProgress;
  const isCompleted = current >= max;
  
  return {
    ...achievement,
    unlocked,
    current,
    max,
    isCompleted,
    progressPercent: Math.min(100, (current / max) * 100)
  };
}

/**
 * Получение всех достижений с их статусами
 * 
 * @returns {Array} - Массив объектов достижений с статусами
 */
export function getAllAchievementsState() {
  const result = [];
  for (const [id] of Object.entries(ACHIEVEMENTS_LIST)) {
    result.push(getAchievementState(id));
  }
  return result;
}

/**
 * Получение достижений по категории с их статусами
 * 
 * @param {string} categoryId - ID категории
 * @returns {Array} - Массив объектов достижений в категории
 */
export function getAchievementsByCategoryState(categoryId) {
  const result = [];
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS_LIST)) {
    if (achievement.category === categoryId) {
      result.push(getAchievementState(id));
    }
  }
  return result;
}

/**
 * Получение статистики достижений
 * 
 * @returns {Object} - Объект со статистикой { total, unlocked }
 */
export function getAchievementsStats() {
  const total = getTotalCount();
  const unlocked = (state.achievements.unlocked || []).length;
  return { total, unlocked };
}

/**
 * Сброс всех достижений
 * 
 * Полностью очищает все достижения и прогресс.
 * Требует подтверждения через UI.
 * 
 * @returns {void}
 */
export function resetAchievements() {
  state.achievements.unlocked = [];
  state.achievements.progress = {};
  
  // Удаляем ключ из localStorage
  try {
    localStorage.removeItem('labirithria_achievements');
  } catch (e) {
    console.warn('⚠️ Не удалось очистить localStorage:', e);
  }
  
  // Сохраняем пустые данные
  saveAchievementsToStorage();
  
  try {
    saveGame();
  } catch (e) {
    console.warn('⚠️ Не удалось сохранить после сброса достижений:', e);
  }
  
  console.log('🗑️ Все достижения сброшены');
}

/**
 * Получение списка скрытых достижений
 * 
 * @returns {string[]} - Массив ID скрытых достижений
 */
export function getHiddenAchievements() {
  const result = [];
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS_LIST)) {
    if (achievement.hidden === true) {
      result.push(id);
    }
  }
  return result;
}

/**
 * Проверка, является ли достижение скрытым
 * 
 * @param {string} id - ID достижения
 * @returns {boolean} - true, если достижение скрытое
 */
export function isHidden(id) {
  const achievement = ACHIEVEMENTS_LIST[id];
  return achievement ? achievement.hidden === true : false;
}

/**
 * Получение количества достижений в категории
 * 
 * @param {string} categoryId - ID категории ('all' для всех)
 * @returns {Object} - Объект { total, unlocked }
 */
export function getCategoryStats(categoryId) {
  let achievements;
  if (categoryId === 'all') {
    achievements = getAllAchievementsState();
  } else {
    achievements = getAchievementsByCategoryState(categoryId);
  }
  
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  
  return { total, unlocked };
}