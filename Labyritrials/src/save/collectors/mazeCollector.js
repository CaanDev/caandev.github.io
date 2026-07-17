/**
 * @fileoverview Сбор данных лабиринта.
 * 
 * @module save/collectors/mazeCollector
 */

import { CONFIG, state } from '../../core/config/index.js';
import { saveMazeGrid, saveRevealedCells } from './helpers.js';

/**
 * Сбор данных о лабиринте
 * 
 * @returns {Object} - Данные о лабиринте
 */
export function collectMazeData() {
  return {
    mazeCols: CONFIG.cols,
    mazeRows: CONFIG.rows,
    mazeGoal: { x: CONFIG.goal.x, y: CONFIG.goal.y },
    mazeShopPos: { x: CONFIG.shopPos.x, y: CONFIG.shopPos.y },
    mazeGrid: saveMazeGrid(),
    revealedCells: saveRevealedCells(),
    pillars: collectPillarsData()
  };
}

/**
 * Сбор данных о колоннах
 * 
 * @returns {Object[]} - Массив данных о колоннах
 */
export function collectPillarsData() {
  if (!state.pillars || state.pillars.length === 0) return [];
  
  return state.pillars.map(p => ({
    x: p.x,
    y: p.y,
    gridX: p.gridX,
    gridY: p.gridY,
    size: p.size,
    isPillar: p.isPillar,
    hasTorch: p.hasTorch || false,
    torchFlicker: p.torchFlicker || 0
  }));
}