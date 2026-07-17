/**
 * @fileoverview Восстановление системных данных (адаптации, события, статистика, достижения, записки).
 * 
 * @module save/restorers/systemRestorer
 */

import { state, player } from '../../core/config/index.js';
import { formatPlayTime } from '../timeFormatter.js';
import { loadNotesFromStorage } from '../notesStorage.js';
import { restoreNotesOnGrid } from './helpers.js';

/**
 * Восстановление данных об адаптации монстров
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreAdaptationData(save) {
  state.monsterAdaptation = save.monsterAdaptation || {
    fireImmunity: false,
    stunImmunity: false,
    healingBlock: false,
    healthBoost: false
  };

  state.totalAttacks = save.totalAttacks || {
    fireball: 0,
    stun: 0,
    vampirism: 0,
    magic: 0
  };
}

/**
 * Восстановление данных о событиях
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreEventData(save) {
  state.currentEvent = save.currentEvent || null;
  state.bloodMoonActive = save.bloodMoonActive || false;
  state.eventMessageShown = true;

  player.eventDamageMultiplier = save.eventDamageMultiplier || 1.0;
  player.eventGoldMultiplier = save.eventGoldMultiplier || 1.0;
  player.eventSpeedBonus = save.eventSpeedBonus || 0;
  player.eventSlowMultiplier = save.eventSlowMultiplier || 1.0;

  if (state.currentEvent === 'bloodMoon') {
    state.bloodMoonActive = true;
    player.eventGoldMultiplier = 2.0;
  }
}

/**
 * Восстановление статистики игры
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreGameStatsData(save) {
  if (save.gameStats) {
    const stats = save.gameStats;
    state.gameStats.maxHpAtEnd = stats.maxHpAtEnd || 0;
    state.gameStats.hpRemaining = stats.hpRemaining || 0;
    state.gameStats.goldCollected = stats.goldCollected || 0;
    state.gameStats.goldSpent = stats.goldSpent || 0;
    state.gameStats.artifactsCollected = stats.artifactsCollected || 0;
    state.gameStats.artifactsTotalPossible = stats.artifactsTotalPossible || 0;
    state.gameStats.monstersKilled = stats.monstersKilled || 0;
    state.gameStats.bossesTotal = stats.bossesTotal || 0;

    state.gameStats.weaponHits = {
      default: stats.weaponHits?.default || 0,
      stun: stats.weaponHits?.stun || 0,
      vampire: stats.weaponHits?.vampire || 0,
      fireball: stats.weaponHits?.fireball || 0
    };

    state.gameStats.favoriteWeapon = stats.favoriteWeapon || 'default';
    state.gameStats.secretRoomsVisited = stats.secretRoomsVisited || 0;
    state.gameStats.secretRoomsGenerated = stats.secretRoomsGenerated || 0;

    state.gameStats.trapsTriggered = {
      spike: stats.trapsTriggered?.spike || 0,
      ice: stats.trapsTriggered?.ice || 0,
      acid: stats.trapsTriggered?.acid || 0,
      lightning: stats.trapsTriggered?.lightning || 0
    };

    state.gameStats.mimicBites = stats.mimicBites || 0;

    state.gameStats.playTime = stats.playTime || 0;
    state.playTimeAccumulator = state.gameStats.playTime;

    console.log('📀 Восстановлена статистика игры');
    console.log(`⏱️ Время игры: ${stats.playTimeFormatted || formatPlayTime(state.gameStats.playTime)}`);
  } else {
    state.gameStats = {
      maxHpAtEnd: 0,
      hpRemaining: 0,
      goldCollected: 0,
      goldSpent: 0,
      artifactsCollected: 0,
      artifactsTotalPossible: 0,
      monstersKilled: 0,
      bossesTotal: 0,
      weaponHits: {
        default: 0,
        stun: 0,
        vampire: 0,
        fireball: 0
      },
      favoriteWeapon: 'default',
      secretRoomsVisited: 0,
      secretRoomsGenerated: 0,
      trapsTriggered: {
        spike: 0,
        ice: 0,
        acid: 0,
        lightning: 0
      },
      mimicBites: 0
    };
  }
}

/**
 * Восстановление данных о достижениях
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreAchievementsData(save) {
  if (save.achievements) {
    let unlocked = save.achievements.unlocked || [];
    let progress = save.achievements.progress || {};

    if (unlocked.includes('fully_equipped')) {
      progress.weapons_bought = 3;
    } else {
      let count = 0;
      if (player.ownedMeleeWeapons.includes('vampire')) count++;
      if (player.ownedMeleeWeapons.includes('stun')) count++;
      if (player.ownedRangedWeapons.includes('fireball')) count++;
      progress.weapons_bought = count;
    }

    state.achievements = {
      unlocked: unlocked,
      progress: progress
    };

  } else {
    state.achievements = {
      unlocked: [],
      progress: {}
    };
  }
}

/**
 * Восстановление данных о записках
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreNotesData(save) {
  if (!state.notes) {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  const notesData = loadNotesFromStorage();

  if (notesData) {
    state.notes.found = notesData.found || [];
    state.notes.spawned = notesData.spawned || {};
    state.notes.positions = notesData.positions || {};
  } else {
    state.notes.found = [];
    state.notes.spawned = {};
    state.notes.positions = {};
  }

  // Восстанавливаем записки на сетке
  restoreNotesOnGrid();

  state.showNotePrompt = false;
  state.notePromptId = null;
  state.notePromptX = null;
  state.notePromptY = null;
}