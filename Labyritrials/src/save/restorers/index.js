/**
 * @fileoverview Точка входа для рестореров сохранения.
 * Экспортирует все функции восстановления данных из сохранения.
 * 
 * @module save/restorers/index
 */

// ============================================================
// БАЗОВЫЕ ДАННЫЕ
// ============================================================

export { restoreBasicData, restoreFlags } from './baseRestorer.js';

// ============================================================
// ИГРОК
// ============================================================

export {
  restorePlayerData,
  restoreWeaponData,
  restoreEffectData,
  restorePositionData
} from './playerRestorer.js';

// ============================================================
// ЛАБИРИНТ
// ============================================================

export { restoreMazeData, restorePillarsData } from './mazeRestorer.js';

// ============================================================
// МОНСТРЫ И БОССЫ
// ============================================================

export { restoreMonstersData, restoreBossData } from './monsterRestorer.js';

// ============================================================
// ОБЪЕКТЫ
// ============================================================

export {
  restoreTrapsData,
  restoreArtifactsData,
  restoreChestsData,
  restoreShrinesData,
  restoreLootData
} from './objectRestorer.js';

// ============================================================
// ОКРУЖЕНИЕ
// ============================================================

export {
  restoreTorchesData,
  restoreFirefliesData,
  restoreRunesData,
  restoreBloodPuddles
} from './environmentRestorer.js';

// ============================================================
// СИСТЕМЫ
// ============================================================

export {
  restoreAdaptationData,
  restoreEventData,
  restoreGameStatsData,
  restoreAchievementsData,
  restoreWeatherData,
  restoreNotesData
} from './systemRestorer.js';

// ============================================================
// ТАЙНЫЕ КОМНАТЫ
// ============================================================

export {
  restoreTreasureRoomData,
  restoreSecretRoomsData,
  restoreTrapRoomData,
  restoreSafeRoomData
} from './secretRoomRestorer.js';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export {
  restoreMazeGrid,
  restoreOriginalMazeGrid,
  restoreRevealedCells,
  restoreBossAbilities,
  restorePortalFlagsOnGrid,
  restoreNotesOnGrid
} from './helpers.js';