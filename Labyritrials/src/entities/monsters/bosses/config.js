/**
 * @fileoverview Конфигурация боссов.
 * Определяет всех боссов игры, их характеристики, способности и фазы.
 * 
 * @module entities/monsters/bosses/config
 */

import { EMOJIS } from '../../../emojis.js';
import { getAbilitiesByBossType } from './abilities/index.js';
import {
  BOSSES_DATA,
  getBossData,
  getBossByLevel as getBossByLevelData,
  isBossLevel as isBossLevelData,
  getBossNameByLevel as getBossNameByLevelData,
  getBossEmojiByLevel as getBossEmojiByLevelData,
  getBossTypeByLevel as getBossTypeByLevelData
} from '../../../data/index.js';

// ============================================================
// РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

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

// ============================================================
// КЛАСС БОССА
// ============================================================

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

// ============================================================
// ЭКЗЕМПЛЯРЫ БОССОВ (ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ)
// ============================================================

// Создаём экземпляры из данных
const demonData = getBossData('demon');
const mindData = getBossData('mind');
const duoData = getBossData('duo');

export const DEMON_BOSS = new Boss({
  id: demonData.id,
  name: demonData.name,
  level: demonData.level,
  emoji: demonData.emoji,
  bossType: demonData.bossType,
  baseHp: demonData.baseHp,
  baseDamage: demonData.baseDamage,
  baseSpeed: demonData.baseSpeed,
  vision: demonData.vision,
  radius: demonData.radius,
  phaseThresholds: demonData.phaseThresholds,
});

export const MIND_BOSS = new Boss({
  id: mindData.id,
  name: mindData.name,
  level: mindData.level,
  emoji: mindData.emoji,
  bossType: mindData.bossType,
  baseHp: mindData.baseHp,
  baseDamage: mindData.baseDamage,
  baseSpeed: mindData.baseSpeed,
  vision: mindData.vision,
  radius: mindData.radius,
  phaseThresholds: mindData.phaseThresholds,
});

// Для дуэта используем отдельную логику (как было)
export const DUO_CHASER_BOSS = new Boss({
  id: duoData.chaser.id,
  name: duoData.chaser.name,
  level: duoData.level,
  emoji: duoData.chaser.emoji,
  bossType: duoData.chaser.bossType,
  baseHp: duoData.chaser.baseHp,
  baseDamage: duoData.chaser.baseDamage,
  baseSpeed: duoData.chaser.baseSpeed,
  vision: duoData.chaser.vision,
  radius: duoData.chaser.radius,
  isDuoBoss: true,
  duoRole: duoData.chaser.duoRole,
  phaseThresholds: duoData.chaser.phaseThresholds,
});

export const DUO_SHOOTER_BOSS = new Boss({
  id: duoData.shooter.id,
  name: duoData.shooter.name,
  level: duoData.level,
  emoji: duoData.shooter.emoji,
  bossType: duoData.shooter.bossType,
  baseHp: duoData.shooter.baseHp,
  baseDamage: duoData.shooter.baseDamage,
  baseSpeed: duoData.shooter.baseSpeed,
  vision: duoData.shooter.vision,
  radius: duoData.shooter.radius,
  isDuoBoss: true,
  duoRole: duoData.shooter.duoRole,
  phaseThresholds: duoData.shooter.phaseThresholds,
  canShootProjectiles: true,
});

// ============================================================
// ФУНКЦИИ (РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ)
// ============================================================

/**
 * Получение конфигурации босса по уровню игры
 * 
 * @param {number} gameLevel - Текущий уровень игры
 * @returns {Object|null} - Конфигурация босса или null, если босса нет на уровне
 */
export function getBossByLevel(gameLevel) {
  return getBossByLevelData(gameLevel);
}

/**
 * Проверка, является ли уровень босс-уровнем
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {boolean} - true, если уровень является босс-уровнем
 */
export function isBossLevel(gameLevel) {
  return isBossLevelData(gameLevel);
}

/**
 * Получение названия босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Название босса
 */
export function getBossNameByLevel(gameLevel) {
  return getBossNameByLevelData(gameLevel);
}

/**
 * Получение эмодзи босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Эмодзи босса
 */
export function getBossEmojiByLevel(gameLevel) {
  return getBossEmojiByLevelData(gameLevel);
}

/**
 * Получение типа босса по уровню
 * 
 * @param {number} gameLevel - Номер уровня
 * @returns {string} - Тип босса
 */
export function getBossTypeByLevel(gameLevel) {
  return getBossTypeByLevelData(gameLevel);
}