/**
 * @fileoverview Снарядные способности боссов.
 * Управляет созданием и запуском снарядов: огненные шары, пси-шары, кольцо огня.
 * 
 * @module entities/monsters/bosses/abilities/projectile
 */

import { BossAbility } from './base.js';
import { state, player } from '../../../../core/config/index.js';
import { COLORS } from '../../../../core/config/colors.js';
import { triggerGameOver } from '../../../player/gameOver.js';

/**
 * Способность "Огненный шар"
 * Запускает огненный шар в направлении игрока.
 * Используется боссом-стрелком (уровень 15).
 * 
 * @class ShootFireballAbility
 * @extends BossAbility
 */
export class ShootFireballAbility extends BossAbility {
  constructor() {
    super({
      id: 'shoot_fireball',
      name: 'Огненный шар',
      description: 'Запускает огненный шар в игрока',
      icon: '🔥',
      cooldown: 50,
      phaseRequired: null
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const angle = Math.atan2(player.py - boss.y, player.px - boss.x);
    const damage = boss.damage;

    // Создаём огненный шар
    state.fireballs.push({
      x: boss.x, y: boss.y,
      dirX: Math.cos(angle), dirY: Math.sin(angle),
      radius: 16, speed: 6,
      damage: damage, life: 180,
      hitMonsters: [],
      hasHitPlayer: false,
      isDuoShooterBall: true,
      isFromBoss: true,
      isFromPlayer: false,
      ownerBoss: boss,
      ignoreOwner: true
    });

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 30,
      text: `🔥`,
      color: COLORS.effects.fire,
      size: 20,
      life: 20,
      speedy: 0.5
    });

    return true;
  }
}

/**
 * Способность "Пси-шар"
 * Запускает энергетический шар, который при попадании в игрока
 * может инвертировать управление (в фазе 2 босса Разум).
 * 
 * @class MindBallAbility
 * @extends BossAbility
 */
export class MindBallAbility extends BossAbility {
  constructor() {
    super({
      id: 'mind_ball',
      name: 'Пси-шар',
      description: 'Запускает энергетический шар, который может инвертировать управление',
      icon: '🧠',
      cooldown: 60,
      phaseRequired: null
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const hpPercent = boss.hp / boss.maxHp;
    const isGlowing = hpPercent < 0.5;
    const angle = Math.atan2(player.py - boss.y, player.px - boss.x);
    const damage = boss.damage;

    // Создаём пси-шар
    state.fireballs.push({
      x: boss.x, y: boss.y,
      dirX: Math.cos(angle), dirY: Math.sin(angle),
      radius: 16, speed: 6,
      damage: damage, life: 180,
      hitMonsters: [],
      hasHitPlayer: false,
      isMindBall: true,
      isGlowing: isGlowing,
      owner: boss,
      isFromBoss: true,
      isFromPlayer: false,
      ignoreOwner: true
    });

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 30,
      text: `🧠`,
      color: isGlowing ? COLORS.player.shadow : COLORS.ui.textDark,
      size: 24,
      life: 20,
      speedy: 0.5
    });

    // Уменьшаем кулдаун в фазе 2
    boss.attackCooldown = isGlowing ? 40 : 60;

    return true;
  }
}

/**
 * Способность "Кольцо огня"
 * Выпускает вращающееся кольцо из 12 огненных снарядов,
 * которое движется к игроку. Используется боссом-стрелком в режиме ярости.
 * 
 * @class CircleFireballAbility
 * @extends BossAbility
 */
export class CircleFireballAbility extends BossAbility {
  constructor() {
    super({
      id: 'circle_fireball',
      name: 'Кольцо огня',
      description: 'Выпускает вращающееся кольцо огненных снарядов',
      icon: '🔥🌀',
      cooldown: 100,
      phaseRequired: null
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const ballCount = 12;
    const ringRadius = 55;
    const damage = Math.floor(boss.damage * 1.6);

    const angleToPlayer = Math.atan2(player.py - boss.y, player.px - boss.x);

    // Центр кольца смещён в сторону игрока
    const centerX = boss.x + Math.cos(angleToPlayer) * 55;
    const centerY = boss.y + Math.sin(angleToPlayer) * 55;

    // Создаём кольцевой снаряд
    state.fireballs.push({
      x: centerX,
      y: centerY,
      targetX: player.px,
      targetY: player.py,
      startX: centerX,
      startY: centerY,
      radius: 16,
      speed: 3.5,
      damage: damage,
      life: 140,
      hitMonsters: [],
      hasHitPlayer: false,
      isFromBoss: true,
      isFromPlayer: false,
      ownerBoss: boss,
      ignoreOwner: true,
      isRingProjectile: true,
      ringOrbitRadius: ringRadius,
      ringOrbitSpeed: 0.18,
      ringOrbitAngle: 0,
      ringBallCount: ballCount,
      ringDamage: damage,
      ringActive: true
    });

    // Визуальные эффекты
    state.screenShake = 12;
    state.damageTexts.push({
      x: boss.x, y: boss.y - 50,
      text: `🔥🌀 КОЛЬЦО ОГНЯ! x${ballCount} 🌀🔥`,
      color: COLORS.effects.fire,
      size: 22,
      life: 50,
      speedy: 0.6
    });

    return true;
  }
}