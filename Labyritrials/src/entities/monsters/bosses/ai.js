/**
 * @fileoverview Искусственный интеллект боссов.
 * Управляет состояниями, движением и поведением боссов разных типов.
 * 
 * @module entities/monsters/bosses/ai
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { checkWallCollision, hasLineOfSight, findPath, hasDirectPath } from '../../../world/physics.js';
import { BOSS_TYPES } from './config.js';

/** @type {number} - Смещение для эффекта дрожания */
let tremorOffset = 0;

/**
 * Проверка наличия колонны в указанной клетке
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @returns {boolean} - true, если в клетке есть колонна
 * @private
 */
function isPillarAt(gridX, gridY) {
  if (gridY < 0 || gridY >= CONFIG.rows || gridX < 0 || gridX >= CONFIG.cols) return false;
  return state.grid[gridY]?.[gridX]?.isPillar || false;
}

/**
 * Проверка коллизии с колонной в указанной позиции
 * 
 * @param {number} px - Координата X в пикселях
 * @param {number} py - Координата Y в пикселях
 * @param {number} radius - Радиус проверки
 * @returns {boolean} - true, если есть коллизия с колонной
 * @private
 */
function isPillarCollision(px, py, radius) {
  const gridX = Math.floor(px / CONFIG.cellSize);
  const gridY = Math.floor(py / CONFIG.cellSize);

  // Проверка текущей клетки
  if (isPillarAt(gridX, gridY)) return true;

  // Проверка соседних клеток в радиусе
  const checkRadius = Math.ceil(radius / CONFIG.cellSize);
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (isPillarAt(gridX + dx, gridY + dy)) {
        const pillarX = (gridX + dx) * CONFIG.cellSize + CONFIG.cellSize / 2;
        const pillarY = (gridY + dy) * CONFIG.cellSize + CONFIG.cellSize / 2;
        const dist = Math.hypot(px - pillarX, py - pillarY);
        if (dist < radius + CONFIG.cellSize * 0.4) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Обновление состояния босса на основе дистанции до игрока
 * 
 * @param {Object} m - Объект босса
 * @param {number} distToPlayer - Расстояние до игрока
 * @returns {boolean} - true, если состояние изменилось
 */
export function updateBossState(m, distToPlayer) {
  let stateChanged = false;

  switch (m.bossType) {
    case BOSS_TYPES.DEMON:
      // Демон всегда в режиме преследования
      if (m.state !== 'chase') {
        m.state = 'chase';
        stateChanged = true;
      }
      break;

    case BOSS_TYPES.DUO_CHASER:
      // Преследователь всегда преследует
      if (m.state !== 'chase') {
        m.state = 'chase';
        stateChanged = true;
      }
      break;

    case BOSS_TYPES.DUO_SHOOTER:
      // Стрелок убегает от игрока на расстоянии
      if (distToPlayer < m.vision) {
        if (m.state !== 'flee') {
          m.state = 'flee';
          stateChanged = true;
        }
      } else {
        const gridX = Math.floor(m.x / CONFIG.cellSize);
        const gridY = Math.floor(m.y / CONFIG.cellSize);
        const isInBadPosition = gridX < 4 || gridY < 4 || gridX > CONFIG.cols - 5 || gridY > CONFIG.rows - 5;

        // Выход из угла или патруль
        if (isInBadPosition && m.state === 'patrol') {
          const centerX = CONFIG.cols * CONFIG.cellSize / 2;
          const centerY = CONFIG.rows * CONFIG.cellSize / 2;
          const angle = Math.atan2(centerY - m.y, centerX - m.x);
          m.x += Math.cos(angle) * m.speed;
          m.y += Math.sin(angle) * m.speed;
        } else {
          if (m.state !== 'patrol') {
            m.state = 'patrol';
            stateChanged = true;
          }
        }
      }
      break;

    case BOSS_TYPES.MIND:
      // Разум всегда преследует
      if (m.state !== 'chase') {
        m.state = 'chase';
        stateChanged = true;
      }
      break;

    default:
      // Стандартное поведение для других типов
      if (m.state === 'patrol' && distToPlayer < m.vision) {
        if (hasLineOfSight(m.x, m.y, player.px, player.py)) {
          m.state = 'chase';
          stateChanged = true;
        }
      }

      if (!m.isGhost && m.state === 'chase' && distToPlayer > m.vision * 1.6) {
        m.state = 'patrol';
        m.startX = m.x;
        m.startY = m.y;
        stateChanged = true;
      }
      break;
  }

  return stateChanged;
}

/**
 * Движение босса в режиме преследования
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossChaseMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;

  let targetX = player.px;
  let targetY = player.py;

  // Обновление пути с задержкой
  if (m.pathUpdateCounter === undefined) m.pathUpdateCounter = 0;
  m.pathUpdateCounter++;

  if (CONFIG.pathfindingEnabled &&
      (m.pathUpdateCounter >= CONFIG.pathUpdateDelay || !m.currentPathTarget)) {
    m.pathUpdateCounter = 0;

    // Поиск пути, если нет прямой видимости
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

  moveBossToTarget(m, targetX, targetY);
}

/**
 * Движение босса в режиме бегства от игрока
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossFleeMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;

  const gridX = Math.floor(m.x / CONFIG.cellSize);
  const gridY = Math.floor(m.y / CONFIG.cellSize);

  // Определение близости к стенам
  const isNearTopWall = gridY < 3;
  const isNearBottomWall = gridY > CONFIG.rows - 4;
  const isNearLeftWall = gridX < 3;
  const isNearRightWall = gridX > CONFIG.cols - 4;
  const isInCorner = (isNearTopWall || isNearBottomWall) && (isNearLeftWall || isNearRightWall);
  const isNearWall = isNearTopWall || isNearBottomWall || isNearLeftWall || isNearRightWall;

  // Базовое направление — от игрока
  let angle = Math.atan2(m.y - player.py, m.x - player.px);

  // Корректировка направления при столкновении со стенами
  if (isInCorner) {
    // Выход из угла — движение к центру арены
    const centerX = CONFIG.cols * CONFIG.cellSize / 2;
    const centerY = CONFIG.rows * CONFIG.cellSize / 2;
    angle = Math.atan2(centerY - m.y, centerX - m.x);

    state.damageTexts.push({
      x: m.x, y: m.y - 20,
      text: `🏃 ВЫХОД ИЗ УГЛА!`,
      color: COLORS.effects.stun,
      size: 12,
      life: 30,
      speedy: 0.5
    });
  } else if (isNearWall) {
    // Смешивание направления бегства и направления от стены
    const wallDir = getWallAvoidanceDirection(m, gridX, gridY, isNearTopWall, isNearBottomWall, isNearLeftWall, isNearRightWall);
    const fleeAngle = angle;
    const wallAvoidAngle = wallDir;
    angle = fleeAngle * 0.6 + wallAvoidAngle * 0.4;
  }

  // Расчёт следующей позиции
  let nextX = m.x + Math.cos(angle) * m.speed;
  let nextY = m.y + Math.sin(angle) * m.speed;

  // Ограничение границами карты
  nextX = Math.max(m.radius + 10, Math.min(nextX, CONFIG.cols * CONFIG.cellSize - m.radius - 10));
  nextY = Math.max(m.radius + 10, Math.min(nextY, CONFIG.rows * CONFIG.cellSize - m.radius - 10));

  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);

  // Если оба направления заблокированы — случайный поиск
  if (inWallX && inWallY) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const randomAngle = Math.random() * Math.PI * 2;
      const testX = m.x + Math.cos(randomAngle) * m.speed;
      const testY = m.y + Math.sin(randomAngle) * m.speed;

      if (!checkWallCollision(testX, m.y, m.radius, true) &&
          !checkWallCollision(m.x, testY, m.radius, true)) {
        nextX = testX;
        nextY = testY;
        break;
      }
    }

    if (!checkWallCollision(nextX, m.y, m.radius, true)) m.x = nextX;
    if (!checkWallCollision(m.x, nextY, m.radius, true)) m.y = nextY;
  } else {
    if (!inWallX) m.x = nextX;
    if (!inWallY) m.y = nextY;
  }
}

/**
 * Получение направления для избегания стен
 * 
 * @param {Object} m - Объект босса
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @param {boolean} isNearTopWall - Близко к верхней стене
 * @param {boolean} isNearBottomWall - Близко к нижней стене
 * @param {boolean} isNearLeftWall - Близко к левой стене
 * @param {boolean} isNearRightWall - Близко к правой стене
 * @returns {number} - Угол направления (в радианах)
 * @private
 */
function getWallAvoidanceDirection(m, gridX, gridY, isNearTopWall, isNearBottomWall, isNearLeftWall, isNearRightWall) {
  let targetX = m.x;
  let targetY = m.y;

  if (isNearTopWall) {
    targetY = m.y + CONFIG.cellSize * 2;
  } else if (isNearBottomWall) {
    targetY = m.y - CONFIG.cellSize * 2;
  }

  if (isNearLeftWall) {
    targetX = m.x + CONFIG.cellSize * 2;
  } else if (isNearRightWall) {
    targetX = m.x - CONFIG.cellSize * 2;
  }

  // В углу — движение к центру карты
  if ((isNearTopWall && isNearLeftWall) || (isNearTopWall && isNearRightWall) ||
      (isNearBottomWall && isNearLeftWall) || (isNearBottomWall && isNearRightWall)) {
    targetX = CONFIG.cols * CONFIG.cellSize / 2;
    targetY = CONFIG.rows * CONFIG.cellSize / 2;
  }

  return Math.atan2(targetY - m.y, targetX - m.x);
}

/**
 * Движение босса в режиме патруля
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossPatrolMovement(m) {
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
 * Перемещение босса к целевой точке с учётом коллизий
 * 
 * @param {Object} m - Объект босса
 * @param {number} targetX - Целевая координата X
 * @param {number} targetY - Целевая координата Y
 * @returns {void}
 * @private
 */
function moveBossToTarget(m, targetX, targetY) {
  const angle = Math.atan2(targetY - m.y, targetX - m.x);
  let nextX = m.x + Math.cos(angle) * m.speed;
  let nextY = m.y + Math.sin(angle) * m.speed;

  const inPillarX = isPillarCollision(nextX, m.y, m.radius);
  const inPillarY = isPillarCollision(m.x, nextY, m.radius);
  const inWallX = checkWallCollision(nextX, m.y, m.radius, true);
  const inWallY = checkWallCollision(m.x, nextY, m.radius, true);

  if (!inPillarX && !inWallX) m.x = nextX;
  if (!inPillarY && !inWallY) m.y = nextY;
}

/**
 * Основное обновление движения босса
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossMovement(m) {
  if (m.stunTimer > 0 || m.isFrozen) return;

  // Эффект дрожания (при подготовке луча)
  if (m.isTremoring) {
    if (m.tremorDuration > 0) {
      m.tremorDuration--;
      const shakeX = (Math.random() - 0.5) * 8;
      const shakeY = (Math.random() - 0.5) * 8;
      m.x += shakeX;
      m.y += shakeY;

      if (m.tremorDuration <= 0) {
        m.isTremoring = false;
      }
    }
  }

  // Выбор режима движения
  switch (m.state) {
    case 'chase':
      updateBossChaseMovement(m);
      break;
    case 'flee':
      updateBossFleeMovement(m);
      break;
    case 'patrol':
      updateBossPatrolMovement(m);
      break;
  }
}