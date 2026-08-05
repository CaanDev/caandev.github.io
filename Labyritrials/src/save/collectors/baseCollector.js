/**
 * @fileoverview Сбор базовых данных игры.
 * 
 * @module save/collectors/baseCollector
 */

import { state, player } from '../../core/config/index.js';

/**
 * Сбор базовых данных игры
 * 
 * @returns {Object} - Базовые данные игры
 */
export function collectBasicData() {
  return {
    version: '1.3',
    gameLevel: state.gameLevel,
    isBossLevel: state.isBossLevel,
    currentBiome: state.currentBiome || 'cave',
    saveDate: Date.now(),
    seed: state.seed,
    staminaUpgradeCount: player.staminaUpgradeCount || 0,
    staminaUpgradeCost: player.staminaUpgradeCost || 150,
    randomCounter: state.randomCounter,
    bonusGiven: state.bonusGiven,
    hadMonsters: state.hadMonsters,
    bossMinionDropCounter: state.bossMinionDropCounter || 0,
    treasureRoomLastLevel: state.treasureRoomLastLevel || 0,
    shrineRoomLastLevel: state.shrineRoomLastLevel || 0,
    shadowActive: state.shadowActive !== undefined ? state.shadowActive : true,
    roomLabel: state.roomLabel || null,
    roomLabelColor: state.roomLabelColor || null,
  };
}