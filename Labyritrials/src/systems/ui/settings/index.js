/**
 * @fileoverview Точка входа для системы настроек.
 * Экспортирует все функции управления настройками, UI и производительностью.
 * 
 * @module systems/ui/settings/index
 */

// ============================================================
// UI НАСТРОЕК
// ============================================================

/**
 * Экспорт функций UI настроек
 * @see module:systems/ui/settings/settingsUI
 */
export {
  openSettings,
  closeSettings,
  initSettings,
  isSettingsOpen,
  updateFpsDisplay,
  shouldSkipFrame,
  getFrameInterval,
  updateFpsLimit,
  switchSettingsTab,
  initSettingsHandlers
} from './settingsUI.js';

// ============================================================
// МЕНЕДЖЕР НАСТРОЕК
// ============================================================

/**
 * Экспорт функций управления настройками
 * @see module:systems/ui/settings/settingsManager
 */
export { getSettings, updateSetting } from './settingsManager.js';