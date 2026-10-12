/**
 * @fileoverview Отдельные проверки для системы "умной" сложности.
 * Каждая проверка возвращает множитель (число около 1.0).
 * 
 * @module systems/difficulty/checkers
 */

import { state, player } from '../../core/config/index.js';
import { DIFFICULTY_CONFIG } from './config.js';

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
 * Линейная интерполяция между двумя точками.
 * 
 * @param {number} t - Прогресс (0..1)
 * @param {number} from - Значение при t = 0
 * @param {number} to - Значение при t = 1
 * @returns {number}
 * @private
 */
function lerp(t, from, to) {
  return from + (to - from) * t;
}

/**
 * Получение бонуса от текущего оружия игрока.
 * 
 * @returns {number} - Множитель бонуса (например, 1.05 для громового посоха)
 * @private
 */
function getWeaponBonus() {
  const cfg = DIFFICULTY_CONFIG.weaponBonus;
  const weapon = player.meleeWeapon || 'default';
  return cfg[weapon] || cfg.default;
}

// ============================================================
// ПРОВЕРКА 1: СИЛА БИЛДА
// ============================================================

/**
 * Проверка 1: индекс силы билда игрока.
 * 
 * Считает "насколько игрок силён" относительно эталонного среднего игрока.
 * Возвращает множитель в диапазоне [minMultiplier, maxMultiplier].
 * 
 * @returns {number} - Множитель сложности от билда
 */
export function checkBuildPower() {
  const cfg = DIFFICULTY_CONFIG.buildPower;

  // Нормализация ключевых характеристик к "эталонным"
  const dmgFactor = (player.baseDamage || 0) / cfg.referenceDamage;
  const hpFactor = (player.maxHp || 0) / cfg.referenceMaxHp;
  const artifactFactor = 1 + (player.artifactsCollected || 0) * cfg.artifactBonus;
  const weaponBonus = getWeaponBonus();

  // Взвешенная сумма: урон 40%, HP 40%, артефакты 20%, x бонус оружия
  const rawPower = (dmgFactor * 0.4 + hpFactor * 0.4 + artifactFactor * 0.2) * weaponBonus;

  // Clamp "сырой" силы в разумные рамки
  const power = clamp(rawPower, cfg.minClamp, cfg.maxClamp);

  // Перевод power -> множитель сложности через линейную интерполяцию
  let multiplier;
  if (power <= 1.0) {
    const t = (power - cfg.minClamp) / (1.0 - cfg.minClamp);
    multiplier = lerp(t, cfg.minMultiplier, 1.0);
  } else {
    const t = (power - 1.0) / (cfg.maxClamp - 1.0);
    multiplier = lerp(t, 1.0, cfg.maxMultiplier);
  }

  return multiplier;
}

// ============================================================
// ПРОВЕРКА 2: ИСТОРИЯ СМЕРТЕЙ
// ============================================================

/**
 * Проверка 2: история недавних смертей.
 * 
 * Чем больше смертей за последние забеги, тем ниже сложность.
 * Хранится в state.metaProgress.recentDeaths.
 * 
 * @returns {number} - Множитель сложности от истории смертей
 */
export function checkDeathFactor() {
  const cfg = DIFFICULTY_CONFIG.deathFactor;
  const recentDeaths = state.metaProgress?.recentDeaths || 0;

  if (recentDeaths <= 0) return cfg.zeroDeathsMultiplier;
  if (recentDeaths === 1) return cfg.oneDeathMultiplier;
  if (recentDeaths === 2) return cfg.twoDeathsMultiplier;
  return cfg.threePlusDeathsMultiplier;
}

// ============================================================
// ПРОВЕРКА 3: СОСТОЯНИЕ HP НА ВХОДЕ
// ============================================================

/**
 * Проверка 3: состояние HP игрока на входе на уровень.
 * 
 * Чем больше HP — тем увереннее игрок, можно дать чуть больше сложности.
 * Чем меньше HP — тем ниже сложность (игрок "на грани").
 * 
 * @returns {number} - Множитель сложности от HP
 */
export function checkHpFactor() {
  const cfg = DIFFICULTY_CONFIG.hpFactor;
  const maxHp = player.maxHp || 100;
  const hpPercent = (player.hp || 0) / maxHp;

  if (hpPercent > 0.9) return cfg.fullHpMultiplier;
  if (hpPercent > 0.6) return cfg.healthyHpMultiplier;
  if (hpPercent > 0.3) return cfg.mediumHpMultiplier;
  return cfg.lowHpMultiplier;
}

// ============================================================
// ПРОВЕРКА 4: ТЕМП ПРОХОЖДЕНИЯ
// ============================================================

/**
 * Проверка 4: темп прохождения уровня.
 * 
 * Использует среднее время за последние 3 уровня (state.recentLevelDurations).
 * Не зависит от текущего уровня — влияет на следующий.
 * 
 * Если история пуста — возвращает нейтральный множитель.
 * 
 * @returns {number} - Множитель сложности от темпа
 */
export function checkPaceFactor() {
  const cfg = DIFFICULTY_CONFIG.paceFactor;
  const durations = state.recentLevelDurations || [];
  
  // Нет истории - нейтрально
  if (durations.length === 0) return cfg.baselineMultiplier;
  
  // Среднее время за последние N уровней
  const sum = durations.reduce((acc, d) => acc + d, 0);
  const averageSeconds = sum / durations.length;
  const ratio = averageSeconds / cfg.referenceLevelTime;
  
  if (ratio < cfg.fastThreshold) return cfg.fastMultiplier;
  if (ratio < cfg.normalThreshold) return cfg.normalMultiplier;
  if (ratio < cfg.slowThreshold) return cfg.baselineMultiplier;
  if (ratio < cfg.verySlowThreshold) return cfg.slowMultiplier;
  return cfg.verySlowMultiplier;
}

// ============================================================
// ПРОВЕРКА 5: ИНДЕКС СТРЕССА
// ============================================================

/**
 * Проверка 5: индекс стресса игрока за последние N секунд.
 * 
 * Окно стресса не сбрасывается при переходе между уровнями -
 * оно накапливает события сквозь уровни. Это позволяет учитывать
 * реальный "стресс" игрока за последние 2 минуты игры.
 * 
 * Влияет на сложность следующего уровня: события, накопленные
 * на текущем уровне, учитываются при спавне монстров следующего.
 * 
 * @returns {number} - Множитель сложности от стресса
 */
export function checkStressFactor() {
  const cfg = DIFFICULTY_CONFIG.stressFactor;

  // Окно событий заполняется извне
  const window = state.stressWindow || [];

  // Фильтрация событий по времени
  const now = Date.now();
  const cutoff = now - cfg.windowSeconds * 1000;
  const recent = window.filter(e => e.time >= cutoff);

  // Подсчёт компонентов стресса
  let damageTaken = 0;
  let potionsUsed = 0;
  let trapsTriggered = 0;

  for (const e of recent) {
    if (e.type === 'damage') damageTaken += e.amount || 0;
    else if (e.type === 'potion') potionsUsed++;
    else if (e.type === 'trap') trapsTriggered++;
  }

  // Нормализация компонентов (0..1)
  const dmgNorm = clamp(damageTaken / cfg.referenceDamageTaken, 0, 1);
  const potionNorm = clamp(potionsUsed / cfg.referencePotionsUsed, 0, 1);
  const trapNorm = clamp(trapsTriggered / cfg.referenceTrapsTriggered, 0, 1);

  // Взвешенная сумма
  const w = cfg.componentWeights;
  let stressIndex = dmgNorm * w.damageTaken + potionNorm * w.potionsUsed + trapNorm * w.trapsTriggered;
  // Clamp
  stressIndex = clamp(stressIndex, 0, cfg.maxStressIndex);

  // Перевод stressIndex -> множитель
  // 0.0 -> calmMultiplier (легче нет, но игрок спокоен => можно дать больше сложности)
  // 0.5 -> mediumStressMultiplier
  // 1.0 -> highStressMultiplier (страдает => упрощение)
  let multiplier;
  if (stressIndex <= 0.5) {
    const t = stressIndex / 0.5;
    multiplier = lerp(t, cfg.calmMultiplier, cfg.mediumStressMultiplier);
  } else {
    const t = (stressIndex - 0.5) / 0.5;
    multiplier = lerp(t, cfg.mediumStressMultiplier, cfg.highStressMultiplier);
  }

  return multiplier;
}

// ============================================================
// DEBUG-СНИМОК
// ============================================================

/**
 * Получение "сырых" значений всех проверок.
 * Используется для debug-логирования.
 * 
 * @returns {Object} - Объект со значениями проверок
 */
export function getDebugSnapshot() {
  return {
    buildPower: checkBuildPower(),
    deathFactor: checkDeathFactor(),
    hpFactor: checkHpFactor(),
    paceFactor: checkPaceFactor(),
    stressFactor: checkStressFactor(),
    recentDeaths: state.metaProgress?.recentDeaths || 0,
  };
}