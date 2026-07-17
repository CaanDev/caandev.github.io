/**
 * @fileoverview Основной рендерер пола.
 * Координирует отрисовку пола в зависимости от типа комнаты,
 * применяет особенности и добавляет декоративные элементы.
 * 
 * @module systems/rendering/maze/floors/floorRenderer
 */

import { CONFIG, state, player } from '../../../../core/config/index.js';
import {
  getFloorTypeFromState,
  getFloorColors,
  getFloorMainColor,
  isCheckered,
  getFloorFeatures,
  hasFeature
} from './floorConfig.js';
import { drawSolidFloor, drawCheckeredFloor } from './patterns.js';
import { 
  drawMagicCircle, 
  drawCornerRunes, 
  drawShrineGlow, 
  drawTrapGlow
} from './features.js';
import { drawRunes } from '../runes.js';

/**
 * Основной рендерер пола
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {{startX: number, endX: number, startY: number, endY: number}} visibleRange - Диапазон видимых клеток
 * @returns {void}
 */
export function drawFloor(ctx, visibleRange) {
  const { startX, endX, startY, endY } = visibleRange;
  
  const minX = Math.max(0, startX);
  const maxX = Math.min(CONFIG.cols, endX);
  const minY = Math.max(0, startY);
  const maxY = Math.min(CONFIG.rows, endY);
  
  // ===== ОПРЕДЕЛЯЕМ ТИП ПОЛА =====
  const floorType = getFloorTypeFromState(state);
  const colors = getFloorColors(floorType);
  const isCheckeredFloor = isCheckered(floorType);
  const features = getFloorFeatures(floorType);
  
  // ===== РИСУЕМ ПОЛ =====
  if (isCheckeredFloor) {
    drawCheckeredFloor(ctx, minX, maxX, minY, maxY, state.grid, player, colors);
  } else {
    drawSolidFloor(ctx, minX, maxX, minY, maxY, state.grid, player, colors[0]);
  }
  
  // ===== РИСУЕМ ОСОБЕННОСТИ =====
  drawFloorFeatures(ctx, features);

  // ===== РУНЫ В КОМНАТЕ С АЛТАРЁМ =====
  if (state.inShrineRoom) {
    drawRunes(ctx, visibleRange);
  }
}

/**
 * Отрисовка особенностей пола
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {string[]} features - Массив названий особенностей
 * @returns {void}
 * @private
 */
function drawFloorFeatures(ctx, features) {
  for (const feature of features) {
    switch (feature) {
      case 'magicCircle':
        drawMagicCircle(ctx);
        break;
      case 'cornerRunes':
        drawCornerRunes(ctx);
        break;
      case 'shrineGlow':
        drawShrineGlowForRoom(ctx);
        break;
      case 'trapGlow':
        drawTrapGlowForRoom(ctx);
        break;
    }
  }
}

/**
 * Отрисовка свечения для комнаты с алтарём
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawShrineGlowForRoom(ctx) {
  for (const shrine of state.shrines) {
    if (!shrine.activated) {
      drawShrineGlow(ctx, shrine.x, shrine.y);
    }
  }
}

/**
 * Отрисовка свечения для комнаты-ловушки
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawTrapGlowForRoom(ctx) {
  // Используем центр комнаты или позицию портала
  if (state.trapPortal) {
    const x = state.trapPortal.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = state.trapPortal.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    drawTrapGlow(ctx, x, y);
  }
}