/**
 * @fileoverview Логика обновления диких блуждающих огоньков.
 * Управляет движением, атакой игрока, оглушением, смертью.
 * 
 * @module entities/objects/willOTheWisps/wildWispsUpdater
 */

import { state, player } from '../../../core/config/index.js';
import { checkWallCollision, hasLineOfSight } from '../../../world/physics.js';
import { playerTakeDamageFromMonster } from '../../player/combat.js';

/** @type {number} - Множитель скорости при преследовании игрока */
const CHASE_SPEED_MULT = 1.5;
/** @type {number} - Множитель скорости при патруле */
const PATROL_SPEED_MULT = 1.0;

/**
 * Обновление всех диких блуждающих огоньков.
 * 
 * @param {number} deltaTime - Время с прошлого кадра (сек)
 * @returns {void}
 */
export function updateWildWisps(deltaTime) {
  if (!state.wildWisps || state.wildWisps.length === 0) return;
  if (state.isPlayerDisabled) return;

  const now = Date.now();

  for (let i = state.wildWisps.length - 1; i >= 0; i--) {
    const wisp = state.wildWisps[i];

    // Смерть
    if (wisp.hp <= 0) {
      state.wildWisps.splice(i, 1);
      continue;
    }

    // Анимация пульсации
    wisp.pulsePhase = (wisp.pulsePhase || 0) + (wisp.pulseSpeed || 0.8) * deltaTime;

    // Оглушение
    if (wisp.stunTimer > 0) {
      wisp.stunTimer = Math.max(0, wisp.stunTimer - deltaTime * 60);
      continue;
    }

    const distToPlayer = Math.hypot(player.px - wisp.x, player.py - wisp.y);

    // Определение состояния
    // Огонёк видит игрока только если тот в радиусе видимости и есть прямая видимость
    const canSeePlayer = distToPlayer < wisp.vision && hasLineOfSight(wisp.x, wisp.y, player.px, player.py);

    if (canSeePlayer) wisp.state = 'chase';
    // Потерял игрока из виду - патруль
    else if (wisp.state === 'chase') wisp.state = 'patrol';

    // Движение
    if (wisp.state === 'chase') {
      moveTowards(wisp, player.px, player.py, wisp.speed * CHASE_SPEED_MULT);

      // Атака игрока
      if (distToPlayer < wisp.radius + 24 && now - wisp.lastHit > 1000) {
        wisp.lastHit = now;
        playerTakeDamageFromMonster(wisp.damage);
        state.screenShake = 8;

        if (player.hp <= 0) return;
      }
    } else {
      // Патруль - медленное блуждание вокруг стартовой позиции
      const angle = wisp.pulsePhase * 0.5;
      const radius = 40 + Math.sin(wisp.pulsePhase * 0.7) * 20;
      const targetX = wisp.startX + Math.cos(angle) * radius;
      const targetY = wisp.startY + Math.sin(angle) * radius;
      moveTowards(wisp, targetX, targetY, wisp.speed * PATROL_SPEED_MULT);
    }
  }
}

/**
 * Перемещение огонька к целевой точке с проверкой коллизий.
 * Огоньки не проходят сквозь стены.
 * 
 * @param {Object} wisp - Объект огонька
 * @param {number} targetX - Целевая координата X
 * @param {number} targetY - Целевая координата Y
 * @param {number} speed - Текущая скорость движения
 * @returns {void}
 * @private
 */
function moveTowards(wisp, targetX, targetY, speed) {
  const dx = targetX - wisp.x;
  const dy = targetY - wisp.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const angle = Math.atan2(dy, dx);
  const nextX = wisp.x + Math.cos(angle) * speed;
  const nextY = wisp.y + Math.sin(angle) * speed;

  const inWallX = checkWallCollision(nextX, wisp.y, wisp.radius, false);
  const inWallY = checkWallCollision(wisp.x, nextY, wisp.radius, false);

  if (!inWallX) wisp.x = nextX;
  if (!inWallY) wisp.y = nextY;
}