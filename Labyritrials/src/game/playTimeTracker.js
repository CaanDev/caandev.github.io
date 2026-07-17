/**
 * @fileoverview Отслеживание времени игры.
 * Управляет подсчётом времени, проведённого в игре, с учётом пауз и состояний.
 * 
 * @module game/playTimeTracker
 */

import { state, player } from '../core/config/index.js';

/** @type {number} - Время последнего обновления (мс) */
let lastTimestamp = 0;
/** @type {boolean} - Активно ли отслеживание времени */
let isTracking = false;
/** @type {number|null} - Интервал обновления */
let updateInterval = null;

/**
 * Запуск отслеживания времени игры
 * 
 * @returns {void}
 */
export function startPlayTimeTracking() {
  if (isTracking) return;
  
  isTracking = true;
  lastTimestamp = Date.now();
  
  updateInterval = setInterval(() => {
    if (player.hp <= 0) return;
    if (state.isShopOpen) return;
    
    const now = Date.now();
    const delta = (now - lastTimestamp) / 1000;
    lastTimestamp = now;
    
    state.playTimeAccumulator += delta;
    state.gameStats.playTime += delta;
  }, 1000);
}

/**
 * Остановка отслеживания времени игры
 * 
 * @returns {void}
 */
export function stopPlayTimeTracking() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  isTracking = false;
}

/**
 * Пауза отслеживания времени игры
 * 
 * @returns {void}
 */
export function pausePlayTimeTracking() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    lastTimestamp = Date.now();
  }
}

/**
 * Возобновление отслеживания времени игры
 * 
 * @returns {void}
 */
export function resumePlayTimeTracking() {
  if (isTracking && !updateInterval) {
    lastTimestamp = Date.now();
    updateInterval = setInterval(() => {
      if (player.hp <= 0) return;
      const now = Date.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      state.playTimeAccumulator += delta;
      state.gameStats.playTime += delta;
    }, 1000);
  }
}

/**
 * Форматирование времени в формат ЧЧ:ММ:СС или ММ:СС
 * 
 * @param {number} seconds - Время в секундах
 * @returns {string} - Отформатированное время
 */
export function formatPlayTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Обновление отображения времени в UI
 * 
 * @returns {void}
 */
export function updatePlayTimeDisplay() {
  const playTimeElement = document.getElementById('play-time-display');
  if (playTimeElement) {
    playTimeElement.textContent = formatPlayTime(state.gameStats.playTime);
  }
}

/**
 * Сброс времени игры
 * 
 * @returns {void}
 */
export function resetPlayTime() {
  stopPlayTimeTracking();
  state.playTimeAccumulator = 0;
  state.gameStats.playTime = 0;
  lastTimestamp = 0;
}