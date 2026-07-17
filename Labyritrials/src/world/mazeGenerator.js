/**
 * @fileoverview Генератор лабиринта с поддержкой seed-генерации.
 * Содержит алгоритм генерации лабиринта с использованием псевдослучайных чисел
 * для детерминированной генерации карт.
 * 
 * @module world/mazeGenerator
 */

import { CONFIG, state } from '../core/config/index.js';
import { Cell } from './cells/cell.js';

/** @type {number|null} - Текущий seed для генерации */
let currentSeed = null;
/** @type {number} - Счётчик для seededRandom */
let randomCounter = 0;

/**
 * Генерация случайного seed
 * 
 * @returns {number} - Случайный seed в диапазоне 0-999999
 */
export function generateRandomSeed() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Установка seed для генерации
 * 
 * @param {number} seed - Seed для генерации
 * @param {number} [counter=0] - Начальное значение счётчика
 * @returns {void}
 */
export function setSeed(seed, counter = 0) {
  currentSeed = seed;
  randomCounter = counter;
}

/**
 * Получение текущего seed
 * 
 * @returns {number|null} - Текущий seed или null
 */
export function getSeed() {
  return currentSeed;
}

/**
 * Получение текущего значения счётчика
 * 
 * @returns {number} - Текущий счётчик
 */
export function getRandomCounter() {
  return randomCounter;
}

/**
 * Генерация псевдослучайного числа на основе seed
 * 
 * @returns {number} - Псевдослучайное число в диапазоне 0-1
 */
export function seededRandom() {
  if (currentSeed === null) {
    return Math.random();
  }
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296;
  const value = (currentSeed + randomCounter) * a + c;
  randomCounter++;
  return (value % m) / m;
}

/**
 * Генерация следующего случайного числа с обновлением seed
 * 
 * @returns {number} - Псевдослучайное число в диапазоне 0-1
 */
export function nextRandom() {
  if (currentSeed === null) {
    return Math.random();
  }
  currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
  return currentSeed / 4294967296;
}

/**
 * Сброс счётчика случайных чисел
 * 
 * @returns {void}
 */
export function resetRandomCounter() {
  randomCounter = 0;
}

/**
 * Генерация лабиринта с помощью алгоритма DFS (рекурсивный бэктрекинг)
 * 
 * @returns {void}
 */
export function generateMazeOnly() {
  state.grid = [];
  
  // ===== ИНИЦИАЛИЗАЦИЯ СЕТКИ =====
  for (let y = 0; y < CONFIG.rows; y++) {
    state.grid[y] = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      state.grid[y][x] = new Cell(x, y);
    }
  }

  let stack = [];
  let startCell = state.grid[1][1];
  
  if (startCell) {
    startCell.visited = true;
    startCell.isWall = false;
    stack.push(startCell);
  }

  const directions = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 }
  ];

  // ===== DFS АЛГОРИТМ =====
  while (stack.length > 0) {
    let current = stack[stack.length - 1];
    let neighbors = [];

    for (let d of directions) {
      let nx = current.x + d.x;
      let ny = current.y + d.y;

      if (nx > 0 && nx < CONFIG.cols - 1 && ny > 0 && ny < CONFIG.rows - 1) {
        if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].visited) {
          neighbors.push(state.grid[ny][nx]);
        }
      }
    }

    if (neighbors.length > 0) {
      // Выбор случайного соседа
      let next = neighbors[Math.floor(nextRandom() * neighbors.length)];
      
      // Удаление стены между текущей и следующей клеткой
      let mx = (current.x + next.x) / 2;
      let my = (current.y + next.y) / 2;
      
      if (state.grid[my] && state.grid[my][mx]) {
        state.grid[my][mx].isWall = false;
      }
      
      next.visited = true;
      next.isWall = false;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // ===== ОБЕСПЕЧЕНИЕ ПРОХОДИМОСТИ СТАРТА =====
  if (state.grid[1] && state.grid[1][1]) state.grid[1][1].isWall = false;
  if (state.grid[1] && state.grid[1][2]) state.grid[1][2].isWall = false;
  if (state.grid[2] && state.grid[2][1]) state.grid[2][1].isWall = false;
  if (state.grid[2] && state.grid[2][2]) state.grid[2][2].isWall = false;

  // ===== ОБЕСПЕЧЕНИЕ ПРОХОДИМОСТИ ВЫХОДА =====
  for (let y = CONFIG.goal.y - 1; y <= CONFIG.goal.y + 1; y++) {
    for (let x = CONFIG.goal.x - 1; x <= CONFIG.goal.x + 1; x++) {
      if (x > 0 && x < CONFIG.cols - 1 && y > 0 && y < CONFIG.rows - 1) {
        if (state.grid[y] && state.grid[y][x]) {
          state.grid[y][x].isWall = false;
        }
      }
    }
  }
}

/**
 * Добавление разрушаемых стен на карту
 * 
 * @param {number} [chance=0.18] - Шанс превращения стены в разрушаемую
 * @returns {void}
 */
export function addBreakableWalls(chance = 0.18) {
  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].isWall && nextRandom() < chance) {
        // Не делаем разрушаемыми стены рядом со стартом
        if (x < 3 && y < 3) continue;
        state.grid[y][x].isBreakable = true;
      }
    }
  }
}

/**
 * Очистка флагов посещения клеток
 * 
 * @returns {void}
 */
export function clearVisitedFlags() {
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].visited = false;
      }
    }
  }
}

/**
 * Получение непосещённых соседей для указанной клетки
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {Cell[]} - Массив непосещённых соседних клеток
 */
export function getUnvisitedNeighbors(x, y) {
  const neighbors = [];
  const dirs = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 }
  ];
  
  for (let d of dirs) {
    const nx = x + d.x;
    const ny = y + d.y;
    if (nx > 0 && nx < CONFIG.cols - 1 && ny > 0 && ny < CONFIG.rows - 1) {
      if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].visited) {
        neighbors.push(state.grid[ny][nx]);
      }
    }
  }
  
  return neighbors;
}