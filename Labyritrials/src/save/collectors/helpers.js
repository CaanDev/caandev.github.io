/**
 * @fileoverview Вспомогательные функции для коллекторов сохранения.
 * 
 * @module save/collectors/helpers
 */

import { CONFIG, state } from '../../core/config/index.js';

/**
 * Сохранение сетки лабиринта
 * 
 * @returns {Array} - Данные сетки
 */
export function saveMazeGrid() {
  const gridData = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    if (!state.grid[y]) continue;
    gridData[y] = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y][x]) {
        gridData[y][x] = {
          isWall: state.grid[y][x].isWall,
          isBreakable: state.grid[y][x].isBreakable,
          revealed: state.grid[y][x].revealed,
          hasSecretPortal: state.grid[y][x].hasSecretPortal || false,
          hasTreasurePortal: state.grid[y][x].hasTreasurePortal || false,
          hasShrinePortal: state.grid[y][x].hasShrinePortal || false,
          isPortal: state.grid[y][x].isPortal || false,
          isShrinePortal: state.grid[y][x].isShrinePortal || false,
          isPillar: state.grid[y][x].isPillar || false
        };
      } else {
        gridData[y][x] = null;
      }
    }
  }
  return gridData;
}

/**
 * Сохранение открытых клеток
 * 
 * @returns {Array} - Массив открытых клеток
 */
export function saveRevealedCells() {
  const revealed = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    if (!state.grid[y]) continue;
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y][x] && state.grid[y][x].revealed) {
        revealed.push({ x, y });
      }
    }
  }
  return revealed;
}

/**
 * Сохранение оригинальной сетки (для сокровищницы)
 * 
 * @returns {Array|null} - Данные оригинальной сетки
 */
export function saveOriginalGrid() {
  if (!state.originalGrid) return null;
  const rows = state.originalMapRows || CONFIG.rows;
  const cols = state.originalMapCols || CONFIG.cols;
  const gridData = [];
  for (let y = 0; y < rows; y++) {
    if (!state.originalGrid[y]) continue;
    gridData[y] = [];
    for (let x = 0; x < cols; x++) {
      if (state.originalGrid[y][x]) {
        gridData[y][x] = {
          isWall: state.originalGrid[y][x].isWall,
          isBreakable: state.originalGrid[y][x].isBreakable,
          revealed: state.originalGrid[y][x].revealed
        };
      } else {
        gridData[y][x] = null;
      }
    }
  }
  return gridData;
}

/**
 * Сбор данных о монстрах из переданного массива
 * 
 * @param {Array} monsters - Массив монстров
 * @returns {Array} - Данные о монстрах
 */
export function collectMonstersDataFrom(monsters) {
  return monsters.map(m => ({
    x: m.x, y: m.y, startX: m.startX, startY: m.startY,
    hp: m.hp, maxHp: m.maxHp, damage: m.damage, emoji: m.emoji,
    radius: m.radius, name: m.name, speed: m.speed, vision: m.vision,
    dir: m.dir, isHorizontal: m.isHorizontal, patrolRange: m.patrolRange,
    state: m.state, lastHit: m.lastHit || 0, stunTimer: m.stunTimer || 0,
    poisonTimer: m.poisonTimer || 0, poisonTick: m.poisonTick || 0,
    poisonOnHit: m.poisonOnHit || false, isMinion: m.isMinion || false,
    isGhost: m.isGhost || false, willNeverStop: m.willNeverStop || false
  }));
}

/**
 * Сбор данных о ловушках из переданного массива
 * 
 * @param {Array} traps - Массив ловушек
 * @returns {Array} - Данные о ловушках
 */
export function collectTrapsDataFrom(traps) {
  return traps.map(t => ({
    x: t.x, y: t.y, damage: t.damage, type: t.type,
    triggered: t.triggered, resetTimer: t.resetTimer
  }));
}

/**
 * Сбор данных о святилищах из переданного массива
 * 
 * @param {Array} shrines - Массив святилищ
 * @returns {Array} - Данные о святилищах
 */
export function collectShrinesDataFrom(shrines) {
  return shrines.map(s => ({
    x: s.x, y: s.y, effect: s.effect, effectText: s.effectText, activated: s.activated
  }));
}

/**
 * Сбор данных о факелах из переданного массива
 * 
 * @param {Array} torches - Массив факелов
 * @returns {Array} - Данные о факелах
 */
export function collectTorchesDataFrom(torches) {
  return torches.map(t => ({
    x: t.x, y: t.y, active: t.active,
    appearTimer: t.appearTimer || 1,
    flickerPhase: t.flickerPhase || 0,
    intensity: t.intensity || 0.7
  }));
}