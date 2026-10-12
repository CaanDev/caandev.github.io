/**
 * @fileoverview Точка входа для сущностей NPC.
 * 
 * @module entities/npc/index
 */

export {
  trySpawnResearcherInLabyrinth,
  spawnResearcherInSafeRoom,
  clearResearcherPosition,
  updateResearcher,
  removeResearcherFromLabyrinth,
  setResearcherState,
  findResearcherSpawnCell,
  isNearResearcher,
} from './researcher/index.js';