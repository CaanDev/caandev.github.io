/**
 * @fileoverview Утилиты для исследовательницы.
 * Поиск подходящих тупиков и проверки условий спавна.
 * 
 * @module entities/npc/researcher/utils
 */

import { CONFIG, state } from '../../../core/config/index.js';

/**
 * Минимальное манхэттенское расстояние от старта (1,1) до тупика.
 * @type {number}
 */
const MIN_DISTANCE_FROM_START = 15;

/**
 * Проверка, является ли клетка стеной.
 * 
 * @param {number} x - Координата X по сетке
 * @param {number} y - Координата Y по сетке
 * @returns {boolean} - true, если клетка — стена
 * @private
 */
function isWall(x, y) {
  if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return true;
  const cell = state.grid[y]?.[x];
  return !cell || cell.isWall;
}

/**
 * Проверка, свободна ли клетка от объектов.
 * Исключает: монстров, ловушки, сундуки, артефакты, предметы, записки, колонны, порталы.
 * 
 * @param {number} x - Координата X по сетке
 * @param {number} y - Координата Y по сетке
 * @returns {boolean} - true, если клетка свободна
 * @private
 */
function isCellFree(x, y) {
  const cell = state.grid[y]?.[x];
  if (!cell) return false;
  if (cell.isWall) return false;
  if (cell.isPillar) return false;
  if (cell.isPortal) return false;
  if (cell.isFakePortal) return false;
  if (cell.isTrapExitPortal) return false;
  if (cell.isShrinePortal) return false;
  if (cell.isExitPortal) return false;
  if (cell.hasNote) return false;
  if (cell.hasBookshelf) return false;
  if (cell.hasTaskBoard) return false;

  // Проверка монстров
  for (const m of state.monsters) {
    if (Math.floor(m.x / CONFIG.cellSize) === x && Math.floor(m.y / CONFIG.cellSize) === y) return false;
  }

  // Проверка ловушек
  for (const t of state.traps) {
    if (Math.floor(t.x / CONFIG.cellSize) === x && Math.floor(t.y / CONFIG.cellSize) === y) return false;
  }

  // Проверка сундуков
  for (const c of state.chests) {
    if (Math.floor(c.x / CONFIG.cellSize) === x && Math.floor(c.y / CONFIG.cellSize) === y) return false;
  }

  // Проверка артефактов
  for (const a of state.artifacts) {
    if (Math.floor(a.x / CONFIG.cellSize) === x && Math.floor(a.y / CONFIG.cellSize) === y) return false;
  }

  // Проверка предметов на полу
  for (const l of state.lootItems) {
    if (Math.floor(l.x / CONFIG.cellSize) === x && Math.floor(l.y / CONFIG.cellSize) === y) return false;
  }

  // Проверка мимиков
  for (const m of state.mimics) {
    if (Math.floor(m.x / CONFIG.cellSize) === x && Math.floor(m.y / CONFIG.cellSize) === y) return false;
  }

  return true;
}

/**
 * Проверка, что клетка - тупик.
 * Тупик: проходимая клетка с ровно 3 стенами из 4 соседей (N, S, W, E).
 * 
 * @param {number} x - Координата X по сетке
 * @param {number} y - Координата Y по сетке
 * @returns {boolean} - true, если клетка - тупик
 * @private
 */
function isDeadEnd(x, y) {
  if (isWall(x, y)) return false;

  let wallCount = 0;
  if (isWall(x, y - 1)) wallCount++; // север
  if (isWall(x, y + 1)) wallCount++; // юг
  if (isWall(x - 1, y)) wallCount++; // запад
  if (isWall(x + 1, y)) wallCount++; // восток

  return wallCount === 3;
}

/**
 * Проверка, что над клеткой (север) - неразрушаемая стена.
 * 
 * @param {number} x - Координата X по сетке
 * @param {number} y - Координата Y по сетке
 * @returns {boolean} - true, если над клеткой неразрушаемая стена
 * @private
 */
function hasSolidWallAbove(x, y) {
  if (y - 1 < 0) return false;
  const cell = state.grid[y - 1]?.[x];
  if (!cell) return false;
  return cell.isWall && !cell.isBreakable;
}

/**
 * Поиск подходящего тупика для спавна исследовательницы.
 * 
 * @returns {{ x: number, y: number } | null} - Координаты тупика или null
 */
export function findResearcherSpawnCell() {
  const candidates = [];

  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      if (!isDeadEnd(x, y)) continue;
      if (!hasSolidWallAbove(x, y)) continue;
      if (!isCellFree(x, y)) continue;

      // Проверка расстояния от старта
      const distFromStart = Math.abs(x - 1) + Math.abs(y - 1);
      if (distFromStart < MIN_DISTANCE_FROM_START) continue;

      // Исключаются старт и выход
      if (x === 1 && y === 1) continue;
      if (x === CONFIG.goal.x && y === CONFIG.goal.y) continue;

      candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) return null;

  // Выбор случайного кандидата
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}