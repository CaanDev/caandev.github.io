/**
 * @fileoverview Конфигурация музыкальных треков
 * @module audio/music/musicConfig
 */

/**
 * @namespace MUSIC_TRACKS
 * @description Все музыкальные треки игры с их настройками
 */
export const MUSIC_TRACKS = {
  /**
   * Музыка главного меню
   */
  menu: {
    path: 'assets/audio/themes/mainMenu.ogg',
    volume: 1.0,
    loop: true,
    preload: true, // Загружать при старте
  },

  /**
   * Фоновая музыка игры (основной лабиринт)
   */
  game: {
    path: 'assets/audio/themes/gameBackground.ogg',
    volume: 1.0,
    loop: true,
    preload: true,
  },

  /**
   * Музыка безопасной комнаты
   */
  safeRoom: {
    path: 'assets/audio/themes/safeRoom.ogg',
    volume: 0.2,
    loop: true,
    preload: false, // Загружать при первом входе
  },
};

/**
 * Список треков, которые загружаются при старте
 * @type {string[]}
 */
export const PRELOAD_TRACKS = ['menu', 'game'];

/**
 * Получение конфигурации трека по ключу
 * @param {string} key - Ключ трека
 * @returns {Object|null} - Конфигурация трека или null
 */
export function getTrackConfig(key) {
  return MUSIC_TRACKS[key] || null;
}

/**
 * Проверка, существует ли трек
 * @param {string} key - Ключ трека
 * @returns {boolean} - true, если трек существует
 */
export function hasTrack(key) {
  return !!MUSIC_TRACKS[key];
}

/**
 * Получение всех ключей треков
 * @returns {string[]} - Массив ключей
 */
export function getTrackKeys() {
  return Object.keys(MUSIC_TRACKS);
}

/**
 * Получение треков, которые нужно предзагрузить
 * @returns {string[]} - Массив ключей треков для предзагрузки
 */
export function getPreloadTracks() {
  return Object.keys(MUSIC_TRACKS).filter(
    key => MUSIC_TRACKS[key].preload === true
  );
}