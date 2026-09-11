/**
 * @fileoverview Спавнер сундуков.
 * Размещает сундуки в лабиринте, определяет их тип и создаёт мимиков.
 * 
 * @module entities/objects/spawners/chestSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { createFlies } from '../fly.js';
import { getRandomFreeCells, markCellUsed, isPortalCell } from '../utils/spawnUtils.js';
import { getRandomSprite } from '../../../sprites/spriteLoader.js';

/**
 * Создание сундуков на уровне
 * 
 * @param {boolean} [isTreasureRoom=false] - Является ли комната сокровищницей
 * @param {Function} [isProtectedCell=()=>false] - Функция проверки защищённой клетки
 * @returns {void}
 */
export function spawnChests(isTreasureRoom = false, isProtectedCell = () => false) {
  if (state.isBossLevel) {
    state.chests = [];
    state.mimics = [];
    return;
  }

  state.chests = [];
  state.mimics = [];

  // Поиск тупиков (dead ends)
  let deadEnds = [];
  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      if (isProtectedCell(x, y)) continue;
      if (isPortalCell(x, y)) continue;

      if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
        if (x === 1 && y === 1) continue;
        if (x === CONFIG.goal.x && y === CONFIG.goal.y) continue;
        if (x === CONFIG.shopPos.x && y === CONFIG.shopPos.y) continue;

        let wallCount = 0;
        let breakableWalls = 0;

        if (state.grid[y-1][x].isWall) wallCount++;
        if (state.grid[y+1][x].isWall) wallCount++;
        if (state.grid[y][x-1].isWall) wallCount++;
        if (state.grid[y][x+1].isWall) wallCount++;

        if (state.grid[y-1][x].isBreakable) breakableWalls++;
        if (state.grid[y+1][x].isBreakable) breakableWalls++;
        if (state.grid[y][x-1].isBreakable) breakableWalls++;
        if (state.grid[y][x+1].isBreakable) breakableWalls++;

        if (wallCount === 3) deadEnds.push({ x, y, breakableWalls });
      }
    }
  }

  // Перемешивание тупиков
  for (let i = deadEnds.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deadEnds[i], deadEnds[j]] = [deadEnds[j], deadEnds[i]];
  }

  // Выбор количества сундуков
  let targetCount = Math.min(Math.floor(Math.random() * 5) + 1, deadEnds.length);

  for (let i = 0; i < targetCount; i++) {
    let pos = deadEnds[i];

    let rand = Math.random();
    let chestType;
    const canBeMimic = pos.breakableWalls === 0;

    if (canBeMimic && rand <= 0.60 && rand > 0.35) chestType = 'mimic';
    else if (rand <= 0.25) chestType = 'gold';
    else if (rand <= 0.35) chestType = 'artifact';
    else if (rand <= 0.60) chestType = 'mimic';
    else chestType = 'empty';

    // Создание мимика
    if (chestType === 'mimic') {
      const biome = state.currentBiome || 'cave';
      
      state.mimics.push({
        x: pos.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: pos.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        gridX: pos.x,
        gridY: pos.y,
        type: 'mimic',
        opened: false,
        isDead: false,
        hp: 100,
        maxHp: 100,
        countedForAchievement: false,
        lastHitTime: 0,
        lastAttackTime: 0,
        hpBarVisible: false,
        biome: biome,
      });
      
      // Создаём мух над мимиком
      createFlies(
        pos.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        pos.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        biome
      );
      
      markCellUsed(pos.x, pos.y);
      continue;
    }

    // Создание сундука
    const chestData = {
      x: pos.x * CONFIG.cellSize + CONFIG.cellSize / 2,
      y: pos.y * CONFIG.cellSize + CONFIG.cellSize / 2,
      type: chestType,
      opened: false,
      countedForAchievement: false
    };

    // Если сундук с золотом — добавляем спрайт
    if (chestType === 'gold') {
      const goldBiome = isTreasureRoom ? 'treasure' : (state.currentBiome || 'cave');
      chestData.goldSpriteName = getRandomSprite('gold', goldBiome) || 'goldCave1';
      chestData.goldBiome = goldBiome;
    }

    // Если сундук с артефактом — добавляем спрайт
    if (chestType === 'artifact') {
      const artifactBiome = isTreasureRoom ? 'treasure' : (state.currentBiome || 'cave');
      chestData.artifactSpriteName = getRandomSprite('artifact', artifactBiome) || 'artifactCave1';
      chestData.artifactBiome = artifactBiome;
    }

    state.chests.push(chestData);
    markCellUsed(pos.x, pos.y);
  }
}

/**
 * Создание лута в сокровищнице
 * 
 * @returns {void}
 */
export function spawnTreasureRoomLoot() {
  // Золото
  for (let i = 0; i < 5; i++) {
    const cell = getRandomFreeCell((x, y) => {
      if (!state.grid[y] || !state.grid[y][x]) return false;
      if (isPortalCell(x, y)) return false;
      return !state.grid[y][x].isWall;
    });
    if (cell) {
      const goldBiome = 'treasure';
      const spriteName = getRandomSprite('gold', goldBiome) || 'goldTreasure1';
      
      state.lootItems.push({
        x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        type: 'gold',
        value: 50 + Math.random() * 100,
        goldSpriteName: spriteName,
        goldBiome: goldBiome,
      });
      markCellUsed(cell.x, cell.y);
    }
  }

  // Артефакты
  for (let i = 0; i < 2; i++) {
    const cell = getRandomFreeCell((x, y) => {
      if (!state.grid[y] || !state.grid[y][x]) return false;
      if (isPortalCell(x, y)) return false;
      return !state.grid[y][x].isWall;
    });
    if (cell) {
      const artifactBiome = 'treasure';
      const spriteName = getRandomSprite('artifact', artifactBiome) || 'artifactTreasure1';
      
      state.artifacts.push({
        x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        artifactSpriteName: spriteName,
        artifactBiome: artifactBiome,
      });
      markCellUsed(cell.x, cell.y);
    }
  }

  // Сундуки с золотом
  for (let i = 0; i < 2; i++) {
    const cell = getRandomFreeCell((x, y) => {
      if (!state.grid[y] || !state.grid[y][x]) return false;
      if (isPortalCell(x, y)) return false;
      return !state.grid[y][x].isWall;
    });
    if (cell) {
      const goldBiome = 'treasure';
      const spriteName = getRandomSprite('gold', goldBiome) || 'goldTreasure1';
      
      state.chests.push({
        x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        type: 'gold',
        opened: false,
        countedForAchievement: false,
        goldSpriteName: spriteName,
        goldBiome: goldBiome,
      });
      markCellUsed(cell.x, cell.y);
    }
  }

  // Зелья
  for (let i = 0; i < 3; i++) {
    const cell = getRandomFreeCell((x, y) => {
      if (!state.grid[y] || !state.grid[y][x]) return false;
      if (isPortalCell(x, y)) return false;
      return !state.grid[y][x].isWall;
    });
    if (cell) {
      const potionBiome = 'treasure';
      const spriteName = getRandomSprite('potion', potionBiome) || 'potionTreasure1';
      
      state.lootItems.push({
        x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        type: 'potion',
        value: 50,
        potionSpriteName: spriteName,
        potionBiome: potionBiome,
      });
      markCellUsed(cell.x, cell.y);
    }
  }
}