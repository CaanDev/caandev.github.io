/**
 * @fileoverview Менеджер "умной" сложности.
 * Считает итоговый множитель и предоставляет API для его получения.
 * 
 * @module systems/difficulty/difficultyManager
 */

import { state } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { DIFFICULTY_CONFIG } from './config.js';
import {
  checkBuildPower, checkDeathFactor, checkHpFactor,
  checkPaceFactor, checkStressFactor, getDebugSnapshot,
} from './checkers.js';
import { saveMetaProgress } from './metaStorage.js';

/** @type {number|null} - Кэш множителя на текущий уровень */
let cachedMultiplier = null;

/** @type {boolean} - Флаг, что множитель уже логировался в этом уровне */
let debugLogged = false;

/**
 * Ограничение числа в диапазоне.
 * 
 * @param {number} value - Значение
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number}
 * @private
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Сброс кэша множителя.
 * Вызывать при переходе на новый уровень.
 * 
 * @returns {void}
 */
export function resetDifficultyCache() {
  cachedMultiplier = null;
  debugLogged = false;
}

/**
 * Расчёт итогового множителя сложности для обычных уровней.
 * 
 * Комбинирует все проверки через взвешенное произведение:
 * итог = buildPower^w1 × deathFactor^w2 × ...
 * 
 * Такой подход даёт плавный результат и не допускает "скачков".
 * 
 * @returns {number} - Множитель в [minMultiplier, maxMultiplier]
 */
export function calculateDifficultyMultiplier() {
  const cfg = DIFFICULTY_CONFIG;

  if (!cfg.enabled) return 1.0;

  const w = cfg.weights;
  const buildPower = checkBuildPower();
  const deathFactor = checkDeathFactor();
  const hpFactor = checkHpFactor();
  const paceFactor = checkPaceFactor();
  const stressFactor = checkStressFactor();

  // Взвешенное произведение: мягко комбинирует факторы
  let multiplier =
    Math.pow(buildPower, w.buildPower) * Math.pow(deathFactor, w.deathFactor) *
    Math.pow(hpFactor, w.hpFactor) * Math.pow(paceFactor, w.paceFactor) * Math.pow(stressFactor, w.stressFactor);

  // Финальный clamp
  multiplier = clamp(multiplier, cfg.minMultiplier, cfg.maxMultiplier);

  return multiplier;
}

/**
 * Получение множителя сложности для обычных уровней (с кэшем).
 * 
 * @returns {number} - Множитель сложности
 */
export function getDifficultyMultiplier() {
  if (cachedMultiplier !== null) return cachedMultiplier;
  cachedMultiplier = calculateDifficultyMultiplier();
  return cachedMultiplier;
}

/**
 * Получение множителя сложности для босс-уровней.
 * 
 * Отличие от обычных уровней: более узкий диапазон.
 * 
 * @returns {number} - Множитель сложности для боссов
 */
export function getBossDifficultyMultiplier() {
  const cfg = DIFFICULTY_CONFIG;

  if (!cfg.enabled) return 1.0;

  const base = getDifficultyMultiplier();

  // Пересчёт к более узкому диапазону для боссов
  let bossMultiplier;
  if (base <= 1.0) {
    const t = (base - cfg.minMultiplier) / (1.0 - cfg.minMultiplier);
    bossMultiplier = cfg.minBossMultiplier + t * (1.0 - cfg.minBossMultiplier);
  } else {
    const t = (base - 1.0) / (cfg.maxMultiplier - 1.0);
    bossMultiplier = 1.0 + t * (cfg.maxBossMultiplier - 1.0);
  }

  return clamp(bossMultiplier, cfg.minBossMultiplier, cfg.maxBossMultiplier);
}

// ============================================================
// УПРАВЛЕНИЕ ИСТОРИЕЙ СМЕРТЕЙ
// ============================================================

/**
 * Увеличение счётчика недавних смертей.
 * Вызывается при смерти игрока.
 * 
 * @returns {void}
 */
export function registerDeath() {
  if (!state.metaProgress) state.metaProgress = { recentDeaths: 0 };

  const max = DIFFICULTY_CONFIG.deathFactor.maxRecentDeaths;
  state.metaProgress.recentDeaths = Math.min(max, (state.metaProgress.recentDeaths || 0) + 1);

  // Сохранение в localStorage - метапрогресс переживает смерть игрока
  saveMetaProgress();
}

/**
 * Сброс счётчика недавних смертей.
 * Вызывается при успешном прохождении "значительного" рубежа
 * (например, после победы над боссом).
 * 
 * @returns {void}
 */
export function resetDeathStreak() {
  if (!state.metaProgress) return;

  if ((state.metaProgress.recentDeaths || 0) > 0) {
    state.metaProgress.recentDeaths = 0;
    // Сохранение в localStorage
    saveMetaProgress();
  }
}