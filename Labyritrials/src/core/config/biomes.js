/**
 * @fileoverview Конфигурация биомов (типов местности)
 * @module core/config/biomes
 */

/**
 * @namespace BIOMES
 * @description Все доступные биомы в игре
 */
export const BIOMES = {
  /** @type {Object} - Пещерный биом (уровни 1-5) */
  cave: {
    id: 'cave',
    name: 'Пещеры',
    colors: {
      floor: '#0b0d13',
    },
    monsterTypes: ['bat', 'pumpkin'],
    trapTypes: { explosion: 1 },
    eventTypes: ['blessing', 'monsterRage', 'fragility']
  },
  
  /** @type {Object} - Ледяной биом (уровни 6-10) */
  ice: {
    id: 'ice',
    name: 'Ледяные пещеры',
    colors: {
      floor: '#01192b',
    },
    monsterTypes: ['skull', 'demon'],
    trapTypes: { explosion: 1, ice: 6, acid: 8 },
    eventTypes: ['blessing', 'iceWind', 'monsterRage', 'fragility']
  },
  
  /** @type {Object} - Песчаный биом (уровни 11-15) */
  sand: {
    id: 'sand',
    name: 'Песчаные пещеры',
    colors: {
      floor: '#1a1814',
    },
    monsterTypes: ['bat', 'ghost', 'scorpion', 'demon'],
    trapTypes: { explosion: 1, acid: 8, psionic: 11, lightning: 13 },
    eventTypes: ['blessing', 'monsterRage', 'fragility', 'bloodMoon']
  }
};

/**
 * Получение биома по номеру уровня
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
 * @returns {Object} - Конфигурация биома
 */
export function getBiomeConfig(biomeId) {
  return BIOMES[biomeId] || BIOMES.cave;
}

/**
 * Получение цвета пола для биома
 * 
 * @param {string} biomeId - ID биома ('cave', 'ice', 'sand')
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
 * Получение доступных типов монстров по номеру уровня
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
 * Получение доступных типов ловушек по номеру уровня
 * 
 * @param {number} level - Номер уровня
 * @returns {string[]} - Массив ключей типов ловушек, доступных на этом уровне
 */
export function getTrapTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  const trapTypes = getTrapTypesForBiome(biomeId);
  
  // Фильтруем только те ловушки, которые доступны по уровню
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
 * Получение доступных типов событий по номеру уровня
 * 
 * @param {number} level - Номер уровня
 * @returns {string[]} - Массив ключей типов событий, доступных на этом уровне
 */
export function getEventTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getEventTypesForBiome(biomeId);
}