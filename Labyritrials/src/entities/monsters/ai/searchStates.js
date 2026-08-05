/**
 * @fileoverview Состояния поиска монстров
 * @module entities/monsters/ai/searchStates
 */

import { state } from '../../../core/config/index.js';
import { smoothMoveToPosition } from './smoothMovement.js';
import { getNextPredictionTarget } from './pathPredictor.js';
import { transitionToPatrol } from './stuckHandler.js';

/**
 * Обработка обычного поиска
 */
export function handleNormalSearch(m, targetPos, searchProgress, distToMemory) {
  // Если монстр реагирует на звук — не показываем ?
  if (m._isReactingToSound) {
    return { isSearching: true };
  }
  
  if (m._stuckCounter === undefined) m._stuckCounter = 0;
  
  if (m.x === m._lastX && m.y === m._lastY) {
    m._stuckCounter++;
  } else {
    m._stuckCounter = 0;
  }
  
  if (m._stuckCounter > 30) {
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
    
    if (m._stuckCounter > 60) {
      return transitionToPatrol(m, 'долгого раздумья');
    }
    
    m._lastX = m.x;
    m._lastY = m.y;
    return { isSearching: true };
  }
  
  if (m.searchTimer % 10 === 0) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + searchProgress * 80;
    const targetX = m.lastKnownX + Math.cos(angle) * distance;
    const targetY = m.lastKnownY + Math.sin(angle) * distance;
    
    smoothMoveToPosition(m, targetX, targetY);
  }
  
  if (m.x === m._lastX && m.y === m._lastY) {
    if (m.searchTimer % 20 === 0) {
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
  }
  
  m._lastX = m.x;
  m._lastY = m.y;
  
  if (m.searchTimer % 20 === 0 && m.x !== m._lastX) {
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
  
  return { isSearching: true };
}

/**
 * Обработка расширенного поиска
 */
export function handleExpandedSearch(m, searchProgress, distToMemory) {
  if (!m._expandedTarget || 
      Math.hypot(m.x - m._expandedTarget.x, m.y - m._expandedTarget.y) < 20) {
    
    const expandedSearchRadius = 150 + searchProgress * 100;
    const angle = Math.random() * Math.PI * 2;
    m._expandedTarget = {
      x: m.lastKnownX + Math.cos(angle) * expandedSearchRadius,
      y: m.lastKnownY + Math.sin(angle) * expandedSearchRadius
    };
    
    if (m.searchTimer % 30 === 0) {
      state.damageTexts.push({
        x: m.x,
        y: m.y - 35,
        text: '?',
        color: '#ff8800',
        size: 14,
        life: 20,
        speedy: 0.2
      });
    }
  }
  
  const oldX = m.x;
  const oldY = m.y;
  
  smoothMoveToPosition(m, m._expandedTarget.x, m._expandedTarget.y);
  
  if (m.x !== oldX || m.y !== oldY) {
    m._lastX = m.x;
    m._lastY = m.y;
  } else {
    m._expandedTarget = null;
    if (m.searchTimer % 20 === 0) {
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
  }
  
  return { isSearching: true };
}

/**
 * Обработка движения к последней позиции
 */
export function handleMoveToLastKnown(m, targetPos) {
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
  
  return { isSearching: true };
}