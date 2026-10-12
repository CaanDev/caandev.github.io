/**
 * @fileoverview Точка входа для системы боссов.
 * Экспортирует все компоненты: конфигурацию боссов, атаки, ИИ, логику и способности.
 * 
 * @module entities/monsters/bosses/index
 */

// ============================================================
// КОНФИГУРАЦИЯ БОССОВ
// ============================================================

/**
 * Экспорт конфигурации боссов
 * @see module:entities/monsters/bosses/config
 */
export {
  BOSS_TYPES,
  DEMON_BOSS,
  DUO_CHASER_BOSS,
  DUO_SHOOTER_BOSS,
  MIND_BOSS,
  Boss,
  getBossByLevel,
  isBossLevel,
  getBossNameByLevel,
  getBossEmojiByLevel,
  getBossTypeByLevel
} from './config.js';

// ============================================================
// АТАКИ БОССОВ
// ============================================================

/**
 * Экспорт функций атак боссов
 * @see module:entities/monsters/bosses/attacks
 */
export {
  updateBossAttack,
  applyInvertedControls,
  updateInvertTimer
} from './attacks.js';

// ============================================================
// ЛОГИКА БОССОВ
// ============================================================

/**
 * Экспорт функций логики боссов
 * @see module:entities/monsters/bosses/logic
 */
export {
  updateBossLogic,
  updateBossAttacks,
  summonMinions
} from './logic.js';

// ============================================================
// ИИ БОССОВ
// ============================================================

/**
 * Экспорт функций ИИ и движения боссов
 * @see module:entities/monsters/bosses/ai
 */
export {
  updateBossState,
  updateBossMovement,
  updateBossChaseMovement,
  updateBossFleeMovement,
  updateBossPatrolMovement
} from './ai.js';

// ============================================================
// СПОСОБНОСТИ БОССОВ
// ============================================================

/**
 * Экспорт способностей боссов
 * @see module:entities/monsters/bosses/abilities/index
 */
export {
  BossAbility,
  SummonMinionsAbility,
  PhaseSummonAbility,
  EmpoweredSummonAbility,
  SpeedBoostAbility,
  RageAbility,
  ShootFireballAbility,
  MindBallAbility,
  CircleFireballAbility,
  TremorAbility,
  PsionicWaveAbility,
  TeleportWithTrapAbility,
  getAbilitiesByBossType,
  DEMON_ABILITIES,
  DUO_CHASER_ABILITIES,
  DUO_SHOOTER_ABILITIES,
  MIND_ABILITIES,
  summonMinionsAroundBoss,
  createTeleportFlash
} from './abilities/index.js';