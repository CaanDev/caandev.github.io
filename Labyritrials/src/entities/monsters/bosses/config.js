/**
 * @fileoverview Конфигурация боссов.
 * Определяет всех боссов игры, их характеристики, способности и фазы.
 * 
 * @module entities/monsters/bosses/config
 */

import { EMOJIS } from '../../../emojis.js';
import { getAbilitiesByBossType } from './abilities/index.js';

/**
 * @namespace BOSS_TYPES
 * @description Типы боссов
 */
export const BOSS_TYPES = {
  DEMON: 'demon',
  MIND: 'mind',
  DUO_CHASER: 'duo_chaser',
  DUO_SHOOTER: 'duo_shooter'
};

/**
 * Базовый класс босса
 * 
 * @class Boss
 */
export class Boss {
  /**
   * Создание экземпляра босса
   * 
   * @param {Object} config - Конфигурация босса
   * @param {string} config.id - Уникальный идентификатор
   * @param {string} config.name - Название босса
   * @param {number} config.level - Уровень появления
   * @param {string} config.emoji - Эмодзи босса
   * @param {string} config.bossType - Тип босса (из BOSS_TYPES)
   * @param {number} config.baseHp - Базовое здоровье
   * @param {number} config.baseDamage - Базовый урон
   * @param {number} config.baseSpeed - Базовая скорость
   * @param {number} [config.vision=1000] - Радиус видимости
   * @param {number} [config.radius=55] - Радиус столкновения
   * @param {string} [config.state='chase'] - Начальное состояние
   * @param {boolean} [config.isDuoBoss=false] - Является ли частью дуэта
   * @param {string} [config.duoRole=null] - Роль в дуэте ('chaser' или 'shooter')
   * @param {boolean} [config.canShootProjectiles=false] - Может ли стрелять снарядами
   * @param {number[]} [config.phaseThresholds=[0.5]] - Пороги смены фаз (в долях HP)
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.level = config.level;
    this.emoji = config.emoji;
    this.bossType = config.bossType;

    this.baseHp = config.baseHp;
    this.baseDamage = config.baseDamage;
    this.baseSpeed = config.baseSpeed;
    this.vision = config.vision || 1000;
    this.radius = config.radius || 55;

    this.state = config.state || 'chase';
    this.isDuoBoss = config.isDuoBoss || false;
    this.duoRole = config.duoRole || null;

    this.abilities = getAbilitiesByBossType(this.bossType);

    this.canShootProjectiles = config.canShootProjectiles || false;

    this.phaseThresholds = config.phaseThresholds || [0.5];
    this.currentPhase = 1;
    this.phaseChanged = false;

    this.abilityCooldowns = {};
    this.lastMinionSummon = 0;
    this.lastAbilityUse = 0;
    this.attackCooldown = 0;
    this.invertedControls = false;
    this.invertTimer = 0;
  }

  /**
   * Обновление фазы босса на основе текущего HP
   * 
   * @param {number} currentHp - Текущее здоровье
   * @param {number} maxHp - Максимальное здоровье
   * @returns {boolean} - true, если фаза изменилась
   */
  updatePhase(currentHp, maxHp) {
    const percent = currentHp / maxHp;
    let newPhase = 1;

    for (let i = 0; i < this.phaseThresholds.length; i++) {
      if (percent < this.phaseThresholds[i]) {
        newPhase = i + 2;
      } else {
        break;
      }
    }

    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      this.phaseChanged = true;
    } else {
      this.phaseChanged = false;
    }
    return this.phaseChanged;
  }

  /**
   * Получение масштабированных характеристик для уровня игры
   * 
   * @param {number} gameLevel - Текущий уровень игры
   * @param {number} [scaling=0.15] - Коэффициент масштабирования
   * @returns {Object} - Масштабированные характеристики
   */
  getScaledStats(gameLevel, scaling = 0.15) {
    const multiplier = 1 + (gameLevel - 1) * scaling;
    return {
      hp: Math.floor(this.baseHp * multiplier),
      damage: Math.floor(this.baseDamage * multiplier),
      speed: this.baseSpeed,
      emoji: this.emoji
    };
  }
}

/**
 * Класс босса "Верховный демон" (уровень 5)
 * 
 * @class DemonBoss
 * @extends Boss
 */
class DemonBoss extends Boss {
  constructor() {
    super({
      id: 'demon_boss',
      name: 'Верховный демон',
      level: 5,
      emoji: EMOJIS.bosses.demon,
      bossType: BOSS_TYPES.DEMON,
      baseHp: 1000,
      baseDamage: 35,
      baseSpeed: 2.0,
      state: 'chase',
      isBoss: true,
      isDuoBoss: false,
      phaseThresholds: [0.75, 0.5]
    });
  }
}

/**
 * Класс босса "Разум" (уровень 10)
 * 
 * @class MindBoss
 * @extends Boss
 */
class MindBoss extends Boss {
  constructor() {
    super({
      id: 'mind_boss',
      name: 'Разум',
      level: 10,
      emoji: EMOJIS.bosses.mind,
      bossType: BOSS_TYPES.MIND,
      baseHp: 800,
      baseDamage: 45,
      baseSpeed: 1.2,
      canShootProjectiles: true,
      state: 'chase',
      isBoss: true,
      isDuoBoss: false,
      radius: 98,
      vision: 1200,
      phaseThresholds: [0.75, 0.4]
    });
  }
}

/**
 * Класс босса "Страж-Преследователь" (уровень 15, часть дуэта)
 * 
 * @class DuoChaserBoss
 * @extends Boss
 */
class DuoChaserBoss extends Boss {
  constructor() {
    super({
      id: 'duo_chaser',
      name: 'Страж-Преследователь',
      level: 15,
      emoji: EMOJIS.bosses.guardian,
      bossType: BOSS_TYPES.DUO_CHASER,
      baseHp: 600,
      baseDamage: 35,
      baseSpeed: 4.0,
      isBoss: true,
      isDuoBoss: true,
      duoRole: 'chaser',
      state: 'chase',
      phaseThreshold: 0.5
    });
  }
}

/**
 * Класс босса "Страж-Стрелок" (уровень 15, часть дуэта)
 * 
 * @class DuoShooterBoss
 * @extends Boss
 */
class DuoShooterBoss extends Boss {
  constructor() {
    super({
      id: 'duo_shooter',
      name: 'Страж-Стрелок',
      level: 15,
      emoji: EMOJIS.bosses.guardian,
      bossType: BOSS_TYPES.DUO_SHOOTER,
      baseHp: 500,
      baseDamage: 25,
      baseSpeed: 3.0,
      isBoss: true,
      isDuoBoss: true,
      duoRole: 'shooter',
      state: 'flee',
      canShootProjectiles: true,
      phaseThreshold: 0.5
    });
  }
}

// Экспорт экземпляров боссов
export const DEMON_BOSS = new DemonBoss();
export const MIND_BOSS = new MindBoss();
export const DUO_CHASER_BOSS = new DuoChaserBoss();
export const DUO_SHOOTER_BOSS = new DuoShooterBoss();

/**
 * Получение конфигурации босса по уровню игры
 * 
 * @param {number} gameLevel - Текущий уровень игры
 * @returns {Object|null} - Конфигурация босса или null, если босса нет на уровне
 */
export function getBossByLevel(gameLevel) {
  const bossLevel = Math.floor(gameLevel / 5) * 5;

  switch (bossLevel) {
    case 5:
      return DEMON_BOSS;
    case 10:
      return MIND_BOSS;
    case 15:
      return { chaser: DUO_CHASER_BOSS, shooter: DUO_SHOOTER_BOSS };
    default:
      return null;
  }
}

/**
 * Проверка, является ли уровень босс-уровнем
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {boolean} - true, если уровень является босс-уровнем
 */
export function isBossLevel(gameLevel) {
  return gameLevel > 0 && gameLevel % 5 === 0;
}

/**
 * Получение названия босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Название босса
 */
export function getBossNameByLevel(gameLevel) {
  const bossLevel = Math.floor(gameLevel / 5) * 5;

  switch (bossLevel) {
    case 5:
      return 'Верховный демон';
    case 10:
      return 'Разум';
    case 15:
      return 'Страж лабиринта';
    default:
      return 'БОСС АРЕНЫ';
  }
}

/**
 * Получение эмодзи босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Эмодзи босса
 */
export function getBossEmojiByLevel(gameLevel) {
  const bossLevel = Math.floor(gameLevel / 5) * 5;

  switch (bossLevel) {
    case 5:
      return EMOJIS.bosses.demon;
    case 10:
      return EMOJIS.bosses.mind;
    case 15:
      return EMOJIS.bosses.guardian;
    default:
      return EMOJIS.bosses.demon;
  }
}

/**
 * Получение типа босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Тип босса
 */
export function getBossTypeByLevel(gameLevel) {
  const bossLevel = Math.floor(gameLevel / 5) * 5;

  switch (bossLevel) {
    case 5:
      return BOSS_TYPES.DEMON;
    case 10:
      return BOSS_TYPES.MIND;
    case 15:
      return 'duo';
    default:
      return 'default';
  }
}