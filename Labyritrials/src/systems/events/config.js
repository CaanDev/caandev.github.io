/**
 * @fileoverview Конфигурация игровых событий.
 * Определяет все доступные события, их эффекты, визуальное оформление
 * и логику применения/удаления эффектов.
 * 
 * @module systems/events/config
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * @namespace EVENTS
 * @description Объект со всеми игровыми событиями.
 * Каждое событие имеет название, сообщение, цвет, иконку
 * и функции применения/удаления эффекта.
 */
export const EVENTS = {
  /**
   * @event blessing
   * @description Благословение: +50% урона, +2 скорости
   */
  blessing: {
    name: '✨ БЛАГОСЛОВЕНИЕ ✨',
    message: 'Небеса одаривают вас силой на этом уровне!<br>+50% к урону и +2 к скорости!',
    color: COLORS.effects.blessing,
    icon: '✨',
    /**
     * Применение эффекта благословения
     * @returns {void}
     */
    applyEffect: () => {
      player.eventDamageMultiplier = 1.5;
      player.eventSpeedBonus = 2;
      player.speed += 2;
    },
    /**
     * Снятие эффекта благословения
     * @returns {void}
     */
    removeEffect: () => {
      player.eventDamageMultiplier = 1.0;
      if (player.eventSpeedBonus) {
        player.speed -= player.eventSpeedBonus;
        player.eventSpeedBonus = 0;
      }
    }
  },
  
  /**
   * @event iceWind
   * @description Ледяной ветер: -10% скорости игрока, +20% скорости монстров
   */
  iceWind: {
    name: '❄️ ЛЕДЯНОЙ ВЕТЕР ❄️',
    message: 'Ледяной ветер слегка замедляет вас, но монстры привыкли к холоду!<br>Ваша скорость -10%, скорость монстров +20%!',
    color: COLORS.effects.ice,
    icon: '❄️',
    /**
     * Применение эффекта ледяного ветра
     * @returns {void}
     */
    applyEffect: () => {
      player.eventSlowMultiplier = 0.9;
      player.originalSpeed = player.speed;
      player.speed = Math.floor(player.speed * 0.9);
      state.eventIceWindActive = true;
    },
    /**
     * Снятие эффекта ледяного ветра
     * @returns {void}
     */
    removeEffect: () => {
      player.eventSlowMultiplier = 1.0;
      if (player.originalSpeed !== undefined) {
        player.speed = player.originalSpeed;
        player.originalSpeed = undefined;
      } else {
        player.speed = player.baseSpeed;
      }

      state.eventIceWindActive = false;
      // Восстанавливаем скорость монстров
      for (let monster of state.monsters) {
        if (monster.isIceWindBoosted) {
          monster.speed = monster.originalSpeedForIceWind || monster.speed;
          monster.originalSpeedForIceWind = undefined;
          monster.isIceWindBoosted = false;
        }
      }
    }
  },
  
  /**
   * @event monsterRage
   * @description Ярость монстров: +30% урона и скорости монстров
   */
  monsterRage: {
    name: '👹 ЯРОСТЬ МОНСТРОВ 👹',
    message: 'Монстры в ярости на этом уровне!<br>Их урон и скорость увеличены на 30%!',
    color: COLORS.effects.fire,
    icon: '👹',
    /**
     * Применение эффекта ярости монстров
     * @returns {void}
     */
    applyEffect: () => {
      state.eventMonsterRageActive = true;
    },
    /**
     * Снятие эффекта ярости монстров
     * @returns {void}
     */
    removeEffect: () => {
      state.eventMonsterRageActive = false;
      // Восстанавливаем параметры монстров
      for (let monster of state.monsters) {
        if (monster.isEventBoosted) {
          monster.damage = monster.originalDamage || monster.damage;
          monster.speed = monster.originalSpeed || monster.speed;
          monster.isEventBoosted = false;
        }
      }
    }
  },

  /**
   * @event fragility
   * @description Хрупкость: +25% получаемого урона
   */
  fragility: {
    name: '🗡️ ХРУПКОСТЬ 🗡️',
    message: 'Ваша защита ослаблена!<br>Вы получаете на 25% больше урона!',
    color: COLORS.ui.textRed,
    icon: '🗡️',
    /**
     * Применение эффекта хрупкости
     * @returns {void}
     */
    applyEffect: () => {
      player.incomingDamageMultiplier = 1.25;
    },
    /**
     * Снятие эффекта хрупкости
     * @returns {void}
     */
    removeEffect: () => {
      player.incomingDamageMultiplier = 1.0;
    }
  },
  
  /**
   * @event bloodMoon
   * @description Кровавая луна: вампиризм у монстров, x2 золота
   */
  bloodMoon: {
    name: '🌕 КРОВАВАЯ ЛУНА 🌕',
    message: 'Кровавая луна восходит на этом уровне!<br>Враги получают вампиризм, а вы удвоенное золото с монстров!',
    color: COLORS.effects.blood,
    icon: '🌕',
    /**
     * Применение эффекта кровавой луны
     * @returns {void}
     */
    applyEffect: () => {
      state.bloodMoonActive = true;
      player.eventGoldMultiplier = 2.0;
      
      // Даём вампиризм всем монстрам
      for (let monster of state.monsters) {
        monster.hasVampirism = true;
      }
    },
    /**
     * Снятие эффекта кровавой луны
     * @returns {void}
     */
    removeEffect: () => {
      state.bloodMoonActive = false;
      player.eventGoldMultiplier = 1.0;
      
      // Убираем вампиризм у монстров
      for (let monster of state.monsters) {
        monster.hasVampirism = false;
      }
    }
  }
};