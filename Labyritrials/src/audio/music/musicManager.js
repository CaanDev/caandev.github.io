/**
 * @fileoverview Менеджер фоновой музыки
 * @module audio/music/musicManager
 */

import { musicLoader } from './musicLoader.js';
import { getTrackConfig, hasTrack } from './musicConfig.js';
import { logger } from '../../utils/logger.js';

/**
 * @class MusicManager
 * @description Управление воспроизведением фоновой музыки
 */
class MusicManager {
  constructor() {
    /** @type {Audio|null} - Текущий воспроизводимый трек */
    this.currentTrack = null;
    /** @type {string|null} - Ключ текущего трека */
    this.currentKey = null;
    /** @type {string} - Текущий режим ('menu', 'game', 'safeRoom') */
    this.currentMode = 'menu';
    /** @type {boolean} - Играет ли музыка */
    this.isPlaying = false;
    /** @type {boolean} - Включена ли музыка */
    this.isEnabled = true;
    /** @type {number} - Текущая громкость (0-1) */
    this.volume = 0.4;
    /** @type {boolean} - Инициализирован ли менеджер */
    this.initialized = false;
    /** @type {number} - Количество попыток воспроизведения */
    this.playAttempts = 0;
    /** @type {number} - Максимальное количество попыток */
    this.maxPlayAttempts = 5;
    /** @type {boolean} - Флаг ошибки загрузки */
    this._hasLoadError = false;
    /** @type {boolean} - Флаг, что ошибка уже сообщена */
    this._errorReported = false;
    /** @type {boolean} - Флаг загрузки */
    this._isLoading = false;
  }

  /**
   * Инициализация менеджера музыки
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;
    await musicLoader.init();
    this.initialized = true;
  }

  /**
   * Воспроизведение музыки в указанном режиме
   * @param {string} mode - Режим ('menu', 'game', 'safeRoom')
   * @returns {Promise<void>}
   */
  async play(mode = 'menu') {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.isEnabled) {
      this.currentMode = mode;
      return;
    }

    if (this._hasLoadError) {
      return;
    }

    if (this._isLoading) return;
    if (this.currentMode === mode && this.isPlaying) return;

    // Проверяем, существует ли трек
    if (!hasTrack(mode)) {
      logger.warn(`⚠️ Режим "${mode}" не найден в конфигурации`);
      return;
    }

    this._isLoading = true;
    this.stop();

    this.currentMode = mode;

    // Проверяем, загружен ли трек
    let audio = musicLoader.getTrack(mode);

    if (!audio) {
      // Ленивая загрузка
      audio = await musicLoader.loadTrack(mode);
      if (!audio) {
        this._isLoading = false;
        this._handleLoadError(mode);
        return;
      }
    }

    this.currentTrack = audio;
    this.currentKey = mode;

    try {
      audio.currentTime = 0;
      const promise = audio.play();

      if (promise !== undefined) {
        promise
          .then(() => {
            this.isPlaying = true;
            this.playAttempts = 0;
            this._isLoading = false;
            this._hasLoadError = false;
            this._errorReported = false;
          })
          .catch((err) => {
            this._isLoading = false;
            if (err.name === 'AbortError') return;
            if (err.name === 'NotAllowedError') {
              // Попытка воспроизведения после взаимодействия пользователя
              this.playAttempts++;
              if (this.playAttempts < this.maxPlayAttempts) {
                setTimeout(() => {
                  if (!this.isPlaying && !this._isLoading) {
                    this.play(mode);
                  }
                }, 1000);
              }
              return;
            }
            logger.warn(`⚠️ Ошибка воспроизведения "${mode}":`, err.name);
            this._handleLoadError(mode);
          });
      } else {
        this._isLoading = false;
      }
    } catch (err) {
      this._isLoading = false;
      if (err.name !== 'AbortError') {
        logger.warn(`⚠️ Не удалось запустить "${mode}":`, err.name);
        this._handleLoadError(mode);
      }
    }
  }

  /**
   * Обработка ошибки загрузки/воспроизведения
   * @param {string} mode - Режим, в котором произошла ошибка
   * @private
   */
  _handleLoadError(mode) {
    this._hasLoadError = true;
    if (!this._errorReported) {
      this._errorReported = true;
      logger.warn(`🔇 Режим отказоустойчивости: музыка "${mode}" отключена`);
    }
    this.isEnabled = false;
    this.isPlaying = false;
    this._isLoading = false;
  }

  /**
   * Постановка музыки на паузу
   * @returns {void}
   */
  pause() {
    if (!this.isPlaying) return;
    if (!this.currentTrack) return;

    this._isLoading = false;

    try {
      this.currentTrack.pause();
      this.isPlaying = false;
    } catch (err) {
      if (err.name !== 'AbortError') {
        logger.warn('⚠️ Не удалось поставить на паузу:', err);
      }
    }
  }

  /**
   * Возобновление воспроизведения музыки
   * @returns {void}
   */
  resume() {
    if (this.isPlaying) return;
    if (!this.isEnabled) return;
    if (!this.currentTrack) return;
    if (this._isLoading) return;
    if (this._hasLoadError) return;

    try {
      const promise = this.currentTrack.play();

      if (promise !== undefined) {
        promise
          .then(() => {
            this.isPlaying = true;
          })
          .catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              logger.warn('⚠️ Не удалось возобновить:', err);
              this._handleLoadError(this.currentMode);
            }
          });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        logger.warn('⚠️ Не удалось возобновить:', err);
        this._handleLoadError(this.currentMode);
      }
    }
  }

  /**
   * Полная остановка музыки с перемоткой на начало
   * @returns {void}
   */
  stop() {
    this._isLoading = false;

    if (this.currentTrack) {
      try {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
      } catch (err) {
        if (err.name !== 'AbortError') {
          logger.warn('⚠️ Не удалось остановить музыку:', err);
        }
      }
    }

    this.isPlaying = false;
    this.currentTrack = null;
    this.currentKey = null;
  }

  /**
   * Установка громкости музыки
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));

    // Обновляем громкость у всех загруженных треков
    for (const [key, audio] of musicLoader.getAllLoaded()) {
      const config = getTrackConfig(key);
      const baseVolume = config?.volume || 0.4;
      audio.volume = this.volume * baseVolume;
    }

    // Обновляем текущий трек, если он есть
    if (this.currentTrack) {
      const config = getTrackConfig(this.currentMode);
      const baseVolume = config?.volume || 0.4;
      this.currentTrack.volume = this.volume * baseVolume;
    }
  }

  /**
   * Включение/отключение музыки
   * @param {boolean} enabled - true — музыка включена
   * @returns {void}
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;

    if (!enabled) {
      this.pause();
    } else {
      if (this._hasLoadError) {
        this._hasLoadError = false;
        this._errorReported = false;
        this.reload();
      } else if (this.currentTrack) {
        this.resume();
      } else {
        this.play(this.currentMode);
      }
    }
  }

  /**
   * Перезагрузка текущего трека
   * @returns {void}
   */
  reload() {
    this._hasLoadError = false;
    this._errorReported = false;
    this._isLoading = false;

    // Перезагружаем трек
    const config = getTrackConfig(this.currentMode);
    if (config) {
      musicLoader.loadTrack(this.currentMode);
    }

    setTimeout(() => {
      if (this.isEnabled) {
        this.play(this.currentMode);
      }
    }, 100);
  }

  /**
   * Проверка, играет ли музыка
   * @returns {boolean} - true, если музыка играет
   */
  isMusicPlaying() {
    return this.isPlaying;
  }

  /**
   * Установка режима музыки
   * @param {string} mode - Режим ('menu', 'game', 'safeRoom')
   * @returns {Promise<void>}
   */
  async setMode(mode) {
    if (this._hasLoadError) return;
    if (this.currentMode === mode && this.isPlaying) return;
    await this.play(mode);
  }

  /**
   * Получение текущего режима музыки
   * @returns {string} - Текущий режим
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Обновление состояния музыки (синхронизация)
   * @returns {void}
   */
  updateState() {
    if (this._hasLoadError) return;

    if (this.isEnabled && !this.isPlaying && this.currentTrack && !this._isLoading) {
      this.resume();
    } else if (!this.isEnabled && this.isPlaying) {
      this.pause();
    }
  }

  /**
   * Сброс менеджера в начальное состояние
   * @returns {void}
   */
  reset() {
    this.stop();
    this.isPlaying = false;
    this._hasLoadError = false;
    this._errorReported = false;
    this.playAttempts = 0;
    this._isLoading = false;
    this.isEnabled = true;
  }
}

/** @type {MusicManager} - Экземпляр менеджера музыки */
export const music = new MusicManager();