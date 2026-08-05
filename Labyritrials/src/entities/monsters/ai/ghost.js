/**
 * @fileoverview Особое поведение призраков
 * @module entities/monsters/ai/ghost
 */

import { state, player } from '../../../core/config/index.js';

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