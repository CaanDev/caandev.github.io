/**
 * @fileoverview Данные о боссах в игре.
 * Содержит характеристики, типы, способности и параметры фаз.
 * 
 * @module data/bosses
 */

import { EMOJIS } from '../emojis.js';

/**
 * @typedef {Object} BossAbilityData
 * @property {string} id - Идентификатор способности
 * @property {string} name - Название способности
 * @property {string} description - Описание способности
 * @property {string} icon - Иконка способности
 * @property {number} cooldown - Кулдаун в миллисекундах
 * @property {string} phaseRequired - Требуемая фаза ('first', 'second', 'third')
 * @property {number} chance - Шанс применения (0-1)
 */

/**
 * @typedef {Object} BossData
 * @property {string} id - Уникальный идентификатор
 * @property {string} name - Название босса
 * @property {string} emoji - Эмодзи для отображения
 * @property {number} level - Уровень появления
 * @property {number} baseHp - Базовое здоровье
 * @property {number} baseDamage - Базовый урон
 * @property {number} baseSpeed - Базовая скорость
 * @property {number} vision - Радиус видимости
 * @property {number} radius - Радиус столкновения
 * @property {number[]} phaseThresholds - Пороги смены фаз (в долях HP)
 * @property {string[]} abilities - Список ID способностей
 * @property {boolean} isDuoBoss - Является ли частью дуэта
 * @property {string} [duoRole] - Роль в дуэте ('chaser' или 'shooter')
 */

/**
 * @constant {Object<string, BossData>} BOSSES_DATA - Все боссы в игре
 */
export const BOSSES_DATA = {
  /**
   * Верховный демон (уровень 5)
   */
  demon: {
    id: 'demon',
    name: 'Верховный демон',
    emoji: EMOJIS.bosses.demon,
    bossType: 'demon',
    level: 5,
    baseHp: 1000,
    baseDamage: 35,
    baseSpeed: 2.0,
    vision: 1000,
    radius: 55,
    phaseThresholds: [0.75, 0.5],
    abilities: ['phaseSummon', 'speedBoost', 'rage', 'empoweredSummon', 'periodicSummon', 'tremor'],
    isDuoBoss: false,
  },

  /**
   * Разум (уровень 10)
   */
  mind: {
    id: 'mind',
    name: 'Разум',
    emoji: EMOJIS.bosses.mind,
    bossType: 'mind',
    level: 10,
    baseHp: 800,
    baseDamage: 45,
    baseSpeed: 1.2,
    vision: 1200,
    radius: 98,
    phaseThresholds: [0.75, 0.4],
    abilities: ['mindBall', 'psionicWave', 'teleportWithTrap'],
    isDuoBoss: false,
  },

  /**
   * Дуэт стражей (уровень 15)
   */
  duo: {
    id: 'duo',
    name: 'Стражи лабиринта',
    level: 15,
    isDuoBoss: true,
    chaser: {
      id: 'duo_chaser',
      name: 'Страж-Преследователь',
      emoji: EMOJIS.bosses.guardian,
      bossType: 'duo_chaser',
      baseHp: 600,
      baseDamage: 35,
      baseSpeed: 4.0,
      vision: 1000,
      radius: 55,
      phaseThresholds: [0.5],
      abilities: ['speedBoost'],
      duoRole: 'chaser',
    },
    shooter: {
      id: 'duo_shooter',
      name: 'Страж-Стрелок',
      emoji: EMOJIS.bosses.guardianAlt,
      bossType: 'duo_shooter',
      baseHp: 500,
      baseDamage: 25,
      baseSpeed: 3.0,
      vision: 1200,
      radius: 55,
      phaseThresholds: [0.5],
      abilities: ['shootFireball', 'circleFireball'],
      duoRole: 'shooter',
    },
  },
};

/**
 * Получение данных о боссе по ID
 * 
 * @param {string} id - ID босса ('demon', 'mind', 'duo')
 * @returns {BossData|undefined} - Данные о боссе или undefined
 */
export function getBossData(id) {
  return BOSSES_DATA[id];
}

/**
 * Получение данных о боссе по уровню игры
 * 
 * @param {number} level - Уровень игры
 * @returns {Object|null} - Данные о боссе или null
 */
export function getBossByLevel(level) {
  const bossLevel = Math.floor(level / 5) * 5;
  
  switch (bossLevel) {
    case 5:
      return BOSSES_DATA.demon;
    case 10:
      return BOSSES_DATA.mind;
    case 15:
      return BOSSES_DATA.duo;
    default:
      return null;
  }
}

/**
 * Проверка, является ли уровень босс-уровнем
 * 
 * @param {number} level - Номер уровня
 * @returns {boolean} - true, если уровень является босс-уровнем
 */
export function isBossLevel(level) {
  return level > 0 && level % 5 === 0;
}

/**
 * Получение названия босса по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string} - Название босса
 */
export function getBossNameByLevel(level) {
  const bossLevel = Math.floor(level / 5) * 5;
  
  switch (bossLevel) {
    case 5:
      return BOSSES_DATA.demon.name;
    case 10:
      return BOSSES_DATA.mind.name;
    case 15:
      return BOSSES_DATA.duo.name;
    default:
      return 'Босс';
  }
}

/**
 * Получение эмодзи босса по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string} - Эмодзи босса
 */
export function getBossEmojiByLevel(level) {
  const bossLevel = Math.floor(level / 5) * 5;
  
  switch (bossLevel) {
    case 5:
      return BOSSES_DATA.demon.emoji;
    case 10:
      return BOSSES_DATA.mind.emoji;
    case 15:
      return BOSSES_DATA.duo.emoji;
    default:
      return EMOJIS.bosses.demon;
  }
}

/**
 * Получение типа босса по уровню
 * 
 * @param {number} level - Номер уровня
 * @returns {string} - Тип босса
 */
export function getBossTypeByLevel(level) {
  const bossLevel = Math.floor(level / 5) * 5;
  
  switch (bossLevel) {
    case 5:
      return BOSSES_DATA.demon.bossType;
    case 10:
      return BOSSES_DATA.mind.bossType;
    case 15:
      return 'duo';
    default:
      return 'default';
  }
}