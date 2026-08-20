/**
 * @fileoverview Движение монстров (патруль, преследование, бегство)
 * @module entities/monsters/ai/movement
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { checkWallCollision, findPath, hasDirectPath } from '../../../world/physics.js';
import { distanceCache } from '../../../utils/cache.js';
import { smoothMoveToPosition, initMovementState, resetMovement } from './smoothMovement.js';

/**
 * Перемещение монстра к целевой точке с учётом коллизий
 * @param {Object} m - Объект монстра
 * @param {number} targetX - Целевая координата X
 * @param {number} targetY - Целевая координата Y
 * @returns {void}
 * @private
 */
function moveMonsterToTarget(m, targetX, targetY) {
  const angle = Math.atan2(targetY - m.y, targetX - m.x);
  let nextX = m.x + Math.cos(angle) * m.speed;
  let nextY = m.y + Math.sin(angle) * m.speed;

  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);

  if (m.isGhost) {
    handleGhostMovement(m, nextX, nextY, inWallX, inWallY);
  } else {
    if (!inWallX) m.x = nextX;
    if (!inWallY) m.y = nextY;
  }
}

/**
 * Проверка, застрял ли монстр в углу
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если монстр застрял
 */
function isMonsterStuckInCorner(m) {
  // Проверяем, не двигался ли монстр последние 30 кадров
  if (!m._stuckCounter) m._stuckCounter = 0;
  if (!m._lastPatrolX) m._lastPatrolX = m.x;
  if (!m._lastPatrolY) m._lastPatrolY = m.y;
  
  const dx = m.x - m._lastPatrolX;
  const dy = m.y - m._lastPatrolY;
  const moved = Math.hypot(dx, dy);
  
  m._lastPatrolX = m.x;
  m._lastPatrolY = m.y;
  
  if (moved < 1) {
    m._stuckCounter++;
  } else {
    m._stuckCounter = 0;
  }
  
  // Если стоит на месте больше 60 кадров — застрял
  if (m._stuckCounter > 60) {
    return true;
  }
  
  return false;
}

/**
 * Выход из тупика — смена направления
 * @param {Object} m - Объект монстра
 */
function escapeFromCorner(m) {
  // Сбрасываем счётчик застревания
  m._stuckCounter = 0;
  
  // Переключаемся на следующую точку маршрута (пропускаем текущую)
  m.patrolIndex = (m.patrolIndex + 1) % m.patrolPath.length;
  
  // Генерируем новый маршрут, если точек мало
  if (m.patrolPath.length < 3) {
    m.patrolPath = generatePatrolPath(m, 4 + Math.floor(Math.random() * 2), 8 + Math.floor(Math.random() * 4));
    m.patrolIndex = 0;
  }
  
  // Визуальный эффект — маленький всплеск пыли (без эмодзи)
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    state.sparks.push({
      x: m.x + (Math.random() - 0.5) * 10,
      y: m.y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 8 + Math.random() * 6,
      maxLife: 14,
      size: 1 + Math.random() * 2,
      color: '#998877',
      gravity: 0.03,
      isDust: true
    });
  }
  
  // Сбрасываем таймер, чтобы монстр продолжил движение
  m.patrolTimer = 0;
  m.patrolPhase = 'moving';
}

/**
 * Обработка движения призрака с фазингом
 * @param {Object} m - Объект призрака
 * @param {number} nextX - Следующая позиция X
 * @param {number} nextY - Следующая позиция Y
 * @param {boolean} inWallX - Коллизия по X
 * @param {boolean} inWallY - Коллизия по Y
 * @returns {void}
 * @private
 */
function handleGhostMovement(m, nextX, nextY, inWallX, inWallY) {
  const gridX = Math.floor(nextX / CONFIG.cellSize);
  const gridY = Math.floor(m.y / CONFIG.cellSize);
  const isBoundary = gridX <= 0 || gridX >= CONFIG.cols - 1 || gridY <= 0 || gridY >= CONFIG.rows - 1;

  if (inWallX && !isBoundary) {
    m.isPhasing = true;
    m.ghostPhaseTimer = 20;
    if (m.originalSpeedDuringPhase === undefined) {
      m.originalSpeedDuringPhase = m.speed;
      m.speed = m.speed * 0.6;
    }
    m.x = nextX;
  } else if (!isBoundary) {
    m.x = nextX;
    if (m.originalSpeedDuringPhase !== undefined) {
      m.speed = m.originalSpeedDuringPhase;
      m.originalSpeedDuringPhase = undefined;
    }
  }

  const gridX2 = Math.floor(m.x / CONFIG.cellSize);
  const gridY2 = Math.floor(nextY / CONFIG.cellSize);
  const isBoundary2 = gridX2 <= 0 || gridX2 >= CONFIG.cols - 1 || gridY2 <= 0 || gridY2 >= CONFIG.rows - 1;

  if (inWallY && !isBoundary2) {
    m.isPhasing = true;
    m.ghostPhaseTimer = 20;
    if (m.originalSpeedDuringPhase === undefined) {
      m.originalSpeedDuringPhase = m.speed;
      m.speed = m.speed * 0.6;
    }
    m.y = nextY;
  } else if (!isBoundary2) {
    m.y = nextY;
    if (m.originalSpeedDuringPhase !== undefined) {
      m.speed = m.originalSpeedDuringPhase;
      m.originalSpeedDuringPhase = undefined;
    }
  }

  if (m.ghostPhaseTimer > 0) {
    m.ghostPhaseTimer--;
    if (m.ghostPhaseTimer <= 0) {
      m.isPhasing = false;
      if (m.originalSpeedDuringPhase !== undefined) {
        m.speed = m.originalSpeedDuringPhase;
        m.originalSpeedDuringPhase = undefined;
      }
    }
  }
}

// ============================================================
// ЭКСПОРТЫ
// ============================================================

/**
 * Движение монстра в режиме преследования
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updateChaseMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;

  let targetX = player.px;
  let targetY = player.py;

  if (m.isGhost) {
    targetX = player.px;
    targetY = player.py;
  } else {
    if (m.pathUpdateCounter === undefined) m.pathUpdateCounter = 0;
    m.pathUpdateCounter++;

    if (CONFIG.pathfinding.enabled && CONFIG.pathfinding.cacheEnabled &&
        (m.pathUpdateCounter >= CONFIG.pathfinding.updateDelay || !m.currentPathTarget)) {
      m.pathUpdateCounter = 0;

      if (!hasDirectPath(m.x, m.y, player.px, player.py)) {
        const nextTarget = findPath(m.x, m.y, player.px, player.py);
        if (nextTarget) {
          m.currentPathTarget = nextTarget;
          targetX = nextTarget.x;
          targetY = nextTarget.y;
        }
      } else {
        m.currentPathTarget = null;
      }
    } else if (m.currentPathTarget) {
      targetX = m.currentPathTarget.x;
      targetY = m.currentPathTarget.y;
    }
  }

  moveMonsterToTarget(m, targetX, targetY);
}

/**
 * Движение монстра в режиме бегства
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updateFleeMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;

  const angle = Math.atan2(m.y - player.py, m.x - player.px);
  let nextX = m.x + Math.cos(angle) * m.speed;
  let nextY = m.y + Math.sin(angle) * m.speed;

  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);

  if (inWallX && inWallY) {
    const randomAngle = Math.random() * Math.PI * 2;
    nextX = m.x + Math.cos(randomAngle) * m.speed;
    nextY = m.y + Math.sin(randomAngle) * m.speed;

    if (!checkWallCollision(nextX, m.y, m.radius, true)) m.x = nextX;
    if (!checkWallCollision(m.x, nextY, m.radius, true)) m.y = nextY;
  } else {
    if (!inWallX) m.x = nextX;
    if (!inWallY) m.y = nextY;
  }
}

/**
 * Обновление патрулирования монстра
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updatePatrolMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;
  
  // ===== ИНИЦИАЛИЗАЦИЯ =====
  if (!m.patrolPath || m.patrolPath.length === 0) {
    m.patrolPath = generatePatrolPath(m, 4 + Math.floor(Math.random() * 2), 8 + Math.floor(Math.random() * 4));
    m.patrolIndex = 0;
  }
  
  if (!m.checkedInterests) m.checkedInterests = [];
  if (m.curiosity === undefined) m.curiosity = 30 + Math.random() * 40;
  
  // ===== ПРОВЕРКА ИНТЕРЕСНЫХ ТОЧЕК (с вероятностью) =====
  // Проверяем не чаще чем раз в 90 кадров
  if (m.patrolTimer <= 0 && m.patrolPhase === 'moving') {
    const interestRadius = m.perception?.interestRadius || 350;
    const points = findInterestingPoints(m, interestRadius);
    
    // Фильтруем уже проверенные точки
    const availablePoints = points.filter(p => {
      const isChecked = m.checkedInterests.some(c => 
        Math.abs(c.x - (p.gridX !== undefined ? p.gridX : Math.floor(p.x / CONFIG.cellSize))) < 1 &&
        Math.abs(c.y - (p.gridY !== undefined ? p.gridY : Math.floor(p.y / CONFIG.cellSize))) < 1
      );
      return !isChecked;
    });
    
    // Если есть интересные точки и монстр любопытен
    if (availablePoints.length > 0 && Math.random() * 100 < m.curiosity * 0.3) {
      // Выбираем точку с самым высоким приоритетом
      const bestPoint = availablePoints[0];
      startInvestigation(m, bestPoint);
      m.patrolTimer = 120 + Math.random() * 120;
      return;
    }
  }
  
  // ===== ОБНОВЛЕНИЕ ОСМОТРА =====
  if (m.patrolPhase === 'investigating') {
    const finished = updateInvestigation(m);
    if (finished) {
      m.patrolTimer = 30 + Math.random() * 60;
    }
    return;
  }
  
  // ===== СЛУЧАЙНАЯ ОСТАНОВКА =====
  if (m.patrolPhase === 'idle') {
    m.idleTimer--;
    
    // Меняем направление взгляда
    if (m.lookTimer <= 0) {
      m.lookDirection = Math.random() * Math.PI * 2;
      m.lookTimer = 15 + Math.random() * 30;
    }
    m.lookTimer--;
    
    // Визуальный эффект осмотра (лёгкое движение головы)
    if (m.idleTimer % 10 === 0) {
      const angle = m.lookDirection + (Math.random() - 0.5) * 0.3;
      const radius = 12 + Math.random() * 10;
      state.sparks.push({
        x: m.x + Math.cos(angle) * radius,
        y: m.y + Math.sin(angle) * radius - 12,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.2,
        life: 8 + Math.random() * 6,
        maxLife: 14,
        size: 0.8 + Math.random() * 1.2,
        color: '#88aacc',
        gravity: 0.01
      });
    }
    
    if (m.idleTimer <= 0) {
      m.patrolPhase = 'moving';
      m.patrolTimer = 20 + Math.random() * 40;
    }
    return;
  }
  
  // ===== ДВИЖЕНИЕ ПО МАРШРУТУ =====
  if (m.patrolPhase === 'moving') {
    // Обновляем таймер
    if (m.patrolTimer > 0) {
      m.patrolTimer--;
    }

    // Проверка на застревание в углу
    if (isMonsterStuckInCorner(m)) {
      escapeFromCorner(m);
      return;
    }
    
    // Проверяем, не пора ли остановиться
    if (m.patrolTimer <= 0 && Math.random() < 0.005) {
      // Случайная остановка на 30-80 кадров (0.5-1.3 секунды)
      m.patrolPhase = 'idle';
      m.idleTimer = 30 + Math.random() * 50;
      m.idleDuration = m.idleTimer;
      m.lookDirection = Math.random() * Math.PI * 2;
      m.lookTimer = 15 + Math.random() * 30;
      return;
    }
    
    // Движение к текущей точке маршрута
    const target = m.patrolPath[m.patrolIndex % m.patrolPath.length];
    if (!target) {
      // Если маршрут пуст — генерируем заново
      m.patrolPath = generatePatrolPath(m, 4 + Math.floor(Math.random() * 2), 8 + Math.floor(Math.random() * 4));
      m.patrolIndex = 0;
      return;
    }
    
    const distToTarget = Math.hypot(m.x - target.x, m.y - target.y);
    
    if (distToTarget < 30) {
      // Достигли точки — переходим к следующей
      m.patrolIndex = (m.patrolIndex + 1) % m.patrolPath.length;
      m.patrolTimer = 20 + Math.random() * 40;
    } else {
      // Движение к точке с плавностью
      smoothMoveToPosition(m, target.x, target.y, 0.88);
    }
  }
}

/**
 * Генерация маршрута патрулирования для монстра
 * 
 * @param {Object} m - Объект монстра
 * @param {number} pointCount - Количество точек маршрута
 * @param {number} maxRadius - Максимальный радиус поиска (в клетках)
 * @returns {Array<{x: number, y: number}>} - Массив точек маршрута
 */
export function generatePatrolPath(m, pointCount = 4, maxRadius = 8) {
  const path = [];
  const startGridX = Math.floor(m.startX / CONFIG.cellSize);
  const startGridY = Math.floor(m.startY / CONFIG.cellSize);
  
  // Добавляем стартовую точку
  path.push({ 
    x: m.startX, 
    y: m.startY,
    gridX: startGridX,
    gridY: startGridY,
    isStart: true
  });
  
  // Ищем дополнительные точки
  let attempts = 0;
  const maxAttempts = 200;
  
  while (path.length < pointCount && attempts < maxAttempts) {
    attempts++;
    
    // Случайное смещение от стартовой позиции
    const dx = Math.floor((Math.random() - 0.5) * maxRadius * 2);
    const dy = Math.floor((Math.random() - 0.5) * maxRadius * 2);
    const gx = startGridX + dx;
    const gy = startGridY + dy;
    
    // Проверка границ
    if (gx < 1 || gx >= CONFIG.cols - 1 || gy < 1 || gy >= CONFIG.rows - 1) continue;
    
    // Проверка, что клетка проходима
    const cell = state.grid[gy]?.[gx];
    if (!cell || cell.isWall) continue;

    // Точка не должна быть тупиком
    // Считаем количество проходимых соседей
    let walkableNeighbors = 0;
    const neighborDirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [ndx, ndy] of neighborDirs) {
      const nx = gx + ndx;
      const ny = gy + ndy;
      if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
        const neighbor = state.grid[ny]?.[nx];
        if (neighbor && !neighbor.isWall) {
          walkableNeighbors++;
        }
      }
    }
    
    // Если у точки меньше 2 проходимых соседей — это тупик, пропускаем
    if (walkableNeighbors < 2) continue;
    
    // Проверка, что точка не дублируется
    const isDuplicate = path.some(p => 
      Math.abs(p.gridX - gx) < 2 && Math.abs(p.gridY - gy) < 2
    );
    if (isDuplicate) continue;
    
    // Проверка, что точка не слишком близко к старту (кроме первой)
    if (path.length > 1) {
      const distToStart = Math.hypot(gx - startGridX, gy - startGridY);
      if (distToStart < 3) continue;
    }
    
    path.push({
      x: gx * CONFIG.cellSize + CONFIG.cellSize / 2,
      y: gy * CONFIG.cellSize + CONFIG.cellSize / 2,
      gridX: gx,
      gridY: gy,
      isStart: false
    });
  }
  
  // Если не нашли достаточно точек — добавляем простые (с проверкой на тупики)
  if (path.length < 3) {
    const fallbackPoints = [
      { dx: 3, dy: 0 },
      { dx: -3, dy: 3 },
      { dx: 0, dy: -3 },
      { dx: 4, dy: 4 },
      { dx: -4, dy: -4 },
    ];
    
    for (const fp of fallbackPoints) {
      if (path.length >= pointCount) break;
      
      const gx = startGridX + fp.dx;
      const gy = startGridY + fp.dy;
      
      if (gx < 1 || gx >= CONFIG.cols - 1 || gy < 1 || gy >= CONFIG.rows - 1) continue;
      
      const cell = state.grid[gy]?.[gx];
      if (!cell || cell.isWall) continue;
      
      // Проверка на тупик
      let walkableNeighbors = 0;
      const neighborDirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [ndx, ndy] of neighborDirs) {
        const nx = gx + ndx;
        const ny = gy + ndy;
        if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
          const neighbor = state.grid[ny]?.[nx];
          if (neighbor && !neighbor.isWall) {
            walkableNeighbors++;
          }
        }
      }
      if (walkableNeighbors < 2) continue;
      
      const isDuplicate = path.some(p => 
        Math.abs(p.gridX - gx) < 2 && Math.abs(p.gridY - gy) < 2
      );
      if (isDuplicate) continue;
      
      path.push({
        x: gx * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: gy * CONFIG.cellSize + CONFIG.cellSize / 2,
        gridX: gx,
        gridY: gy,
        isStart: false
      });
    }
  }
  
  return path;
}

/**
 * Поиск интересных точек в радиусе вокруг монстра
 * 
 * @param {Object} m - Объект монстра
 * @param {number} radius - Радиус поиска (в пикселях)
 * @returns {Array<{x: number, y: number, type: string, priority: number}>}
 */
export function findInterestingPoints(m, radius = 350) {
  const points = [];
  const gridX = Math.floor(m.x / CONFIG.cellSize);
  const gridY = Math.floor(m.y / CONFIG.cellSize);
  
  // ===== 1. ВЫХОД С УРОВНЯ (высокий приоритет) =====
  if (CONFIG.goal && CONFIG.goal.x > 0 && CONFIG.goal.y > 0) {
    const goalWorldX = CONFIG.goal.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const goalWorldY = CONFIG.goal.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const dist = Math.hypot(m.x - goalWorldX, m.y - goalWorldY);
    
    if (dist < radius) {
      // Проверяем, доступен ли выход (не босс-уровень или босс побеждён)
      let isExitAvailable = false;
      if (!state.isBossLevel) {
        isExitAvailable = true;
      } else if (state.bossSpawned) {
        const hasAliveBoss = state.monsters.some(mob => mob.isBoss && mob.hp > 0);
        isExitAvailable = !hasAliveBoss;
      }
      
      if (isExitAvailable) {
        points.push({
          x: goalWorldX,
          y: goalWorldY,
          type: 'exit',
          priority: 90,
          label: 'Выход'
        });
      }
    }
  }
  
  // ===== 2. АРТЕФАКТЫ (средний приоритет) =====
  for (const art of state.artifacts) {
    const dist = Math.hypot(m.x - art.x, m.y - art.y);
    if (dist < radius) {
      const cell = state.grid[Math.floor(art.y / CONFIG.cellSize)]?.[Math.floor(art.x / CONFIG.cellSize)];
      if (cell && cell.revealed) {
        points.push({
          x: art.x,
          y: art.y,
          type: 'artifact',
          priority: 60,
          label: 'Артефакт'
        });
      }
    }
  }
  
  // ===== 3. ЗОЛОТО И ЗЕЛЬЯ (низкий приоритет) =====
  for (const loot of state.lootItems) {
    const dist = Math.hypot(m.x - loot.x, m.y - loot.y);
    if (dist < radius) {
      const cell = state.grid[Math.floor(loot.y / CONFIG.cellSize)]?.[Math.floor(loot.x / CONFIG.cellSize)];
      if (cell && cell.revealed) {
        const priority = loot.type === 'gold' ? 30 : 25;
        points.push({
          x: loot.x,
          y: loot.y,
          type: loot.type,
          priority: priority,
          label: loot.type === 'gold' ? 'Золото' : 'Зелье'
        });
      }
    }
  }
  
  // ===== 4. ЗАКРЫТЫЕ СУНДУКИ (средний приоритет) =====
  for (const chest of state.chests) {
    if (chest.opened) continue;
    const dist = Math.hypot(m.x - chest.x, m.y - chest.y);
    if (dist < radius) {
      const cell = state.grid[Math.floor(chest.y / CONFIG.cellSize)]?.[Math.floor(chest.x / CONFIG.cellSize)];
      if (cell && cell.revealed) {
        const priority = chest.type === 'mimic' ? 55 : 45;
        points.push({
          x: chest.x,
          y: chest.y,
          type: 'chest',
          priority: priority,
          label: 'Сундук'
        });
      }
    }
  }
  
  // ===== 5. РАЗРУШЕННЫЕ СТЕНЫ (средний приоритет) =====
  // Проверяем клетки вокруг монстра
  const checkRadius = Math.ceil(radius / CONFIG.cellSize);
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const gx = gridX + dx;
      const gy = gridY + dy;
      
      if (gx < 0 || gx >= CONFIG.cols || gy < 0 || gy >= CONFIG.rows) continue;
      
      const cell = state.grid[gy]?.[gx];
      if (!cell) continue;
      
      // Ищем разрушенные стены (isWall === false, но была стеной)
      // Используем специальный флаг wasBreakable
      if (cell.wasBreakable && !cell.isWall) {
        const worldX = gx * CONFIG.cellSize + CONFIG.cellSize / 2;
        const worldY = gy * CONFIG.cellSize + CONFIG.cellSize / 2;
        const dist = Math.hypot(m.x - worldX, m.y - worldY);
        
        if (dist < radius) {
          // Проверяем, не проверяли ли уже эту стену
          const alreadyChecked = m.checkedInterests?.some(c => 
            Math.abs(c.x - gx) < 1 && Math.abs(c.y - gy) < 1
          );
          if (!alreadyChecked) {
            points.push({
              x: worldX,
              y: worldY,
              type: 'broken_wall',
              priority: 50,
              label: 'Разрушенная стена',
              gridX: gx,
              gridY: gy
            });
          }
        }
      }
    }
  }
  
  // Сортируем по приоритету (от высокого к низкому)
  points.sort((a, b) => b.priority - a.priority);
  
  // Возвращаем только уникальные точки (не слишком близко друг к другу)
  const uniquePoints = [];
  const minDist = 80;
  
  for (const p of points) {
    let isDuplicate = false;
    for (const existing of uniquePoints) {
      if (Math.hypot(p.x - existing.x, p.y - existing.y) < minDist) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      uniquePoints.push(p);
    }
  }
  
  return uniquePoints;
}

/**
 * Начало осмотра интересной точки
 * 
 * @param {Object} m - Объект монстра
 * @param {Object} point - Точка для осмотра
 * @returns {void}
 */
export function startInvestigation(m, point) {
  m.patrolPhase = 'investigating';
  m.investigationTarget = { x: point.x, y: point.y };
  m.investigationTimer = 60 + Math.random() * 60; // 1-2 секунды
  
  // Отмечаем точку как проверенную
  if (!m.checkedInterests) m.checkedInterests = [];
  m.checkedInterests.push({
    x: point.gridX !== undefined ? point.gridX : Math.floor(point.x / CONFIG.cellSize),
    y: point.gridY !== undefined ? point.gridY : Math.floor(point.y / CONFIG.cellSize),
    type: point.type,
    time: Date.now()
  });
  
  // Ограничиваем список проверенных точек
  if (m.checkedInterests.length > 20) {
    m.checkedInterests.splice(0, m.checkedInterests.length - 20);
  }
  
  // Визуальный эффект — вопросительный знак (без эмодзи!)
  state.damageTexts.push({
    x: m.x,
    y: m.y - 45,
    text: '?',
    color: '#ffcc44',
    size: 16,
    life: 25,
    speedy: 0.2
  });
}

/**
 * Обновление осмотра точки
 * 
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если осмотр завершён
 */
export function updateInvestigation(m) {
  if (m.patrolPhase !== 'investigating') return true;
  if (!m.investigationTarget) {
    m.patrolPhase = 'moving';
    return true;
  }
  
  // Движение к точке осмотра
  const distToTarget = Math.hypot(m.x - m.investigationTarget.x, m.y - m.investigationTarget.y);
  
  if (distToTarget > 20) {
    // Идём к точке
    smoothMoveToPosition(m, m.investigationTarget.x, m.investigationTarget.y, 0.85);
  } else {
    // На месте — осматриваемся
    m.investigationTimer--;
    
    // Меняем направление взгляда
    if (m.lookTimer <= 0) {
      m.lookDirection = Math.random() * Math.PI * 2;
      m.lookTimer = 15 + Math.random() * 30;
    }
    m.lookTimer--;
    
    // Визуальный эффект осмотра
    if (m.investigationTimer % 15 === 0) {
      // Маленькие искры вокруг головы (без эмодзи)
      for (let i = 0; i < 2; i++) {
        const angle = m.lookDirection + (Math.random() - 0.5) * 0.5;
        const radius = 20 + Math.random() * 15;
        state.sparks.push({
          x: m.x + Math.cos(angle) * radius,
          y: m.y + Math.sin(angle) * radius - 15,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.3,
          life: 10 + Math.random() * 8,
          maxLife: 18,
          size: 1 + Math.random() * 1.5,
          color: '#ffcc44',
          gravity: 0.02
        });
      }
    }
    
    if (m.investigationTimer <= 0) {
      m.patrolPhase = 'moving';
      m.investigationTarget = null;
      return true;
    }
  }
  
  return false;
}