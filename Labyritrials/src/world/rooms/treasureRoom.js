/**
 * @fileoverview Комната-сокровищница.
 * Управляет генерацией портала в сокровищницу, созданием карты сокровищ,
 * спавном лута и возвратом в основной лабиринт.
 * 
 * @module world/rooms/treasureRoom
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { logger } from '../../utils/logger.js';
import { generateMaze, addProtectedCell, clearProtectedCells } from '../maze.js';
import { spawnTreasureRoomLoot } from '../../entities/objects/spawners/chestSpawner.js';
import { activateAllTorches } from '../../entities/objects/spawners/torchSpawner.js';
import { clearPlayerTrails } from '../../entities/objects/playerTrails.js';
import { clearAllRoomParticles } from '../../entities/objects/index.js';
import { clearFireflies, generatedPortals } from '../../entities/objects/firefly.js';
import { getRandomSprite } from '../../sprites/spriteLoader.js';

/**
 * Генерация портала в сокровищницу
 * 
 * @returns {void}
 */
export function generateTreasurePortal() {
  if (state.isBossLevel) return;
  if (state.treasurePortal && state.treasurePortal.active) return;
  if (state.gameLevel < 3) return;

  const levelsSinceLastTreasure = state.gameLevel - (state.treasureRoomLastLevel || 0);
  if (levelsSinceLastTreasure < 5 && state.treasureRoomLastLevel !== 0) return;
  
  if (Math.random() > CONFIG.treasurePortalChance) return;
  
  let attempts = 0;
  let maxAttempts = 500;
  let wallX, wallY;
  let found = false;
  
  while (!found && attempts < maxAttempts) {
    wallX = Math.floor(Math.random() * (CONFIG.cols - 2)) + 1;
    wallY = Math.floor(Math.random() * (CONFIG.rows - 2)) + 1;
    
    if (state.grid[wallY] && state.grid[wallY][wallX] && 
        state.grid[wallY][wallX].isWall && 
        state.grid[wallY][wallX].isBreakable &&
        (Math.abs(wallX - 1) > 5 || Math.abs(wallY - 1) > 5) &&
        (Math.abs(wallX - CONFIG.goal.x) > 5 || Math.abs(wallY - CONFIG.goal.y) > 5)) {
      
      let alreadyUsed = false;
      if (state.shrinePortal && state.shrinePortal.x === wallX && state.shrinePortal.y === wallY) alreadyUsed = true;
      
      if (!alreadyUsed) {
        let hasAdjacentFree = false;
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (let [dx, dy] of neighbors) {
          const nx = wallX + dx;
          const ny = wallY + dy;
          if (state.grid[ny] && state.grid[ny][nx] && !state.grid[ny][nx].isWall) {
            hasAdjacentFree = true;
            break;
          }
        }
        
        if (hasAdjacentFree) found = true;
      }
    }
    attempts++;
  }
  
  if (found) {
    state.treasurePortal = {
      x: wallX,
      y: wallY,
      active: false,
      hidden: true,
      targetMap: 'treasure'
    };
    
    state.treasureRoomLastLevel = state.gameLevel;
    state.grid[wallY][wallX].hasTreasurePortal = true;
  }
}

/**
 * Генерация карты сокровищницы
 * 
 * @returns {void}
 */
export function generateTreasureMap() {
  if (state.inTreasureRoom) return;
  
  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();
  clearFireflies();
  generatedPortals.clear();
  
  state.originalGrid = state.grid;
  state.originalGoal = { ...CONFIG.goal };
  state.originalShopPos = { ...CONFIG.shopPos };
  state.originalMonsters = [...state.monsters];
  state.originalMimics = state.mimics.map(m => ({ ...m }));
  state.originalHadMonsters = state.hadMonsters;
  state.originalTraps = [...state.traps];
  state.originalBonusGiven = state.bonusGiven;

  // Сохранение раскрытые клетки (для мини-карты)
  state.originalRevealedCells = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].revealed) state.originalRevealedCells.push({ x, y });
    }
  }

  state.originalRunes = [...state.runes];
  state.originalFireflies = state.fireflies ? [...state.fireflies] : [];
  
  state.originalArtifacts = state.artifacts.map(a => ({
    gridX: Math.floor(a.x / CONFIG.cellSize),
    gridY: Math.floor(a.y / CONFIG.cellSize),
    x: a.x,
    y: a.y
  }));
  
  state.originalChests = state.chests.map(c => {
    const chest = {
      gridX: Math.floor(c.x / CONFIG.cellSize),
      gridY: Math.floor(c.y / CONFIG.cellSize),
      type: c.type,
      opened: c.opened,
      countedForAchievement: c.countedForAchievement || false
    };
    
    // Сохранение информации о спрайтах для золота
    if (c.type === 'gold') {
      chest.goldSpriteName = c.goldSpriteName;
      chest.goldBiome = c.goldBiome || 'cave';
    }
    
    // Сохранение информации о спрайтах для артефактов
    if (c.type === 'artifact') {
      chest.artifactSpriteName = c.artifactSpriteName;
      chest.artifactBiome = c.artifactBiome || 'cave';
    }
    
    // Сохранение информации о спрайтах для зелий
    if (c.type === 'potion_chest') {
      chest.potionSpriteName = c.potionSpriteName;
      chest.potionBiome = c.potionBiome || 'cave';
    }
    
    return chest;
  });
  
  state.originalLootItems = state.lootItems.map(l => {
    const item = {
      gridX: Math.floor(l.x / CONFIG.cellSize),
      gridY: Math.floor(l.y / CONFIG.cellSize),
      type: l.type,
      value: l.value,
      x: l.x,
      y: l.y
    };
    
    // Сохранение информации о спрайтах для золота
    if (l.type === 'gold') {
      item.goldSpriteName = l.goldSpriteName;
      item.goldBiome = l.goldBiome || 'cave';
    }
    
    // Сохранение информации о спрайтах для зелий
    if (l.type === 'potion') {
      item.potionSpriteName = l.potionSpriteName;
      item.potionBiome = l.potionBiome || 'cave';
    }
    
    return item;
  });
  
  state.originalShrines = [...state.shrines];
  state.originalTorches = [...state.torches];
  state.originalMapCols = CONFIG.cols;
  state.originalMapRows = CONFIG.rows;

  state.gameStats.secretRoomsGenerated++;
  
  state.originalTreasurePortal = state.treasurePortal ? { ...state.treasurePortal } : null;
  state.originalShrinePortal = state.shrinePortal ? { ...state.shrinePortal } : null;
  state.originalTrapPortal = state.trapPortal ? { ...state.trapPortal } : null;
  state.originalSafePortal = state.safePortal ? { ...state.safePortal } : null;

  if (state.treasurePortal) {
    state.treasurePortal.active = false;
    state.treasurePortal.hidden = true;
  }
  
  state.returnPortal = {
    x: player.x,
    y: player.y,
    px: player.px,
    py: player.py
  };
  
  CONFIG.cols = CONFIG.treasureMapSize;
  CONFIG.rows = CONFIG.treasureMapSize;
  CONFIG.goal = { x: -100, y: -100 };
  CONFIG.shopPos = { x: -100, y: -100 };

  state.roomLabel = 'treasure';
  state.roomLabelColor = '#f39c12';
  
  state.monsters = [];
  state.mimics = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.lootItems = [];
  state.damageTexts = [];
  state.inTreasureRoom = true;
  
  generateMaze(true);
  addProtectedCell(1, 1);
  
  player.x = 1;
  player.y = 1;
  player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  
  activateAllTorches();
  spawnTreasureRoomLoot();
  createTreasureExitPortal();
}

/**
 * Создание портала выхода из сокровищницы
 * 
 * @returns {void}
 * @private
 */
function createTreasureExitPortal() {
  if (!state.inTreasureRoom) return;
  
  let exitX, exitY;
  let found = false;
  
  for (let y = CONFIG.rows - 2; y > 0 && !found; y--) {
    for (let x = CONFIG.cols - 2; x > 0 && !found; x--) {
      if (x === 1 && y === 1) continue;
      
      if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
        exitX = x;
        exitY = y;
        found = true;
      }
    }
  }
  
  if (!found) {
    for (let y = 1; y < CONFIG.rows - 1 && !found; y++) {
      for (let x = 1; x < CONFIG.cols - 1 && !found; x++) {
        if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
          exitX = x;
          exitY = y;
          found = true;
        }
      }
    }
  }
  
  if (found) {
    state.grid[exitY][exitX].isPortal = true;
    state.grid[exitY][exitX].revealed = true;
    
    state.treasureExitPortal = {
      x: exitX,
      y: exitY,
      spawnX: exitX,
      spawnY: exitY,
      active: true
    };
    
    addProtectedCell(exitX, exitY);
  }
}

/**
 * Возврат из сокровищницы в основной лабиринт
 * 
 * Восстанавливает сохранённое состояние игры, очищает
 * временные объекты и возвращает игрока на исходную позицию.
 * 
 * @returns {void}
 */
export function returnFromTreasureRoom() {
  if (!state.inTreasureRoom) return;

  // Очистка кэша трещин при выходе
  import('../../systems/rendering/maze/walls/index.js').then(module => {
    if (module.clearTreasureCrackCache) module.clearTreasureCrackCache();
  });
  
  clearProtectedCells();
  clearPlayerTrails();
  clearAllRoomParticles();
  
  if (!state.originalGrid) {
    logger.error('❌ [TREASURE] originalGrid не существует!');
    state.inTreasureRoom = false;
    return;
  }
  
  const portalX = state.treasurePortal?.x;
  const portalY = state.treasurePortal?.y;
  
  if (state.treasurePortal) {
    state.treasurePortal.active = false;
    state.treasurePortal.hidden = true;
  }
  
  state.grid = state.originalGrid;
  CONFIG.cols = state.originalMapCols;
  CONFIG.rows = state.originalMapRows;
  CONFIG.goal = state.originalGoal;
  CONFIG.shopPos = state.originalShopPos;
  state.monsters = state.originalMonsters;
  state.traps = state.originalTraps;

  state.roomLabel = null;
  state.roomLabelColor = null;

  // Восстановление мимиков
  if (state.originalMimics) {
    state.mimics = state.originalMimics.map(m => ({ ...m }));
    state.originalMimics = [];
  }

  // Восстановление портала в безопасную комнату
  if (state.originalSafePortal) {
    state.safePortal = {
      x: state.originalSafePortal.x,
      y: state.originalSafePortal.y,
      active: true,
      hidden: false,
      targetMap: state.originalSafePortal.targetMap || 'safe'
    };
    
    const px = state.safePortal.x;
    const py = state.safePortal.y;
    if (state.grid[py] && state.grid[py][px]) {
      state.grid[py][px].isPortal = true;
      state.grid[py][px].revealed = true;
      state.grid[py][px].isWall = false;
      state.grid[py][px].hasSafePortal = true;
    }
  }
  
  // Восстановление артефактов
  if (state.originalArtifacts && state.originalArtifacts.length > 0) {
    if (state.originalArtifacts[0].gridX !== undefined) {
      state.artifacts = state.originalArtifacts.map(a => ({
        x: a.x !== undefined ? a.x : a.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: a.y !== undefined ? a.y : a.gridY * CONFIG.cellSize + CONFIG.cellSize / 2
      }));
    } else {
      state.artifacts = state.originalArtifacts;
    }
  } else {
    state.artifacts = [];
  }
  
  // Восстановление сундуков
  if (state.originalChests && state.originalChests.length > 0) {
    if (state.originalChests[0].gridX !== undefined) {
      state.chests = state.originalChests.map(c => {
        const chest = {
          x: c.x !== undefined ? c.x : c.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
          y: c.y !== undefined ? c.y : c.gridY * CONFIG.cellSize + CONFIG.cellSize / 2,
          type: c.type,
          opened: c.opened,
          countedForAchievement: c.countedForAchievement || false
        };
        
        // Восстановление спрайтов для золота
        if (c.type === 'gold') {
          chest.goldSpriteName = c.goldSpriteName || getRandomSprite('gold', c.goldBiome || 'cave') || 'goldCave1';
          chest.goldBiome = c.goldBiome || 'cave';
        }
        
        // Восстановление спрайтов для артефактов
        if (c.type === 'artifact') {
          chest.artifactSpriteName = c.artifactSpriteName || getRandomSprite('artifact', c.artifactBiome || 'cave') || 'artifactCave1';
          chest.artifactBiome = c.artifactBiome || 'cave';
        }
        
        // Восстановление спрайтов для зелий
        if (c.type === 'potion_chest') {
          chest.potionSpriteName = c.potionSpriteName || getRandomSprite('potion', c.potionBiome || 'cave') || 'potionCave1';
          chest.potionBiome = c.potionBiome || 'cave';
        }
        
        return chest;
      });
    } else {
      state.chests = state.originalChests;
    }
  } else {
    state.chests = [];
  }
  
  // Восстановление предметов на полу
  if (state.originalLootItems && state.originalLootItems.length > 0) {
    if (state.originalLootItems[0].gridX !== undefined) {
      state.lootItems = state.originalLootItems.map(l => {
        const item = {
          x: l.x !== undefined ? l.x : l.gridX * CONFIG.cellSize + CONFIG.cellSize / 2,
          y: l.y !== undefined ? l.y : l.gridY * CONFIG.cellSize + CONFIG.cellSize / 2,
          type: l.type,
          value: l.value
        };
        
        // Восстановление спрайтов для золота
        if (l.type === 'gold') {
          item.goldSpriteName = l.goldSpriteName || getRandomSprite('gold', l.goldBiome || 'cave') || 'goldCave1';
          item.goldBiome = l.goldBiome || 'cave';
        }
        
        // Восстановление спрайтов для зелий
        if (l.type === 'potion') {
          item.potionSpriteName = l.potionSpriteName || getRandomSprite('potion', l.potionBiome || 'cave') || 'potionCave1';
          item.potionBiome = l.potionBiome || 'cave';
        }
        
        return item;
      });
    } else {
      state.lootItems = state.originalLootItems;
    }
  } else {
    state.lootItems = [];
  }
  
  state.shrines = state.originalShrines || [];
  state.torches = state.originalTorches || [];
  
  // Восстановление порталов
  if (state.originalTreasurePortal) {
    state.treasurePortal = state.originalTreasurePortal;
    if (state.treasurePortal) {
      state.treasurePortal.active = false;
      state.treasurePortal.hidden = true;
    }
  }
  if (state.originalShrinePortal) state.shrinePortal = state.originalShrinePortal;
  if (state.originalTrapPortal) state.trapPortal = state.originalTrapPortal;
  if (state.originalSafePortal) state.safePortal = state.originalSafePortal;

  // Восстановление рун
  if (state.originalRunes) state.runes = state.originalRunes;
  // Восстановление светлячков
  if (state.originalFireflies) state.fireflies = state.originalFireflies;
  
  // Восстановление состояния карты
  // Сначала закрываются все клетки
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) state.grid[y][x].revealed = false;
    }
  }
  
  // Открываются только те клетки, что были открыты до входа
  if (state.originalRevealedCells) {
    for (const cell of state.originalRevealedCells) {
      if (state.grid[cell.y] && state.grid[cell.y][cell.x]) state.grid[cell.y][cell.x].revealed = true;
    }
  }
  
  // Восстановление позиции игрока
  if (state.returnPortal) {
    let targetX = state.returnPortal.x;
    let targetY = state.returnPortal.y;
    
    if (portalX !== undefined && portalY !== undefined &&
        targetX === portalX && targetY === portalY) {
      const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];
      let foundNewPos = false;
      for (const dir of directions) {
        const newX = targetX + dir.dx;
        const newY = targetY + dir.dy;
        if (state.grid[newY] && state.grid[newY][newX] && 
            !state.grid[newY][newX].isWall) {
          targetX = newX;
          targetY = newY;
          foundNewPos = true;
          break;
        }
      }
      if (!foundNewPos) {
        targetX = 1;
        targetY = 1;
      }
    }
    
    if (state.grid[targetY] && state.grid[targetY][targetX] && 
        !state.grid[targetY][targetX].isWall) {
      player.x = targetX;
      player.y = targetY;
      player.px = targetX * CONFIG.cellSize + CONFIG.cellSize / 2;
      player.py = targetY * CONFIG.cellSize + CONFIG.cellSize / 2;
    } else {
      player.x = 1;
      player.y = 1;
      player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
      player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
    }
  }
  
  state.inTreasureRoom = false;
  state.returnPortal = null;
  state.treasureExitPortal = null;
  state.bonusGiven = false;
  state.hadMonsters = state.originalHadMonsters || false;

  if (state.originalHadMonsters && state.monsters.length === 0) state.bonusGiven = false;

  if (state.originalBonusGiven !== undefined) {
    state.bonusGiven = state.originalBonusGiven;
    state.originalBonusGiven = undefined;
  }

  state.originalGrid = null;
  state.originalMonsters = [];
  state.originalTraps = [];
  state.originalArtifacts = [];
  state.originalChests = [];
  state.originalShrines = [];
  state.originalTorches = [];
  state.originalTreasurePortal = null;
  state.originalShrinePortal = null;
  state.originalTrapPortal = null;
  state.originalSafePortal = null;
  state.originalRunes = null;
  state.originalFireflies = null;
  state.originalRevealedCells = [];
}