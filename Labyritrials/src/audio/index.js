/**
 * @fileoverview Точка входа для аудиосистемы.
 * Экспортирует все основные компоненты аудио: AudioManager, MusicManager, SoundManager.
 * 
 * @module audio
 */

/**
 * Экспорт менеджера аудио — центрального контроллера
 * @see module:audio/audioManager
 */
export { audio } from './audioManager.js';

/**
 * Экспорт менеджера музыки — управление фоновой музыкой
 * @see module:audio/musicManager
 */
export { music } from './musicManager.js';

/**
 * Экспорт менеджера звуков — управление звуковыми эффектами
 * @see module:audio/soundManager
 */
export { sound } from './soundManager.js';