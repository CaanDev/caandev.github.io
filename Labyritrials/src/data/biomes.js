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
 * @property {Object} colors.fog - Цвета тумана для этого биома
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
      fog: {
        center:  'rgba(0, 0, 0, 0)',
        inner:   'rgba(0, 0, 0, 0.1)',
        mid:     'rgba(0, 0, 0, 0.2)',
        outer:   'rgba(0, 0, 0, 0.35)',
        far:     'rgba(0, 0, 0, 0.5)',
        farther: 'rgba(0, 0, 0, 0.7)',
        edge:    'rgba(0, 0, 0, 0.85)',
        full:    'rgba(0, 0, 0, 1)',
        memoryFade: 'rgba(5, 5, 15, ',
      }
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
      fog: {
        center: 'rgba(255, 255, 255, 0)',
        inner1: 'rgba(255, 255, 255, 0.04)',
        inner2: 'rgba(255, 255, 255, 0.10)',
        inner3: 'rgba(255, 255, 255, 0.18)',
        mid1:   'rgba(252, 252, 255, 0.26)',
        mid2:   'rgba(252, 252, 255, 0.35)',
        mid3:   'rgba(250, 250, 255, 0.44)',
        outer1: 'rgba(248, 248, 252, 0.54)',
        outer2: 'rgba(248, 248, 252, 0.64)',
        outer3: 'rgba(246, 246, 250, 0.74)',
        far1:   'rgba(244, 244, 248, 0.83)',
        far2:   'rgba(242, 242, 246, 0.88)',
        edge:   'rgba(240, 240, 245, 0.92)',
        full:   'rgba(238, 238, 244, 0.95)',
        memoryFade: 'rgba(235, 240, 248, ',
      }
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
      fog: {
        center: 'rgba(0, 0, 0, 0)',
        inner1: 'rgba(30, 18, 10, 0.05)',
        inner2: 'rgba(30, 18, 10, 0.15)',
        mid1:   'rgba(30, 18, 10, 0.25)',
        mid2:   'rgba(30, 18, 10, 0.34)',
        outer1: 'rgba(30, 18, 10, 0.58)',
        outer2: 'rgba(30, 18, 10, 0.76)',
        far1:   'rgba(30, 18, 10, 0.82)',
        far2:   'rgba(30, 18, 10, 0.88)',
        edge:   'rgba(30, 18, 10, 0.95)',
        full:   'rgba(30, 18, 10, 1)',
        memoryFade: 'rgba(45, 28, 16, ',
      }
    },
    monsterTypes: ['bat', 'ghost', 'scorpion', 'demon'],
    trapTypes: { explosion: 1, acid: 8, psionic: 11, lightning: 13 },
    eventTypes: ['blessing', 'monsterRage', 'fragility', 'bloodMoon'],
  },
};

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

export function getBiomeData(id) {
  return BIOMES_DATA[id];
}

export function getBiomeByLevel(level) {
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

export function getBiomeConfig(biomeId) {
  return BIOMES_DATA[biomeId] || BIOMES_DATA.cave;
}

export function getFloorColorForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.colors?.floor || '#0b0d13';
}

export function getFogColorsForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.colors?.fog || BIOMES_DATA.cave.colors.fog;
}

export function getMemoryFadeColorForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.colors?.fog?.memoryFade || 'rgba(5, 5, 15, ';
}

export function getFogColorsByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getFogColorsForBiome(biomeId);
}

export function getMonsterTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.monsterTypes || [];
}

export function getMonsterTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getMonsterTypesForBiome(biomeId);
}

export function getTrapTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.trapTypes || {};
}

export function getTrapTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  const trapTypes = getTrapTypesForBiome(biomeId);
  
  const availableTraps = [];
  for (const [trapType, minLevel] of Object.entries(trapTypes)) {
    if (level >= minLevel) availableTraps.push(trapType);
  }
  return availableTraps;
}

export function getEventTypesForBiome(biomeId) {
  const config = getBiomeConfig(biomeId);
  return config.eventTypes || [];
}

export function getEventTypesByLevel(level) {
  const biomeId = getBiomeByLevel(level);
  return getEventTypesForBiome(biomeId);
}