/**
 * @fileoverview Данные о всех монстрах в игре.
 * Содержит характеристики, типы, уровни появления и особенности.
 * 
 * @module data/monsters
 */

/**
 * @typedef {Object} MonsterData
 * @property {string} id - Уникальный идентификатор
 * @property {string} name - Название монстра
 * @property {string} emoji - Эмодзи для отображения
 * @property {number} hp - Базовое здоровье
 * @property {number} damage - Базовый урон
 * @property {number} radius - Радиус столкновения
 * @property {number} speed - Базовая скорость
 * @property {number} vision - Радиус видимости
 * @property {number} minLevel - Минимальный уровень появления
 * @property {string[]} biomes - Биомы, в которых появляется
 * @property {Object} [special] - Особые свойства
 * @property {boolean} [special.isGhost] - Является ли призраком
 * @property {boolean} [special.poisonOnHit] - Отравляет ли при атаке
 * @property {number} [dropChance] - Шанс выпадения предметов (0-1)
 */

/**
 * @constant {Object<string, MonsterData>} MONSTERS_DATA - Все монстры в игре
 */
export const MONSTERS_DATA = {
  bat: {
    id: 'bat',
    name: 'Летучая мышь',
    emoji: '🦇',
    hp: 25,
    damage: 6,
    radius: 18,
    speed: 2.5,
    vision: 280,
    minLevel: 1,
    biomes: ['cave', 'ice', 'sand'],
    dropChance: 0.25,
  },
  
  pumpkin: {
    id: 'pumpkin',
    name: 'Тыква',
    emoji: '🎃',
    hp: 60,
    damage: 12,
    radius: 24,
    speed: 2.0,
    vision: 320,
    minLevel: 1,
    biomes: ['cave', 'ice'],
    dropChance: 0.35,
  },
  
  ghost: {
    id: 'ghost',
    name: 'Призрак',
    emoji: '👻',
    hp: 30,
    damage: 6,
    radius: 22,
    speed: 1.5,
    vision: 260,
    minLevel: 8,
    biomes: ['sand'],
    special: {
      isGhost: true,
    },
    dropChance: 0.15,
  },
  
  skull: {
    id: 'skull',
    name: 'Череп',
    emoji: '💀',
    hp: 90,
    damage: 18,
    radius: 22,
    speed: 2.4,
    vision: 350,
    minLevel: 3,
    biomes: ['ice', 'sand'],
    dropChance: 0.30,
  },
  
  demon: {
    id: 'demon',
    name: 'Демон',
    emoji: '😈',
    hp: 150,
    damage: 28,
    radius: 28,
    speed: 1.8,
    vision: 400,
    minLevel: 6,
    biomes: ['ice', 'sand'],
    dropChance: 0.35,
  },
  
  scorpion: {
    id: 'scorpion',
    name: 'Гигантский скорпион',
    emoji: '🦂',
    hp: 130,
    damage: 24,
    radius: 26,
    speed: 1.6,
    vision: 350,
    minLevel: 11,
    biomes: ['sand'],
    special: {
      poisonOnHit: true,
    },
    dropChance: 0.30,
  },
};

/**
 * Получение данных о монстре по ID
 * 
 * @param {string} id - ID монстра
 * @returns {MonsterData|undefined} - Данные о монстре или undefined
 */
export function getMonsterData(id) {
  return MONSTERS_DATA[id];
}

/**
 * Получение всех монстров
 * 
 * @returns {MonsterData[]} - Массив данных о монстрах
 */
export function getAllMonsters() {
  return Object.values(MONSTERS_DATA);
}

/**
 * Получение монстров по биому
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {MonsterData[]} - Массив данных о монстрах в биоме
 */
export function getMonstersByBiome(biome) {
  return Object.values(MONSTERS_DATA).filter(m => m.biomes.includes(biome));
}

/**
 * Получение монстров по уровню игры
 * 
 * @param {number} level - Текущий уровень игры
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {MonsterData[]} - Массив данных о доступных монстрах
 */
export function getMonstersByLevel(level, biome) {
  return Object.values(MONSTERS_DATA).filter(m => 
    m.minLevel <= level && m.biomes.includes(biome)
  );
}

/**
 * Получение минимального уровня для монстра
 * 
 * @param {string} id - ID монстра
 * @returns {number} - Минимальный уровень
 */
export function getMonsterMinLevel(id) {
  return MONSTERS_DATA[id]?.minLevel || 1;
}