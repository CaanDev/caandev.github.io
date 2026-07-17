/**
 * @fileoverview Утилиты для спавна объектов в лабиринте.
 * Предоставляет функции для получения свободных клеток с учётом фильтров,
 * кэширования и маркировки занятых клеток.
 * 
 * @module entities/objects/utils/spawnUtils
 */

import { CONFIG, state } from '../../../core/config/index.js';

/** @type {Array<{x: number, y: number}>} - Кэш свободных клеток */
let freeCellsCache = [];
/** @type {boolean} - Инициализирован ли кэш */
let cacheInitialized = false;

/**
 * Перестроение кэша свободных клеток
 * 
 * Сканирует всю карту и собирает все клетки, которые не являются стенами и не заняты порталами.
 * Результат сохраняется в кэше для быстрого доступа.
 * 
 * @returns {void}
 */
export function rebuildFreeCellsCache() {
  freeCellsCache = [];

  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      const cell = state.grid[y]?.[x];
      if (cell && !cell.isWall && !cell.isPortal) {
        freeCellsCache.push({ x, y });
      }
    }
  }

  cacheInitialized = true;
}

/**
 * Получение случайной свободной клетки с возможной фильтрацией
 * 
 * @param {Function|null} [filterFn=null] - Функция-фильтр, принимает (x, y) и возвращает boolean
 * @param {number} [maxAttempts=50] - Максимальное количество попыток поиска
 * @returns {{x: number, y: number}|null} - Объект с координатами клетки или null, если клетка не найдена
 */
export function getRandomFreeCell(filterFn = null, maxAttempts = 50) {
  // Инициализируем кэш, если он ещё не создан
  if (!cacheInitialized) {
    rebuildFreeCellsCache();
  }

  // Если свободных клеток нет
  if (freeCellsCache.length === 0) return null;

  // Если фильтр не передан — возвращаем случайную клетку
  if (!filterFn) {
    const index = Math.floor(Math.random() * freeCellsCache.length);
    return { ...freeCellsCache[index] };
  }

  // Пытаемся найти клетку, удовлетворяющую фильтру
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const index = Math.floor(Math.random() * freeCellsCache.length);
    const cell = freeCellsCache[index];

    if (filterFn(cell.x, cell.y)) {
      return { ...cell };
    }
  }

  // Если не нашли за maxAttempts — пробуем перебором все клетки
  for (const cell of freeCellsCache) {
    if (filterFn(cell.x, cell.y)) {
      return { ...cell };
    }
  }

  return null;
}

/**
 * Получение нескольких случайных свободных клеток с фильтрацией и минимальным расстоянием
 * 
 * @param {number} count - Количество клеток для получения
 * @param {Function|null} [filterFn=null] - Функция-фильтр, принимает (x, y) и возвращает boolean
 * @param {number} [minDistance=2] - Минимальное расстояние между выбранными клетками (в клетках)
 * @returns {Array<{x: number, y: number}>} - Массив объектов с координатами клеток
 */
export function getRandomFreeCells(count, filterFn = null, minDistance = 2) {
  // Инициализируем кэш, если он ещё не создан
  if (!cacheInitialized) {
    rebuildFreeCellsCache();
  }

  // Если свободных клеток нет
  if (freeCellsCache.length === 0) return [];

  const result = [];
  const available = [...freeCellsCache];

  // Перемешиваем доступные клетки
  shuffleArray(available);

  for (const cell of available) {
    if (result.length >= count) break;

    // Проверяем фильтр
    if (filterFn && !filterFn(cell.x, cell.y)) continue;

    // Проверяем расстояние до уже выбранных клеток
    let tooClose = false;
    for (const selected of result) {
      const dist = Math.hypot(cell.x - selected.x, cell.y - selected.y);
      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    result.push({ x: cell.x, y: cell.y });
  }

  return result;
}

/**
 * Отметка клетки как занятой (удаление из кэша)
 * 
 * @param {number} x - Координата X клетки
 * @param {number} y - Координата Y клетки
 * @returns {void}
 */
export function markCellUsed(x, y) {
  const index = freeCellsCache.findIndex(c => c.x === x && c.y === y);
  if (index !== -1) {
    freeCellsCache.splice(index, 1);
  }
}

/**
 * Перемешивание массива (алгоритм Фишера-Йетса)
 * 
 * @param {Array} array - Массив для перемешивания (изменяется на месте)
 * @returns {Array} - Тот же массив (для цепочки вызовов)
 * @private
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Получение количества свободных клеток
 * 
 * @returns {number} - Количество клеток в кэше
 */
export function getFreeCellsCount() {
  if (!cacheInitialized) {
    rebuildFreeCellsCache();
  }
  return freeCellsCache.length;
}

/**
 * Инвалидация кэша свободных клеток
 * 
 * @returns {void}
 */
export function invalidateFreeCellsCache() {
  cacheInitialized = false;
  freeCellsCache = [];
}

/**
 * Проверка, является ли клетка порталом (любого типа)
 * 
 * @param {number} x - Координата X клетки
 * @param {number} y - Координата Y клетки
 * @returns {boolean} - true, если клетка занята порталом
 */
export function isPortalCell(x, y) {
  // Проверяем все типы порталов
  if (state.safePortal && state.safePortal.x === x && state.safePortal.y === y) return true;
  if (state.treasurePortal && state.treasurePortal.x === x && state.treasurePortal.y === y) return true;
  if (state.shrinePortal && state.shrinePortal.x === x && state.shrinePortal.y === y) return true;
  if (state.trapPortal && state.trapPortal.x === x && state.trapPortal.y === y) return true;
  if (state.treasureExitPortal && state.treasureExitPortal.x === x && state.treasureExitPortal.y === y) return true;
  if (state.shrineExitPortal && state.shrineExitPortal.x === x && state.shrineExitPortal.y === y) return true;
  if (state.trapExitPortal && state.trapExitPortal.x === x && state.trapExitPortal.y === y) return true;
  if (state.safeExitPortal && state.safeExitPortal.x === x && state.safeExitPortal.y === y) return true;
  if (state.trapFakePortal && state.trapFakePortal.x === x && state.trapFakePortal.y === y) return true;
  
  return false;
}