/**
 * @fileoverview Данные о игровых событиях.
 * Содержит названия, сообщения, цвета, иконки и эффекты для каждого события.
 * 
 * @module data/events
 */

import { COLORS } from '../core/config/colors.js';

/**
 * @typedef {Object} EventData
 * @property {string} id - Уникальный идентификатор события
 * @property {string} name - Название события (отображается в UI)
 * @property {string} message - Сообщение при активации события
 * @property {string} color - Цвет события (HEX)
 * @property {string} icon - Иконка события
 * @property {Object} effects - Эффекты события
 * @property {Function} effects.apply - Функция применения эффекта
 * @property {Function} effects.remove - Функция снятия эффекта
 * @property {string} category - Категория события ('positive', 'negative', 'neutral')
 */

/**
 * @constant {Object<string, EventData>} EVENTS_DATA - Все события в игре
 */
export const EVENTS_DATA = {
  /**
   * Благословение — положительное событие
   * +50% урона, +2 скорости
   */
  blessing: {
    id: 'blessing',
    name: '✨ БЛАГОСЛОВЕНИЕ ✨',
    message: 'Небеса одаривают вас силой на этом уровне!<br>+50% к урону и +2 к скорости!',
    color: COLORS.effects.blessing,
    icon: '✨',
    category: 'positive',
    effects: {
      /**
       * Применение эффекта благословения
       * @param {Object} player - Объект игрока
       * @param {Object} state - Объект состояния
       * @param {Object} EVENTS - Объект с событиями (для доступа к другим событиям)
       * @returns {void}
       */
      apply: (player, state) => {
        player.eventDamageMultiplier = 1.5;
        player.eventSpeedBonus = 2;
        player.speed += 2;
      },
      /**
       * Снятие эффекта благословения
       * @param {Object} player - Объект игрока
       * @param {Object} state - Объект состояния
       * @returns {void}
       */
      remove: (player, state) => {
        player.eventDamageMultiplier = 1.0;
        if (player.eventSpeedBonus) {
          player.speed -= player.eventSpeedBonus;
          player.eventSpeedBonus = 0;
        }
      }
    }
  },

  /**
   * Ледяной ветер — отрицательное событие
   * -10% скорости игрока, +20% скорости монстров
   */
  iceWind: {
    id: 'iceWind',
    name: '❄️ ЛЕДЯНОЙ ВЕТЕР ❄️',
    message: 'Ледяной ветер слегка замедляет вас, но монстры привыкли к холоду!<br>Ваша скорость -10%, скорость монстров +20%!',
    color: COLORS.effects.ice,
    icon: '❄️',
    category: 'negative',
    effects: {
      apply: (player, state) => {
        player.eventSlowMultiplier = 0.9;
        player.originalSpeed = player.speed;
        player.speed = Math.floor(player.speed * 0.9);
        state.eventIceWindActive = true;
      },
      remove: (player, state) => {
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
    }
  },

  /**
   * Ярость монстров — отрицательное событие
   * +30% урона и скорости монстров
   */
  monsterRage: {
    id: 'monsterRage',
    name: '👹 ЯРОСТЬ МОНСТРОВ 👹',
    message: 'Монстры в ярости на этом уровне!<br>Их урон и скорость увеличены на 30%!',
    color: COLORS.effects.fire,
    icon: '👹',
    category: 'negative',
    effects: {
      apply: (player, state) => {
        state.eventMonsterRageActive = true;
      },
      remove: (player, state) => {
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
    }
  },

  /**
   * Хрупкость — отрицательное событие
   * +25% получаемого урона
   */
  fragility: {
    id: 'fragility',
    name: '🗡️ ХРУПКОСТЬ 🗡️',
    message: 'Ваша защита ослаблена!<br>Вы получаете на 25% больше урона!',
    color: COLORS.ui.textRed,
    icon: '🗡️',
    category: 'negative',
    effects: {
      apply: (player, state) => {
        player.incomingDamageMultiplier = 1.25;
      },
      remove: (player, state) => {
        player.incomingDamageMultiplier = 1.0;
      }
    }
  },

  /**
   * Кровавая луна — нейтральное/смешанное событие
   * x2 золота, вампиризм у монстров
   */
  bloodMoon: {
    id: 'bloodMoon',
    name: '🌕 КРОВАВАЯ ЛУНА 🌕',
    message: 'Кровавая луна восходит на этом уровне!<br>Враги получают вампиризм, а вы удвоенное золото с монстров!',
    color: COLORS.effects.blood,
    icon: '🌕',
    category: 'neutral',
    effects: {
      apply: (player, state) => {
        state.bloodMoonActive = true;
        player.eventGoldMultiplier = 2.0;
        // Даём вампиризм всем монстрам
        for (let monster of state.monsters) {
          monster.hasVampirism = true;
        }
      },
      remove: (player, state) => {
        state.bloodMoonActive = false;
        player.eventGoldMultiplier = 1.0;
        // Убираем вампиризм у монстров
        for (let monster of state.monsters) {
          monster.hasVampirism = false;
        }
      }
    }
  }
};

/**
 * Получение данных о событии по ID
 * 
 * @param {string} id - ID события
 * @returns {EventData|undefined} - Данные о событии или undefined
 */
export function getEventData(id) {
  return EVENTS_DATA[id];
}

/**
 * Получение всех событий
 * 
 * @returns {EventData[]} - Массив данных о событиях
 */
export function getAllEvents() {
  return Object.values(EVENTS_DATA);
}

/**
 * Получение событий по категории
 * 
 * @param {string} category - Категория ('positive', 'negative', 'neutral')
 * @returns {EventData[]} - Массив данных о событиях в категории
 */
export function getEventsByCategory(category) {
  return Object.values(EVENTS_DATA).filter(e => e.category === category);
}

/**
 * Получение названия события по ID
 * 
 * @param {string} id - ID события
 * @returns {string} - Название события
 */
export function getEventName(id) {
  return EVENTS_DATA[id]?.name || '';
}

/**
 * Получение цвета события по ID
 * 
 * @param {string} id - ID события
 * @returns {string} - Цвет события
 */
export function getEventColor(id) {
  return EVENTS_DATA[id]?.color || '#ffffff';
}

/**
 * Получение иконки события по ID
 * 
 * @param {string} id - ID события
 * @returns {string} - Иконка события
 */
export function getEventIcon(id) {
  return EVENTS_DATA[id]?.icon || '❓';
}