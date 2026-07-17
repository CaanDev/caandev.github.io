/**
 * @fileoverview Сбор данных тайных комнат (сокровищница, комната с алтарём, комната-ловушка, безопасная комната).
 * 
 * @module save/collectors/secretRoomCollector
 */

import { state, CONFIG, player } from '../../core/config/index.js';
import {
  saveOriginalGrid,
  collectMonstersDataFrom,
  collectTrapsDataFrom,
  collectShrinesDataFrom,
  collectTorchesDataFrom
} from './helpers.js';

/**
 * Сбор данных о сокровищнице
 * 
 * @returns {Object} - Данные о сокровищнице
 */
export function collectTreasureRoomData() {
  return {
    inTreasureRoom: state.inTreasureRoom,
    secretPortal: state.secretPortal ? { ...state.secretPortal } : null,
    exitPortal: state.exitPortal ? { ...state.exitPortal } : null,
    returnPortal: state.returnPortal ? { ...state.returnPortal } : null,
    originalGrid: state.originalGrid ? saveOriginalGrid() : null,
    originalGoal: state.originalGoal,
    originalShopPos: state.originalShopPos,
    originalMapCols: state.originalMapCols,
    originalMapRows: state.originalMapRows,
    originalMonsters: state.originalMonsters ? collectMonstersDataFrom(state.originalMonsters) : [],
    originalTraps: state.originalTraps ? collectTrapsDataFrom(state.originalTraps) : [],
    originalHadMonsters: state.originalHadMonsters || false,
    originalArtifacts: state.originalArtifacts ? state.originalArtifacts : [],
    originalChests: state.originalChests ? state.originalChests : [],
    originalLootItems: state.originalLootItems ? state.originalLootItems : [],
    originalShrines: state.originalShrines ? collectShrinesDataFrom(state.originalShrines) : [],
    originalTorches: state.originalTorches ? collectTorchesDataFrom(state.originalTorches) : []
  };
}

/**
 * Сбор данных о секретных комнатах
 * 
 * @returns {Object} - Данные о секретных комнатах
 */
export function collectSecretRoomsData() {
  return {
    treasurePortal: state.treasurePortal ? {
      x: state.treasurePortal.x,
      y: state.treasurePortal.y,
      active: state.treasurePortal.active,
      hidden: state.treasurePortal.hidden,
      targetMap: state.treasurePortal.targetMap
    } : null,
    treasureExitPortal: state.treasureExitPortal ? {
      x: state.treasureExitPortal.x,
      y: state.treasureExitPortal.y,
      spawnX: state.treasureExitPortal.spawnX,
      spawnY: state.treasureExitPortal.spawnY,
      active: state.treasureExitPortal.active
    } : null,
    inTreasureRoom: state.inTreasureRoom || false,
    shrinePortal: state.shrinePortal ? {
      x: state.shrinePortal.x,
      y: state.shrinePortal.y,
      active: state.shrinePortal.active,
      hidden: state.shrinePortal.hidden,
      targetMap: state.shrinePortal.targetMap
    } : null,
    shrineExitPortal: state.shrineExitPortal ? {
      x: state.shrineExitPortal.x,
      y: state.shrineExitPortal.y,
      spawnX: state.shrineExitPortal.spawnX,
      spawnY: state.shrineExitPortal.spawnY,
      active: state.shrineExitPortal.active
    } : null,
    inShrineRoom: state.inShrineRoom || false,
    trapPortal: state.trapPortal ? {
      x: state.trapPortal.x,
      y: state.trapPortal.y,
      active: state.trapPortal.active || false,
      hidden: state.trapPortal.hidden !== undefined ? state.trapPortal.hidden : true,
      targetMap: state.trapPortal.targetMap || 'trap'
    } : null,
    trapFakePortal: state.trapFakePortal ? {
      x: state.trapFakePortal.x,
      y: state.trapFakePortal.y,
      active: state.trapFakePortal.active || false,
      isFake: true
    } : null,
    trapExitPortal: state.trapExitPortal ? {
      x: state.trapExitPortal.x,
      y: state.trapExitPortal.y,
      spawnX: state.trapExitPortal.spawnX,
      spawnY: state.trapExitPortal.spawnY,
      active: state.trapExitPortal.active || false
    } : null,
    inTrapRoom: state.inTrapRoom || false,
    originalArtifacts: state.originalArtifacts ? state.originalArtifacts : [],
    originalChests: state.originalChests ? state.originalChests : [],
    originalLootItems: state.originalLootItems ? state.originalLootItems : [],
    originalShrines: state.originalShrines ? collectShrinesDataFrom(state.originalShrines) : [],
    returnPortal: state.returnPortal ? { ...state.returnPortal } : null,
    originalMapCols: state.originalMapCols,
    originalMapRows: state.originalMapRows,
    originalGoal: state.originalGoal,
    originalShopPos: state.originalShopPos,
    bonusGiven: state.bonusGiven,
    hadMonsters: state.hadMonsters
  };
}

/**
 * Сбор данных о комнате-ловушке
 * 
 * @returns {Object} - Данные о комнате-ловушке
 */
export function collectTrapRoomData() {
  const aliveMonsters = (state.trapMonsters || []).filter(m => m.hp > 0);
  const monsterIds = [];
  for (const m of aliveMonsters) {
    if (!m.id) {
      m.id = `${m.x},${m.y},${Date.now()}`;
    }
    monsterIds.push(m.id);
  }
  
  return {
    inTrapRoom: state.inTrapRoom || false,
    trapActivated: state.trapActivated || false,
    trapWave: state.trapWave || 0,
    trapMonstersTotal: state.trapMonstersTotal || 0,
    trapMonstersKilled: state.trapMonstersKilled || 0,
    trapWaveActive: state.trapWaveActive || false,
    trapExitRevealed: state.trapExitRevealed || false,
    trapPortal: state.trapPortal ? {
      x: state.trapPortal.x,
      y: state.trapPortal.y,
      active: state.trapPortal.active || false,
      hidden: state.trapPortal.hidden !== undefined ? state.trapPortal.hidden : true,
      targetMap: state.trapPortal.targetMap || 'trap'
    } : null,
    trapFakePortal: state.trapFakePortal && state.trapFakePortal.active ? {
      x: state.trapFakePortal.x,
      y: state.trapFakePortal.y,
      active: state.trapFakePortal.active || false,
      isFake: true
    } : null,
    trapExitPortal: state.trapExitPortal ? {
      x: state.trapExitPortal.x,
      y: state.trapExitPortal.y,
      spawnX: state.trapExitPortal.spawnX,
      spawnY: state.trapExitPortal.spawnY,
      active: state.trapExitPortal.active || false
    } : null,
    trapRoomLastLevel: state.trapRoomLastLevel || 0,
    trapWaveLoaded: state.trapWaveLoaded || false,
    trapMonsterIds: monsterIds,
    trapMonsters: aliveMonsters.map(m => ({
      id: m.id || `${m.x},${m.y},${Date.now()}`,
      x: m.x, y: m.y,
      startX: m.startX, startY: m.startY,
      hp: m.hp,
      maxHp: m.maxHp,
      damage: m.damage,
      emoji: m.emoji,
      radius: m.radius,
      name: m.name,
      speed: m.speed,
      vision: m.vision,
      dir: m.dir,
      isHorizontal: m.isHorizontal,
      patrolRange: m.patrolRange,
      state: m.state,
      lastHit: m.lastHit || 0,
      stunTimer: m.stunTimer || 0,
      poisonOnHit: m.poisonOnHit || false,
      isGhost: m.isGhost || false,
      isTrapMonster: true,
      canDropItems: false
    }))
  };
}

/**
 * Сбор данных о безопасной комнате
 * 
 * @returns {Object} - Данные о безопасной комнате
 */
export function collectSafeRoomData() {
  const bookshelves = [];
  if (state.bookshelves) {
    for (const shelf of state.bookshelves) {
      bookshelves.push({ x: shelf.x, y: shelf.y });
    }
  }
  
  return {
    safePortal: state.safePortal ? { ...state.safePortal } : null,
    safeExitPortal: state.safeExitPortal ? { ...state.safeExitPortal } : null,
    inSafeRoom: state.inSafeRoom || false,
    originalSafePortal: state.originalSafePortal ? { ...state.originalSafePortal } : null,
    originalHadMap: state.originalHadMap !== undefined ? state.originalHadMap : undefined,
    originalRevealedCells: state.originalRevealedCells ? [...state.originalRevealedCells] : [],
    safeChestOpened: state.safeChestOpened || false,
    bookshelves: bookshelves
  };
}