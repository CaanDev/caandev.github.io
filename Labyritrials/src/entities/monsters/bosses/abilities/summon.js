/**
 * @fileoverview Способности призыва миньонов.
 * Управляет призывом миньонов боссами: обычный, фазовый и усиленный призыв.
 * 
 * @module entities/monsters/bosses/abilities/summon
 */

import { BossAbility } from './base.js';
import { summonMinionsAroundBoss } from './helpers.js';
import { state } from '../../../../core/config/index.js';
import { COLORS } from '../../../../core/config/colors.js';

/**
 * Способность "Призыв миньонов"
 * Периодический призыв 1-2 миньонов в фазах 2-3 босса Демон.
 * 
 * @class SummonMinionsAbility
 * @extends BossAbility
 */
export class SummonMinionsAbility extends BossAbility {
  constructor() {
    super({
      id: 'summon_minions',
      name: 'Призыв миньонов',
      description: 'Призывает миньонов для помощи в бою',
      icon: '👾',
      cooldown: 300,
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
    // Проверка возможности использования
    if (!this.canUse(boss, boss.currentPhase)) return false;

    // Призыв 1-2 миньонов
    const count = Math.floor(Math.random() * 2) + 1;
    summonMinionsAroundBoss(boss, count);

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 40,
      text: `👾 ПРИЗЫВ! x${count} 👾`,
      color: COLORS.ui.textGold,
      size: 18,
      life: 50,
      speedy: 0.8
    });

    boss.lastMinionSummon = Date.now();
    return true;
  }
}

/**
 * Способность "Яростный призыв"
 * При переходе во вторую фазу босса Демон призывает 3 миньонов.
 * 
 * @class PhaseSummonAbility
 * @extends BossAbility
 */
export class PhaseSummonAbility extends BossAbility {
  constructor() {
    super({
      id: 'phase_summon',
      name: 'Яростный призыв',
      description: 'При переходе во вторую фазу призывает 3 миньонов',
      icon: '🔥',
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
    const count = 3;
    summonMinionsAroundBoss(boss, count);

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 60,
      text: `🔥 БОСС ПРИЗЫВАЕТ МИНЬОНОВ! x${count} 🔥`,
      color: COLORS.effects.fire,
      size: 24,
      life: 80,
      speedy: 0.8
    });
    state.screenShake = 15;

    return true;
  }
}

/**
 * Способность "Усиленный призыв"
 * При переходе в третью фазу босса Демон призывает 4 усиленных миньонов.
 * 
 * @class EmpoweredSummonAbility
 * @extends BossAbility
 */
export class EmpoweredSummonAbility extends BossAbility {
  constructor() {
    super({
      id: 'empowered_summon',
      name: 'Усиленный призыв',
      description: 'Призывает более сильных миньонов',
      icon: '👾🔥',
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
    const count = 4;
    summonMinionsAroundBoss(boss, count);

    // Визуальный эффект
    state.damageTexts.push({
      x: boss.x, y: boss.y - 60,
      text: `🔥 УСИЛЕННЫЙ ПРИЗЫВ! x${count} 🔥`,
      color: COLORS.ui.textRed,
      size: 24,
      life: 80,
      speedy: 0.8
    });
    state.screenShake = 18;

    return true;
  }
}