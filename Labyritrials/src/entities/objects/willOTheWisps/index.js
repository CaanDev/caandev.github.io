/**
 * @fileoverview Точка входа для системы блуждающих огоньков
 * (призванных willOTheWisps и диких wildWisps).
 * @module entities/objects/willOTheWisps/index
 */

// ============================================================
// ПРИЗВАННЫЕ ОГОНЬКИ
// ============================================================

export {
  WISPS_CONFIG,
  WISPS_VISUAL,
  WISPS_MOTION,
  WISPS_COLORS,
  WISPS_BIOME_COLORS,
  WISPS_BLOOD,
  WISPS_DEATH,
  getAggroRadius,
} from './wispsData.js';

export {
  initWispsState,
  getWisps,
  isWispsActive,
  resetWisps,
} from './wispsState.js';

export {
  summonWisps,
  hasWispsEquipped,
  hasMimicHunterEquipped,
  hasWispsInInventory,
  getHpCostFraction,
  markWispsAcquired,
} from './wispsSummon.js';

export { createWisp, updateWisps } from './wispsBehavior.js';

export {
  findWispTarget,
  performWispAttack,
  buildNearbyMonstersList,
  getNearbyMonsters,
  resetNearbyMonstersCache,
} from './wispsCombat.js';

// ============================================================
// ДИКИЕ ОГОНЬКИ
// ============================================================

export { updateWildWisps } from './wildWispsUpdater.js';