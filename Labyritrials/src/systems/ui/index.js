/**
 * @fileoverview Точка входа для UI-системы.
 * Экспортирует функции обновления UI, управления кнопками,
 * настройками, магазином и инвентарём.
 * 
 * @module systems/ui/index
 */

// ============================================================
// ОБНОВЛЕНИЕ UI
// ============================================================

/**
 * Экспорт функции обновления UI
 * @see module:systems/ui/statsUpdater
 */
export { updateUI } from './statsUpdater.js';

// ============================================================
// КНОПКИ УПРАВЛЕНИЯ
// ============================================================

/**
 * Экспорт функций управления кнопками
 * @see module:systems/ui/controlButtons
 */
export {
  updateControlButtonsVisibility,
  initControlButtons
} from './controlButtons.js';

// ============================================================
// НАСТРОЙКИ
// ============================================================

/**
 * Экспорт функций управления настройками
 * @see module:systems/ui/settings/index
 */
export {
  openSettings,
  closeSettings,
  initSettings,
  updateFpsDisplay,
  shouldSkipFrame,
  getFrameInterval
} from './settings/index.js';

// ============================================================
// МАГАЗИН
// ============================================================

/**
 * Экспорт функций управления магазином
 * @see module:systems/ui/shop/index
 */
export { initShopHandlers, updateShopUIForExternal } from './shop/index.js';

// ============================================================
// ИНВЕНТАРЬ
// ============================================================

/**
 * Экспорт функций управления инвентарём
 * @see module:systems/ui/inventory/index
 */
export {
  initInventory,
  openInventory,
  closeInventory,
  toggleInventory,
  getInventoryState,
  handleInventoryKey
} from './inventory/index.js';