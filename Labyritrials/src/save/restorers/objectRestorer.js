/**
 * @fileoverview Восстановление данных объектов (ловушки, артефакты, сундуки, алтари, предметы).
 * 
 * @module save/restorers/objectRestorer
 */

import { state } from '../../core/config/index.js';

/**
 * Восстановление данных о ловушках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTrapsData(save) {
  state.traps = (save.traps && Array.isArray(save.traps)) ? save.traps : [];
}

/**
 * Восстановление данных об артефактах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreArtifactsData(save) {
  state.artifacts = (save.artifacts && Array.isArray(save.artifacts)) ? save.artifacts : [];
}

/**
 * Восстановление данных о сундуках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreChestsData(save) {
  state.chests = (save.chests && Array.isArray(save.chests))
    ? save.chests.map(c => ({
      x: c.x, y: c.y, type: c.type, opened: c.opened,
      countedForAchievement: c.countedForAchievement || false
    }))
    : [];

  if (state.isBossLevel) state.chests = [];
}

/**
 * Восстановление данных о святилищах (алтарях)
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreShrinesData(save) {
  state.shrines = (save.shrines && Array.isArray(save.shrines)) ? save.shrines : [];
}

/**
 * Восстановление данных о предметах на полу
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreLootData(save) {
  state.lootItems = (save.lootItems && Array.isArray(save.lootItems)) ? save.lootItems : [];
}