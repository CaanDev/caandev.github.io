/**
 * @fileoverview Управление состояниями монстров
 * @module entities/monsters/ai/states
 */

import { state, player } from '../../../core/config/index.js';
import { hasLineOfSight } from '../../../world/physics.js';

/**
 * Обновление состояния монстра на основе дистанции до игрока
 * 
 * @param {Object} m - Объект монстра
 * @param {number} distToPlayer - Расстояние от монстра до игрока
 * @returns {boolean} - true, если состояние изменилось
 */
export function updateMonsterState(m, distToPlayer) {
  let stateChanged = false;

  // Используем текущую видимость (может быть усилена)
  const currentVision = m.vision || m.baseVision || 320;

  // ===== ПАТРУЛЬ → ПРЕСЛЕДОВАНИЕ =====
  if (m.state === 'patrol' && distToPlayer < currentVision) {
    if (hasLineOfSight(m.x, m.y, player.px, player.py)) {
      m.state = 'chase';
      stateChanged = true;
    }
  }

  // ===== ПРИЗРАК: БОЛЕЕ ШИРОКИЙ РАДИУС =====
  if (m.isGhost && m.state === 'patrol' && distToPlayer < currentVision * 1.5) {
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

  // ===== ПРЕСЛЕДОВАНИЕ -> ПАТРУЛЬ =====
  // Если монстр в режиме поиска — НЕ переключаемся в патруль
  if (m.isSearching) {
    return stateChanged;
  }

  // Обычный монстр: преследование → патруль при потере игрока
  // Используем увеличенный порог для более долгого преследования
  const loseThreshold = currentVision * 2.0; // Увеличил с 1.6 до 2.0
  
  if (!m.isGhost && m.state === 'chase' && distToPlayer > loseThreshold) {
    // Проверяем, есть ли память о позиции игрока
    const hasMemory = m.lastKnownX !== null && m.memoryTimer > 0;
    
    // Если нет памяти — переходим в патруль
    if (!hasMemory) {
      m.state = 'patrol';
      m.startX = m.x;
      m.startY = m.y;
      stateChanged = true;
    }
    // Если есть память — остаёмся в режиме chase (поиск)
  }

  return stateChanged;
}