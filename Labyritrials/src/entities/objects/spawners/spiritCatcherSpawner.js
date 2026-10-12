/**
 * @fileoverview Спавнер потерянного предмета "Ловец духов".
 * Размещает предмет в случайном тупике, удалённом от старта.
 * 
 * @module entities/objects/spawners/spiritCatcherSpawner
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { logger } from '../../../utils/logger.js';

/** @type {number} - Минимальное манхэттенское расстояние от старта (1,1) */
const MIN_DISTANCE_FROM_START = 15;

/**
 * Проверка, является ли клетка стеной
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean}
 * @private
 */
function isWall(x, y) {
  if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return true;
  const cell = state.grid[y]?.[x];
  return !cell || cell.isWall;
}

/**
 * Проверка, что клетка - тупик (3 стены из 4 соседей)
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean}
 * @private
 */
function isDeadEnd(x, y) {
  if (isWall(x, y)) return false;
  
  let wallCount = 0;
  if (isWall(x, y - 1)) wallCount++;
  if (isWall(x, y + 1)) wallCount++;
  if (isWall(x - 1, y)) wallCount++;
  if (isWall(x + 1, y)) wallCount++;
  
  return wallCount === 3;
}

/**
 * Проверка, что над клеткой неразрушаемая стена
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean}
 * @private
 */
function hasSolidWallAbove(x, y) {
  if (y - 1 < 0) return false;
  const cell = state.grid[y - 1]?.[x];
  if (!cell) return false;
  return cell.isWall && !cell.isBreakable;
}

/**
 * Проверка, что клетка свободна от объектов
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean}
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
 * Поиск подходящего тупика для спавна "Ловца духов"
 * 
 * @returns {{x: number, y: number}|null}
 * @private
 */
function findSpiritCatcherSpawnCell() {
  const candidates = [];

  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      if (!isDeadEnd(x, y)) continue;
      if (!hasSolidWallAbove(x, y)) continue;
      if (!isCellFree(x, y)) continue;

      const distFromStart = Math.abs(x - 1) + Math.abs(y - 1);
      if (distFromStart < MIN_DISTANCE_FROM_START) continue;

      if (x === 1 && y === 1) continue;
      if (x === CONFIG.goal.x && y === CONFIG.goal.y) continue;

      candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Спавн "Ловца духов" в лабиринте, если задание активно
 * 
 * @returns {boolean} - true, если предмет заспавнен
 */
export function trySpawnSpiritCatcher() {
  // Проверка, что задание активно
  const isQuestActive = state.quests?.active?.some(q => q.id === 'researcherWisps');
  if (!isQuestActive) return false;

  // Проверка, что предмет ещё не найден (нет в инвентаре)
  const hasSpiritCatcher = player.inventory?.items?.equipment?.includes('spiritCatcher') || false;
  if (hasSpiritCatcher) return false;

  // Проверка, что предмета нет на карте (не заспавнен ранее)
  const isOnMap = state.lootItems.some(l => l.type === 'spiritCatcher');
  if (isOnMap) return false;

  // Поиск тупика
  const spawnCell = findSpiritCatcherSpawnCell();
  if (!spawnCell) {
    logger.warn('⚠️ Не удалось найти место для "Ловца духов"');
    return false;
  }

  // Создание предмета
  const worldX = spawnCell.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  const worldY = spawnCell.y * CONFIG.cellSize + CONFIG.cellSize / 2;

  state.lootItems.push({
    x: worldX,
    y: worldY,
    type: 'spiritCatcher',
    value: 1,
    requiresInteraction: true,
    showPopup: true,
  });

  logger.game(`🏺 "Ловец духов" заспавнен в клетке (${spawnCell.x}, ${spawnCell.y})`);
  return true;
}