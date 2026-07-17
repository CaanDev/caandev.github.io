/**
 * @fileoverview Логика боссов.
 * Управляет фазами боссов, активацией способностей,
 * периодическими атаками и переходами между фазами.
 * 
 * @module entities/monsters/bosses/logic
 */

import { state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { BOSS_TYPES } from './config.js';
import { summonMinionsAroundBoss } from './abilities/index.js';
import { hasLineOfSight } from '../../../world/physics.js';

/**
 * Основная логика босса
 * 
 * Обрабатывает:
 * - Смену фаз
 * - Активацию способностей при смене фаз
 * - Периодический призыв миньонов (Демон)
 * - Особую логику для каждого типа босса
 * 
 * @param {Object} m - Объект босса
 * @param {number} i - Индекс босса в массиве
 * @returns {boolean} - true, если были использованы способности
 */
export function updateBossLogic(m, i) {
  if (!m.abilities || m.hp <= 0) return false;

  let abilitiesUsed = false;

  // ===== ДЕМОН: выполнение луча после подготовки =====
  if (m.bossType === BOSS_TYPES.DEMON && m.isPreparingBeam) {
    if (m.abilities.tremor && m.abilities.tremor.tryExecuteBeam) {
      m.abilities.tremor.tryExecuteBeam(m);
    }
  }

  // ===== ОБНОВЛЕНИЕ ФАЗЫ =====
  const phaseChanged = m.updatePhase(m.hp, m.maxHp);

  // ===== ДЕМОН: активация способностей при смене фазы =====
  if (m.bossType === BOSS_TYPES.DEMON && phaseChanged) {
    if (m.currentPhase === 2) {
      // Фаза 2: призыв миньонов + ускорение
      if (m.abilities.phaseSummon) {
        m.abilities.phaseSummon.execute(m);
        abilitiesUsed = true;
      }
      if (m.abilities.speedBoost) {
        m.abilities.speedBoost.execute(m);
        abilitiesUsed = true;
      }
    }

    if (m.currentPhase === 3) {
      // Фаза 3: ярость + усиленный призыв
      if (m.abilities.rage) {
        m.abilities.rage.execute(m);
        abilitiesUsed = true;
      }
      if (m.abilities.empoweredSummon) {
        m.abilities.empoweredSummon.execute(m);
        abilitiesUsed = true;
      }
    }
  }

  // ===== ДЕМОН: периодический призыв миньонов (фазы 2-3) =====
  if (m.bossType === BOSS_TYPES.DEMON && (m.currentPhase === 2 || m.currentPhase === 3)) {
    // Если босс готовит луч — пропускаем призыв
    if (m.isPreparingBeam) {
      return abilitiesUsed;
    }

    if (m.abilities.periodicSummon) {
      const now = Date.now();
      const cooldown = m.currentPhase === 3 ? 4000 : 5000;
      if (!m.lastMinionSummon || (now - m.lastMinionSummon > cooldown)) {
        m.abilities.periodicSummon.execute(m);
        m.lastMinionSummon = now;
        abilitiesUsed = true;
      }
    }
  }

  // ===== ДЕМОН: тряска (только фаза 3) =====
  if (m.bossType === BOSS_TYPES.DEMON && m.currentPhase === 3) {
    if (m.abilities.tremor) {
      const now = Date.now();
      if (!m.lastTremor || (now - m.lastTremor > 15000)) {
        if (!m.isTremoring) {
          m.abilities.tremor.execute(m);
          m.lastTremor = now;
          abilitiesUsed = true;
        }
      }
    }
  }

  // ===== РАЗУМ: управление фазами =====
  if (m.bossType === BOSS_TYPES.MIND) {
    // Инициализация флагов
    if (m.phase2MessageShown === undefined) m.phase2MessageShown = false;
    if (m.phase3MessageShown === undefined) m.phase3MessageShown = false;
    if (m.lastPhase === undefined) m.lastPhase = 1;
    if (m.lastWaveTime === undefined) m.lastWaveTime = 0;
    if (m.lastTeleportTime === undefined) m.lastTeleportTime = 0;

    const currentPercent = m.hp / m.maxHp;
    let currentPhase = 1;
    if (currentPercent < 0.75) currentPhase = 2;
    if (currentPercent < 0.4) currentPhase = 3;

    // Смена фазы
    if (currentPhase !== m.lastPhase) {
      m.lastPhase = currentPhase;
      m.currentPhase = currentPhase;
      m.phaseChanged = true;

      if (currentPhase === 2) {
        m.phase2MessageShown = false;
      }
      if (currentPhase === 3) {
        m.phase3MessageShown = false;
        m.lastWaveTime = 0;
        m.lastTeleportTime = 0;

        // Активация способностей при входе в фазу 3
        if (m.abilities.psionicWave) {
          m.abilities.psionicWave.execute(m);
          abilitiesUsed = true;
        }
        if (m.abilities.teleportWithTrap) {
          m.abilities.teleportWithTrap.execute(m);
          abilitiesUsed = true;
        }
      }
    } else {
      m.phaseChanged = false;
    }

    // Сообщение о переходе в фазу 2
    if (m.currentPhase === 2 && !m.phase2MessageShown) {
      m.phase2MessageShown = true;
      if (m.abilities.speedBoost) {
        m.abilities.speedBoost.execute(m);
        abilitiesUsed = true;
      }
      state.damageTexts.push({
        x: m.x, y: m.y - 70,
        text: `⚠️ РАЗУМ УСИЛИВАЕТСЯ! ⚠️`,
        color: COLORS.effects.lightning,
        size: 22,
        life: 60,
        speedy: 0.3
      });
    }

    // Сообщение о переходе в фазу 3
    if (m.currentPhase === 3 && !m.phase3MessageShown) {
      m.phase3MessageShown = true;
      state.damageTexts.push({
        x: m.x, y: m.y - 80,
        text: `🌌 РАЗУМ ДОСТИГ ПИКА СИЛЫ! 🌌`,
        color: COLORS.effects.magic,
        size: 26,
        life: 80,
        speedy: 0.3
      });
      state.screenShake = 18;
    }

    // Периодические атаки в фазе 3
    if (m.currentPhase === 3) {
      const now = Date.now();

      if (m.lastWaveTime === 0) m.lastWaveTime = now;
      if (m.lastTeleportTime === 0) m.lastTeleportTime = now;

      // Пси-волна каждые 3 секунды
      if (m.abilities.psionicWave && (now - m.lastWaveTime) >= 3000) {
        m.abilities.psionicWave.execute(m);
        m.lastWaveTime = now;
        abilitiesUsed = true;
      }

      // Телепортация с ловушкой каждые 4 секунды
      if (m.abilities.teleportWithTrap && (now - m.lastTeleportTime) >= 4000) {
        m.abilities.teleportWithTrap.execute(m);
        m.lastTeleportTime = now;
        abilitiesUsed = true;
      }
    }
  }

  // ===== ДУЭТ: ПРЕСЛЕДОВАТЕЛЬ (фаза 2 — ускорение) =====
  if (m.bossType === BOSS_TYPES.DUO_CHASER && phaseChanged && m.currentPhase === 2) {
    if (m.abilities.speedBoost) {
      m.abilities.speedBoost.execute(m);
      abilitiesUsed = true;
    }
  }

  // ===== ДУЭТ: СТРЕЛОК (ярость после смерти преследователя) =====
  if (m.bossType === BOSS_TYPES.DUO_SHOOTER) {
    const chaserAlive = state.monsters.some(mob =>
      mob.duoRole === 'chaser' && mob.hp > 0
    );

    // Активация ярости
    if (!chaserAlive && !m.rageModeActive) {
      m.rageModeActive = true;
      m.rageModeActivated = true;

      if (m.originalSpeed === undefined) {
        m.originalSpeed = m.speed;
      }
      m.speed = m.originalSpeed + 1.5;

      m.attackCooldown = 0;

      state.damageTexts.push({
        x: m.x, y: m.y - 60,
        text: `🔥 СТРАЖ В ЯРОСТИ! 🔥`,
        color: COLORS.effects.fire,
        size: 24,
        life: 80,
        speedy: 0.4
      });
      state.screenShake = 12;
    }

    // Динамический кулдаун в режиме ярости
    if (m.rageModeActive) {
      const hpPercent = m.hp / m.maxHp;

      // Кулдаун зависит от HP: чем меньше HP, тем быстрее атака
      let dynamicCooldown = Math.floor(40 + hpPercent * 60);
      dynamicCooldown = Math.min(100, Math.max(40, dynamicCooldown));

      m.currentDynamicCooldown = dynamicCooldown;

      // Индикатор ускорения при HP < 30%
      if (hpPercent < 0.3 && !m.fastModeIndicatorShown) {
        m.fastModeIndicatorShown = true;
        state.damageTexts.push({
          x: m.x, y: m.y - 45,
          text: `⚡ СКОРОСТЬ АТАК УВЕЛИЧЕНА! ⚡`,
          color: COLORS.effects.lightning,
          size: 16,
          life: 60,
          speedy: 0.3
        });
      }
    }
  }

  return abilitiesUsed;
}

/**
 * Альтернативная функция обновления атак босса
 * (используется в некоторых контекстах)
 * 
 * @param {Object} m - Объект босса
 * @returns {void}
 */
export function updateBossAttacks(m) {
  if (!m.abilities || m.hp <= 0) return;

  const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);

  // Атаки стрелка
  if (m.abilities.shootFireball) {
    if (m.attackCooldown > 0) {
      m.attackCooldown--;
    } else {
      if (distToPlayer < m.vision) {
        m.abilities.shootFireball.execute(m);
        m.attackCooldown = 50;
      }
    }
  }

  // Атаки разума (кроме фазы 3, там своя логика)
  if (m.abilities.mindBall && m.currentPhase !== 3) {
    if (m.attackCooldown > 0) {
      m.attackCooldown--;
    } else {
      if (distToPlayer < m.vision && hasLineOfSight(m.x, m.y, player.px, player.py)) {
        m.abilities.mindBall.execute(m);
        m.attackCooldown = m.currentPhase === 2 ? 40 : 60;
      }
    }
  }
}

/**
 * Призыв миньонов вокруг босса
 * 
 * @param {Object} boss - Объект босса
 * @param {number} [count=2] - Количество миньонов
 * @returns {void}
 */
export function summonMinions(boss, count = 2) {
  summonMinionsAroundBoss(boss, count);
}