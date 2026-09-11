/**
 * @fileoverview Рендерер UI-элементов на игровом поле.
 * Экспортирует функции отрисовки мини-карты, индикаторов событий,
 * адаптаций, полоски здоровья босса и названия комнаты.
 * 
 * @module systems/rendering/uiRenderer
 */

import {
  drawMiniMap,
  drawEventIndicator,
  drawAdaptationIndicator,
  drawBossHealthBar,
  drawRoomLabel
} from './ui/index.js';

/**
 * Экспорт функций отрисовки UI-элементов
 * @see module:systems/rendering/ui/miniMap
 * @see module:systems/rendering/ui/eventIndicator
 * @see module:systems/rendering/ui/adaptationIndicator
 * @see module:systems/rendering/ui/bossHealthBar
 * @see module:systems/rendering/ui/roomLabel
 */
export {
  drawMiniMap,
  drawEventIndicator,
  drawAdaptationIndicator,
  drawBossHealthBar,
  drawRoomLabel
};