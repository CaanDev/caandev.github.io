/**
 * @fileoverview Конфигурация адаптаций монстров.
 * Определяет все доступные адаптации, их пороги срабатывания,
 * визуальные эффекты и логику применения.
 * 
 * @module entities/monsters/adaptations/config
 */

import { state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * @namespace ADAPTATIONS
 * @description Объект со всеми адаптациями монстров.
 * Каждая адаптация активируется при превышении порога определённого типа атак.
 */
export const ADAPTATIONS = {
  /**
   * @adaptation fireImmunity
   * @description Иммунитет к огненным шарам.
   * Активируется после 50+ огненных шаров.
   */
  fireImmunity: {
    name: '🔥 ОГНЕУПОРНОСТЬ',
    description: 'Монстры получили иммунитет к огненным шарам!',
    color: COLORS.effects.fire,
    icon: '🔥',
    /**
     * Получение порога активации
     * @returns {number} - Количество атак, необходимое для активации
     */
    getThreshold: () => Math.min(200, 50 + Math.floor(state.gameLevel / 5) * 15),
    /**
     * Получение текущего количества атак
     * @returns {number} - Текущее количество атак этого типа
     */
    getTotal: () => state.totalAttacks.fireball,
    /**
     * Проверка активности адаптации
     * @returns {boolean} - true, если адаптация уже активна
     */
    isActive: () => state.monsterAdaptation.fireImmunity,
    /**
     * Применение адаптации
     * @returns {void}
     */
    apply: () => {
      state.monsterAdaptation.fireImmunity = true;
      state.damageTexts.push({
        x: player.px,
        y: player.py - 80,
        text: `🔥 МОНСТРЫ СТАЛИ ОГНЕУПОРНЫ! 🔥`,
        color: COLORS.effects.fire,
        size: 20,
        life: 180,
        speedy: 0
      });
      state.screenShake = 8;
    }
  },

  /**
   * @adaptation stunImmunity
   * @description Невосприимчивость к оглушению.
   * Активируется после 50+ атак громовым посохом.
   */
  stunImmunity: {
    name: '⚡ СТОЙКОСТЬ',
    description: 'Монстры стали невосприимчивы к оглушению!',
    color: COLORS.effects.lightning,
    icon: '⚡',
    getThreshold: () => Math.min(150, 50 + Math.floor(state.gameLevel / 5) * 12),
    getTotal: () => state.totalAttacks.stun,
    isActive: () => state.monsterAdaptation.stunImmunity,
    apply: () => {
      state.monsterAdaptation.stunImmunity = true;
      state.damageTexts.push({
        x: player.px,
        y: player.py - 80,
        text: `⚡ МОНСТРЫ СТАЛИ НЕВОСПРИИМЧИВЫ К ОГЛУШЕНИЮ! ⚡`,
        color: COLORS.effects.lightning,
        size: 20,
        life: 180,
        speedy: 0
      });
      state.screenShake = 8;
    }
  },

  /**
   * @adaptation healingBlock
   * @description Ослабление лечения игрока.
   * Активируется после 50+ атак посохом вампира.
   */
  healingBlock: {
    name: '🧛 БЛОК ЛЕЧЕНИЯ',
    description: 'Лечение игрока ослаблено вдвое!',
    color: COLORS.effects.vampire,
    icon: '🧛',
    getThreshold: () => Math.min(200, 50 + Math.floor(state.gameLevel / 5) * 15),
    getTotal: () => state.totalAttacks.vampirism,
    isActive: () => state.monsterAdaptation.healingBlock,
    apply: () => {
      state.monsterAdaptation.healingBlock = true;
      state.damageTexts.push({
        x: player.px,
        y: player.py - 80,
        text: `🧛 ВАМПИРИЗМ ИГРОКА ОСЛАБЛЕН! 🧛`,
        color: COLORS.effects.vampire,
        size: 20,
        life: 180,
        speedy: 0
      });
      state.screenShake = 8;
    }
  },

  /**
   * @adaptation healthBoost
   * @description Увеличение здоровья монстров.
   * Активируется после 70+ магических атак (огненный шар + громовой посох).
   */
  healthBoost: {
    name: '🛡️ ЗАКАЛКА',
    description: 'Монстры получили +50% к здоровью!',
    color: COLORS.effects.stun,
    icon: '🛡️',
    getThreshold: () => Math.min(250, 70 + Math.floor(state.gameLevel / 5) * 18),
    getTotal: () => state.totalAttacks.magic,
    isActive: () => state.monsterAdaptation.healthBoost,
    apply: () => {
      state.monsterAdaptation.healthBoost = true;

      // Увеличиваем HP всех живых монстров на 50%
      for (let monster of state.monsters) {
        if (!monster.isAdaptationBoosted) {
          monster.originalMaxHp = monster.maxHp;
          monster.originalHp = monster.hp;
          monster.maxHp = Math.floor(monster.maxHp * 1.5);
          monster.hp = Math.floor(monster.hp * 1.5);
          monster.isAdaptationBoosted = true;
        }
      }

      state.damageTexts.push({
        x: player.px,
        y: player.py - 80,
        text: `🛡️ МОНСТРЫ ЗАКАЛЕНЫ! +50% HP 🛡️`,
        color: COLORS.effects.stun,
        size: 20,
        life: 180,
        speedy: 0
      });
      state.screenShake = 8;
    }
  }
};