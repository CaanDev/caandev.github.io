/**
 * @fileoverview Рендерер лабиринта.
 * Экспортирует функции отрисовки пола, стен, колонн и рун.
 * 
 * @module systems/rendering/mazeRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { isCellVisibleSimple } from './visibilityUtils.js';
import { drawFloor, drawWalls, drawPillars, drawRunes } from './maze/index.js';

/**
 * Экспорт функций отрисовки элементов лабиринта
 * @see module:systems/rendering/maze/floors/floorRenderer
 * @see module:systems/rendering/maze/walls/wallRenderer
 * @see module:systems/rendering/maze/pillars
 * @see module:systems/rendering/maze/runes
 */
export { drawFloor, drawWalls, drawPillars, drawRunes };