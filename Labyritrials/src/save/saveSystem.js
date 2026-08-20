/**
 * @fileoverview Основная система сохранения и загрузки игры.
 * Координирует сбор данных из всех игровых систем и их восстановление.
 * 
 * @module save/saveSystem
 */

import { state, player } from '../core/config/index.js';
import { logger } from '../utils/logger.js';
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
  collectMimicsData,
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
  restoreMimicsData,
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
  restoreWeatherData,
  restoreNotesData,
  restoreFlags
} from './restorers/index.js';
import { snowState } from '../systems/weather/snowManager.js';
import { frostState } from '../systems/weather/frostSystem.js';

/**
 * Сохранение текущего состояния игры
 * 
 * @returns {void}
 */
export function saveGame() {
  // Запрещаем сохранение во время активной волны в комнате-ловушке
  if (state.inTrapRoom && state.trapWaveActive && state.trapMonsters.length > 0) {
    // Показываем уведомление игроку
    state.damageTexts.push({
      x: player.px,
      y: player.py - 60,
      text: '⚠️ Сохранение недоступно!',
      color: '#ff4444',
      size: 20,
      life: 60,
      speedy: 0.5
    });
    return;
  }

  // Если игра завершена или игрок мёртв — не сохраняем
  if (player.hp <= 0) return;

  const saveData = {
    compressed: true,
    ...collectBasicData(),
    ...collectPlayerData(),
    ...collectWeaponData(),
    ...collectEffectData(),
    ...collectPositionData(),
    ...collectMazeData(),
    ...collectBossData(),
    weatherState: {
      snowActive: snowState.active,
      snowStartTime: snowState.startTime,
      lastSnowfallEnd: snowState.lastSnowfallEnd,
      levelStartTime: snowState.levelStartTime,
      frostProgress: frostState.progress,
      frostFrozen: frostState.frozen,
      frostDamageTimer: frostState.damageTimer,
    },
    monsters: collectMonstersData(),
    mimics: collectMimicsData(),
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
    // ===== ВОССТАНОВЛЕНИЕ ДАННЫХ =====
    restoreBasicData(save);

    if (save.mazeCols && save.mazeRows) {
      const { CONFIG } = await import('../core/config/index.js');
      CONFIG.cols = save.mazeCols;
      CONFIG.rows = save.mazeRows;
    }

    // ===== ВОССТАНАВЛИВАЕМ ПОГОДУ ПОСЛЕ ВСЕХ ДАННЫХ =====
    let weatherRestored = false;
    if (save.weatherState) {
      const ws = save.weatherState;
      snowState.active = ws.snowActive || false;
      snowState.startTime = ws.snowStartTime || 0;
      snowState.lastSnowfallEnd = ws.lastSnowfallEnd || 0;
      snowState.levelStartTime = ws.levelStartTime || Date.now();
      
      frostState.progress = ws.frostProgress || 0;
      frostState.frozen = ws.frostFrozen || false;
      frostState.damageTimer = ws.frostDamageTimer || 0;
      
      weatherRestored = true;
    }

    // ===== ВОССТАНАВЛИВАЕМ ВСЁ ОСТАЛЬНОЕ =====
    restoreMazeData(save);
    restorePlayerData(save);
    restoreWeaponData(save);
    restoreEffectData(save);
    restorePositionData(save);
    restoreMonstersData(save);
    restoreTrapsData(save);
    restoreArtifactsData(save);
    restoreChestsData(save);
    restoreMimicsData(save);
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

    // ===== ВОССТАНАВЛИВАЕМ СНЕГОПАД ПОСЛЕ ВСЕГО =====
    if (weatherRestored && snowState.active) {
      // Проверяем, что мы в ледяном биоме и не в тайной комнате
      const isIceBiome = state.currentBiome === 'ice' && state.gameLevel >= 6 && state.gameLevel <= 9;
      const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
      
      if (isIceBiome && !isInSecretRoom && !state.isBossLevel) {
        // Импортируем функцию для создания снежинок
        const { createSnowflakes } = await import('../systems/weather/snowRenderer.js');
        createSnowflakes();
        
        // Устанавливаем прозрачность на максимум
        snowState.targetOpacity = 1;
        snowState.opacity = 1;
        
        // Восстанавливаем таймер остановки снегопада
        const elapsed = Date.now() - snowState.startTime;
        // Используем значения из snowState или значения по умолчанию
        const minDuration = snowState.minDuration || 60000;
        const maxDuration = snowState.maxDuration || 180000;
        const avgDuration = (minDuration + maxDuration) / 2;
        const remaining = Math.max(0, avgDuration - elapsed);
        
        if (remaining > 0) {
          if (snowState.stopTimer) {
            clearTimeout(snowState.stopTimer);
            snowState.stopTimer = null;
          }
          snowState.stopTimer = setTimeout(() => {
            import('../systems/weather/snowManager.js').then(module => {
              module.stopSnowfall();
            });
          }, remaining);
        } else {
          snowState.active = false;
          snowState.targetOpacity = 0;
          snowState.opacity = 0;
        }
      } else {
        // Если не подходит биом — отключаем снегопад
        snowState.active = false;
        snowState.targetOpacity = 0;
        snowState.opacity = 0;
      }
    }

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
    logger.error('❌ Ошибка загрузки сохранения:', e);
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
    logger.warn('⚠️ Не удалось применить настройки:', e);
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
  if (state.flies && state.flies.length > 0) state.flies = [];

  const biome = state.currentBiome || 'cave';

  // Восстанавливаем мух над мимиками
  for (const mimic of state.mimics) {
    if (!mimic.isDead && !mimic.opened) {
      const { createFlies } = await import('../entities/objects/fly.js');
      createFlies(mimic.x, mimic.y, biome);
    }
  }
}

// ============================================================
// РЕЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

export { deleteSave, hasSave, getSaveInfo };