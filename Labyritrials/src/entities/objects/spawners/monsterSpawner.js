/**
 * @fileoverview Спавнер монстров и артефактов.
 * Размещает монстров на уровне с учётом уровня сложности и событий.
 * 
 * @module entities/objects/spawners/monsterSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { EMOJIS } from '../../../emojis.js';
import { getRandomFreeCells, markCellUsed, isPortalCell } from '../utils/spawnUtils.js';

/**
 * Создание монстров на уровне
 * 
 * @param {boolean} [isTreasureRoom=false] - Является ли комната сокровищницей
 * @param {Function} [isProtectedCell=()=>false] - Функция проверки защищённой клетки
 * @returns {void}
 */
export function spawnMonsters(isTreasureRoom = false, isProtectedCell = () => false) {
  const maxMonstersInTreasure = 5;
  let monstersSpawned = 0;

  state.monsters = [];

  // ===== МАСШТАБИРОВАНИЕ СЛОЖНОСТИ =====
  let scaling = 1 + (state.gameLevel - 1) * 0.15;

  // ===== ДОСТУПНЫЕ ТИПЫ МОНСТРОВ =====
  const types = [
    { type: 6, emoji: EMOJIS.monsters.bat, hp: 20, damage: 4, radius: 18, name: "Летучая мышь", speed: 2.5, vision: 280, minLevel: 1 },
    { type: 2, emoji: EMOJIS.monsters.pumpkin, hp: 60, damage: 12, radius: 24, name: "Тыква", speed: 2.0, vision: 320, minLevel: 1 },
    { type: 3, emoji: EMOJIS.monsters.skull, hp: 90, damage: 18, radius: 22, name: "Череп", speed: 2.4, vision: 350, minLevel: 3 },
    { type: 4, emoji: EMOJIS.monsters.demon, hp: 150, damage: 26, radius: 28, name: "Демон", speed: 1.8, vision: 400, minLevel: 6 },
    { type: 1, emoji: EMOJIS.monsters.ghost, hp: 30, damage: 6, radius: 22, name: "Призрак", speed: 1.5, vision: 260, minLevel: 8, isGhost: true },
    { type: 5, emoji: EMOJIS.monsters.scorpion, hp: 130, damage: 22, radius: 26, name: "Гигантский скорпион", speed: 1.6, vision: 350, minLevel: 11, poisonOnHit: true }
  ];

  let availableTypes = types.filter(t => state.gameLevel >= t.minLevel);
  if (availableTypes.length === 0) {
    availableTypes = [types[0]];
  }

  // ===== КОЛИЧЕСТВО МОНСТРОВ =====
  let monsterCount;
  if (isTreasureRoom) {
    monsterCount = maxMonstersInTreasure;
  } else {
    monsterCount = Math.max(20, Math.floor(20 + state.gameLevel * 0.5));
    monsterCount = Math.min(monsterCount, 45);
  }

  // ===== ПОИСК КЛЕТОК ДЛЯ СПАВНА =====
  const cells = getRandomFreeCells(monsterCount * 3, (x, y) => {
    if (isProtectedCell(x, y)) return false;
    if (isPortalCell(x, y)) return false;

    // Не спавним рядом со стартовой позицией
    if (Math.abs(x - 1) < 4 && Math.abs(y - 1) < 4) return false;

    // Не спавним рядом с выходом
    if (Math.abs(x - CONFIG.goal.x) < 2 && Math.abs(y - CONFIG.goal.y) < 2) return false;

    if (isTreasureRoom && monstersSpawned >= maxMonstersInTreasure) return false;

    return true;
  });

  // ===== СОЗДАНИЕ МОНСТРОВ =====
  for (const cell of cells) {
    if (monstersSpawned >= monsterCount) break;
    if (isTreasureRoom && monstersSpawned >= maxMonstersInTreasure) break;

    const base = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const isHor = Math.random() < 0.5;

    const x = cell.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = cell.y * CONFIG.cellSize + CONFIG.cellSize / 2;

    const newMonster = {
      x, y,
      startX: x,
      startY: y,
      hp: Math.floor(base.hp * scaling),
      maxHp: Math.floor(base.hp * scaling),
      damage: Math.floor(base.damage * scaling),
      emoji: base.emoji,
      radius: base.radius,
      name: base.name,
      speed: base.speed,
      vision: base.vision,
      dir: 1,
      isHorizontal: isHor,
      patrolRange: CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1),
      state: 'patrol',
      lastHit: 0,
      stunTimer: 0,
      poisonOnHit: base.poisonOnHit || false,
      shockTimer: 0,
      shockTick: 0,
      shockSlowAmount: 0,
      isGhost: base.isGhost || false,
      willNeverStop: false,
      ghostPhaseTimer: 0,
      originalOpacity: 1,
      isPhasing: false,
      justSpawned: true,
      justSpawnedTimer: 20
    };

    // ===== ПРИМЕНЕНИЕ ЭФФЕКТОВ СОБЫТИЙ =====
    if (state.eventIceWindActive) {
      newMonster.originalSpeedForIceWind = newMonster.speed;
      newMonster.speed = newMonster.speed * 1.2;
      newMonster.isIceWindBoosted = true;
    }

    if (state.eventMonsterRageActive) {
      newMonster.originalDamage = newMonster.damage;
      newMonster.originalSpeed = newMonster.speed;
      newMonster.damage = Math.floor(newMonster.damage * 1.3);
      newMonster.speed = newMonster.speed * 1.3;
      newMonster.isEventBoosted = true;
    }

    if (state.bloodMoonActive) {
      newMonster.hasVampirism = true;
    }

    state.monsters.push(newMonster);
    monstersSpawned++;

    markCellUsed(cell.x, cell.y);
  }
}

/**
 * Создание артефактов на уровне
 * 
 * @param {boolean} [isTreasureRoom=false] - Является ли комната сокровищницей
 * @param {Function} [isProtectedCell=()=>false] - Функция проверки защищённой клетки
 * @returns {void}
 */
export function spawnArtifacts(isTreasureRoom = false, isProtectedCell = () => false) {
  state.artifacts = [];

  const artifactCount = isTreasureRoom ? 2 : 3;

  const cells = getRandomFreeCells(artifactCount * 2, (x, y) => {
    if (isProtectedCell(x, y)) return false;
    if (isPortalCell(x, y)) return false;
    if (x === 1 && y === 1) return false;
    if (x === CONFIG.goal.x && y === CONFIG.goal.y) return false;

    // Проверка, нет ли уже артефакта на этой клетке
    const existing = state.artifacts.some(a =>
      Math.floor(a.x / CONFIG.cellSize) === x &&
      Math.floor(a.y / CONFIG.cellSize) === y
    );
    if (existing) return false;

    return true;
  });

  for (let i = 0; i < Math.min(artifactCount, cells.length); i++) {
    const cell = cells[i];
    state.artifacts.push({
      x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
      y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2
    });
    markCellUsed(cell.x, cell.y);
  }
}