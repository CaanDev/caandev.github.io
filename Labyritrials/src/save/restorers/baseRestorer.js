/**
 * @fileoverview Восстановление базовых данных игры.
 * 
 * @module save/restorers/baseRestorer
 */

import { state, CONFIG } from '../../core/config/index.js';
import { BIOMES_DATA as BIOMES } from '../../data/biomes.js';
import { setSeed } from '../../world/mazeGenerator.js';

/**
 * Восстановление базовых данных игры
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreBasicData(save) {
  state.gameLevel = save.gameLevel;
  state.isBossLevel = save.isBossLevel || false;
  state.bonusGiven = save.bonusGiven || false;
  state.hadMonsters = save.hadMonsters || false;
  state.bossMinionDropCounter = save.bossMinionDropCounter || 0;
  state.treasureRoomLastLevel = save.treasureRoomLastLevel || 0;
  state.shrineRoomLastLevel = save.shrineRoomLastLevel || 0;

  const savedBiome = save.currentBiome || 'cave';
  state.currentBiome = BIOMES[savedBiome] ? savedBiome : 'cave';
  
  if (save.seed !== undefined) {
    setSeed(save.seed, save.randomCounter || 0);
    state.seed = save.seed;
    state.randomCounter = save.randomCounter || 0;
  }
  
  if (save.shadowActive !== undefined) {
    state.shadowActive = save.shadowActive;
  }
  
  state.roomLabel = save.roomLabel || null;
  state.roomLabelColor = save.roomLabelColor || null;
}

/**
 * Восстановление флагов состояния
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreFlags(save) {
  state.screenShake = 0;
  state.isShopOpen = false;
  state.damageTexts = [];
  state.fireballs = [];
  state.justLoaded = true;

  // Восстанавливаем данные босса
  if (save.bossSpawned !== undefined) {
    state.bossSpawned = save.bossSpawned;
  }
  if (save.bossSpawnTriggered !== undefined) {
    state.bossSpawnTriggered = save.bossSpawnTriggered;
  }
  if (save.bossSpawnTimer !== undefined) {
    state.bossSpawnTimer = save.bossSpawnTimer;
  }

  if (save.pendingBossData) {
    state.pendingBossData = save.pendingBossData;
  } else if (state.isBossLevel) {
    const arenaSize = CONFIG.bossArenaSize || 25;
    state.pendingBossData = {
      arenaSize: arenaSize,
      scaling: 1 + (state.gameLevel - 1) * 0.15,
      bossLevel: Math.floor(state.gameLevel / 5) * 5
    };
  }

  setTimeout(() => {
    state.justLoaded = false;
  }, 1000);
}