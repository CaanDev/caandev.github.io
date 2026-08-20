/**
 * @fileoverview Обновление снарядов и лучей.
 * Управляет движением огненных шаров, кольцевых снарядов,
 * проверкой коллизий со стенами, колоннами, монстрами и игроком.
 * 
 * @module entities/monsters/fireballUpdater
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { hasFireImmunity } from '../monsters/adaptations/index.js';
import { updateAttackCounter } from '../monsters/adaptations/index.js';
import { handleMonsterDeath } from '../monsters/death.js';
import { dealDamageToMimicsFireball } from '../player/mimicCombat.js';
import { triggerGameOver } from '../../entities/player/gameOver.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Обновление всех огненных шаров
 * 
 * Обрабатывает движение обычных снарядов и кольцевых снарядов боссов.
 * Проверяет столкновения со стенами, колоннами, монстрами и игроком.
 * 
 * @returns {boolean} - true, если был нанесён урон монстру
 */
export function updateFireballs() {
  let monstersChanged = false;

  for (let i = state.fireballs.length - 1; i >= 0; i--) {
    let fb = state.fireballs[i];

    // Кольцевые снаряды (босс-стрелок)
    if (fb.isRingProjectile && fb.ringActive) {
      fb.ringOrbitAngle = (fb.ringOrbitAngle || 0) + (fb.ringOrbitSpeed || 0.15);

      // Движение к игроку
      const dx = player.px - fb.x;
      const dy = player.py - fb.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        const step = Math.min(fb.speed, dist);
        fb.x += (dx / dist) * step;
        fb.y += (dy / dist) * step;
      }

      fb.life--;

      // Проверка попадания в игрока
      const distToPlayer = Math.hypot(player.px - fb.x, player.py - fb.y);
      if (distToPlayer < (fb.ringOrbitRadius || 50) + 25 && !fb.hasHitPlayer) {
        fb.hasHitPlayer = true;
        const finalDamage = fb.damage;
        player.hp -= finalDamage;

        state.damageTexts.push({
          x: player.px, y: player.py - 40,
          text: `🔥🌀 КОЛЬЦО ОГНЯ! -${finalDamage} 🌀🔥`,
          color: COLORS.effects.fire,
          size: 24,
          life: 50,
          speedy: 1.2
        });
        state.screenShake = 18;

        // Искры при попадании
        for (let s = 0; s < 8; s++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          state.sparks.push({
            x: player.px, y: player.py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 20 + Math.random() * 15,
            maxLife: 35,
            size: 3 + Math.random() * 5,
            color: COLORS.effects.fire,
            gravity: 0.1
          });
        }

        if (player.hp <= 0) triggerGameOver();

        state.fireballs.splice(i, 1);
        continue;
      }

      // Удаление при выходе за границы или окончании жизни
      if (fb.x < -100 || fb.x > CONFIG.cols * CONFIG.cellSize + 100 ||
          fb.y < -100 || fb.y > CONFIG.rows * CONFIG.cellSize + 100 ||
          fb.life <= 0) {

        for (let s = 0; s < 6; s++) {
          const angle = Math.random() * Math.PI * 2;
          state.sparks.push({
            x: fb.x, y: fb.y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2 - 1,
            life: 15,
            maxLife: 15,
            size: 2 + Math.random() * 3,
            color: COLORS.effects.fireGlow,
            gravity: 0.05
          });
        }

        state.fireballs.splice(i, 1);
        continue;
      }

      continue;
    }

    // Обычные снаряды
    fb.x += fb.dirX * fb.speed;
    fb.y += fb.dirY * fb.speed;
    fb.life--;

    // Проверка выхода за границы
    if (isFireballOutOfBounds(fb) || fb.life <= 0) {
      state.fireballs.splice(i, 1);
      continue;
    }

    // Проверка столкновений с монстрами
    const hit = checkFireballCollision(fb, i);
    if (hit) monstersChanged = true;
  }

  // Обновление лучей
  updateBeams();

  return monstersChanged;
}

/**
 * Проверка, вышел ли снаряд за границы карты или столкнулся с препятствием
 * 
 * @param {Object} fb - Объект огненного шара
 * @returns {boolean} - true, если снаряд нужно удалить
 * @private
 */
function isFireballOutOfBounds(fb) {
  const gridX = Math.floor(fb.x / CONFIG.cellSize);
  const gridY = Math.floor(fb.y / CONFIG.cellSize);

  if (gridY >= 0 && gridY < CONFIG.rows && gridX >= 0 && gridX < CONFIG.cols) {
    // Столкновение с колонной
    if (state.grid[gridY] && state.grid[gridY][gridX] && state.grid[gridY][gridX].isPillar) {
      createPillarImpact(fb.x, fb.y);
      return true;
    }

    // Столкновение со стеной
    if (state.grid[gridY] && state.grid[gridY][gridX] && state.grid[gridY][gridX].isWall) {
      return true;
    }
  } else {
    return true;
  }
  return false;
}

/**
 * Создание эффекта попадания в колонну
 * 
 * @param {number} x - Координата X попадания
 * @param {number} y - Координата Y попадания
 * @returns {void}
 * @private
 */
function createPillarImpact(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    state.sparks.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      size: 2 + Math.random() * 4,
      color: COLORS.sparks.dust,
      gravity: 0.1,
      isDust: true
    });
  }

  state.damageTexts.push({
    x: x, y: y - 25,
    text: '💥 КОЛОННА!',
    color: COLORS.ui.textDark,
    size: 16,
    life: 30,
    speedy: 0.8
  });
}

/**
 * Проверка столкновения снаряда с монстрами и игроком
 * 
 * @param {Object} fb - Объект огненного шара
 * @param {number} fireballIndex - Индекс снаряда в массиве
 * @returns {boolean} - true, если было попадание
 * @private
 */
function checkFireballCollision(fb, fireballIndex) {
  let hit = false;

  // Попадание в игрока (снаряды боссов)
  if ((fb.isDuoShooterBall || fb.isMindBall) && !fb.ignorePlayer && !fb.hasHitPlayer) {
    const distToPlayer = Math.hypot(player.px - fb.x, player.py - fb.y);
    if (distToPlayer < 30) {
      fb.hasHitPlayer = true;
      player.hp -= fb.damage;

      const textColor = fb.isMindBall ? COLORS.effects.magic : COLORS.effects.fire;
      const emoji = fb.isMindBall ? '🧠' : '🔥';

      state.damageTexts.push({
        x: player.px, y: player.py - 20,
        text: `${emoji} -${fb.damage}`,
        color: textColor,
        size: 20,
        life: 40,
        speedy: 1.2
      });
      state.screenShake = 10;

      // Инверсия управления от пси-шара (фаза 2)
      if (fb.isMindBall && fb.owner && fb.owner.bossType === 'mind') {
        const hpPercent = fb.owner.hp / fb.owner.maxHp;
        const isPhase2 = hpPercent < 0.75 && hpPercent >= 0.4;

        if (isPhase2) {
          player.controlsInverted = !player.controlsInverted;
          player.invertTimer = 360;

          state.realityShift.active = true;
          state.realityShift.intensity = 1.0;
          state.realityShift.timer = 90;

          const invertStatus = player.controlsInverted ? "ИНВЕРТИРОВАНО" : "ВОССТАНОВЛЕНО";
          const textColor = player.controlsInverted ? COLORS.ui.textGold : COLORS.ui.textGreen;

          state.damageTexts.push({
            x: player.px, y: player.py - 60,
            text: `🌀 УПРАВЛЕНИЕ ${invertStatus}! 🌀`,
            color: textColor,
            size: 22,
            life: 80,
            speedy: 0.5
          });
        }
      }

      if (player.hp <= 0) triggerGameOver();

      return true;
    }
  }

  // Попадание в монстров
  for (let j = state.monsters.length - 1; j >= 0; j--) {
    let m = state.monsters[j];

    // Пропускаем владельца снаряда
    if (fb.ignoreOwner && fb.ownerBoss === m) continue;
    if (fb.hitMonsters && fb.hitMonsters.includes(m)) continue;
    if (fb.isMindBall && fb.owner === m) continue;

    const dist = Math.hypot(m.x - fb.x, m.y - fb.y);
    if (dist < m.radius + fb.radius) {
      hit = true;

      // Обновление счётчика адаптаций (огненные шары игрока)
      if (fb.isFromPlayer && !fb.isMindBall) {
        if (!hasFireImmunity()) updateAttackCounter('fireball', 1);
      }

      // Дружественный огонь (снаряды стрелка бьют преследователя)
      if (fb.isDuoShooterBall && m.isDuoBoss && m.duoRole !== 'shooter') {
        const friendlyDamage = Math.floor(fb.damage * 0.5);
        m.hp -= friendlyDamage;

        state.damageTexts.push({
          x: m.x, y: m.y - 15,
          text: `💥 ДРУЖЕСТВЕННЫЙ ОГОНЬ! -${friendlyDamage}`,
          color: COLORS.effects.fire,
          size: 16,
          life: 40,
          speedy: 1.2
        });

        if (!fb.hitMonsters) fb.hitMonsters = [];
        fb.hitMonsters.push(m);

        if (m.hp <= 0) {
          const currentIndex = state.monsters.findIndex(monster => monster === m);
          if (currentIndex !== -1) handleMonsterDeath(m, currentIndex, state.monsters);
        }
        continue;
      }

      // Иммунитет к огню (адаптация монстров)
      if (hasFireImmunity()) {
        state.damageTexts.push({
          x: m.x, y: m.y - 15,
          text: `🔥 ИММУНИТЕТ!`,
          color: COLORS.ui.textDark,
          size: 18, life: 30, speedy: 1.0
        });
        m.x += fb.dirX * 15;
        m.y += fb.dirY * 15;
        if (!fb.hitMonsters) fb.hitMonsters = [];
        fb.hitMonsters.push(m);
        continue;
      }

      // Нанесение урона
      if (!fb.hitMonsters) fb.hitMonsters = [];
      fb.hitMonsters.push(m);
      m.hp -= fb.damage;

      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `🔥 -${fb.damage}`,
        color: COLORS.effects.fire,
        size: 22,
        life: 40,
        speedy: 1.2
      });

      m.x += fb.dirX * 15;
      m.y += fb.dirY * 15;

      // Смерть монстра
      if (m.hp <= 0) {
        if (fb.isFromPlayer) updateProgress('fireball_kills', 1);
        const currentIndex = state.monsters.findIndex(monster => monster === m);
        if (currentIndex !== -1) handleMonsterDeath(m, currentIndex, state.monsters);
      }
    }
  }

  // Урон по мимикам от огненного шара (только от игрока)
  if (fb.isFromPlayer) {
    const attackRadius = fb.radius * 3;
    dealDamageToMimicsFireball(fb.x, fb.y, attackRadius);
  }

  return hit;
}

/**
 * Обновление лучей боссов (уменьшение времени жизни)
 * 
 * @returns {void}
 * @private
 */
function updateBeams() {
  if (!state.beams) return;

  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];
    beam.life--;
    if (beam.life <= 0) state.beams.splice(i, 1);
  }
}