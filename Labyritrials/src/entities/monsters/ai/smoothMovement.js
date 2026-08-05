/**
 * @fileoverview Плавное движение монстров с инерцией
 * @module entities/monsters/ai/smoothMovement
 */

import { checkWallCollision } from '../../../world/physics.js';

/**
 * Инициализация состояния движения монстра
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function initMovementState(m) {
  if (m._moveDx === undefined) m._moveDx = 0;
  if (m._moveDy === undefined) m._moveDy = 0;
  if (m._lastX === undefined) m._lastX = m.x;
  if (m._lastY === undefined) m._lastY = m.y;
}

/**
 * Плавное движение монстра к указанной позиции
 * @param {Object} m - Объект монстра
 * @param {number} targetX - Целевая координата X
 * @param {number} targetY - Целевая координата Y
 * @param {number} [smoothness=0.88] - Плавность поворота
 * @returns {void}
 */
export function smoothMoveToPosition(m, targetX, targetY, smoothness = 0.88) {
  if (m.stunTimer > 0 || m.isFrozen) return;
  
  initMovementState(m);
  
  const angle = Math.atan2(targetY - m.y, targetX - m.x);
  const desiredDx = Math.cos(angle);
  const desiredDy = Math.sin(angle);
  
  m._moveDx = m._moveDx * smoothness + desiredDx * (1 - smoothness);
  m._moveDy = m._moveDy * smoothness + desiredDy * (1 - smoothness);
  
  const len = Math.hypot(m._moveDx, m._moveDy);
  if (len > 0.01) {
    m._moveDx /= len;
    m._moveDy /= len;
  } else {
    m._moveDx = desiredDx;
    m._moveDy = desiredDy;
  }
  
  let nextX = m.x + m._moveDx * m.speed;
  let nextY = m.y + m._moveDy * m.speed;
  
  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);
  
  if (!inWallX) {
    m.x = nextX;
  } else {
    m._moveDx = 0;
  }
  if (!inWallY) {
    m.y = nextY;
  } else {
    m._moveDy = 0;
  }
  
  m._lastX = m.x;
  m._lastY = m.y;
}

/**
 * Сброс движения
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function resetMovement(m) {
  m._moveDx = 0;
  m._moveDy = 0;
}