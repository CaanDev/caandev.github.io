/**
 * @fileoverview Обработка застревания монстров
 * @module entities/monsters/ai/stuckHandler
 */

import { state } from '../../../core/config/index.js';
import { resetMovement } from './smoothMovement.js';

/**
 * Проверка и обработка застревания монстра
 * @param {Object} m - Объект монстра
 * @param {number} distToMemory - Расстояние до последней позиции игрока
 * @returns {Object|null} - Результат { isSearching: false } или null
 */
export function checkAndHandleStuck(m, distToMemory) {
  // Инициализация счётчика застревания
  if (m._stuckCounter === undefined) m._stuckCounter = 0;
  
  // Проверяем, сдвинулся ли монстр
  if (m.x === m._lastX && m.y === m._lastY) {
    m._stuckCounter++;
  } else {
    m._stuckCounter = 0;
  }
  
  // Если застрял более чем на 30 кадров
  if (m._stuckCounter > 30) {
    // Показываем, что монстр обдумывает путь
    if (m._stuckCounter % 15 === 0) {
      state.damageTexts.push({
        x: m.x,
        y: m.y - 35,
        text: '?',
        color: '#ffcc44',
        size: 14,
        life: 25,
        speedy: 0.2
      });
    }
    
    // Если слишком долго стоит (> 60 кадров) — переходим в патруль
    if (m._stuckCounter > 60) {
      return transitionToPatrol(m, 'долгого раздумья');
    }
    
    // Не двигаемся — просто стоим
    m._lastX = m.x;
    m._lastY = m.y;
    return { isSearching: true };
  }
  
  return null;
}

/**
 * Переход монстра в режим патруля
 * @param {Object} m - Объект монстра
 * @param {string} reason - Причина перехода (для отладки)
 * @returns {Object} - { isSearching: false }
 */
export function transitionToPatrol(m, reason = '') {
  // Если монстр реагирует на звук — не показываем ?
  if (m._isReactingToSound) {
    // Просто сбрасываем состояние без визуального эффекта
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
    m._expandedTarget = null;
    m._stuckCounter = 0;
    resetMovement(m);
    return { isSearching: false };
  }
  
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
  m._expandedTarget = null;
  m._stuckCounter = 0;
  resetMovement(m);
  
  state.damageTexts.push({
    x: m.x,
    y: m.y - 35,
    text: '?',
    color: '#888888',
    size: 14,
    life: 30,
    speedy: 0.2
  });
  
  return { isSearching: false };
}

/**
 * Сброс состояния застревания
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function resetStuckState(m) {
  m._stuckCounter = 0;
}