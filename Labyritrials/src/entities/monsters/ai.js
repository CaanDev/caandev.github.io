/**
 * @fileoverview Искусственный интеллект монстров.
 * Управляет состояниями монстров: патруль, преследование, бегство.
 * Обрабатывает движение, переходы между состояниями и особое поведение призраков.
 * 
 * @module entities/monsters/ai
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { checkWallCollision, hasLineOfSight, findPath, hasDirectPath } from '../../world/physics.js';
import { distanceCache } from '../../utils/cache.js';

/**
 * Поиск и использование зелья монстром
 * 
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если зелье использовано
 */
export function usePotionIfNearby(m) {
  // Монстр должен преследовать игрока
  if (m.state !== 'chase') return false;
  
  // На босс-уровнях монстры не используют зелья
  if (state.isBossLevel) return false;
  // Боссы не используют зелья
  if (m.isBoss || m.isDuoBoss) return false;
  
  // Проверяем зелья на полу
  const potionRadius = 120;
  let nearestPotion = null;
  let nearestDist = Infinity;
  
  for (let item of state.lootItems) {
    if (item.type !== 'potion') continue;
    
    const dist = Math.hypot(m.x - item.x, m.y - item.y);
    if (dist < potionRadius && dist < nearestDist) {
      // Проверяем, есть ли прямая видимость до зелья
      if (hasLineOfSight(m.x, m.y, item.x, item.y)) {
        nearestPotion = item;
        nearestDist = dist;
      }
    }
  }
  
  if (!nearestPotion) return false;
  
  // Если монстр уже достаточно близко к зелью — использует его
  const distToPotion = Math.hypot(m.x - nearestPotion.x, m.y - nearestPotion.y);
  if (distToPotion < 35) {
    // Удаляем зелье с пола
    const index = state.lootItems.indexOf(nearestPotion);
    if (index !== -1) {
      state.lootItems.splice(index, 1);
    }

    // Проверяем, нужно ли лечение
    const isFullHp = m.hp >= m.maxHp;
    
    if (isFullHp) {
      // Здоровье полное — показываем соответствующее сообщение
      state.damageTexts.push({
        x: m.x,
        y: m.y - 20,
        text: `❤️ Здоровье полное!`,
        color: COLORS.ui.textGold,
        size: 18,
        life: 50,
        speedy: 1.0
      });
      
      // Лёгкие золотые искры
      for (let i = 0; i < 6; i++) {
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        state.sparks.push({
          x: m.x,
          y: m.y,
          vx: Math.cos(angle2) * speed,
          vy: Math.sin(angle2) * speed - 0.5,
          life: 10 + Math.random() * 10,
          maxLife: 20,
          size: 1.5 + Math.random() * 2.5,
          color: COLORS.ui.textGold,
          gravity: 0.03,
          isDust: false
        });
      }
      
      return true;
    }
    
    // Лечим монстра (30-40% от максимального HP)
    const healPercent = 0.3 + Math.random() * 0.15;
    const healAmount = Math.floor(m.maxHp * healPercent);
    const oldHp = m.hp;
    m.hp = Math.min(m.maxHp, m.hp + healAmount);
    const actualHeal = m.hp - oldHp;
    
    // Визуальный эффект
    state.damageTexts.push({
      x: m.x,
      y: m.y - 20,
      text: `+${actualHeal} ❤️`,
      color: COLORS.effects.potion.mid,
      size: 24,
      life: 50,
      speedy: 1.2
    });
    
    // Зелёные искры
    for (let i = 0; i < 12; i++) {
      const angle2 = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      state.sparks.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(angle2) * speed,
        vy: Math.sin(angle2) * speed - 1,
        life: 15 + Math.random() * 15,
        maxLife: 30,
        size: 2 + Math.random() * 4,
        color: COLORS.effects.potion.mid,
        gravity: 0.05,
        isDust: false
      });
    }
    
    // Зелёное свечение вокруг монстра
    m.trapGlowColor = COLORS.effects.potion.mid;
    m.trapGlowTimer = 30;
    
    return true;
  }
  
  // Если монстр ещё не дошёл до зелья — движется к нему
  const angle = Math.atan2(nearestPotion.y - m.y, nearestPotion.x - m.x);
  const moveSpeed = m.speed * 1.8;
  
  m.x += Math.cos(angle) * moveSpeed;
  m.y += Math.sin(angle) * moveSpeed;
  
  // Возвращаем false, чтобы монстр продолжил преследование в следующем кадре
  return false;
}

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