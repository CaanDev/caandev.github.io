/**
 * @fileoverview Система слуха монстров — реакция на звуки
 * @module entities/monsters/ai/hearing
 */

import { state } from '../../../core/config/index.js';
import { CONFIG } from '../../../core/config/index.js';
import { smoothMoveToPosition } from './smoothMovement.js';

/** @type {number} - Базовый радиус слышимости разрушения стены (в пикселях) */
const WALL_DESTROY_HEARING_RADIUS = 600;

/** @type {number} - Время жизни звука в секундах */
const SOUND_LIFETIME = 5;

/** @type {number} - Минимальная длительность реакции (кадры) */
const REACTION_DURATION_MIN = 120; // 2 секунды при 60 FPS

/** @type {number} - Дополнительное время на каждые 100px расстояния (кадры) */
const REACTION_DURATION_PER_100PX = 30; // 0.5 секунды

/** @type {number} - Максимальное время движения к звуку (кадры) */
const MAX_MOVE_DURATION = 300; // 5 секунд при 60 FPS

/** @type {number} - Пауза при реакции (кадры) */
const REACTION_PAUSE = 30; // 0.5 секунды

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Добавление события звука
 * @param {number} x - Координата X источника звука
 * @param {number} y - Координата Y источника звука
 * @param {string} type - Тип звука ('wallDestroy')
 * @param {number} [radius] - Радиус слышимости (если не указан, используется стандартный)
 * @returns {void}
 */
export function addSoundEvent(x, y, type, radius) {
  if (!state.soundEvents) {
    state.soundEvents = [];
  }

  // Если радиус не указан — используем базовый
  const actualRadius = radius || WALL_DESTROY_HEARING_RADIUS;

  state.soundEvents.push({
    x,
    y,
    type,
    radius: actualRadius,
    timestamp: Date.now(),
    active: true,
    heardBy: []
  });

  cleanupSoundEvents();
}

/**
 * Очистка устаревших звуков
 * @returns {void}
 */
function cleanupSoundEvents() {
  if (!state.soundEvents) return;
  
  const now = Date.now();
  state.soundEvents = state.soundEvents.filter(
    sound => (now - sound.timestamp) < SOUND_LIFETIME * 1000
  );
}

/**
 * Проверка, проверял ли уже монстр это место
 * @param {Object} m - Объект монстра
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {boolean} - true, если место уже проверено
 */
function isPlaceChecked(m, x, y) {
  if (!m._checkedPlaces) m._checkedPlaces = [];
  const key = `${Math.round(x)},${Math.round(y)}`;
  return m._checkedPlaces.includes(key);
}

/**
 * Отметка места как проверенного
 * @param {Object} m - Объект монстра
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {void}
 */
function markPlaceAsChecked(m, x, y) {
  if (!m._checkedPlaces) m._checkedPlaces = [];
  const key = `${Math.round(x)},${Math.round(y)}`;
  if (!m._checkedPlaces.includes(key)) {
    m._checkedPlaces.push(key);
  }
  if (m._checkedPlaces.length > 20) {
    m._checkedPlaces.shift();
  }
}

/**
 * Поиск ближайшей проходимой клетки к цели
 * @param {number} targetX - Координата X цели (пиксели)
 * @param {number} targetY - Координата Y цели (пиксели)
 * @param {number} maxRadius - Максимальный радиус поиска (в клетках)
 * @returns {Object} - { x, y }
 */
function findClosestWalkableCell(targetX, targetY, maxRadius = 3) {
  const cellSize = CONFIG.cellSize;
  const centerGridX = Math.floor(targetX / cellSize);
  const centerGridY = Math.floor(targetY / cellSize);
  
  const centerCell = state.grid[centerGridY]?.[centerGridX];
  if (centerCell && !centerCell.isWall && !centerCell.isPillar && centerCell.revealed) {
    return { x: targetX, y: targetY };
  }
  
  let bestDist = Infinity;
  let bestX = targetX;
  let bestY = targetY;
  
  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      const gx = centerGridX + dx;
      const gy = centerGridY + dy;
      
      if (gx < 0 || gx >= CONFIG.cols || gy < 0 || gy >= CONFIG.rows) continue;
      
      const cell = state.grid[gy]?.[gx];
      if (!cell || cell.isWall || cell.isPillar) continue;
      if (!cell.revealed) continue;
      
      const worldX = gx * cellSize + cellSize / 2;
      const worldY = gy * cellSize + cellSize / 2;
      const dist = Math.hypot(worldX - targetX, worldY - targetY);
      
      if (dist < bestDist) {
        bestDist = dist;
        bestX = worldX;
        bestY = worldY;
      }
    }
  }
  
  if (bestDist < maxRadius * cellSize) {
    return { x: bestX, y: bestY };
  }
  
  return { x: targetX, y: targetY };
}

/**
 * Получение ближайшего активного звука для монстра
 * @param {Object} m - Объект монстра
 * @returns {Object|null} - Ближайший звук или null
 */
function getNearestSound(m) {
  if (!state.soundEvents || state.soundEvents.length === 0) return null;

  const monsterId = m.id || `monster_${m.x}_${m.y}`;
  let nearest = null;
  let nearestDist = Infinity;

  for (const sound of state.soundEvents) {
    if (!sound.active) continue;
    
    if (sound.heardBy && sound.heardBy.includes(monsterId)) continue;
    if (isPlaceChecked(m, sound.x, sound.y)) continue;
    
    const dist = Math.hypot(m.x - sound.x, m.y - sound.y);
    
    if (dist <= sound.radius) {
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = sound;
      }
    }
  }

  return nearest;
}

/**
 * Отметка звука как услышанного монстром
 * @param {Object} m - Объект монстра
 * @param {Object} sound - Объект звука
 * @returns {void}
 */
function markSoundAsHeard(m, sound) {
  if (!sound) return;
  const monsterId = m.id || `monster_${m.x}_${m.y}`;
  if (!sound.heardBy) sound.heardBy = [];
  if (!sound.heardBy.includes(monsterId)) {
    sound.heardBy.push(monsterId);
  }
}

/**
 * Очистка всех звуков, услышанных монстром
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
function clearHeardSounds(m) {
  if (!state.soundEvents) return;
  const monsterId = m.id || `monster_${m.x}_${m.y}`;
  
  for (const sound of state.soundEvents) {
    if (sound.heardBy && sound.heardBy.includes(monsterId)) {
      const index = sound.heardBy.indexOf(monsterId);
      if (index !== -1) {
        sound.heardBy.splice(index, 1);
      }
    }
  }
}

/**
 * Полная очистка памяти о звуках для монстра (при обнаружении игрока)
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
function clearSoundMemory(m) {
  m._checkedPlaces = [];
  clearHeardSounds(m);
  if (m._isReactingToSound) {
    resetSoundReaction(m);
  }
}

/**
 * Проверка, реагирует ли монстр на звук в данный момент
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если монстр реагирует на звук
 */
export function isReactingToSound(m) {
  return m._isReactingToSound === true;
}

/**
 * Расчёт длительности реакции на основе расстояния
 * @param {number} distToSound - Расстояние до звука
 * @param {number} gameLevel - Текущий уровень игры
 * @returns {number} - Длительность реакции в кадрах
 */
function getReactionDuration(distToSound, gameLevel) {
  let duration = REACTION_DURATION_MIN + Math.floor(distToSound / 100) * REACTION_DURATION_PER_100PX;
  
  if (gameLevel >= 10) {
    duration = Math.floor(duration * 1.5);
  }
  
  return Math.min(duration, MAX_MOVE_DURATION);
}

/**
 * Проверка, застрял ли монстр и не двигается к цели
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если монстр застрял
 */
function isMonsterStuck(m) {
  if (m._lastMoveX === undefined) m._lastMoveX = m.x;
  if (m._lastMoveY === undefined) m._lastMoveY = m.y;
  
  const moved = Math.hypot(m.x - m._lastMoveX, m.y - m._lastMoveY);
  m._lastMoveX = m.x;
  m._lastMoveY = m.y;
  
  if (moved < 1) {
    m._stuckMoveCounter = (m._stuckMoveCounter || 0) + 1;
  } else {
    m._stuckMoveCounter = 0;
  }
  
  return m._stuckMoveCounter > 30;
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ — С ПРИОРИТЕТОМ ПРЕСЛЕДОВАНИЯ
// ============================================================

/**
 * Обновление реакции монстра на звуки
 * @param {Object} m - Объект монстра
 * @param {number} distToPlayer - Расстояние до игрока
 * @param {boolean} hasLineOfSight - Есть ли прямая видимость
 * @returns {Object|null} - Результат { isReacting: boolean, targetX, targetY } или null
 */
export function updateMonsterHearing(m, distToPlayer, hasLineOfSight) {
  // Если монстр видит игрока — ВСЕГДА игнорирует звуки
  if (hasLineOfSight && distToPlayer < m.vision) {
    // Если монстр реагировал на звук — сбрасываем
    if (m._isReactingToSound) {
      clearSoundMemory(m);
    }
    // Если монстр в режиме поиска — переключаем в преследование
    if (m.isSearching) {
      m.isSearching = false;
      m.memoryTimer = m.memoryDuration || 360;
      m.state = 'chase';
    }
    return null; // Монстр не реагирует на звуки, он видит игрока
  }

  // Если монстр уже преследует игрока И имеет активную память о нём — звуки полностью игнорируются!
  // Главная задача монстра — найти игрока, а не отвлекаться на шумы.
  const hasActiveMemory = m.lastKnownX !== null && 
                          m.memoryDuration !== undefined && 
                          m.memoryTimer > m.memoryDuration * 0.3;
  const isActivelyChasing = m.state === 'chase' && hasActiveMemory;
  
  if (isActivelyChasing) {
    // Если монстр реагировал на звук — сбрасываем
    if (m._isReactingToSound) {
      clearSoundMemory(m);
    }
    // Продолжаем преследование — возвращаем null (не реагируем на звуки)
    return null;
  }

  // Если монстр уже реагирует на звук — продолжаем реакцию
  if (m._isReactingToSound) {
    return updateSoundReaction(m);
  }

  // Монстр НЕ преследует игрока (патруль или потерял след) — может отреагировать на звук
  const hearingRadius = m.hearingRadius || WALL_DESTROY_HEARING_RADIUS;
  
  const nearestSound = getNearestSoundWithRadius(m, hearingRadius);
  if (!nearestSound) return null;

  return startSoundReaction(m, nearestSound);
}

/**
 * Получение ближайшего активного звука для монстра с учётом его радиуса слуха
 * @param {Object} m - Объект монстра
 * @param {number} hearingRadius - Радиус слуха монстра
 * @returns {Object|null} - Ближайший звук или null
 */
function getNearestSoundWithRadius(m, hearingRadius) {
  if (!state.soundEvents || state.soundEvents.length === 0) return null;

  const monsterId = m.id || `monster_${m.x}_${m.y}`;
  let nearest = null;
  let nearestDist = Infinity;

  for (const sound of state.soundEvents) {
    if (!sound.active) continue;
    
    if (sound.heardBy && sound.heardBy.includes(monsterId)) continue;
    if (isPlaceChecked(m, sound.x, sound.y)) continue;
    
    const dist = Math.hypot(m.x - sound.x, m.y - sound.y);
    
    // Используем радиус слуха монстра (или звука, если он больше)
    const effectiveRadius = Math.max(sound.radius || hearingRadius, hearingRadius);
    
    if (dist <= effectiveRadius) {
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = sound;
      }
    }
  }

  return nearest;
}

/**
 * Запуск реакции на звук
 * @param {Object} m - Объект монстра
 * @param {Object} sound - Объект звука
 * @returns {Object} - Результат { isReacting: true, targetX, targetY }
 */
function startSoundReaction(m, sound) {
  markSoundAsHeard(m, sound);
  
  m._savedState = m.state;
  m._savedStartX = m.startX;
  m._savedStartY = m.startY;
  
  const walkableTarget = findClosestWalkableCell(sound.x, sound.y);
  
  m._isReactingToSound = true;
  m._reactionTargetX = walkableTarget.x;
  m._reactionTargetY = walkableTarget.y;
  
  const distToSound = Math.hypot(m.x - walkableTarget.x, m.y - walkableTarget.y);
  m._reactionTimer = getReactionDuration(distToSound, state.gameLevel);
  m._reactionPauseTimer = REACTION_PAUSE;
  m._reactionPhase = 'pause';
  m._soundTarget = sound;
  m._stuckMoveCounter = 0;
  m._lastMoveX = m.x;
  m._lastMoveY = m.y;
  
  state.damageTexts.push({
    x: m.x,
    y: m.y - 45,
    text: '!',
    color: '#ffcc00',
    size: 28,
    life: 20,
    speedy: 0.1
  });
  
  return {
    isReacting: true,
    targetX: walkableTarget.x,
    targetY: walkableTarget.y,
    phase: 'pause'
  };
}

/**
 * Принудительное завершение реакции и переход в патруль
 * @param {Object} m - Объект монстра
 * @param {string} reason - Причина завершения
 * @returns {null}
 */
function forceFinishReaction(m, reason = '') {
  if (m._soundTarget) {
    markPlaceAsChecked(m, m._soundTarget.x, m._soundTarget.y);
    m._soundTarget = null;
  }
  
  resetSoundReaction(m);
  
  m.state = 'patrol';
  m.startX = m.x;
  m.startY = m.y;
  m.dir = Math.random() < 0.5 ? 1 : -1;
  m.isHorizontal = Math.random() < 0.5;
  m.patrolRange = CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1);
  m.isSearching = false;
  m._stuckCounter = 0;
  m.searchTimer = 0;
  m.memoryTimer = 0;
  m._moveDx = 0;
  m._moveDy = 0;
  m._stuckMoveCounter = 0;
  
  state.damageTexts.push({
    x: m.x,
    y: m.y - 45,
    text: '?',
    color: '#888888',
    size: 20,
    life: 15,
    speedy: 0.1
  });
  
  return null;
}

/**
 * Обновление реакции на звук
 * @param {Object} m - Объект монстра
 * @returns {Object|null} - Результат или null, если реакция завершена
 */
function updateSoundReaction(m) {
  if (m._reactionTimer > 0) {
    m._reactionTimer--;
  }
  
  // ===== ФАЗА 1: ПАУЗА =====
  if (m._reactionPhase === 'pause') {
    if (m._reactionPauseTimer > 0) {
      m._reactionPauseTimer--;
      return {
        isReacting: true,
        targetX: m.x,
        targetY: m.y,
        phase: 'pause'
      };
    }
    m._reactionPhase = 'move';
    m._reactionPauseTimer = 0;
    m._stuckMoveCounter = 0;
    m._lastMoveX = m.x;
    m._lastMoveY = m.y;
  }
  
  // ===== ФАЗА 2: ДВИЖЕНИЕ К ИСТОЧНИКУ =====
  if (m._reactionPhase === 'move') {
    const distToTarget = Math.hypot(m.x - m._reactionTargetX, m.y - m._reactionTargetY);
    
    if (isMonsterStuck(m) && distToTarget > 50) {
      return forceFinishReaction(m, 'stuck');
    }
    
    if (m._reactionTimer <= 0 && distToTarget > 50) {
      return forceFinishReaction(m, 'timeout');
    }
    
    if (distToTarget < 30) {
      markPlaceAsChecked(m, m._soundTarget ? m._soundTarget.x : m._reactionTargetX, 
                            m._soundTarget ? m._soundTarget.y : m._reactionTargetY);
      
      m._soundTarget = null;
      
      m._reactionPhase = 'arrived';
      m._reactionTimer = 30;
      
      state.damageTexts.push({
        x: m.x,
        y: m.y - 45,
        text: '?',
        color: '#888888',
        size: 24,
        life: 25,
        speedy: 0.1
      });
      
      return {
        isReacting: true,
        targetX: m.x,
        targetY: m.y,
        phase: 'arrived'
      };
    }
    
    if (m._reactionTimer <= 0) {
      if (distToTarget < 100) {
        m._reactionTimer = 30;
      } else {
        return forceFinishReaction(m, 'timeout_far');
      }
    }
    
    smoothMoveToPosition(m, m._reactionTargetX, m._reactionTargetY);
    
    return {
      isReacting: true,
      targetX: m._reactionTargetX,
      targetY: m._reactionTargetY,
      phase: 'move'
    };
  }
  
  // ===== ФАЗА 3: ОСМОТР =====
  if (m._reactionPhase === 'arrived') {
    if (m._reactionTimer > 0) {
      m._reactionTimer--;
      return {
        isReacting: true,
        targetX: m.x,
        targetY: m.y,
        phase: 'arrived'
      };
    }
    
    resetSoundReaction(m);
    
    m.state = 'patrol';
    m.startX = m.x;
    m.startY = m.y;
    m.dir = Math.random() < 0.5 ? 1 : -1;
    m.isHorizontal = Math.random() < 0.5;
    m.patrolRange = CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1);
    m.isSearching = false;
    m._stuckCounter = 0;
    m.searchTimer = 0;
    m.memoryTimer = 0;
    m._moveDx = 0;
    m._moveDy = 0;
    m._stuckMoveCounter = 0;
    
    return null;
  }
  
  resetSoundReaction(m);
  return null;
}

/**
 * Сброс реакции на звук
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
function resetSoundReaction(m) {
  m._isReactingToSound = false;
  m._reactionTargetX = null;
  m._reactionTargetY = null;
  m._reactionTimer = 0;
  m._reactionPauseTimer = 0;
  m._reactionPhase = null;
  m._soundTarget = null;
  m._stuckMoveCounter = 0;
  m._lastMoveX = undefined;
  m._lastMoveY = undefined;
  
  if (m._savedState) {
    m.state = m._savedState;
    m.startX = m._savedStartX || m.x;
    m.startY = m._savedStartY || m.y;
    m._savedState = null;
    m._savedStartX = null;
    m._savedStartY = null;
  }
  
  m.isSearching = false;
  m._stuckCounter = 0;
  m.searchTimer = 0;
  m.memoryTimer = 0;
  m._moveDx = 0;
  m._moveDy = 0;
}

/**
 * Очистка всех звуковых событий
 * @returns {void}
 */
export function clearSoundEvents() {
  if (state.soundEvents) {
    state.soundEvents = [];
  }
}

/**
 * Очистка проверенных мест для монстра
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function clearCheckedPlaces(m) {
  if (m) {
    m._checkedPlaces = [];
  }
}

/**
 * Получение количества активных звуков
 * @returns {number}
 */
export function getSoundEventsCount() {
  if (!state.soundEvents) return 0;
  cleanupSoundEvents();
  return state.soundEvents.length;
}