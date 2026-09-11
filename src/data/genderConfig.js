/**
 * @fileoverview Конфигурация характеристик по полу персонажа
 * @module data/genderConfig
 */

/**
 * @typedef {Object} GenderStats
 * @property {number} baseDamage - Базовый урон
 * @property {number} baseSpeed - Базовая скорость
 * @property {number} maxStamina - Максимальная выносливость
 * @property {number} staminaRegenInCombat - Регенерация в бою (ед/сек)
 * @property {number} staminaRegenOutOfCombat - Регенерация вне боя (ед/сек)
 * @property {number} staminaUpgradeCost - Стоимость улучшения выносливости
 * @property {number} dmgCost - Стоимость улучшения урона
 * @property {number} evasionBonus - Бонус к уклонению от ловушек
 * @property {Object} weaponBonuses - Бонусы к оружию
 */

/**
 * @namespace GENDER_CONFIG
 * @description Характеристики для каждого пола
 */
export const GENDER_CONFIG = {
  male: {
    // Основные характеристики
    baseDamage: 25,
    baseSpeed: 6,
    maxStamina: 100,
    staminaRegenInCombat: 6,
    staminaRegenOutOfCombat: 10,
    staminaUpgradeCost: 150,
    dmgCost: 40,
    evasionBonus: 0, // стандартное уклонение
    
    // Бонусы к оружию
    weaponBonuses: {
      // Громовой посох: оглушение на 0.5 сек дольше
      stunDurationBonus: 0.5,
      // Посох вампира: кулдаун на 20% меньше
      vampCooldownReduction: 0.2,
      // Огненный шар: урон +20%
      fireballDamageBonus: 0.2,
    },
  },
  
  female: {
    // Основные характеристики
    baseDamage: 20,
    baseSpeed: 7,
    maxStamina: 85,
    staminaRegenInCombat: 8,
    staminaRegenOutOfCombat: 12,
    staminaUpgradeCost: 180,
    dmgCost: 50,
    evasionBonus: 0.1, // +10% к уклонению
    
    // Бонусы к оружию
    weaponBonuses: {
      // Громовой посох: кулдаун на 20% меньше
      stunCooldownReduction: 0.2,
      // Посох вампира: лечение +2%
      vampHealBonus: 0.02,
      // Огненный шар: скорость +30%
      fireballSpeedBonus: 0.3,
    },
  },
};

/**
 * Получение конфигурации для указанного пола
 * @param {string} gender - 'male' или 'female'
 * @returns {GenderStats} - Конфигурация характеристик
 */
export function getGenderConfig(gender) {
  return GENDER_CONFIG[gender] || GENDER_CONFIG.male;
}

/**
 * Получение бонусов к оружию для указанного пола
 * @param {string} gender - 'male' или 'female'
 * @returns {Object} - Бонусы к оружию
 */
export function getWeaponBonuses(gender) {
  const config = getGenderConfig(gender);
  return config.weaponBonuses || {};
}

/**
 * Получение значения конкретного бонуса
 * @param {string} gender - 'male' или 'female'
 * @param {string} bonusKey - Ключ бонуса
 * @returns {number|null} - Значение бонуса или null
 */
export function getWeaponBonus(gender, bonusKey) {
  const bonuses = getWeaponBonuses(gender);
  return bonuses[bonusKey] !== undefined ? bonuses[bonusKey] : null;
}