/**
 * @fileoverview Память монстров о последней позиции игрока
 * @module entities/monsters/ai/memory
 */

import { state, player } from '../../../core/config/index.js';
import { CONFIG } from '../../../core/config/index.js';
import { smoothMoveToPosition, initMovementState, resetMovement } from './smoothMovement.js';
import { 
  updatePredictedPath, 
  getNextPredictionTarget, 
  advancePredictionStep 
} from './pathPredictor.js';
import {
  handleNormalSearch,
  handleExpandedSearch,
  handleMoveToLastKnown
} from './searchStates.js';
import { transitionToPatrol } from './stuckHandler.js';

/** @type {number} - Длительность памяти о позиции игрока (кадры) ~10 секунд при 60 FPS */
const MEMORY_DURATION = 600;

/** @type {number} - Длительность усиленной видимости после потери игрока (кадры) ~5 секунд */
const VISION_BOOST_DURATION = 300;

/** @type {number} - Множитель усиления видимости */
const VISION_BOOST_MULTIPLIER = 1.8;

// ============================================================
// УСИЛЕННАЯ ВИДИМОСТЬ
// ============================================================

/**
 * Активация усиленной видимости монстра
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
function activateVisionBoost(m) {
  if (!m.visionBoosted) {
    m.vision = Math.floor(m.baseVision * m.visionBoostMultiplier);
    m.visionBoosted = true;
    m.visionBoostTimer = m.visionBoostDuration;
  } else {
    m.visionBoostTimer = m.visionBoostDuration;
  }
}

/**
 * Деактивация усиленной видимости монстра
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
function deactivateVisionBoost(m) {
  if (m.visionBoosted) {
    m.vision = m.baseVision;
    m.visionBoosted = false;
    m.visionBoostTimer = 0;
  }
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ ПАМЯТИ
// ============================================================

/**
 * Обновление памяти монстра о последней позиции игрока
 * @param {Object} m - Объект монстра
 * @param {number} distToPlayer - Расстояние до игрока
 * @param {boolean} hasLineOfSight - Есть ли прямая видимость
 * @returns {Object} - { isSearching: boolean }
 */
export function updateMonsterMemory(m, distToPlayer, hasLineOfSight) {
  // ===== ЕСЛИ МОНСТР РЕАГИРУЕТ НА ЗВУК — ПРОПУСКАЕМ ЛОГИКУ ПАМЯТИ =====
  if (m._isReactingToSound) {
    return { isSearching: false };
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  initMovementState(m);

  // ===== УВЕЛИЧИВАЕМ ДЛИТЕЛЬНОСТЬ ПАМЯТИ =====
  // Если у монстра ещё не установлена длительность памяти — устанавливаем
  if (m.memoryDuration === undefined || m.memoryDuration < MEMORY_DURATION) {
    m.memoryDuration = MEMORY_DURATION;
  }
  
  // Устанавливаем длительность усиленной видимости
  if (m.visionBoostDuration === undefined || m.visionBoostDuration < VISION_BOOST_DURATION) {
    m.visionBoostDuration = VISION_BOOST_DURATION;
  }
  
  if (m.visionBoostMultiplier === undefined) {
    m.visionBoostMultiplier = VISION_BOOST_MULTIPLIER;
  }

  // ===== ЕСЛИ ЕСТЬ ВИДИМОСТЬ — ОБНОВЛЯЕМ ПАМЯТЬ =====
  if (hasLineOfSight && distToPlayer < m.vision) {
    activateVisionBoost(m);
    
    const playerGridX = Math.floor(player.px / CONFIG.cellSize);
    const playerGridY = Math.floor(player.py / CONFIG.cellSize);
    
    m.lastKnownX = player.px;
    m.lastKnownY = player.py;
    m.memoryTimer = m.memoryDuration;
    m.isSearching = false;
    m.searchTimer = 0;
    m.predictionStep = 1;
    
    updatePredictedPath(m, playerGridX, playerGridY);
    
    return { isSearching: false };
  }

  // ===== ЕСЛИ ВИДИМОСТИ НЕТ, НО ЕСТЬ ПАМЯТЬ — ИЩЕМ =====
  if (m.lastKnownX !== null && m.memoryTimer > 0) {
    if (m.visionBoosted) {
      m.visionBoostTimer--;
      if (m.visionBoostTimer <= 0) {
        deactivateVisionBoost(m);
      }
    }
    
    m.memoryTimer--;
    m.isSearching = true;
    m.searchTimer++;
    
    if (m.predictionTimer > 0) {
      m.predictionTimer--;
    }
    
    const searchProgress = 1 - (m.memoryTimer / m.memoryDuration);
    
    // ===== ПРИОРИТЕТ 1: ПРЕДПОЛАГАЕМЫЙ ПУТЬ =====
    let targetPos = null;
    let usingPrediction = false;
    
    if (m.predictedPath && m.predictedPath.length > 1 && m.predictionTimer > 0) {
      const reachedEnd = advancePredictionStep(m, m.x, m.y);
      
      if (!reachedEnd) {
        const pathTarget = getNextPredictionTarget(m);
        if (pathTarget) {
          targetPos = pathTarget;
          usingPrediction = true;
        }
      }
    }
    
    // ===== ПРИОРИТЕТ 2: ПОСЛЕДНЯЯ ПОЗИЦИЯ =====
    if (!targetPos) {
      const accuracy = Math.max(0.15, m.memoryTimer / m.memoryDuration);
      const randomOffset = (1 - accuracy) * 80 + 10;
      
      targetPos = {
        x: m.lastKnownX + (Math.random() - 0.5) * randomOffset,
        y: m.lastKnownY + (Math.random() - 0.5) * randomOffset
      };
    }
    
    const distToMemory = Math.hypot(m.x - m.lastKnownX, m.y - m.lastKnownY);
    
    // ===== УВЕЛИЧИВАЕМ ВРЕМЯ ПОИСКА =====
    // Выход в патруль только после очень долгого поиска
    if (m.isSearching && m.searchTimer > 600 && 
        m.x === m._lastX && m.y === m._lastY && 
        distToMemory > 100) {
      return transitionToPatrol(m, 'долгого стояния на месте');
    }
    
    // ===== ДВИЖЕНИЕ =====
    if (usingPrediction) {
      smoothMoveToPosition(m, targetPos.x, targetPos.y);
      
      if (m.searchTimer % 40 === 0) {
        state.damageTexts.push({
          x: m.x,
          y: m.y - 35,
          text: '?',
          color: '#ff8800',
          size: 16,
          life: 20,
          speedy: 0.2
        });
      }
    } else if (distToMemory < 40) {
      // ===== АКТИВНЫЙ ПОИСК =====

      // Выход в патруль при слишком долгом поиске
      if (m.searchTimer > 500) {
        return transitionToPatrol(m, 'долгого поиска');
      }

      // ===== РАСШИРЕННЫЙ ПОИСК =====
      if (m.searchTimer > 300) {
        return handleExpandedSearch(m, searchProgress, distToMemory);
      }

      // ===== ОБЫЧНЫЙ ПОИСК =====
      return handleNormalSearch(m, targetPos, searchProgress, distToMemory);
      
    } else {
      // ===== ДВИЖЕНИЕ К ПОСЛЕДНЕЙ ПОЗИЦИИ =====
      return handleMoveToLastKnown(m, targetPos);
    }
  }

  // ===== ПАМЯТЬ ИСТЕКЛА =====
  if (m.memoryTimer <= 0 && m.isSearching) {
    deactivateVisionBoost(m);
    
    m.isSearching = false;
    m.lastKnownX = null;
    m.lastKnownY = null;
    m.searchTimer = 0;
    m.predictedPath = [];
    m.predictionTimer = 0;
    m.predictionStep = 0;
    m.state = 'patrol';
    m.startX = m.x;
    m.startY = m.y;
    m._lastX = m.x;
    m._lastY = m.y;
    resetMovement(m);
    return { isSearching: false };
  }
  
  return { isSearching: false };
}