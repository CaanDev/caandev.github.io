/**
 * @fileoverview Восстановление данных тайных комнат (сокровищница, комната с алтарём, комната-ловушка, безопасная комната).
 * 
 * @module save/restorers/secretRoomRestorer
 */

import { state, CONFIG, player } from '../../core/config/index.js';
import { Cell } from '../../world/cells/cell.js';
import {
  restoreOriginalMazeGrid,
  restorePortalFlagsOnGrid,
  restoreRevealedCells
} from './helpers.js';

/**
 * Восстановление данных о сокровищнице
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTreasureRoomData(save) {
  if (!save.treasureRoomData) {
    state.inTreasureRoom = false;
    state.secretPortal = null;
    state.exitPortal = null;
    state.returnPortal = null;
    return;
  }

  const tr = save.treasureRoomData;
  state.inTreasureRoom = tr.inTreasureRoom || false;
  state.secretPortal = tr.secretPortal || null;
  state.exitPortal = tr.exitPortal || null;
  state.returnPortal = tr.returnPortal || null;
  state.originalGoal = tr.originalGoal || null;
  state.originalShopPos = tr.originalShopPos || null;
  state.originalMapCols = tr.originalMapCols || CONFIG.cols;
  state.originalMapRows = tr.originalMapRows || CONFIG.rows;
  state.originalTorches = tr.originalTorches || [];

  state.originalArtifacts = tr.originalArtifacts || [];
  state.originalChests = tr.originalChests || [];
  state.originalLootItems = tr.originalLootItems || [];
  state.originalShrines = tr.originalShrines || [];

  if (tr.originalArtifacts && tr.originalArtifacts.length > 0 && typeof tr.originalArtifacts[0].gridX !== 'undefined') {
    state.originalArtifacts = tr.originalArtifacts;
  } else if (tr.originalArtifacts && tr.originalArtifacts.length > 0) {
    state.originalArtifacts = tr.originalArtifacts.map(a => ({
      gridX: Math.floor(a.x / CONFIG.cellSize),
      gridY: Math.floor(a.y / CONFIG.cellSize)
    }));
  } else {
    state.originalArtifacts = [];
  }

  if (tr.originalGrid) {
    restoreOriginalMazeGrid(tr.originalGrid, tr.originalMapCols, tr.originalMapRows);
  }

  state.originalMonsters = tr.originalMonsters || [];
  state.originalTraps = tr.originalTraps || [];
}

/**
 * Восстановление данных о секретных комнатах
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreSecretRoomsData(save) {
  if (!save.secretRoomsData) {
    state.inTreasureRoom = false;
    state.inShrineRoom = false;
    state.inTrapRoom = false;
    state.treasurePortal = null;
    state.treasureExitPortal = null;
    state.shrinePortal = null;
    state.shrineExitPortal = null;
    state.trapPortal = null;
    state.trapFakePortal = null;
    state.trapExitPortal = null;
    state.roomLabel = null;
    state.roomLabelColor = null;
    return;
  }

  const sr = save.secretRoomsData;

  state.treasurePortal = sr.treasurePortal || null;
  state.treasureExitPortal = sr.treasureExitPortal || null;
  state.inTreasureRoom = sr.inTreasureRoom || false;

  state.shrinePortal = sr.shrinePortal || null;
  state.shrineExitPortal = sr.shrineExitPortal || null;
  state.inShrineRoom = sr.inShrineRoom || false;

  state.trapPortal = sr.trapPortal || null;
  state.trapFakePortal = sr.trapFakePortal || null;
  state.trapExitPortal = sr.trapExitPortal || null;
  state.inTrapRoom = sr.inTrapRoom || false;

  // Восстанавливаем название комнаты
  if (state.inTreasureRoom) {
    state.roomLabel = 'treasure';
    state.roomLabelColor = '#f39c12';
  } else if (state.inShrineRoom) {
    state.roomLabel = 'shrine';
    state.roomLabelColor = '#9b59b6';
  } else if (state.inTrapRoom) {
    state.roomLabel = 'trap';
    state.roomLabelColor = '#e74c3c';
  } else {
    state.roomLabel = null;
    state.roomLabelColor = null;
  }

  if (state.inTreasureRoom && state.treasurePortal) {
    state.treasurePortal.active = false;
    state.treasurePortal.hidden = true;
  }

  if (state.inShrineRoom && state.shrinePortal) {
    state.shrinePortal.active = false;
    state.shrinePortal.hidden = true;
  }

  if (state.inTrapRoom && state.trapPortal) {
    state.trapPortal.active = false;
    state.trapPortal.hidden = true;
  }

  restorePortalFlagsOnGrid(save);
}

/**
 * Восстановление данных о комнате-ловушке
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreTrapRoomData(save) {
  if (!save.trapRoomData) {
    state.inTrapRoom = false;
    state.trapActivated = false;
    state.trapWave = 0;
    state.trapMonstersTotal = 0;
    state.trapMonstersKilled = 0;
    state.trapWaveActive = false;
    state.trapExitRevealed = false;
    state.trapPortal = null;
    state.trapFakePortal = null;
    state.trapExitPortal = null;
    state.trapMonsters = [];
    state.trapWaveLoaded = false;
    state.trapMonsterIds = new Set();
    return;
  }

  const tr = save.trapRoomData;

  state.inTrapRoom = tr.inTrapRoom || false;
  state.trapActivated = tr.trapActivated || false;
  state.trapWave = tr.trapWave || 0;
  state.trapMonstersTotal = tr.trapMonstersTotal || 0;
  state.trapMonstersKilled = tr.trapMonstersKilled || 0;
  state.trapWaveActive = tr.trapWaveActive || false;
  state.trapExitRevealed = tr.trapExitRevealed || false;
  state.trapPortal = tr.trapPortal || null;
  state.trapFakePortal = tr.trapFakePortal || null;
  state.trapExitPortal = tr.trapExitPortal || null;
  state.trapRoomLastLevel = tr.trapRoomLastLevel || 0;
  state.trapWaveLoaded = tr.trapWaveLoaded || false;
  state.trapMonsterIds = new Set(Array.isArray(tr.trapMonsterIds) ? tr.trapMonsterIds : []);

  if (tr.trapPortal) {
    state.trapPortal = {
      x: tr.trapPortal.x,
      y: tr.trapPortal.y,
      active: tr.trapPortal.active || false,
      hidden: tr.trapPortal.hidden !== undefined ? tr.trapPortal.hidden : true,
      targetMap: tr.trapPortal.targetMap || 'trap'
    };

    if (state.inTrapRoom) {
      state.trapPortal.active = false;
      state.trapPortal.hidden = true;
    }
  } else {
    state.trapPortal = null;
  }

  state.trapMonsters = (tr.trapMonsters || []).filter(m => m.hp > 0);

  if (state.inTrapRoom && state.trapActivated) {
    state.monsters = state.monsters.filter(m => {
      if (m.isTrapMonster) return false;
      if (state.trapMonsterIds.has(m.id || `${m.x},${m.y}`)) return false;
      return true;
    });

    for (const m of state.trapMonsters) {
      if (m.hp === undefined || m.hp <= 0) {
        m.hp = m.maxHp || 50;
      }
      if (m.maxHp === undefined || m.maxHp <= 0) {
        m.maxHp = m.hp || 50;
      }

      m.isTrapMonster = true;
      m.canDropItems = false;

      if (!m.id) {
        m.id = `${m.x},${m.y},${Date.now()}`;
      }
      state.trapMonsterIds.add(m.id);

      state.monsters.push(m);
    }

    const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);

    if (aliveMonsters.length > 0) {
      state.trapWaveActive = true;
    } else {
      state.trapWaveActive = false;

      if (state.trapWave >= 3) {
        if (!state.trapExitRevealed) {
          state.trapExitRevealed = true;
          import('../../world/rooms/trapRoom/index.js').then(module => {
            setTimeout(() => {
              module.showRealExitPortal();
            }, 300);
          });
        }
      } else {
        import('../../world/rooms/trapRoom/index.js').then(module => {
          setTimeout(() => {
            if (state.trapMonsters.filter(m => m.hp > 0).length === 0) {
              module.startNextWave();
            }
          }, 500);
        });
      }
    }
  }
}

/**
 * Восстановление данных о безопасной комнате
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreSafeRoomData(save) {
  if (!save) return;
  
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;
  const isInSafeRoom = save.inSafeRoom || false;
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom;
  
  state.inSafeRoom = isInSafeRoom;

  if (isInSafeRoom) {
    state.roomLabel = 'safe';
    state.roomLabelColor = '#3498db';
  } else if (!isInSecretRoom) {
    state.roomLabel = null;
    state.roomLabelColor = null;
  }
  
  if (save.originalHadMap !== undefined) {
    state.originalHadMap = save.originalHadMap;
  }
  
  if (save.originalRevealedCells && Array.isArray(save.originalRevealedCells)) {
    state.originalRevealedCells = save.originalRevealedCells;
  } else {
    state.originalRevealedCells = [];
  }
  
  if (save.originalSafePortal) {
    state.originalSafePortal = {
      x: save.originalSafePortal.x,
      y: save.originalSafePortal.y,
      active: true,
      hidden: false,
      targetMap: save.originalSafePortal.targetMap || 'safe'
    };
  }
  
  if (save.safePortal && !isInSafeRoom && !isBossLevel && !isInSecretRoom) {
    state.safePortal = {
      x: save.safePortal.x,
      y: save.safePortal.y,
      active: save.safePortal.active !== undefined ? save.safePortal.active : true,
      hidden: save.safePortal.hidden !== undefined ? save.safePortal.hidden : false,
      targetMap: save.safePortal.targetMap || 'safe'
    };
    
    if (state.grid[state.safePortal.y] && state.grid[state.safePortal.y][state.safePortal.x]) {
      state.grid[state.safePortal.y][state.safePortal.x].isPortal = true;
      state.grid[state.safePortal.y][state.safePortal.x].revealed = true;
      state.grid[state.safePortal.y][state.safePortal.x].isWall = false;
      state.grid[state.safePortal.y][state.safePortal.x].hasSafePortal = true;
    }
  } else {
    state.safePortal = null;
  }
  
  if (save.safeExitPortal && isInSafeRoom) {
    state.safeExitPortal = {
      x: save.safeExitPortal.x,
      y: save.safeExitPortal.y,
      active: save.safeExitPortal.active !== undefined ? save.safeExitPortal.active : true,
      spawnX: save.safeExitPortal.spawnX || save.safeExitPortal.x,
      spawnY: save.safeExitPortal.spawnY || save.safeExitPortal.y
    };
    
    if (state.grid[state.safeExitPortal.y] && state.grid[state.safeExitPortal.y][state.safeExitPortal.x]) {
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].isPortal = true;
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].revealed = true;
      state.grid[state.safeExitPortal.y][state.safeExitPortal.x].isWall = false;
    }
  } else if (save.safeExitPortal && !isInSafeRoom) {
    state.safeExitPortal = null;
  }

  if (save.safeChestOpened !== undefined) {
    state.safeChestOpened = save.safeChestOpened;
  }
  
  if (save.bookshelves && Array.isArray(save.bookshelves)) {
    state.bookshelves = save.bookshelves.map(shelf => ({
      x: shelf.x,
      y: shelf.y
    }));
    
    for (const shelf of state.bookshelves) {
      if (state.grid[shelf.y] && state.grid[shelf.y][shelf.x]) {
        state.grid[shelf.y][shelf.x].hasBookshelf = true;
        state.grid[shelf.y][shelf.x].isWall = false;
        state.grid[shelf.y][shelf.x].revealed = true;
      }
    }
  }
}