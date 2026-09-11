/**
 * @fileoverview Точка входа для конфигурационных модулей ядра.
 * Экспортирует все основные компоненты: конфигурацию, игрока, состояние, функции
 * и централизованные размеры спрайтов.
 * 
 * @module core/config
 */

/**
 * Экспорт объекта CONFIG со всеми настройками игры
 * @see module:core/config/constants
 */
export { CONFIG } from './constants.js';

/**
 * Экспорт объекта player — состояние игрока
 * @see module:core/config/player
 */
export { player } from './player.js';

/**
 * Экспорт объекта state — глобальное состояние игры
 * @see module:core/config/state
 */
export { state } from './state.js';

/**
 * Экспорт основных игровых функций
 * @see module:core/config/functions
 */
export { updateMapSize, showGameOverScreen, resetGameFull } from './functions.js';

/**
 * Экспорт конфигурации размеров спрайтов и функций-помощников
 * @see module:core/config/spriteSizes
 */
export { 
  SPRITE_SIZES, 
  getCellBasedSize, 
  getLootSize, 
  getFireflySize,
  getInventorySize,
  getShopSize
} from './spriteSizes.js';