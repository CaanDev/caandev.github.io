/**
 * @fileoverview Спавнер монстров и артефактов.
 * Размещает монстров на уровне с учётом уровня сложности и событий.
 * 
 * @module entities/objects/spawners/monsterSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { EMOJIS } from '../../../emojis.js';
import { getRandomArtifactImage } from '../../../images/itemImages.js';
import { ITEM_IMAGES } from '../../../images/itemImages.js';
import { getRandomFreeCells, markCellUsed, isPortalCell } from '../utils/spawnUtils.js';
import { getMonstersByLevel, getMonsterData } from '../../../data/index.js';

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
  
  // ===== ПОЛУЧЕНИЕ ТИПОВ МОНСТРОВ ПО БИОМУ И УРОВНЮ =====
  let availableMonsters = getMonstersByLevel(state.gameLevel, state.currentBiome);

  if (availableMonsters.length === 0) {
    const fallback = getMonsterData('pumpkin');
    if (fallback) {
      availableMonsters = [fallback];
    } else {
      availableMonsters = [{
        id: 'pumpkin',
        name: 'Тыква',
        emoji: EMOJIS.monsters.pumpkin,
        hp: 60,
        damage: 12,
        radius: 24,
        speed: 2.0,
        vision: 320,
        minLevel: 1,
        biomes: ['cave', 'ice'],
        special: {},
        dropChance: 0.35,
      }];
    }
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

    if (Math.abs(x - 1) < 4 && Math.abs(y - 1) < 4) return false;
    if (Math.abs(x - CONFIG.goal.x) < 2 && Math.abs(y - CONFIG.goal.y) < 2) return false;

    if (isTreasureRoom && monstersSpawned >= maxMonstersInTreasure) return false;

    return true;
  });

  // ===== СОЗДАНИЕ МОНСТРОВ =====
  for (const cell of cells) {
    if (monstersSpawned >= monsterCount) break;
    if (isTreasureRoom && monstersSpawned >= maxMonstersInTreasure) break;

    const base = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
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
      baseRadius: base.radius,
      name: base.name,
      speed: base.speed,
      dir: 1,
      isHorizontal: isHor,
      patrolRange: CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1),
      state: 'patrol',
      lastHit: 0,
      stunTimer: 0,
      poisonOnHit: base.special?.poisonOnHit || false,
      shockTimer: 0,
      shockTick: 0,
      shockSlowAmount: 0,
      isGhost: base.special?.isGhost || false,
      willNeverStop: false,
      ghostPhaseTimer: 0,
      originalOpacity: 1,
      isPhasing: false,
      justSpawned: true,
      justSpawnedTimer: 20,
      canDropItems: true,
      
      // ===== ВИДИМОСТЬ =====
      vision: base.vision,
      baseVision: base.vision,
      visionBoosted: false,
      visionBoostTimer: 0,
      visionBoostDuration: 300,
      visionBoostMultiplier: 1.8,

      // ===== СЛУХ =====
      hearingRadius: 600, // базовый радиус слуха
      
      // ===== ПАМЯТЬ =====
      lastKnownX: null,
      lastKnownY: null,
      lastKnownDirection: { x: 0, y: 0 },
      predictedPath: [],
      predictionTimer: 0,
      predictionLength: 5,
      predictionStep: 0,
      memoryTimer: 0,
      memoryDuration: 360,
      isSearching: false,
      searchRadius: 80,
      searchTimer: 0,

      // ===== УЛУЧШЕННЫЙ ПАТРУЛЬ =====
      // Маршрут патрулирования
      patrolPath: [],              // Массив точек {x, y}
      patrolIndex: 0,              // Текущая точка маршрута
      patrolTimer: 0,              // Таймер до следующего действия
      patrolPhase: 'moving',       // 'moving' | 'idle' | 'investigating'
      idleTimer: 0,                // Время остановки (кадры)
      idleDuration: 0,             // Общая длительность остановки
      investigationTarget: null,   // Точка для осмотра {x, y}
      investigationTimer: 0,       // Время осмотра
      lookDirection: 0,            // Направление взгляда (угол)
      lookTimer: 0,                // Таймер смены взгляда

      // Интересы
      interests: [],               // Точки, которые интересны монстру
      checkedInterests: [],        // Уже проверенные точки
      curiosity: 30 + Math.random() * 40, // Уровень любопытства (30-70)

      // Восприятие
      perception: {
        interestRadius: 350,       // Радиус обнаружения интересных объектов
        smellRadius: 150,          // Радиус "обоняния"
      },
      
      // Инициализация _lastX/_lastY для отслеживания застревания
      _lastX: x,
      _lastY: y,
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
      newMonster.originalVision = newMonster.vision;
      newMonster.originalBaseVision = newMonster.baseVision;
      newMonster.originalHearingRadius = newMonster.hearingRadius;
      
      newMonster.damage = Math.floor(newMonster.damage * 1.3);
      newMonster.speed = newMonster.speed * 1.3;
      newMonster.vision = Math.floor(newMonster.vision * 1.4);
      newMonster.baseVision = Math.floor(newMonster.baseVision * 1.4);
      newMonster.hearingRadius = Math.floor(newMonster.hearingRadius * 1.4);
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

  let artifactBiome;
  if (isTreasureRoom || state.inTreasureRoom) {
    artifactBiome = 'treasure';
  } else {
    artifactBiome = state.currentBiome || 'cave';
  }

  const artifactCount = isTreasureRoom ? 2 : 3;

  const cells = getRandomFreeCells(artifactCount * 2, (x, y) => {
    if (isProtectedCell(x, y)) return false;
    if (isPortalCell(x, y)) return false;
    if (x === 1 && y === 1) return false;
    if (x === CONFIG.goal.x && y === CONFIG.goal.y) return false;

    const existing = state.artifacts.some(a =>
      Math.floor(a.x / CONFIG.cellSize) === x &&
      Math.floor(a.y / CONFIG.cellSize) === y
    );
    if (existing) return false;

    return true;
  });

  for (let i = 0; i < Math.min(artifactCount, cells.length); i++) {
    const cell = cells[i];
    const imagePath = getRandomArtifactImage(artifactBiome);
    const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
    
    state.artifacts.push({
      x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2,
      y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2,
      imageKey: cacheKey,
      imagePath: imagePath,
      biome: artifactBiome,
    });
    
    markCellUsed(cell.x, cell.y);
  }
}