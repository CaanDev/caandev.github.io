/**
 * @fileoverview Сбор системных данных (адаптации, события, статистика, достижения, записки).
 * 
 * @module save/collectors/systemCollector
 */

import { state, player, CONFIG } from '../../core/config/index.js';
import { formatPlayTime } from '../timeFormatter.js';

/**
 * Сбор данных об адаптации монстров
 * 
 * @returns {Object} - Данные об адаптации
 */
export function collectAdaptationData() {
  return {
    monsterAdaptation: state.monsterAdaptation,
    totalAttacks: state.totalAttacks
  };
}

/**
 * Сбор данных о случайных событиях
 * 
 * @returns {Object} - Данные о событиях
 */
export function collectEventData() {
  return {
    currentEvent: state.currentEvent,
    bloodMoonActive: state.bloodMoonActive,
    eventDamageMultiplier: player.eventDamageMultiplier,
    eventGoldMultiplier: player.eventGoldMultiplier,
    eventSpeedBonus: player.eventSpeedBonus,
    eventSlowMultiplier: player.eventSlowMultiplier
  };
}

/**
 * Сбор данных о статистике игры
 * 
 * @returns {Object} - Данные о статистике
 */
export function collectGameStatsData() {
  return {
    maxHpAtEnd: state.gameStats.maxHpAtEnd || 0,
    hpRemaining: state.gameStats.hpRemaining || 0,
    goldCollected: state.gameStats.goldCollected || 0,
    goldSpent: state.gameStats.goldSpent || 0,
    artifactsCollected: state.gameStats.artifactsCollected || 0,
    artifactsTotalPossible: state.gameStats.artifactsTotalPossible || 0,
    monstersKilled: state.gameStats.monstersKilled || 0,
    bossesTotal: state.gameStats.bossesTotal || 0,
    weaponHits: {
      default: state.gameStats.weaponHits?.default || 0,
      stun: state.gameStats.weaponHits?.stun || 0,
      vampire: state.gameStats.weaponHits?.vampire || 0,
      fireball: state.gameStats.weaponHits?.fireball || 0
    },
    favoriteWeapon: state.gameStats.favoriteWeapon || 'default',
    secretRoomsVisited: state.gameStats.secretRoomsVisited || 0,
    secretRoomsGenerated: state.gameStats.secretRoomsGenerated || 0,
    trapsTriggered: {
      spike: state.gameStats.trapsTriggered?.spike || 0,
      ice: state.gameStats.trapsTriggered?.ice || 0,
      acid: state.gameStats.trapsTriggered?.acid || 0,
      lightning: state.gameStats.trapsTriggered?.lightning || 0
    },
    mimicBites: state.gameStats.mimicBites || 0,
    playTime: state.gameStats.playTime || 0,
    playTimeFormatted: formatPlayTime(state.gameStats.playTime || 0)
  };
}

/**
 * Сбор данных о достижениях
 * 
 * @returns {Object} - Данные о достижениях
 */
export function collectAchievementsData() {
  if (!state.achievements) {
    return {
      unlocked: [],
      progress: {}
    };
  }
  return {
    unlocked: state.achievements.unlocked || [],
    progress: state.achievements.progress || {}
  };
}

/**
 * Сбор данных о записках
 * 
 * @returns {Object} - Данные о записках
 */
export function collectNotesData() {
  if (!state.notes) {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  const positions = {};
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      const cell = state.grid[y]?.[x];
      if (cell && cell.hasNote && cell.noteId) {
        // Сохраняем позицию только если записка ещё не найдена
        if (!state.notes.found.includes(cell.noteId)) {
          positions[cell.noteId] = { x, y };
        }
      }
    }
  }

  return {
    found: state.notes.found || [],
    spawned: state.notes.spawned || {},
    positions: positions
  };
}