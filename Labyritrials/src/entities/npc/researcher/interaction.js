/**
 * @fileoverview Проверка близости NPC-исследовательницы.
 * 
 * @module entities/npc/researcher/interaction
 */

import { state, player, SPRITE_SIZES } from '../../../core/config/index.js';
import { INTERACTION_CONFIG } from '../../player/interactions/config.js';
import { RESEARCHER_STATES } from '../../../systems/dialogs/npcStates.js';

/**
 * Дополнительное смещение зоны взаимодействия по вертикали (px).
 * @type {number}
 */
const INTERACTION_ZONE_VERTICAL_OFFSET = 50;

/**
 * Проверка, находится ли игрок рядом с NPC-исследовательницей.
 * 
 * @returns {boolean} - true, если рядом и NPC активна
 */
export function isNearResearcher() {
  const r = state.researcher;
  if (!r || r.x === null || r.y === null) return false;

  // Проверка статуса - можно ли взаимодействовать
  const status = state.npcState.researcher;
  const canInteract =
    status === RESEARCHER_STATES.IN_LABYRINTH || status === RESEARCHER_STATES.IN_SAFE_ROOM ||
    status === RESEARCHER_STATES.QUEST_READY_TO_TURN_IN ||
    status === RESEARCHER_STATES.WISPS_QUEST_STUDYING || status === RESEARCHER_STATES.WISPS_QUEST_COMPLETE;

  if (!canInteract) return false;

  // Визуальный центр спрайта NPC (с учётом смещения)
  const offsets = SPRITE_SIZES.cells.offsets?.researcher || { x: 0, y: 0 };
  const npcCenterX = r.x + offsets.x;
  const npcCenterY = r.y + offsets.y + INTERACTION_ZONE_VERTICAL_OFFSET;

  const radius = INTERACTION_CONFIG.researcher.radius;
  const dist = Math.hypot(player.px - npcCenterX, player.py - npcCenterY);
  return dist < radius;
}