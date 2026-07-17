/**
 * @fileoverview Искусственный интеллект монстров.
 * Управляет состояниями монстров: патруль, преследование, бегство.
 * Обрабатывает движение, переходы между состояниями и особое поведение призраков.
 * 
 * @module entities/monsters/ai
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { checkWallCollision, hasLineOfSight, findPath, hasDirectPath } from '../../world/physics.js';
import { distanceCache } from '../../utils/cache.js';

/**
 * Обновление состояния монстра на основе дистанции до игрока
 * 
 * Обрабатывает переходы между состояниями:
 * - `patrol` → `chase` при обнаружении игрока
 * - `chase` → `patrol` при потере игрока
 * - Особое поведение для призраков
 * 
 * @param {Object} m - Объект монстра
 * @param {number} distToPlayer - Расстояние от монстра до игрока
 * @returns {boolean} - true, если состояние изменилось
 */
export function updateMonsterState(m, distToPlayer) {
  let stateChanged = false;

  // Обычный монстр: патруль → преследование при виде игрока
  if (m.state === 'patrol' && distToPlayer < m.vision) {
    if (hasLineOfSight(m.x, m.y, player.px, player.py)) {
      m.state = 'chase';
      stateChanged = true;
    }
  }

  // Призрак: более широкий радиус обнаружения, может обнаружить без прямой видимости
  if (m.isGhost && m.state === 'patrol' && distToPlayer < m.vision * 1.5) {
    if (hasLineOfSight(m.x, m.y, player.px, player.py) || Math.random() < 0.3) {
      m.state = 'chase';
      m.willNeverStop = true;
      stateChanged = true;
    }
  }

  // Призрак, который однажды начал преследование, не останавливается
  if (m.isGhost && m.willNeverStop && m.state === 'chase') {
    m.vision = 2000;
  }

  // Обычный монстр: преследование → патруль при потере игрока
  if (!m.isGhost && m.state === 'chase' && distToPlayer > m.vision * 1.6) {
    m.state = 'patrol';
    m.startX = m.x;
    m.startY = m.y;
    stateChanged = true;
  }

  return stateChanged;
}

/**
 * Движение монстра в режиме бегства (от игрока)
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updateFleeMovement(m) {
  // Пропускаем, если монстр оглушён или заморожен
  if (m.stunTimer > 0 || m.isFrozen) return;

  // Направление от игрока
  const angle = Math.atan2(m.y - player.py, m.x - player.px);
  let nextX = m.x + Math.cos(angle) * m.speed;
  let nextY = m.y + Math.sin(angle) * m.speed;

  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);

  // Если оба направления заблокированы — случайное движение
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
 * Движение монстра в режиме преследования игрока
 * 
 * Использует поиск пути (pathfinding) для обхода препятствий.
 * Оптимизирует производительность с помощью кэширования.
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updateChaseMovement(m) {
  // Пропускаем, если монстр оглушён или заморожен
  if (m.stunTimer > 0 || m.isFrozen) return;

  const distKey = `${Math.floor(m.x)},${Math.floor(m.y)}`;
  const cachedDist = distanceCache.get(distKey);
  let targetX, targetY;

  // Используем кэшированное расстояние для оптимизации
  if (cachedDist !== null && cachedDist < 100) {
    targetX = player.px;
    targetY = player.py;
  } else {
    targetX = player.px;
    targetY = player.py;
  }

  // Призраки всегда движутся напрямую к игроку
  if (m.isGhost) {
    targetX = player.px;
    targetY = player.py;
  } else {
    targetX = player.px;
    targetY = player.py;

    // Обновляем путь с задержкой для оптимизации
    if (m.pathUpdateCounter === undefined) m.pathUpdateCounter = 0;
    m.pathUpdateCounter++;

    if (CONFIG.pathfinding.enabled && CONFIG.pathfinding.cacheEnabled &&
        (m.pathUpdateCounter >= CONFIG.pathfinding.updateDelay || !m.currentPathTarget)) {
      m.pathUpdateCounter = 0;

      // Если нет прямой видимости — ищем путь
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
 * Перемещение монстра к целевой точке с учётом коллизий
 * 
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

  // Призраки могут проходить сквозь стены (фазинг)
  if (m.isGhost) {
    handleGhostMovement(m, nextX, nextY, inWallX, inWallY);
  } else {
    if (!inWallX) m.x = nextX;
    if (!inWallY) m.y = nextY;
  }
}

/**
 * Обработка движения призрака с возможностью фазинга (прохождения сквозь стены)
 * 
 * @param {Object} m - Объект призрака
 * @param {number} nextX - Следующая позиция X
 * @param {number} nextY - Следующая позиция Y
 * @param {boolean} inWallX - Коллизия по оси X
 * @param {boolean} inWallY - Коллизия по оси Y
 * @returns {void}
 * @private
 */
function handleGhostMovement(m, nextX, nextY, inWallX, inWallY) {
  const gridX = Math.floor(nextX / CONFIG.cellSize);
  const gridY = Math.floor(m.y / CONFIG.cellSize);
  const isBoundary = gridX <= 0 || gridX >= CONFIG.cols - 1 || gridY <= 0 || gridY >= CONFIG.rows - 1;

  // Движение по X с фазингом
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

  // Движение по Y с фазингом
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

  // Обновление таймера фазинга
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

/**
 * Движение монстра в режиме патруля (по горизонтали или вертикали)
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updatePatrolMovement(m) {
  // Пропускаем, если монстр оглушён или заморожен
  if (m.stunTimer > 0 || m.isFrozen) return;

  if (m.isHorizontal) {
    let nextX = m.x + m.speed * m.dir;
    if (Math.abs(nextX - m.startX) > m.patrolRange ||
        checkWallCollision(nextX, m.y, m.radius, true)) {
      m.dir *= -1;
    } else {
      m.x = nextX;
    }
  } else {
    let nextY = m.y + m.speed * m.dir;
    if (Math.abs(nextY - m.startY) > m.patrolRange ||
        checkWallCollision(m.x, nextY, m.radius, true)) {
      m.dir *= -1;
    } else {
      m.y = nextY;
    }
  }
}

/**
 * Поведение потерянного призрака (случайное блуждание)
 * 
 * @param {Object} m - Объект призрака
 * @returns {void}
 */
export function updateLostGhostBehavior(m) {
  if (m.isGhost && m.willNeverStop && m.state === 'chase' &&
      Math.hypot(player.px - m.x, player.py - m.y) > m.vision) {
    if (Math.random() < 0.1) {
      const randomAngle = Math.random() * Math.PI * 2;
      m.x += Math.cos(randomAngle) * m.speed;
      m.y += Math.sin(randomAngle) * m.speed;
    }
  }
}