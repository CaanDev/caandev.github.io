/**
 * @fileoverview Точка входа для исследовательницы.
 * 
 * @module entities/npc/researcher/index
 */

export {
  trySpawnResearcherInLabyrinth,
  spawnResearcherInSafeRoom,
  clearResearcherPosition,
} from './spawner.js';

export {
  updateResearcher,
  removeResearcherFromLabyrinth,
  setResearcherState,
} from './manager.js';

export { findResearcherSpawnCell } from './utils.js';
export { isNearResearcher } from './interaction.js';