/**
 * @fileoverview Атаки боссов.
 * Управляет атаками боссов разных типов, проверкой условий для атаки,
 * кулдаунами и блокировкой атак колоннами.
 * 
 * @module entities/monsters/bosses/attacks
 */

import { state, player, CONFIG } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { hasLineOfSight } from '../../../world/physics.js';
import { BOSS_TYPES } from './config.js';

/**
 * Проверка наличия колонны между двумя точками
 * 
 * @param {number} x1 - Координата X начальной точки
 * @param {number} y1 - Координата Y начальной точки
 * @param {number} x2 - Координата X конечной точки
 * @param {number} y2 - Координата Y конечной точки
 * @returns {boolean} - true, если между точками есть колонна
 * @private
 */
function hasPillarBetween(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
    const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
    if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
      if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isPillar) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Обновление атак босса
 * 
 * Обрабатывает атаки для разных типов боссов:
 * - DUO_SHOOTER: обычные и усиленные атаки в режиме ярости
 * - MIND: пси-шары с разным кулдауном в зависимости от фазы
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossAttack(m) {
  if (!m.abilities || m.hp <= 0) return;

  const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);

  // ===== БОСС-СТРЕЛОК (уровень 15) =====
  if (m.bossType === BOSS_TYPES.DUO_SHOOTER) {
    // Режим ярости (после смерти преследователя)
    if (m.rageModeActive) {
      let cooldownValue = m.currentDynamicCooldown !== undefined ? m.currentDynamicCooldown : 100;

      if (m.attackCooldown > 0) {
        m.attackCooldown--;
      } else {
        const hasPillar = hasPillarBetween(m.x, m.y, player.px, player.py);

        // Атака кольцом огня
        if (distToPlayer < m.vision && m.abilities.circleFireball && !hasPillar) {
          m.abilities.circleFireball.execute(m);
          m.attackCooldown = cooldownValue;

          // Индикатор быстрой атаки при малом кулдауне
          if (cooldownValue < 60) {
            state.screenShake = 5;
            state.damageTexts.push({
              x: m.x, y: m.y - 30,
              text: `⚡ БЫСТРАЯ АТАКА!`,
              color: COLORS.effects.lightning,
              size: 14,
              life: 25,
              speedy: 0.6
            });
          }
        } else if (hasPillar) {
          // Блокировка атаки колонной
          state.damageTexts.push({
            x: m.x, y: m.y - 20,
            text: '🏛️ БЛОК!',
            color: COLORS.ui.textDark,
            size: 14,
            life: 25,
            speedy: 0.8
          });
          m.attackCooldown = 10;
        }
      }
    } else {
      // Обычный режим (до смерти преследователя)
      if (m.attackCooldown > 0) {
        m.attackCooldown--;
      } else {
        const hasPillar = hasPillarBetween(m.x, m.y, player.px, player.py);

        // Обычный огненный шар
        if (distToPlayer < m.vision && hasLineOfSight(m.x, m.y, player.px, player.py) && !hasPillar) {
          m.abilities.shootFireball.execute(m);
          m.attackCooldown = 50;
        } else if (hasPillar) {
          state.damageTexts.push({
            x: m.x, y: m.y - 20,
            text: '🏛️ БЛОК!',
            color: COLORS.ui.textDark,
            size: 14,
            life: 25,
            speedy: 0.8
          });
          m.attackCooldown = 10;
        }
      }
    }
  }

  // ===== БОСС-РАЗУМ (уровень 10) =====
  if (m.abilities.mindBall) {
    if (m.attackCooldown > 0) {
      m.attackCooldown--;
    } else {
      const hasPillar = hasPillarBetween(m.x, m.y, player.px, player.py);

      if (distToPlayer < m.vision && hasLineOfSight(m.x, m.y, player.px, player.py) && !hasPillar) {
        m.abilities.mindBall.execute(m);
        // Кулдаун зависит от фазы: фаза 2 — быстрее
        m.attackCooldown = m.currentPhase === 2 ? 40 : 60;
      } else if (hasPillar) {
        state.damageTexts.push({
          x: m.x, y: m.y - 20,
          text: '🏛️ БЛОК!',
          color: COLORS.ui.textDark,
          size: 14,
          life: 25,
          speedy: 0.8
        });
        m.attackCooldown = 10;
      }
    }
  }
}

/**
 * Применение инверсии управления к боссу
 * 
 * @param {Object} boss - Объект босса
 * @returns {void}
 */
export function applyInvertedControls(boss) {
  if (!boss || boss.bossType !== BOSS_TYPES.MIND) return;

  if (boss.abilities.invertControls) {
    boss.abilities.invertControls.execute(boss);
  }
}

/**
 * Обновление таймера инверсии управления для босса
 * 
 * @returns {void}
 */
export function updateInvertTimer() {
  for (let monster of state.monsters) {
    if (monster.bossType === BOSS_TYPES.MIND && monster.invertTimer > 0) {
      monster.invertTimer--;
      if (monster.invertTimer <= 0) {
        monster.invertedControls = false;
      }
    }
  }
}