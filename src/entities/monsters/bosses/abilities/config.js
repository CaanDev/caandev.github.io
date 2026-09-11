/**
 * @fileoverview Конфигурация способностей боссов.
 * Определяет наборы способностей для каждого типа босса.
 * 
 * @module entities/monsters/bosses/abilities/config
 */

import {
  PhaseSummonAbility,
  SummonMinionsAbility,
  EmpoweredSummonAbility
} from './summon.js';
import {
  SpeedBoostAbility,
  RageAbility
} from './buff.js';
import {
  ShootFireballAbility,
  MindBallAbility,
  CircleFireballAbility
} from './projectile.js';
import {
  TremorAbility,
  PsionicWaveAbility,
  TeleportWithTrapAbility
} from './special.js';

/**
 * @namespace DEMON_ABILITIES
 * @description Способности босса "Верховный демон" (уровень 5)
 */
export const DEMON_ABILITIES = {
  phaseSummon: new PhaseSummonAbility(),
  speedBoost: new SpeedBoostAbility(),
  rage: new RageAbility(),
  empoweredSummon: new EmpoweredSummonAbility(),
  periodicSummon: new SummonMinionsAbility(),
  tremor: new TremorAbility()
};

/**
 * @namespace DUO_CHASER_ABILITIES
 * @description Способности босса "Страж-Преследователь" (уровень 15)
 */
export const DUO_CHASER_ABILITIES = {
  speedBoost: new SpeedBoostAbility()
};

/**
 * @namespace DUO_SHOOTER_ABILITIES
 * @description Способности босса "Страж-Стрелок" (уровень 15)
 */
export const DUO_SHOOTER_ABILITIES = {
  shootFireball: new ShootFireballAbility(),
  circleFireball: new CircleFireballAbility()
};

/**
 * @namespace MIND_ABILITIES
 * @description Способности босса "Разум" (уровень 10)
 */
export const MIND_ABILITIES = {
  mindBall: new MindBallAbility(),
  psionicWave: new PsionicWaveAbility(),
  teleportWithTrap: new TeleportWithTrapAbility()
};

/**
 * Получение набора способностей по типу босса
 * 
 * @param {string} bossType - Тип босса ('demon', 'duo_chaser', 'duo_shooter', 'mind')
 * @returns {Object} - Объект со способностями босса
 */
export function getAbilitiesByBossType(bossType) {
  switch (bossType) {
    case 'demon': return DEMON_ABILITIES;
    case 'duo_chaser': return DUO_CHASER_ABILITIES;
    case 'duo_shooter': return DUO_SHOOTER_ABILITIES;
    case 'mind': return MIND_ABILITIES;
    default: return {};
  }
}