/**
 * @fileoverview Физика и коллизии в лабиринте.
 * Предоставляет функции для проверки видимости, столкновений,
 * поиска пути и других физических расчётов.
 * 
 * @module world/physics
 */

import { CONFIG, state } from '../core/config/index.js';
import { pathCache, distanceCache, visibilityCache, gridCache } from '../utils/cache.js';

/**
 * Проверка прямой видимости между двумя точками
 * 
 * @param {number} x1 - Координата X начальной точки
 * @param {number} y1 - Координата Y начальной точки
 * @param {number} x2 - Координата X конечной точки
 * @param {number} y2 - Координата Y конечной точки
 * @returns {boolean} - true, если есть прямая видимость
 */
export function hasLineOfSight(x1, y1, x2, y2) {
  const key = `${Math.min(x1, x2)},${Math.min(y1, y2)},${Math.max(x1, x2)},${Math.max(y1, y2)}`;
  
  const cached = visibilityCache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  let steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 15);
  steps = Math.min(steps, 100);
  
  for (let i = 1; i < steps; i++) {
    let t = i / steps;
    let cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
    let cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
        
    if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
      if (state.grid[cy] && state.grid[cy][cx] && (state.grid[cy][cx].isWall)) {
        visibilityCache.set(key, false);
        return false;
      }
    } else {
      visibilityCache.set(key, false);
      return false;
    }
  }
  
  visibilityCache.set(key, true);
  return true;
}

/**
 * Проверка наличия стены между двумя точками
 * 
 * @param {number} x1 - Координата X начальной точки
 * @param {number} y1 - Координата Y начальной точки
 * @param {number} x2 - Координата X конечной точки
 * @param {number} y2 - Координата Y конечной точки
 * @returns {boolean} - true, если между точками есть стена
 */
export function hasWallBetween(x1, y1, x2, y2) {
  const key = `wall_${Math.min(x1, x2)},${Math.min(y1, y2)},${Math.max(x1, x2)},${Math.max(y1, y2)}`;
  
  const cached = visibilityCache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 20);
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
    const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
    
    if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
      if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isWall) {
        visibilityCache.set(key, true);
        return true;
      }
    }
  }
  
  visibilityCache.set(key, false);
  return false;
}

/**
 * Проверка, является ли клетка порталом (устаревшая функция)
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean} - true, если клетка является порталом
 * @deprecated Используйте isPortalCell из spawnUtils
 */
export function isPortalCell(x, y) {
  if (state.secretPortal && state.secretPortal.active && 
      state.secretPortal.x === x && state.secretPortal.y === y) {
    return true;
  }
  if (state.exitPortal && state.exitPortal.active && 
      state.exitPortal.x === x && state.exitPortal.y === y) {
    return true;
  }
  return false;
}

/**
 * Проверка столкновения со стенами или колоннами
 * 
 * @param {number} px - Координата X в пикселях
 * @param {number} py - Координата Y в пикселях
 * @param {number} [radius=24] - Радиус проверки
 * @param {boolean} [isMonster=false] - Проверка для монстра (пропускает порталы)
 * @returns {boolean} - true, если есть столкновение
 */
export function checkWallCollision(px, py, radius = 30, isMonster = false) {
  let points = [
    { x: px - radius, y: py - radius },
    { x: px + radius, y: py - radius },
    { x: px - radius, y: py + radius },
    { x: px + radius, y: py + radius }
  ];

  for (let p of points) {
    let cx = Math.floor(p.x / CONFIG.cellSize);
    let cy = Math.floor(p.y / CONFIG.cellSize);
    
    // Проверка выхода за границы карты
    if (cx < 0 || cx >= CONFIG.cols || cy < 0 || cy >= CONFIG.rows) return true;

    // Защита от null/undefined
    if (!state.grid[cy] || !state.grid[cy][cx]) return true;

    // Проверка колонн
    if (state.grid[cy][cx].isPillar) return true;
    
    // Проверка порталов (монстры могут проходить)
    if (isMonster) {
      if (isPortalCell(cx, cy)) return true;
    } else {
      if (isPortalCell(cx, cy)) continue;
    }
    
    // Проверка стен
    if (state.grid[cy][cx].isWall) return true;
  }
  return false;
}

/**
 * Поиск пути с использованием BFS
 * 
 * @param {number} startX - Координата X начальной точки
 * @param {number} startY - Координата Y начальной точки
 * @param {number} targetX - Координата X целевой точки
 * @param {number} targetY - Координата Y целевой точки
 * @returns {Object|null} - Следующая точка пути или null
 */
export function findPath(startX, startY, targetX, targetY) {
  const startGrid = { x: Math.floor(startX / CONFIG.cellSize), y: Math.floor(startY / CONFIG.cellSize) };
  const targetGrid = { x: Math.floor(targetX / CONFIG.cellSize), y: Math.floor(targetY / CONFIG.cellSize) };
  
  if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) return null;
  
  const dist = Math.hypot(startGrid.x - targetGrid.x, startGrid.y - targetGrid.y);
  if (dist > 30) return null;
  
  const key = `${startGrid.x},${startGrid.y},${targetGrid.x},${targetGrid.y}`;
  
  // Проверка кэша
  const cached = pathCache.get(key);
  if (cached !== null) {
    if (cached.length > 0) {
      const nextStep = cached[0];
      return {
        x: nextStep.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: nextStep.y * CONFIG.cellSize + CONFIG.cellSize / 2
      };
    }
    return null;
  }
  
  // BFS алгоритм
  const queue = [{ x: startGrid.x, y: startGrid.y, path: [] }];
  const visited = new Set();
  visited.add(`${startGrid.x},${startGrid.y}`);
  
  const directions = [
    { x: 0, y: -1, cost: 1 },
    { x: 0, y: 1, cost: 1 },
    { x: -1, y: 0, cost: 1 },
    { x: 1, y: 0, cost: 1 },
    { x: 1, y: -1, cost: 1.4 },
    { x: -1, y: -1, cost: 1.4 },
    { x: 1, y: 1, cost: 1.4 },
    { x: -1, y: 1, cost: 1.4 }
  ];
  
  let maxSteps = 150;
  
  while (queue.length > 0 && maxSteps-- > 0) {
    const current = queue.shift();
    
    if (current.x === targetGrid.x && current.y === targetGrid.y) {
      pathCache.set(key, current.path);
      
      if (current.path.length > 0) {
        const nextStep = current.path[0];
        return {
          x: nextStep.x * CONFIG.cellSize + CONFIG.cellSize / 2,
          y: nextStep.y * CONFIG.cellSize + CONFIG.cellSize / 2
        };
      }
      return null;
    }
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key2 = `${nx},${ny}`;
      
      if (nx > 0 && nx < CONFIG.cols - 1 && ny > 0 && ny < CONFIG.rows - 1 && !visited.has(key2)) {
        if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].isWall) {
          visited.add(key2);
          queue.push({
            x: nx,
            y: ny,
            path: [...current.path, { x: nx, y: ny }]
          });
        }
      }
    }
  }
  
  pathCache.set(key, []);
  return null;
}

/**
 * Проверка наличия прямого пути без препятствий
 * 
 * @param {number} x1 - Координата X начальной точки
 * @param {number} y1 - Координата Y начальной точки
 * @param {number} x2 - Координата X конечной точки
 * @param {number} y2 - Координата Y конечной точки
 * @returns {boolean} - true, если есть прямой путь
 */
export function hasDirectPath(x1, y1, x2, y2) {
  const key = `direct_${Math.min(x1, x2)},${Math.min(y1, y2)},${Math.max(x1, x2)},${Math.max(y1, y2)}`;
  
  const cached = visibilityCache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
  
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
    const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
    
    if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
      if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isWall) {
        visibilityCache.set(key, false);
        return false;
      }
    }
  }
  
  visibilityCache.set(key, true);
  return true;
}