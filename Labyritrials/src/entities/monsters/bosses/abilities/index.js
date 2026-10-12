/**
 * @fileoverview Точка входа для способностей боссов.
 * Экспортирует все классы способностей, вспомогательные функции
 * и конфигурации для каждого типа босса.
 * 
 * @module entities/monsters/bosses/abilities/index
 */

// ============================================================
// БАЗОВЫЙ КЛАСС
// ============================================================

/**
 * Экспорт базового класса способности
 * @see module:entities/monsters/bosses/abilities/base
 */
export { BossAbility } from './base.js';

// ============================================================
// СПОСОБНОСТИ ПРИЗЫВА
// ============================================================

/**
 * Экспорт способностей призыва миньонов
 * @see module:entities/monsters/bosses/abilities/summon
 */
export {
  SummonMinionsAbility,
  PhaseSummonAbility,
  EmpoweredSummonAbility
} from './summon.js';

// ============================================================
// БАФФ-СПОСОБНОСТИ
// ============================================================

/**
 * Экспорт бафф-способностей
 * @see module:entities/monsters/bosses/abilities/buff
 */
export {
  SpeedBoostAbility,
  RageAbility
} from './buff.js';

// ============================================================
// СПОСОБНОСТИ СНАРЯДОВ
// ============================================================

/**
 * Экспорт способностей со снарядами
 * @see module:entities/monsters/bosses/abilities/projectile
 */
export {
  ShootFireballAbility,
  MindBallAbility,
  CircleFireballAbility
} from './projectile.js';

// ============================================================
// ОСОБЫЕ СПОСОБНОСТИ
// ============================================================

/**
 * Экспорт особых способностей
 * @see module:entities/monsters/bosses/abilities/special
 */
export {
  TremorAbility,
  PsionicWaveAbility,
  TeleportWithTrapAbility
} from './special.js';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Экспорт вспомогательных функций
 * @see module:entities/monsters/bosses/abilities/helpers
 */
export {
  summonMinionsAroundBoss,
  createTeleportFlash
} from './helpers.js';

// ============================================================
// КОНФИГУРАЦИЯ СПОСОБНОСТЕЙ
// ============================================================

/**
 * Экспорт конфигураций способностей для каждого типа босса
 * @see module:entities/monsters/bosses/abilities/config
 */
export {
  DEMON_ABILITIES,
  DUO_CHASER_ABILITIES,
  DUO_SHOOTER_ABILITIES,
  MIND_ABILITIES,
  getAbilitiesByBossType
} from './config.js';