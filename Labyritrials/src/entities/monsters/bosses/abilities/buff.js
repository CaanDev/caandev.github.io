/**
 * @fileoverview Бафф-способности боссов.
 * Управляет усилениями боссов: ускорение, ярость.
 * 
 * @module entities/monsters/bosses/abilities/buff
 */

import { BossAbility } from './base.js';
import { state } from '../../../../core/config/index.js';
import { COLORS } from '../../../../core/config/colors.js';

/**
 * Способность "Ускорение"
 * Увеличивает скорость босса на 0.5 при переходе во вторую фазу.
 * 
 * @class SpeedBoostAbility
 * @extends BossAbility
 */
export class SpeedBoostAbility extends BossAbility {
  constructor() {
    super({
      id: 'speed_boost',
      name: 'Ускорение',
      description: 'Увеличивает скорость босса',
      icon: '⚡',
      cooldown: 0,
      phaseRequired: 'second'
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    // Сохраняем оригинальную скорость, если ещё не сохранена
    if (boss.originalSpeed === undefined) {
      boss.originalSpeed = boss.speed;
    }

    // Увеличиваем скорость
    const bonus = 0.5;
    boss.speed = boss.originalSpeed + bonus;

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 40,
      text: `⚡ УСКОРЕНИЕ! (ФАЗА 2)`,
      color: COLORS.effects.lightning,
      size: 18,
      life: 40,
      speedy: 0.8
    });

    return true;
  }
}

/**
 * Способность "Ярость"
 * Увеличивает урон босса на 50% и скорость на 0.8 при переходе в третью фазу.
 * 
 * @class RageAbility
 * @extends BossAbility
 */
export class RageAbility extends BossAbility {
  constructor() {
    super({
      id: 'rage',
      name: 'Ярость',
      description: 'Увеличивает урон босса',
      icon: '💢',
      cooldown: 0,
      phaseRequired: 'third'
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    // Сохраняем оригинальный урон, если ещё не сохранён
    if (boss.originalDamage === undefined) {
      boss.originalDamage = boss.damage;
    }

    // Увеличиваем урон на 50%
    const bonus = Math.floor(boss.originalDamage * 0.5);
    boss.damage = boss.originalDamage + bonus;

    // Увеличиваем скорость
    if (boss.originalSpeed === undefined) {
      boss.originalSpeed = boss.speed;
    }
    boss.speed = boss.originalSpeed + 0.8;

    // Визуальные эффекты
    state.damageTexts.push({
      x: boss.x, y: boss.y - 50,
      text: `💢 ЯРОСТЬ! +50% УРОНА! 💢`,
      color: COLORS.ui.textRed,
      size: 22,
      life: 60,
      speedy: 0.8
    });
    state.screenShake = 12;

    return true;
  }
}