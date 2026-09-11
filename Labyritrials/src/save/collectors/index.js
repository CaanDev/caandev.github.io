/**
 * @fileoverview Точка входа для коллекторов сохранения.
 * Экспортирует все функции сбора данных для сохранения.
 * 
 * @module save/collectors/index
 */

// ============================================================
// БАЗОВЫЕ ДАННЫЕ
// ============================================================

export { collectBasicData } from './baseCollector.js';

// ============================================================
// ИГРОК
// ============================================================

export {
  collectPlayerData,
  collectWeaponData,
  collectEffectData,
  collectPositionData
} from './playerCollector.js';

// ============================================================
// ЛАБИРИНТ
// ============================================================

export { collectMazeData, collectPillarsData } from './mazeCollector.js';

// ============================================================
// МОНСТРЫ И БОССЫ
// ============================================================

export { collectMonstersData, collectBossData } from './monsterCollector.js';

// ============================================================
// ОБЪЕКТЫ
// ============================================================

export {
  collectTrapsData,
  collectArtifactsData,
  collectChestsData,
  collectMimicsData,
  collectShrinesData,
  collectLootData
} from './objectCollector.js';

// ============================================================
// ОКРУЖЕНИЕ
// ============================================================

export {
  collectTorchesData,
  collectFirefliesData,
  collectRunesData
} from './environmentCollector.js';

// ============================================================
// СИСТЕМЫ
// ============================================================

export {
  collectAdaptationData,
  collectEventData,
  collectGameStatsData,
  collectAchievementsData,
  collectNotesData
} from './systemCollector.js';

// ============================================================
// ТАЙНЫЕ КОМНАТЫ
// ============================================================

export {
  collectTreasureRoomData,
  collectSecretRoomsData,
  collectTrapRoomData,
  collectSafeRoomData
} from './secretRoomCollector.js';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export {
  saveMazeGrid,
  saveRevealedCells,
  saveOriginalGrid,
  collectMonstersDataFrom,
  collectTrapsDataFrom,
  collectShrinesDataFrom,
  collectTorchesDataFrom
} from './helpers.js';