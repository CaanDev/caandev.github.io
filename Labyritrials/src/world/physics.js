/**
 * @fileoverview Физика и коллизии в лабиринте.
 * Предоставляет функции для проверки видимости, столкновений,
 * поиска пути и других физических расчётов.
 * 
 * @module world/physics
 */

import { CONFIG, state } from '../core/config/index.js';
import { pathCache, distanceCache, visibilityCache, gridCache } from '../utils/cache.js';

// ============================================================
// ОПТИМИЗИРОВАННЫЙ ПОИСК ПУТИ: A* + BFS (гибридный подход)
// ============================================================

/**
 * Приоритетная очередь для A* (минимальная куча)
 * @class PriorityQueue
 */
class PriorityQueue {
  constructor() {
    /** @type {Array<{key: string, priority: number}>} */
    this.elements = [];
  }

  /**
   * Добавление элемента в очередь
   * @param {string} key - Ключ элемента
   * @param {number} priority - Приоритет (чем меньше, тем выше)
   * @returns {void}
   */
  push(key, priority) {
    this.elements.push({ key, priority });
    this._bubbleUp(this.elements.length - 1);
  }

  /**
   * Извлечение элемента с наименьшим приоритетом
   * @returns {string|null} - Ключ элемента или null, если очередь пуста
   */
  pop() {
    if (this.elements.length === 0) return null;
    const min = this.elements[0];
    const last = this.elements.pop();
    if (this.elements.length > 0) {
      this.elements[0] = last;
      this._sinkDown(0);
    }
    return min.key;
  }

  /**
   * Проверка, пуста ли очередь
   * @returns {boolean} - true, если очередь пуста
   */
  isEmpty() {
    return this.elements.length === 0;
  }

  /**
   * Подъём элемента вверх (восстановление свойства кучи)
   * @param {number} index - Индекс элемента
   * @private
   */
  _bubbleUp(index) {
    const element = this.elements[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.elements[parentIndex];
      if (element.priority >= parent.priority) break;
      this.elements[index] = parent;
      this.elements[parentIndex] = element;
      index = parentIndex;
    }
  }

  /**
   * Опускание элемента вниз (восстановление свойства кучи)
   * @param {number} index - Индекс элемента
   * @private
   */
  _sinkDown(index) {
    const length = this.elements.length;
    const element = this.elements[index];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let swapIndex = null;
      let leftChild, rightChild;

      if (leftChildIndex < length) {
        leftChild = this.elements[leftChildIndex];
        if (leftChild.priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.elements[rightChildIndex];
        if (
          (swapIndex === null && rightChild.priority < element.priority) ||
          (swapIndex !== null && rightChild.priority < leftChild.priority)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.elements[index] = this.elements[swapIndex];
      this.elements[swapIndex] = element;
      index = swapIndex;
    }
  }

  /**
   * Получение размера очереди
   * @returns {number} - Количество элементов в очереди
   */
  get size() {
    return this.elements.length;
  }
}

// ============================================================
// ЭВРИСТИКИ ДЛЯ A*
// ============================================================

/**
 * Манхэттенское расстояние (рекомендуется для 4-направлений)
 * @param {Object} a - Точка A
 * @param {number} a.x - Координата X
 * @param {number} a.y - Координата Y
 * @param {Object} b - Точка B
 * @param {number} b.x - Координата X
 * @param {number} b.y - Координата Y
 * @returns {number} - Манхэттенское расстояние
 */
function manhattanHeuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Евклидово расстояние (для 8-направлений)
 * @param {Object} a - Точка A
 * @param {number} a.x - Координата X
 * @param {number} a.y - Координата Y
 * @param {Object} b - Точка B
 * @param {number} b.x - Координата X
 * @param {number} b.y - Координата Y
 * @returns {number} - Евклидово расстояние
 */
function euclideanHeuristic(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Диагональное расстояние (Чебышёва)
 * @param {Object} a - Точка A
 * @param {number} a.x - Координата X
 * @param {number} a.y - Координата Y
 * @param {Object} b - Точка B
 * @param {number} b.x - Координата X
 * @param {number} b.y - Координата Y
 * @returns {number} - Расстояние Чебышёва
 */
function chebyshevHeuristic(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** @type {Function} - Используемая эвристика (можно менять для тестирования) */
const HEURISTIC = manhattanHeuristic;

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Поиск пути с использованием A* (с гибридным подходом)
 * 
 * @param {number} startX - Координата X начальной точки (в пикселях)
 * @param {number} startY - Координата Y начальной точки (в пикселях)
 * @param {number} targetX - Координата X целевой точки (в пикселях)
 * @param {number} targetY - Координата Y целевой точки (в пикселях)
 * @returns {Object|null} - Следующая точка пути {x, y} или null, если путь не найден
 */
export function findPath(startX, startY, targetX, targetY) {
  const startGrid = { 
    x: Math.floor(startX / CONFIG.cellSize), 
    y: Math.floor(startY / CONFIG.cellSize) 
  };
  const targetGrid = { 
    x: Math.floor(targetX / CONFIG.cellSize), 
    y: Math.floor(targetY / CONFIG.cellSize) 
  };
  
  // Если начальная и целевая клетки совпадают
  if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) return null;
  
  // Проверка расстояния (если слишком далеко — не ищем)
  const dist = Math.hypot(startGrid.x - targetGrid.x, startGrid.y - targetGrid.y);
  if (dist > 30) return null;
  
  // Ключ для кэширования
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
  
  // ===== ВЫБОР МЕТОДА ПОИСКА (ГИБРИДНЫЙ ПОДХОД) =====
  // Для коротких расстояний используем BFS (быстрее)
  if (dist < 5) {
    const result = findPathBFS(startGrid, targetGrid);
    if (result) {
      pathCache.set(key, result);
      if (result.length > 0) {
        const nextStep = result[0];
        return {
          x: nextStep.x * CONFIG.cellSize + CONFIG.cellSize / 2,
          y: nextStep.y * CONFIG.cellSize + CONFIG.cellSize / 2
        };
      }
    }
    pathCache.set(key, []);
    return null;
  }
  
  // Для длинных расстояний используем A* (эффективнее)
  const result = findPathAStar(startGrid, targetGrid);
  if (result) {
    pathCache.set(key, result);
    if (result.length > 0) {
      const nextStep = result[0];
      return {
        x: nextStep.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: nextStep.y * CONFIG.cellSize + CONFIG.cellSize / 2
      };
    }
  }
  
  pathCache.set(key, []);
  return null;
}

// ============================================================
// A* АЛГОРИТМ
// ============================================================

/**
 * Поиск пути с использованием A* алгоритма
 * 
 * @param {Object} start - Начальная клетка
 * @param {number} start.x - Координата X в сетке
 * @param {number} start.y - Координата Y в сетке
 * @param {Object} target - Целевая клетка
 * @param {number} target.x - Координата X в сетке
 * @param {number} target.y - Координата Y в сетке
 * @returns {Array<{x: number, y: number}>|null} - Массив клеток пути или null
 * @private
 */
function findPathAStar(start, target) {
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  
  const startKey = `${start.x},${start.y}`;
  const targetKey = `${target.x},${target.y}`;
  
  gScore.set(startKey, 0);
  fScore.set(startKey, HEURISTIC(start, target));
  openSet.push(startKey, fScore.get(startKey));
  
  // Направления (8 направлений с весами)
  const directions = [
    { dx: 0, dy: -1, cost: 1 },   // вверх
    { dx: 0, dy: 1, cost: 1 },    // вниз
    { dx: -1, dy: 0, cost: 1 },   // влево
    { dx: 1, dy: 0, cost: 1 },    // вправо
    { dx: 1, dy: -1, cost: 1.4 }, // вверх-вправо
    { dx: -1, dy: -1, cost: 1.4 },// вверх-влево
    { dx: 1, dy: 1, cost: 1.4 },  // вниз-вправо
    { dx: -1, dy: 1, cost: 1.4 }  // вниз-влево
  ];
  
  let maxSteps = 200;
  
  while (!openSet.isEmpty() && maxSteps-- > 0) {
    const currentKey = openSet.pop();
    
    // Если достигли цели
    if (currentKey === targetKey) {
      return reconstructPath(cameFrom, currentKey);
    }
    
    closedSet.add(currentKey);
    const [cx, cy] = currentKey.split(',').map(Number);
    
    for (const dir of directions) {
      const nx = cx + dir.dx;
      const ny = cy + dir.dy;
      const neighborKey = `${nx},${ny}`;
      
      // Пропускаем, если уже в закрытом множестве
      if (closedSet.has(neighborKey)) continue;
      
      // Проверка на выход за границы
      if (nx < 0 || nx >= CONFIG.cols || ny < 0 || ny >= CONFIG.rows) continue;
      
      // Проверка на стену
      if (state.grid[ny] && state.grid[ny][nx] && state.grid[ny][nx].isWall) continue;
      
      // Проверка на колонну
      if (state.grid[ny] && state.grid[ny][nx] && state.grid[ny][nx].isPillar) continue;
      
      // Расчёт новой стоимости
      const tentativeG = gScore.get(currentKey) + dir.cost;
      
      if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        const h = HEURISTIC({ x: nx, y: ny }, target);
        fScore.set(neighborKey, tentativeG + h);
        
        // Добавляем в открытое множество только если ещё не там
        let inOpenSet = false;
        for (const item of openSet.elements) {
          if (item.key === neighborKey) {
            inOpenSet = true;
            break;
          }
        }
        if (!inOpenSet) {
          openSet.push(neighborKey, fScore.get(neighborKey));
        }
      }
    }
  }
  
  // Если путь не найден, пробуем BFS как fallback
  return findPathBFS(start, target);
}

// ============================================================
// BFS АЛГОРИТМ (как fallback для коротких путей)
// ============================================================

/**
 * Поиск пути с использованием BFS (для коротких расстояний)
 * 
 * @param {Object} start - Начальная клетка
 * @param {number} start.x - Координата X в сетке
 * @param {number} start.y - Координата Y в сетке
 * @param {Object} target - Целевая клетка
 * @param {number} target.x - Координата X в сетке
 * @param {number} target.y - Координата Y в сетке
 * @returns {Array<{x: number, y: number}>|null} - Массив клеток пути или null
 * @private
 */
function findPathBFS(start, target) {
  const queue = [{ x: start.x, y: start.y, path: [] }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);
  
  const directions = [
    { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 1, y: 0 },
    { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 1 }, { x: -1, y: 1 }
  ];
  
  let maxSteps = 150;
  
  while (queue.length > 0 && maxSteps-- > 0) {
    const current = queue.shift();
    
    if (current.x === target.x && current.y === target.y) {
      return current.path;
    }
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;
      
      if (nx > 0 && nx < CONFIG.cols - 1 && ny > 0 && ny < CONFIG.rows - 1 && !visited.has(key)) {
        if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].isWall) {
          visited.add(key);
          queue.push({
            x: nx,
            y: ny,
            path: [...current.path, { x: nx, y: ny }]
          });
        }
      }
    }
  }
  
  return null;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Восстановление пути из карты привязок
 * 
 * @param {Map<string, string>} cameFrom - Карта привязок (клетка → предыдущая клетка)
 * @param {string} currentKey - Ключ текущей клетки
 * @returns {Array<{x: number, y: number}>} - Массив клеток пути
 * @private
 */
function reconstructPath(cameFrom, currentKey) {
  const path = [];
  let key = currentKey;
  
  while (cameFrom.has(key)) {
    const [x, y] = key.split(',').map(Number);
    path.unshift({ x, y });
    key = cameFrom.get(key);
  }
  
  return path;
}

// ============================================================
// СТАНДАРТНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Проверка прямой видимости между двумя точками
 * 
 * @param {number} x1 - Координата X начальной точки (в пикселях)
 * @param {number} y1 - Координата Y начальной точки (в пикселях)
 * @param {number} x2 - Координата X конечной точки (в пикселях)
 * @param {number} y2 - Координата Y конечной точки (в пикселях)
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
 * @param {number} x1 - Координата X начальной точки (в пикселях)
 * @param {number} y1 - Координата Y начальной точки (в пикселях)
 * @param {number} x2 - Координата X конечной точки (в пикселях)
 * @param {number} y2 - Координата Y конечной точки (в пикселях)
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
 * @param {number} x - Координата X в сетке
 * @param {number} y - Координата Y в сетке
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
 * Проверка наличия прямого пути без препятствий
 * 
 * @param {number} x1 - Координата X начальной точки (в пикселях)
 * @param {number} y1 - Координата Y начальной точки (в пикселях)
 * @param {number} x2 - Координата X конечной точки (в пикселях)
 * @param {number} y2 - Координата Y конечной точки (в пикселях)
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