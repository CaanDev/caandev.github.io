/**
 * @fileoverview Конфигурация звуковых эффектов
 * @module audio/sounds/soundConfig
 */

/**
 * @namespace SOUNDS
 * @description Все звуковые эффекты игры, сгруппированные по категориям
 */
export const SOUNDS = {
  /**
   * Звуки взаимодействия с объектами
   */
  interactions: {
    wallDestroy: {
      path: 'assets/audio/sounds/interactions/wallDestroy.ogg',
      volume: 0.4,
      preload: true,
    },
    torchActivate: {
      path: 'assets/audio/sounds/interactions/torchActivate.ogg',
      volume: 0.4,
      preload: true,
    },
    portalActivate: {
      path: 'assets/audio/sounds/interactions/portalActivate.ogg',
      volume: 0.4,
      preload: true,
    },
    shopBuyItem: {
      path: 'assets/audio/sounds/interactions/shopBuyItem.ogg',
      volume: 0.5,
      preload: true,
    },
    equip: {
      path: 'assets/audio/sounds/interactions/equip.ogg',
      volume: 0.5,
      preload: true,
    },
    achievementCompleted: {
      path: 'assets/audio/sounds/interactions/achievementCompleted.ogg',
      volume: 0.5,
      preload: true,
    },
    dodge: {
      path: 'assets/audio/sounds/interactions/dodge.ogg',
      volume: 0.4,
      preload: true,
    },
    noteRead: {
      path: 'assets/audio/sounds/interactions/noteRead.ogg',
      volume: 0.5,
      preload: false,
    },
  },

  /**
   * Звуки монстров
   */
  monsters: {
    monsterDeath: {
      path: 'assets/audio/sounds/monsters/monsterDeath.ogg',
      volume: 0.3,
      preload: true,
    },
    attacks: {
      mimicBite: {
        path: 'assets/audio/sounds/monsters/attacks/mimicBite.ogg',
        volume: 0.6,
        preload: true,
      },
    },
  },

  /**
   * Звуки игрока
   */
  player: {
    steps: {
      /** @type {Object} - Звуки шагов по разным поверхностям */
      stone: {
        path: 'assets/audio/sounds/player/steps/playerStepStone.ogg',
        volume: 1.0,
        preload: true,
        surfaces: ['cave', 'boss', 'safeRoom', 'treasure', 'shrine', 'trap'],
      },
      snow: {
        path: 'assets/audio/sounds/player/steps/playerStepSnow.ogg',
        volume: 0.1,
        preload: true,
        surfaces: ['ice'],
      },
      sand: {
        path: 'assets/audio/sounds/player/steps/playerStepSand.ogg',
        volume: 0.4,
        preload: true,
        surfaces: ['sand'],
      },
    },
    lowHP: {
      path: 'assets/audio/sounds/player/lowHP.ogg',
      volume: 0.3,
      preload: true,
      loop: true,
    },
  },

  /**
   * Звуки ловушек
   */
  traps: {
    trapSpikeActivate: {
      path: 'assets/audio/sounds/traps/trapSpikeActivate.ogg',
      volume: 0.7,
      preload: true,
    },
    trapIceActivate: {
      path: 'assets/audio/sounds/traps/trapIceActivate.ogg',
      volume: 0.7,
      preload: true,
    },
    trapIceFinish: {
      path: 'assets/audio/sounds/traps/trapIceFinish.ogg',
      volume: 0.6,
      preload: true,
    },
    trapLightningActivate: {
      path: 'assets/audio/sounds/traps/trapLightningActivate.ogg',
      volume: 0.6,
      preload: true,
    },
    trapLightningEffect: {
      path: 'assets/audio/sounds/traps/trapLightningEffect.ogg',
      volume: 0.3,
      preload: true,
    },
  },
};

/**
 * Плоский список всех звуков для быстрого доступа
 * @type {Object<string, {path: string, volume: number, preload: boolean}>}
 */
export const FLAT_SOUNDS = {};

// Собираем все звуки в плоскую структуру
function flattenSounds(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (value.path) {
      // Это звук
      const flatKey = prefix ? `${prefix}.${key}` : key;
      FLAT_SOUNDS[flatKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Это категория
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      flattenSounds(value, newPrefix);
    }
  }
}

flattenSounds(SOUNDS);

/**
 * Список звуков, которые загружаются при старте
 * @type {string[]}
 */
export const PRELOAD_SOUNDS = Object.keys(FLAT_SOUNDS).filter(
  key => FLAT_SOUNDS[key].preload === true
);

/**
 * Получение конфигурации звука по ключу (поддерживает точечную нотацию)
 * @param {string} key - Ключ звука (например, 'interactions.wallDestroy')
 * @returns {Object|null} - Конфигурация звука или null
 */
export function getSoundConfig(key) {
  // Проверяем плоский список
  if (FLAT_SOUNDS[key]) {
    return FLAT_SOUNDS[key];
  }

  // Пробуем найти в иерархии
  const parts = key.split('.');
  let current = SOUNDS;

  for (const part of parts) {
    if (current && typeof current === 'object' && current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }

  // Проверяем, что нашли звук (имеет path)
  if (current && current.path) {
    return current;
  }

  return null;
}

/**
 * Проверка, существует ли звук
 * @param {string} key - Ключ звука
 * @returns {boolean} - true, если звук существует
 */
export function hasSound(key) {
  return !!getSoundConfig(key);
}

/**
 * Получение всех ключей звуков
 * @returns {string[]} - Массив ключей
 */
export function getSoundKeys() {
  return Object.keys(FLAT_SOUNDS);
}

/**
 * Получение звуков по категории
 * @param {string} category - Название категории
 * @returns {Object} - Объект со звуками в категории
 */
export function getSoundsByCategory(category) {
  return SOUNDS[category] || {};
}

/**
 * Получение всех категорий звуков
 * @returns {string[]} - Массив названий категорий
 */
export function getSoundCategories() {
  return Object.keys(SOUNDS);
}

/**
 * Получение звуков для предзагрузки
 * @returns {string[]} - Массив ключей звуков для предзагрузки
 */
export function getPreloadSounds() {
  return PRELOAD_SOUNDS;
}