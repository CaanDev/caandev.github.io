/**
 * @fileoverview Центральный контроллер аудиосистемы
 * @module audio/audioManager
 */

import { music } from './music/index.js';
import { sound } from './sounds/index.js';
import { state } from '../core/config/state.js';
import { logger } from '../utils/logger.js'; 

/**
 * @class AudioManager
 * @description Центральный контроллер для музыки и звуковых эффектов
 */
class AudioManager {
  constructor() {
    /** @type {MusicManager} */
    this.music = music;
    /** @type {SoundManager} */
    this.sound = sound;
    /** @type {boolean} - Активна ли игра */
    this.isGameActive = false;
    /** @type {boolean} - Инициализирован ли аудиоменеджер */
    this.isInitialized = false;
    /** @type {boolean} - В главном меню */
    this.isMainMenu = true;
    /** @type {boolean} - Флаг ошибки загрузки */
    this._hasLoadError = false;
  }

  /**
   * Инициализация аудиосистемы
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;

    await this.music.init();
    await this.sound.init();

    this.isInitialized = true;
    this.isMainMenu = true;
    this.isGameActive = false;
  }

  /**
   * Запуск длительного звукового эффекта с зацикливанием
   * @param {string} key - Ключ звука
   * @param {number} volumeMultiplier - Множитель громкости (0-1)
   * @returns {Audio|null}
   */
  playEffect(key, volumeMultiplier = 0.3) {
    return this.sound.playEffect(key, volumeMultiplier);
  }

  /**
   * Остановка конкретного звука эффекта
   * @param {Audio} audio - Объект Audio
   * @returns {void}
   */
  stopEffectSound(audio) {
    this.sound.stopEffectSound(audio);
  }

  /**
   * Остановка всех активных звуков эффектов
   * @returns {void}
   */
  stopAllEffects() {
    this.sound.stopAllEffects();
  }

  /**
   * Определяет местоположение игрока и переключает музыку
   * @returns {void}
   */
  updateMusicByLocation() {
    if (this.isMainMenu) return;
    if (this.music._hasLoadError) return;

    let mode = 'game';

    if (state.inSafeRoom) {
      mode = 'safeRoom';
    } else if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) {
      mode = 'game';
    }

    if (this.music.isEnabled) {
      this.forcePlayMusic(mode);
    } else {
      this.music.setMode(mode);
    }
  }

  /**
   * Устанавливает состояние игры (активна/неактивна)
   * @param {boolean} isActive - Активна ли игра
   * @returns {void}
   */
  setGameState(isActive) {
    this.isGameActive = isActive;
    this.isMainMenu = !isActive;
    this.updateMusicByLocation();
  }

  /**
   * Устанавливает режим музыки без принудительного воспроизведения
   * @param {string} mode - Режим музыки
   * @returns {void}
   */
  setMusicMode(mode) {
    this.music.setMode(mode);
  }

  /**
   * Принудительное переключение музыки
   * @param {string} mode - Режим музыки
   * @returns {void}
   */
  forcePlayMusic(mode) {
    if (this.music._hasLoadError) {
      this.music.reload();
      return;
    }

    this.music.stop();
    this.music.isPlaying = false;
    this.music.setMode(mode);

    if (this.music.isEnabled) {
      this.music.play(mode);
    }
  }

  /**
   * Ставит музыку на паузу
   * @returns {void}
   */
  pause() {
    this.music.pause();
  }

  /**
   * Возобновляет воспроизведение музыки
   * @returns {void}
   */
  resume() {
    if (this.music._hasLoadError) return;

    if (this.isGameActive && this.music.isEnabled) {
      this.music.resume();
    } else if (this.isMainMenu && this.music.isEnabled) {
      this.music.resume();
    }
  }

  /**
   * Полная остановка музыки
   * @returns {void}
   */
  stop() {
    this.music.stop();
    this.music.isPlaying = false;
    this.isGameActive = false;
  }

  /**
   * Сброс аудиоменеджера
   * @returns {void}
   */
  reset() {
    this.music.reset();
    this.sound.reset();
    this.isGameActive = false;
    this.isMainMenu = true;
    this._hasLoadError = false;
  }

  /**
   * Воспроизведение короткого звука
   * @param {string} key - Ключ звука
   * @param {number|null} volume - Громкость (0-1)
   * @returns {Promise<void>}
   */
  playSound(key, volume = null) {
    return this.sound.play(key, volume);
  }

  /**
   * Воспроизведение звука шага
   * @param {string|null} dir - Направление движения
   * @returns {void}
   */
  playStep(dir = null) {
    this.sound.playStep(dir);
  }

  /**
   * Обновление состояния шагов
   * @returns {void}
   */
  updateSteps() {
    this.sound.updateSteps();
  }

  /**
   * Переключение звука (вкл/выкл)
   * @returns {void}
   */
  toggleMute() {
    this.sound.toggleMute();
  }

  /**
   * Установка громкости музыки
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setMusicVolume(value) {
    this.music.setVolume(value);
  }

  /**
   * Установка громкости звуковых эффектов
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setSoundVolume(value) {
    this.sound.setVolume(value);
  }

  /**
   * Установка громкости для всей аудиосистемы
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.setMusicVolume(value);
    this.setSoundVolume(value);
  }

  /**
   * Проверка, играет ли музыка
   * @returns {boolean}
   */
  isMusicPlaying() {
    return this.music.isMusicPlaying();
  }

  /**
   * Проверка, активна ли игра
   * @returns {boolean}
   */
  isGameActive() {
    return this.isGameActive;
  }

  /**
   * Включение/отключение музыки
   * @param {boolean} enabled - true — музыка включена
   * @returns {void}
   */
  setMusicEnabled(enabled) {
    this.music.setEnabled(enabled);

    if (enabled && this.isGameActive) {
      this.updateMusicByLocation();
    }
  }

  /**
   * Обновление состояния музыки
   * @returns {void}
   */
  updateMusicState() {
    this.music.updateState();
  }

  /**
   * Получение текущего режима музыки
   * @returns {string}
   */
  getMusicMode() {
    return this.music.getMode();
  }

  /**
   * Предзагрузка дополнительных звуков
   * @param {string[]} keys - Массив ключей звуков
   * @returns {Promise<void>}
   */
  preloadSounds(keys) {
    return this.sound.preloadSounds(keys);
  }
}

/** @type {AudioManager} - Экземпляр менеджера аудио */
export const audio = new AudioManager();