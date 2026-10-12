/**
 * @fileoverview Базовый класс способностей боссов.
 * Определяет структуру и базовую логику всех способностей боссов.
 * 
 * @module entities/monsters/bosses/abilities/base
 */

/**
 * Базовый класс способности босса
 * 
 * @class BossAbility
 */
export class BossAbility {
  /**
   * Создание экземпляра способности
   * 
   * @param {Object} config - Конфигурация способности
   * @param {string} config.id - Уникальный идентификатор способности
   * @param {string} config.name - Название способности
   * @param {string} config.description - Описание способности
   * @param {string} config.icon - Иконка способности
   * @param {number} [config.cooldown=0] - Кулдаун в миллисекундах (0 — без кулдауна)
   * @param {string|null} [config.phaseRequired=null] - Требуемая фаза ('first', 'second', 'third')
   * @param {number} [config.chance=1.0] - Шанс применения (0-1)
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon;
    this.cooldown = config.cooldown || 0;
    this.phaseRequired = config.phaseRequired || null;
    this.chance = config.chance || 1.0;
  }

  /**
   * Проверка, может ли босс использовать способность
   * 
   * @param {Object} boss - Объект босса
   * @param {number} currentPhase - Текущая фаза босса (1, 2, 3)
   * @returns {boolean} - true, если способность может быть использована
   */
  canUse(boss, currentPhase) {
    // Проверка требования фазы
    if (this.phaseRequired === 'second' && currentPhase === 1) return false;
    if (this.phaseRequired === 'first' && currentPhase === 2) return false;
    if (this.phaseRequired === 'third' && currentPhase < 3) return false;
    
    // Проверка шанса
    if (Math.random() > this.chance) return false;
    
    return true;
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    return false;
  }
}