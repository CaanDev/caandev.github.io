/**
 * @fileoverview Оптимизация тумана войны.
 * Использует зональное обновление и кэширование для повышения производительности.
 * 
 * @module systems/fog/fogOptimizer
 */

import { CONFIG, state, player } from '../../core/config/index.js';

/** @type {number} - Счётчик кадров для управления обновлениями */
let frameCounter = 0;

/**
 * @namespace cache
 * @description Кэш для оптимизации обновления тумана
 */
const cache = {
  /** @type {number} - Последняя позиция игрока по X в клетках */
  playerX: -1,
  /** @type {number} - Последняя позиция игрока по Y в клетках */
  playerY: -1,
  /** @type {number} - Кэшированный радиус видимости */
  radius: 0,
  /** @type {Array} - Список клеток для обновления */
  cellsToUpdate: [],
  /** @type {number} - Кадр последнего обновления */
  lastUpdateFrame: 0
};

/**
 * @namespace ZONES
 * @description Зоны обновления с разной частотой в зависимости от расстояния до игрока
 */
const ZONES = {
  CLOSE: { maxDist: 3, interval: 1 },      // Близко — обновляем каждый кадр
  MID: { maxDist: 7, interval: 2 },        // Средне — каждый 2-й кадр
  FAR: { maxDist: 12, interval: 4 },       // Далеко — каждый 4-й кадр
  VERY_FAR: { maxDist: Infinity, interval: 8 } // Очень далеко — каждый 8-й кадр
};

/**
 * Получение интервала обновления для клетки на основе расстояния до игрока
 * 
 * @param {number} distToPlayer - Расстояние до игрока в пикселях
 * @returns {number} - Интервал обновления (в кадрах)
 * @private
 */
function getUpdateInterval(distToPlayer) {
  const cellDist = distToPlayer / CONFIG.cellSize;
  
  if (cellDist <= ZONES.CLOSE.maxDist) return ZONES.CLOSE.interval;
  if (cellDist <= ZONES.MID.maxDist) return ZONES.MID.interval;
  if (cellDist <= ZONES.FAR.maxDist) return ZONES.FAR.interval;
  return ZONES.VERY_FAR.interval;
}

/**
 * Проверка, нужно ли обновлять клетку в текущем кадре
 * 
 * @param {number} distToPlayer - Расстояние до игрока в пикселях
 * @param {number} cellX - Координата X клетки
 * @param {number} cellY - Координата Y клетки
 * @param {number} frameCount - Текущий номер кадра
 * @returns {boolean} - true, если клетку нужно обновить
 * @private
 */
function shouldUpdateCell(distToPlayer, cellX, cellY, frameCount) {
  const interval = getUpdateInterval(distToPlayer);
  const hash = (cellX * 31 + cellY * 17) % interval;
  return (frameCount % interval) === hash;
}

/**
 * Умное обновление памяти тумана с оптимизацией
 * 
 * Обновляет только клетки, которые находятся в радиусе видимости,
 * с разной частотой в зависимости от расстояния до игрока.
 * Использует кэш для минимизации вычислений.
 * 
 * @returns {void}
 */
export function updateFogMemorySmart() {
  frameCounter++;
  
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  const currentRadius = state.fogState.currentRadius || CONFIG.fog.baseRadius;
  
  const playerMoved = (playerGridX !== cache.playerX || playerGridY !== cache.playerY);
  
  // Если игрок не двигался и прошло мало времени — используем кэш
  if (!playerMoved && (frameCounter - cache.lastUpdateFrame) < 30) {
    updateCachedCells(frameCounter);
    return;
  }
  
  // Обновляем кэш
  cache.playerX = playerGridX;
  cache.playerY = playerGridY;
  cache.radius = currentRadius;
  cache.lastUpdateFrame = frameCounter;
  
  // Собираем клетки для обновления
  const cellsToUpdate = [];
  const radiusInCells = Math.ceil(currentRadius / CONFIG.cellSize) + 2;
  
  const startX = Math.max(0, playerGridX - radiusInCells);
  const endX = Math.min(CONFIG.cols, playerGridX + radiusInCells);
  const startY = Math.max(0, playerGridY - radiusInCells);
  const endY = Math.min(CONFIG.rows, playerGridY + radiusInCells);
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      
      const worldX = (x + 0.5) * CONFIG.cellSize;
      const worldY = (y + 0.5) * CONFIG.cellSize;
      const dist = Math.hypot(worldX - player.px, worldY - player.py);
      
      cellsToUpdate.push({
        x, y,
        cell,
        dist,
        isVisible: dist < currentRadius,
        interval: getUpdateInterval(dist)
      });
    }
  }
  
  cache.cellsToUpdate = cellsToUpdate;
  updateCells(cellsToUpdate, frameCounter);
}

/**
 * Обновление клеток из кэша (когда игрок не двигается)
 * 
 * @param {number} frameCount - Текущий номер кадра
 * @returns {void}
 * @private
 */
function updateCachedCells(frameCount) {
  if (!cache.cellsToUpdate || cache.cellsToUpdate.length === 0) return;
  
  for (const item of cache.cellsToUpdate) {
    const hash = (item.x * 31 + item.y * 17) % item.interval;
    if ((frameCount % item.interval) === hash) {
      updateSingleCell(item);
    }
  }
}

/**
 * Обновление собранных клеток
 * 
 * @param {Array} cells - Массив клеток для обновления
 * @param {number} frameCount - Текущий номер кадра
 * @returns {void}
 * @private
 */
function updateCells(cells, frameCount) {
  for (const item of cells) {
    const hash = (item.x * 31 + item.y * 17) % item.interval;
    if ((frameCount % item.interval) === hash) {
      updateSingleCell(item);
    }
  }
}

/**
 * Обновление одной клетки
 * 
 * @param {Object} item - Объект с данными клетки
 * @param {Object} item.cell - Клетка
 * @param {number} item.dist - Расстояние до игрока
 * @param {boolean} item.isVisible - Видна ли клетка
 * @returns {void}
 * @private
 */
function updateSingleCell(item) {
  const { cell, dist, isVisible } = item;
  const fadeDelay = CONFIG.fog.memoryFadeDelay || 600;
  const fadeDuration = CONFIG.fog.memoryFadeDuration || 600;
  
  if (isVisible) {
    // Клетка в радиусе видимости — полностью открыта
    cell.lastSeenFrame = frameCounter;
    cell.fogIntensity = 0;
    cell.revealed = true;
  } else if (cell.revealed) {
    // Клетка вне радиуса — рассчитываем затухание
    const framesSinceSeen = frameCounter - cell.lastSeenFrame;
    if (framesSinceSeen > fadeDelay) {
      const fadeProgress = Math.min(1, (framesSinceSeen - fadeDelay) / fadeDuration);
      cell.fogIntensity = Math.min(0.8, fadeProgress * 0.8);
    } else {
      cell.fogIntensity = 0;
    }
  }
}

/**
 * Обновление памяти тумана (обёртка для совместимости)
 * 
 * @returns {void}
 */
export function updateFogMemory() {
  updateFogMemorySmart();
}

/**
 * Принудительное обновление всего тумана
 * 
 * Открывает все клетки в радиусе видимости и сбрасывает кэш.
 * Используется при загрузке сохранения или переходе между уровнями.
 * 
 * @returns {void}
 */
export function forceUpdateAllFog() {
  const currentRadius = state.fogState.currentRadius || CONFIG.fog.baseRadius;
  
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      
      const worldX = (x + 0.5) * CONFIG.cellSize;
      const worldY = (y + 0.5) * CONFIG.cellSize;
      const dist = Math.hypot(worldX - player.px, worldY - player.py);
      
      if (dist < currentRadius) {
        cell.revealed = true;
        cell.lastSeenFrame = frameCounter;
        cell.fogIntensity = 0;
      }
    }
  }
  
  // Сбрасываем кэш
  cache.cellsToUpdate = [];
  cache.playerX = -1;
  cache.playerY = -1;
}