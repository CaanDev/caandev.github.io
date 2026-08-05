/**
 * @fileoverview Движение монстров (патруль, преследование, бегство)
 * @module entities/monsters/ai/movement
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { checkWallCollision, findPath, hasDirectPath } from '../../../world/physics.js';
import { distanceCache } from '../../../utils/cache.js';

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
 * Движение монстра в режиме патруля
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updatePatrolMovement(m) {
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