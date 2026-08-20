/**
 * @fileoverview Точка входа для музыкальной системы
 * @module audio/music/index
 */

export { music } from './musicManager.js';
export { musicLoader } from './musicLoader.js';
export { MUSIC_TRACKS, getTrackConfig, hasTrack, getTrackKeys, getPreloadTracks } from './musicConfig.js';