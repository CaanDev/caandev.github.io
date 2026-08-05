/**
 * @fileoverview Данные о биомах в игре.
 * Содержит названия, цвета, типы монстров, ловушек и событий для каждого биома.
 * 
 * @module data/biomes
 */

/**
 * @typedef {Object} BiomeData
 * @property {string} id - Уникальный идентификатор биома
 * @property {string} name - Название биома
 * @property {Object} colors - Цветовая схема биома
 * @property {string} colors.floor - Цвет пола
 * @property {string[]} monsterTypes - Типы монстров, доступные в биоме
 * @property {Object} trapTypes - Типы ловушек с минимальным уровнем появления
 * @property {string[]} eventTypes - Типы событий, доступные в биоме
 */

/**
 * @constant {Object<string, BiomeData>} BIOMES_DATA - Все биомы в игре
 */
export const BIOMES_DATA = {
  /**
   * Пещерный биом (уровни 1-5)
   */
  cave: {
    id: 'cave',
    name: 'Пещеры',
    colors: {
      floor: '#0b0d13',
    },
    monsterTypes: ['bat', 'pumpkin'],
    trapTypes: { explosion: 1 },
    eventTypes: ['blessing', 'monsterRage', 'fragility'],
  },

  /**
   * Ледяной биом (уровни 6-10)
   */
  ice: {
    id: 'ice',
    name: 'Ледяные пещеры',
    colors: {
      floor: '#01192b',
    },
    monsterTypes: ['skull', 'demon'],
    trapTypes: { explosion: 1, ice: 6, acid: 8 },
    eventTypes: ['blessing', 'iceWind', 'monsterRage', 'fragility'],
  },

  /**
   * Песчаный биом (уровни 11-15)
   */
  sand: {
    id: 'sand',
    name: 'Песчаные пещеры',
    colors: {
      floor: '#1a1814',
    },
    monsterTypes: ['bat', 'ghost', 'scorpion', 'demon'],
    trapTypes: { explosion: 1, acid: 8, psionic: 11, lightning: 13 },
    eventTypes: ['blessing', 'monsterRage', 'fragility', 'bloodMoon'],
  },
};

/**
 * Получение данных о биоме по ID
 * 
 * @param {string} id - ID биома ('cave', 'ice', 'sand')
 * @returns {BiomeData|undefined} - Данные о биоме или undefined
 */
export function getBiomeData(id) {
  return BIOMES_DATA[id];
}

/**
 * Получение биома по уровню игры
 * 
 * @param {number} level - Номер уровня (1-15)
 * @returns {string} - ID биома ('cave', 'ice', 'sand')
 */
export function getBiomeByLevel(level) {
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

/**
 * Получение конфигурации биома по ID
 * 
 * @param {string} biomeId - ID биома
 * @returns {BiomeData} - Конфигурация биома (с fallback на cave)
 */
export function getBiomeConfig(biomeId) {
  return BIOMES_DATA[biomeId] || BIOMES_DATA.cave;
}

/**
 * Получение цвета пола для биома
 * 
 * @param {string} biomeId - ID биома
 * @returns {string} - Цвет пола (HEX)
 */
export function getFloorColorForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.colors?.floor || '#0b0d13';
}

/**
 * Получение доступных типов монстров для биома
 * 
 * @param {string} biomeId - ID биома
 * @returns {string[]} - Массив ключей типов монстров
 */
export function getMonsterTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.monsterTypes || [];
}

/**
 * Получение доступных типов монстров по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string[]} - Массив ключей типов монстров
 */
export function getMonsterTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getMonsterTypesForBiome(biomeId);
}

/**
 * Получение доступных типов ловушек для биома
 * 
 * @param {string} biomeId - ID биома
 * @returns {Object} - Объект { тип_ловушки: минимальный_уровень }
 */
export function getTrapTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.trapTypes || {};
}

/**
 * Получение доступных типов ловушек по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string[]} - Массив ключей типов ловушек, доступных на этом уровне
 */
export function getTrapTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  const trapTypes = getTrapTypesForBiome(biomeId);
  
  const availableTraps = [];
  for (const [trapType, minLevel] of Object.entries(trapTypes)) {
    if (level >= minLevel) {
      availableTraps.push(trapType);
    }
  }
  return availableTraps;
}

/**
 * Получение доступных типов событий для биома
 * 
 * @param {string} biomeId - ID биома
 * @returns {string[]} - Массив ключей типов событий
 */
export function getEventTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.eventTypes || [];
}

/**
 * Получение доступных типов событий по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string[]} - Массив ключей типов событий, доступных на этом уровне
 */
export function getEventTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getEventTypesForBiome(biomeId);
}