/**
 * @fileoverview Точка входа ядра игры.
 * Экспортирует все основные модули для внешнего использования.
 * 
 * @module core
 */

/**
 * Экспорт конфигурационных модулей
 * @see module:core/config
 */
export { CONFIG, player, state, updateMapSize, showGameOverScreen, resetGameFull } from './config/index.js';

/**
 * Экспорт основного объекта Game
 * @see module:core/game
 */
export { Game } from './game.js';

/**
 * Экспорт функции создания игрового цикла
 * @see module:core/gameLoop
 */
export { createGameLoop } from './gameLoop.js';

/**
 * Экспорт объекта инициализации игры
 * @see module:core/gameInit
 */
export { GameInit } from './gameInit.js';

/**
 * Экспорт объекта рендерера
 * @see module:core/renderer
 */
export { Renderer } from './renderer.js';