/**
 * @fileoverview Точка входа для аудиосистемы
 * @module audio/index
 */

// ============================================================
// МУЗЫКА
// ============================================================

export {
  music,
  musicLoader,
  MUSIC_TRACKS,
  getTrackConfig,
  hasTrack,
  getTrackKeys,
  getPreloadTracks,
} from './music/index.js';

// ============================================================
// ЗВУКОВЫЕ ЭФФЕКТЫ
// ============================================================

export {
  sound,
  soundLoader,
  SOUNDS,
  FLAT_SOUNDS,
  getSoundConfig,
  hasSound,
  getSoundKeys,
  getSoundsByCategory,
  getSoundCategories,
  getPreloadSounds,
} from './sounds/index.js';

// ============================================================
// АУДИО МЕНЕДЖЕР (ЦЕНТРАЛЬНЫЙ КОНТРОЛЛЕР)
// ============================================================

export { audio } from './audioManager.js';