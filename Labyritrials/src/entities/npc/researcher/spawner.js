/**
 * @fileoverview Логика спавна исследовательницы.
 * Спавн в лабиринте (в тупике) и в безопасной комнате.
 * 
 * @module entities/npc/researcher/spawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { logger } from '../../../utils/logger.js';
import { RESEARCHER_STATES } from '../../../systems/dialogs/npcStates.js';
import { findResearcherSpawnCell } from './utils.js';

/**
 * Попытка спавна исследовательницы в лабиринте.
 * 
 * Условия:
 *  - статус NPC = NOT_MET
 *  - игрок уже посещал безопасную комнату (safeRoomIntroShown)
 *  - уровень >= 8 (есть доска заданий)
 *  - не босс-уровень
 *  - не тайная комната
 * 
 * @returns {boolean} - true, если спавн удался
 */
export function trySpawnResearcherInLabyrinth() {
  // Проверка статуса NPC
  const status = state.npcState.researcher;
  if (status !== RESEARCHER_STATES.NOT_MET && status !== RESEARCHER_STATES.IN_LABYRINTH) return false;

  // Проверка условий по уровню
  if (!state.safeRoomIntroShown) return false;
  if (state.gameLevel < 8) return false;
  if (state.isBossLevel) return false;
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return false;

  // Поиск тупика
  const spawnCell = findResearcherSpawnCell();
  if (!spawnCell) return false;

  // Заполнение state.researcher
  state.researcher.status = RESEARCHER_STATES.IN_LABYRINTH;
  state.researcher.gridX = spawnCell.x;
  state.researcher.gridY = spawnCell.y;
  state.researcher.x = spawnCell.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  state.researcher.y = spawnCell.y * CONFIG.cellSize + CONFIG.cellSize / 2;
  state.researcher.spawnLevel = state.gameLevel;
  state.researcher.pendingRemoval = false;

  // Синхронизация с state.npcState
  state.npcState.researcher = RESEARCHER_STATES.IN_LABYRINTH;

  return true;
}

/**
 * Спавн исследовательницы в безопасной комнате.
 * 
 * @returns {boolean} - true, если спавн удался
 */
export function spawnResearcherInSafeRoom() {
  // Проверка статуса
  const status = state.npcState.researcher;
  if (status !== RESEARCHER_STATES.IN_SAFE_ROOM && 
      status !== RESEARCHER_STATES.QUEST_READY_TO_TURN_IN &&
      status !== RESEARCHER_STATES.WISPS_QUEST_STUDYING &&
      status !== RESEARCHER_STATES.WISPS_QUEST_COMPLETE) return false;

  // Фиксированная клетка в safeRoom
  const cellX = 5;
  const cellY = 1;

  // Проверка, что клетка свободна и не занята
  const cell = state.grid[cellY]?.[cellX];
  if (!cell) return false;

  state.researcher.status = status;
  state.researcher.gridX = cellX;
  state.researcher.gridY = cellY;
  state.researcher.x = cellX * CONFIG.cellSize + CONFIG.cellSize / 2;
  state.researcher.y = cellY * CONFIG.cellSize + CONFIG.cellSize / 2;
  state.researcher.pendingRemoval = false;

  return true;
}

/**
 * Удаление исследовательницы из текущей локации (обнуление координат).
 * 
 * @returns {void}
 */
export function clearResearcherPosition() {
  state.researcher.x = null;
  state.researcher.y = null;
  state.researcher.gridX = null;
  state.researcher.gridY = null;
  state.researcher.pendingRemoval = false;
}