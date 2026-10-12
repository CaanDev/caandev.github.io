/**
 * @fileoverview Данные о игровых событиях.
 * Содержит названия, сообщения, цвета, иконки и эффекты для каждого события.
 * 
 * @module data/events
 */

/**
 * @typedef {Object} EventData
 * @property {string} id - Уникальный идентификатор события
 * @property {string} name - Название события (отображается в UI)
 * @property {string} message - Сообщение при активации события
 * @property {string} color - Основной цвет события (HEX)
 * @property {string} icon - Иконка события
 * @property {Object} fog - Цвета для эффектов тумана (events + effects)
 * @property {Object} effects - Игровые эффекты события
 * @property {Function} effects.apply - Функция применения эффекта
 * @property {Function} effects.remove - Функция снятия эффекта
 * @property {string} category - Категория события
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
    color: '#f1c40f',
    icon: '✨',
    category: 'positive',
    fog: {
      colorRgb: { r: 255, g: 215, b: 0 },
      alpha: 0.08,
      color1: 'rgba(255, 230, 100, ',
      color2: 'rgba(255, 215, 50, ',
      color3: 'rgba(255, 200, 30, ',
      color4: 'rgba(255, 180, 0, 0)',
      ray: 'rgba(255, 215, 0, 0.1)',
      spark: '#ffdd44',
      sparkShadow: '#ffdd44',
    },
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
    color: '#4488ff',
    icon: '❄️',
    category: 'negative',
    fog: {
      colorRgb: { r: 30, g: 120, b: 200 },
      alpha: 0.12,
      color1: 'rgba(30, 150, 220, ',
      color2: 'rgba(20, 120, 200, ',
      color3: 'rgba(15, 90, 170, ',
      color4: 'rgba(10, 60, 140, 0)',
      spark: '#88ddff',
      sparkShadow: '#66ccff',
      frost1: 'rgba(100, 180, 255, ',
      frost2: 'rgba(60, 140, 220, ',
    },
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
        // Восстаноавление скорости монстров
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
   * +30% урона и скорости монстров, +40% радиус видимости и слуха
   */
  monsterRage: {
    id: 'monsterRage',
    name: '👹 ЯРОСТЬ МОНСТРОВ 👹',
    message: 'Монстры в ярости на этом уровне!<br>Их урон, скорость, видимость и слух увеличены!',
    color: '#ff8800',
    icon: '👹',
    category: 'negative',
    fog: {
      colorRgb: { r: 200, g: 50, b: 0 },
      alpha: 0.1,
      color1: 'rgba(255, 100, 20, ',
      color2: 'rgba(230, 70, 10, ',
      color3: 'rgba(200, 50, 0, ',
      color4: 'rgba(150, 30, 0, 0)',
      shadow1: 'rgba(50, 20, 0, ',
      shadow2: 'rgba(30, 10, 0, ',
      flash: '#ff4400',
      flashShadow: '#ff4400',
    },
    effects: {
      apply: (player, state) => {
        state.eventMonsterRageActive = true;

        // Применение эффектов ко всем монстрам
        for (let monster of state.monsters) {
          // Сохранение оригинальных значений
          monster.originalVision = monster.vision;
          monster.originalBaseVision = monster.baseVision || monster.vision;
          monster.originalHearingRadius = monster.originalHearingRadius || 600;
          
          // Увеличение видимости на 40%
          monster.vision = Math.floor(monster.vision * 1.4);
          if (monster.baseVision) monster.baseVision = Math.floor(monster.baseVision * 1.4);
          
          // Увеличение радиуса слуха на 40%
          monster.hearingRadius = Math.floor(600 * 1.4);
          
          // Остальные бонусы (урон, скорость) уже есть в monsterSpawner
          // Но если монстр уже существует — применяем и их
          if (!monster.isEventBoosted) {
            monster.originalDamage = monster.damage;
            monster.originalSpeed = monster.speed;
            monster.damage = Math.floor(monster.damage * 1.3);
            monster.speed = monster.speed * 1.3;
            monster.isEventBoosted = true;
          }
        }
      },
      remove: (player, state) => {
        state.eventMonsterRageActive = false;
        // Восстановление параметров монстров
        for (let monster of state.monsters) {
          // Восстановление видимости
          if (monster.originalVision !== undefined) {
            monster.vision = monster.originalVision;
            monster.originalVision = undefined;
          }
          if (monster.originalBaseVision !== undefined) {
            monster.baseVision = monster.originalBaseVision;
            monster.originalBaseVision = undefined;
          }
          
          // Восстановление слуха
          if (monster.originalHearingRadius !== undefined) {
            monster.hearingRadius = monster.originalHearingRadius;
            monster.originalHearingRadius = undefined;
          }
          
          // Восстановление урона и скорости
          if (monster.isEventBoosted) {
            monster.damage = monster.originalDamage || monster.damage;
            monster.speed = monster.originalSpeed || monster.speed;
            monster.isEventBoosted = false;
            monster.originalDamage = undefined;
            monster.originalSpeed = undefined;
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
    color: '#e07080',
    icon: '🗡️',
    category: 'negative',
    fog: {
      colorRgb: { r: 100, g: 20, b: 50 },
      alpha: 0.1,
      color1: 'rgba(150, 30, 100, ',
      color2: 'rgba(120, 20, 80, ',
      color3: 'rgba(90, 15, 60, ',
      color4: 'rgba(60, 10, 40, 0)',
      crack: '#8b3a6b',
      spark: '#4a1a3a',
      sparkShadow: '#4a1a3a',
    },
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
    color: '#8b0000',
    icon: '🌕',
    category: 'neutral',
    fog: {
      colorRgb: { r: 180, g: 30, b: 30 },
      alpha: 0.15,
      color1: 'rgba(180, 30, 30, ',
      color2: 'rgba(150, 20, 20, ',
      color3: 'rgba(120, 15, 15, ',
      color4: 'rgba(80, 10, 10, 0)',
      spark: '#ff2200',
      sparkShadow: '#ff2200',
      vignette1: 'rgba(100, 10, 10, ',
      vignette2: 'rgba(60, 5, 5, ',
    },
    effects: {
      apply: (player, state) => {
        state.bloodMoonActive = true;
        player.eventGoldMultiplier = 2.0;
        // Вампиризм даётся всем монстрам
        for (let monster of state.monsters) {
          monster.hasVampirism = true;
        }
      },
      remove: (player, state) => {
        state.bloodMoonActive = false;
        player.eventGoldMultiplier = 1.0;
        // Удаление вампиризма у монстров
        for (let monster of state.monsters) {
          monster.hasVampirism = false;
        }
      }
    }
  }
};

// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ

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

/**
 * Получение RGB-цвета события для тумана
 * 
 * @param {string} id - ID события
 * @returns {{r: number, g: number, b: number}|null} - RGB цвета или null
 */
export function getEventRgbColor(id) {
  return EVENTS_DATA[id]?.fog?.colorRgb || null;
}

/**
 * Получение альфа-канала события для тумана
 * 
 * @param {string} id - ID события
 * @returns {number|null} - Альфа-канал или null
 */
export function getEventAlpha(id) {
  return EVENTS_DATA[id]?.fog?.alpha || null;
}

/**
 * Получение цветов визуальных эффектов для события
 * 
 * @param {string} id - ID события
 * @returns {Object|null} - Цвета эффектов или null
 */
export function getEventFogColors(id) {
  const data = EVENTS_DATA[id];
  if (!data) return null;
  
  // Возвращение всего, кроме colorRgb и alpha (они для другого использования)
  const { colorRgb, alpha, ...effectsColors } = data.fog || {};
  return effectsColors;
}