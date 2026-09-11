/**
 * @fileoverview Точка входа для системы тумана войны.
 * Экспортирует функции рендеринга, утилиты и компоненты освещения.
 * 
 * @module systems/fog/index
 */

// ============================================================
// ОСНОВНОЙ РЕНДЕРИНГ
// ============================================================

/**
 * Экспорт функций рендеринга тумана
 * @see module:systems/fog/fogRenderer
 */
export { drawFogOfWar, refreshFogCompletely, updateLightZones } from './fogRenderer.js';

// ============================================================
// УТИЛИТЫ
// ============================================================

/**
 * Экспорт вспомогательных функций тумана
 * @see module:systems/fog/fogUtils
 */
export {
  getDistanceVisibility,
  getFadedColor,
  getCurrentFogRadius,
  getEventFogColor
} from './fogUtils.js';

// ============================================================
// ОСВЕЩЕНИЕ
// ============================================================

/**
 * Экспорт функции света от огненных шаров
 * @see module:systems/fog/fogLight
 */
export { drawFireballLight } from './fogLight.js';