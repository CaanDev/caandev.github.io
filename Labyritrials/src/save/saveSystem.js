/**
 * @fileoverview Основная система сохранения и загрузки игры.
 * Координирует сбор данных из всех игровых систем и их восстановление.
 * 
 * @module save/saveSystem
 */

import { state, player } from '../core/config/index.js';
import { audio } from '../audio/audioManager.js';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  deleteSave,
  hasSave,
  getSaveInfo,
  showSaveNotification
} from './saveStorage.js';
import { saveNotesToStorage } from './notesStorage.js';
import {
  collectBasicData,
  collectPlayerData,
  collectWeaponData,
  collectEffectData,
  collectPositionData,
  collectMazeData,
  collectMonstersData,
  collectTrapsData,
  collectArtifactsData,
  collectChestsData,
  collectShrinesData,
  collectLootData,
  collectTorchesData,
  collectAdaptationData,
  collectEventData,
  collectTreasureRoomData,
  collectSecretRoomsData,
  collectTrapRoomData,
  collectSafeRoomData,
  collectFirefliesData,
  collectRunesData,
  collectGameStatsData,
  collectPillarsData,
  collectBossData,
  collectAchievementsData,
  collectNotesData
} from './collectors/index.js';
import {
  restoreBasicData,
  restorePlayerData,
  restoreWeaponData,
  restoreEffectData,
  restorePositionData,
  restoreMazeData,
  restoreMonstersData,
  restoreTrapsData,
  restoreArtifactsData,
  restoreChestsData,
  restoreShrinesData,
  restoreLootData,
  restoreTorchesData,
  restoreAdaptationData,
  restoreEventData,
  restoreBloodPuddles,
  restoreTreasureRoomData,
  restoreSecretRoomsData,
  restoreTrapRoomData,
  restoreSafeRoomData,
  restoreFirefliesData,
  restoreRunesData,
  restoreGameStatsData,
  restoreAchievementsData,
  restoreNotesData,
  restoreFlags
} from './restorers/index.js';

/**
 * Сохранение текущего состояния игры
 * 
 * @returns {void}
 */
export function saveGame() {
  // Если игра завершена или игрок мёртв — не сохраняем
  if (player.hp <= 0) return;

  const saveData = {
    ...collectBasicData(),
    ...collectPlayerData(),
    ...collectWeaponData(),
    ...collectEffectData(),
    ...collectPositionData(),
    ...collectMazeData(),
    ...collectBossData(),
    monsters: collectMonstersData(),
    traps: collectTrapsData(),
    artifacts: collectArtifactsData(),
    chests: collectChestsData(),
    shrines: collectShrinesData(),
    lootItems: collectLootData(),
    bloodPuddles: state.bloodPuddles,
    ...collectTorchesData(),
    ...collectAdaptationData(),
    ...collectEventData(),
    treasureRoomData: collectTreasureRoomData(),
    secretRoomsData: collectSecretRoomsData(),
    trapRoomData: collectTrapRoomData(),
    safeRoomData: collectSafeRoomData(),
    pillars: collectPillarsData(),
    fireflies: collectFirefliesData(),
    runes: collectRunesData(),
    gameStats: collectGameStatsData(),
    achievements: collectAchievementsData()
  };

  saveToLocalStorage(saveData);
  showSaveNotification();

  const notesData = collectNotesData();
  saveNotesToStorage(notesData);
}

/**
 * Загрузка сохранения и восстановление состояния игры
 * 
 * @returns {Promise<boolean>} - true, если загрузка успешна
 */
export async function loadGame() {
  const save = loadFromLocalStorage();
  if (!save) return false;

  try {
    // ===== ПРОВЕРКА ВЕРСИИ =====
    if (!save.version || !save.version.startsWith('1.')) {
      console.warn('⚠️ Неподдерживаемая версия сохранения:', save.version);
      return false;
    }

    // ===== ВОССТАНОВЛЕНИЕ ДАННЫХ =====
    restoreBasicData(save);

    if (save.mazeCols && save.mazeRows) {
      const { CONFIG } = await import('../core/config/index.js');
      CONFIG.cols = save.mazeCols;
      CONFIG.rows = save.mazeRows;
    }

    restoreMazeData(save);
    restorePlayerData(save);
    restoreWeaponData(save);
    restoreEffectData(save);
    restorePositionData(save);
    restoreMonstersData(save);
    restoreTrapsData(save);
    restoreArtifactsData(save);
    restoreChestsData(save);
    restoreShrinesData(save);
    restoreLootData(save);
    restoreTorchesData(save);
    restoreAdaptationData(save);
    restoreEventData(save);
    restoreBloodPuddles(save);
    restoreTreasureRoomData(save);
    restoreSecretRoomsData(save);
    restoreTrapRoomData(save);
    restoreSafeRoomData(save.safeRoomData);
    restoreFirefliesData(save);
    restoreRunesData(save);
    restoreGameStatsData(save);
    restoreAchievementsData(save);
    restoreNotesData(save);
    restoreFlags(save);

    console.log('📀 Игра загружена! Уровень:', state.gameLevel);
    console.log(`🏆 Достижений разблокировано: ${state.achievements.unlocked.length}`);

    // ===== ПРИМЕНЕНИЕ НАСТРОЕК =====
    await applySettingsAfterLoad();

    // ===== ВОССТАНОВЛЕНИЕ МИМИКОВ (мухи) =====
    await restoreMimicFlies();

    // ===== ОБНОВЛЕНИЕ UI =====
    const { Game } = await import('../core/game.js');
    if (Game && Game.updateUI) {
      Game.updateUI();
    }

    // ===== СИНХРОНИЗАЦИЯ ЗАПИСОК С ДОСТИЖЕНИЯМИ =====
    if (state.notes && state.notes.found) {
      const notesFound = state.notes.found.length;
      const currentProgress = state.achievements?.progress?.notes_found || 0;
      
      if (notesFound > currentProgress) {
        const { setProgress } = await import('../systems/achievements/manager.js');
        setProgress('notes_found', notesFound);
        console.log(`📚 Синхронизировано записок: ${notesFound}`);
      }
    }

    // ===== ПРОВЕРКА ДОСТИЖЕНИЙ =====
    const { checkAchievements } = await import('../systems/achievements/manager.js');
    checkAchievements();

    // ===== ВОССТАНОВЛЕНИЕ МУЗЫКИ =====
    if (state.inSafeRoom) {
      audio.forcePlayMusic('safeRoom');
    } else if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) {
      audio.forcePlayMusic('game');
    } else {
      audio.forcePlayMusic('game');
    }

    return true;
  } catch (e) {
    console.error('❌ Ошибка загрузки сохранения:', e);
    return false;
  }
}

/**
 * Применение настроек после загрузки сохранения
 * 
 * @returns {Promise<void>}
 * @private
 */
async function applySettingsAfterLoad() {
  try {
    const { getSettings } = await import('../systems/ui/settings/index.js');
    const settings = getSettings();

    const { audio } = await import('../audio/audioManager.js');

    audio.setMusicVolume(settings.musicVolume / 100);

    if (settings.soundEnabled) {
      audio.sound.isMuted = false;
      audio.setSoundVolume(settings.soundVolume / 100);
    } else {
      audio.sound.isMuted = true;
      audio.setSoundVolume(0);
    }
    audio.sound.updateVolume();

    audio.music.isEnabled = settings.musicEnabled;

    const { updateFpsLimit } = await import('../systems/ui/settings/index.js');
    if (typeof updateFpsLimit === 'function') {
      updateFpsLimit();
    }
  } catch (e) {
    console.warn('⚠️ Не удалось применить настройки:', e);
  }
}

/**
 * Восстановление мух у сундуков-мимиков
 * 
 * @returns {Promise<void>}
 * @private
 */
async function restoreMimicFlies() {
  if (state.isBossLevel) return;

  if (state.flies && state.flies.length > 0) {
    state.flies = [];
  }

  for (let chest of state.chests) {
    if (chest.type === 'mimic' && !chest.opened) {
      const { createFlies } = await import('../entities/objects/fly.js');
      createFlies(chest.x, chest.y);
    }
  }
}

// ============================================================
// РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

export { deleteSave, hasSave, getSaveInfo };