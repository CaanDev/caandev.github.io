/**
 * @fileoverview Восстановление данных лабиринта.
 * 
 * @module save/restorers/mazeRestorer
 */

import { CONFIG, state } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { Cell } from '../../world/cells/cell.js';
import {
  restoreMazeGrid,
  restoreRevealedCells,
  restorePortalFlagsOnGrid,
  restoreNotesOnGrid
} from './helpers.js';

/**
 * Восстановление данных о лабиринте
 * 
 * @param {Object} save - Объект сохранения
 * @returns {boolean} - true, если восстановление успешно
 */
export function restoreMazeData(save) {
  if (save.mazeCols && save.mazeRows) {
    CONFIG.cols = save.mazeCols;
    CONFIG.rows = save.mazeRows;
    CONFIG.goal = save.mazeGoal || { x: CONFIG.cols - 13, y: CONFIG.rows - 13 };
    CONFIG.shopPos = save.mazeShopPos || { x: 1, y: 2 };
  }

  if (!restoreMazeGrid(save.mazeGrid)) {
    logger.warn('⚠️ Не удалось восстановить лабиринт');
    return false;
  }

  restoreRevealedCells(save.revealedCells);
  restorePillarsData(save);
  restorePortalFlagsOnGrid(save);

  // Восстанавливаем записки на сетке
  restoreNotesOnGrid();

  return true;
}

/**
 * Восстановление данных о колоннах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {boolean} - true, если восстановление успешно
 */
export function restorePillarsData(save) {
  let pillarsData = null;

  if (save.pillars && Array.isArray(save.pillars)) {
    pillarsData = save.pillars;
  } else if (save.secretRoomsData && save.secretRoomsData.pillars) {
    pillarsData = save.secretRoomsData.pillars;
  } else if (save.mazeData && save.mazeData.pillars) {
    pillarsData = save.mazeData.pillars;
  }

  if (!pillarsData || !Array.isArray(pillarsData) || pillarsData.length === 0) {
    state.pillars = [];
    return false;
  }

  state.pillars = pillarsData.map(p => ({
    x: p.x,
    y: p.y,
    gridX: p.gridX,
    gridY: p.gridY,
    size: p.size || CONFIG.cellSize * 0.65,
    isPillar: p.isPillar !== undefined ? p.isPillar : true,
    hasTorch: p.hasTorch || false,
    torchFlicker: p.torchFlicker || 0
  }));

  for (const pillar of state.pillars) {
    const { gridX, gridY } = pillar;
    if (state.grid[gridY] && state.grid[gridY][gridX]) {
      state.grid[gridY][gridX].isPillar = true;
      state.grid[gridY][gridX].isWall = false;
      state.grid[gridY][gridX].revealed = true;
    }
  }

  return true;
}