/**
 * @fileoverview Сбор данных объектов (ловушки, артефакты, сундуки, алтари, предметы).
 * 
 * @module save/collectors/objectCollector
 */

import { state } from '../../core/config/index.js';

/**
 * Сбор данных о ловушках
 * 
 * @returns {Object[]} - Массив данных о ловушках
 */
export function collectTrapsData() {
  return state.traps.map(t => ({
    x: t.x, y: t.y, damage: t.damage, type: t.type,
    triggered: t.triggered, resetTimer: t.resetTimer
  }));
}

/**
 * Сбор данных об артефактах
 * 
 * @returns {Object[]} - Массив данных об артефактах
 */
export function collectArtifactsData() {
  return state.artifacts.map(a => ({ x: a.x, y: a.y }));
}

/**
 * Сбор данных о сундуках
 * 
 * @returns {Object[]} - Массив данных о сундуках
 */
export function collectChestsData() {
  return state.chests.map(c => ({
    x: c.x, y: c.y, type: c.type, opened: c.opened,
    countedForAchievement: c.countedForAchievement || false
  }));
}

/**
 * Сбор данных о мимиках
 * 
 * @returns {Object[]} - Массив данных о мимиках
 */
export function collectMimicsData() {
  return state.mimics.map(m => ({
    x: m.x, y: m.y, gridX: m.gridX, gridY: m.gridY,
    type: m.type, opened: m.opened, isDead: m.isDead,
    hp: m.hp, maxHp: m.maxHp,
    countedForAchievement: m.countedForAchievement || false,
    lastHitTime: m.lastHitTime || 0,
    lastAttackTime: m.lastAttackTime || 0,
    hpBarVisible: m.hpBarVisible || false,
    biome: m.biome || 'cave'
  }));
}

/**
 * Сбор данных о святилищах (алтарях)
 * 
 * @returns {Object[]} - Массив данных о святилищах
 */
export function collectShrinesData() {
  return state.shrines.map(s => ({
    x: s.x, y: s.y, effect: s.effect, effectText: s.effectText, activated: s.activated
  }));
}

/**
 * Сбор данных о предметах на полу
 * 
 * @returns {Object[]} - Массив данных о предметах
 */
export function collectLootData() {
  return state.lootItems.map(l => ({
    x: l.x, y: l.y, type: l.type, value: l.value
  }));
}