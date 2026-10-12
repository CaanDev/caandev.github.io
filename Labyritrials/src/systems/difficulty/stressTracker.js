/**
 * @fileoverview Трекер стресса игрока.
 * Собирает события (урон, зелья, ловушки) в скользящее окно для последующего анализа в checkStressFactor().
 * 
 * @module systems/difficulty/stressTracker
 */

import { state } from '../../core/config/index.js';
import { DIFFICULTY_CONFIG } from './config.js';

/**
 * Инициализация окна стресса (если его нет).
 * 
 * @returns {void}
 * @private
 */
function ensureWindow() {
  if (!state.stressWindow) state.stressWindow = [];
}

/**
 * Очистка устаревших событий из окна.
 * 
 * @returns {void}
 * @private
 */
function pruneWindow() {
  ensureWindow();
  const cutoff = Date.now() - DIFFICULTY_CONFIG.stressFactor.windowSeconds * 1000;
  state.stressWindow = state.stressWindow.filter(e => e.time >= cutoff);
}

/**
 * Регистрация полученного урона.
 * 
 * @param {number} amount - Количество урона
 * @returns {void}
 */
export function trackDamage(amount) {
  if (!amount || amount <= 0) return;
  ensureWindow();
  state.stressWindow.push({
    type: 'damage',
    amount,
    time: Date.now(),
  });
  pruneWindow();
}

/**
 * Регистрация использования зелья.
 * 
 * @returns {void}
 */
export function trackPotion() {
  ensureWindow();
  state.stressWindow.push({
    type: 'potion',
    time: Date.now(),
  });
  pruneWindow();
}

/**
 * Регистрация активации ловушки.
 * 
 * @returns {void}
 */
export function trackTrap() {
  ensureWindow();
  state.stressWindow.push({
    type: 'trap',
    time: Date.now(),
  });
  pruneWindow();
}

/**
 * Полная очистка окна стресса.
 * 
 * Вызывать только при смерти игрока или полном сбросе игры.
 * Не вызывать при переходе между уровнями - окно копится сквозь уровни.
 * 
 * @returns {void}
 */
export function resetStressWindow() {
  state.stressWindow = [];
}