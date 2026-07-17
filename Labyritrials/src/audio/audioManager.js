/**
 * @fileoverview Менеджер аудио — центральный контроллер для музыки и звуковых эффектов.
 * Объединяет MusicManager и SoundManager, предоставляя единый интерфейс.
 */

import { music } from './musicManager.js';
import { sound } from './soundManager.js';
import { state } from '../core/config/state.js';

/**
 * Класс AudioManager — управление всей аудиосистемой игры
 * 
 * @class AudioManager
 * @property {MusicManager} music - Менеджер музыки
 * @property {SoundManager} sound - Менеджер звуковых эффектов
 * @property {boolean} isGameActive - Активна ли игра (не меню)
 * @property {boolean} isInitialized - Инициализирован ли аудиоменеджер
 * @property {boolean} isMainMenu - Находится ли игрок в главном меню
 * @property {boolean} _hasLoadError - Флаг ошибки загрузки аудио
 */
class AudioManager {
  constructor() {
    this.music = music;
    this.sound = sound;
    this.isGameActive = false;
    this.isInitialized = false;
    this.isMainMenu = true;
    this._hasLoadError = false;
  }

  /**
   * Инициализация аудиосистемы
   * Вызывается один раз при старте игры
   * 
   * @returns {void}
   */
  init() {
    if (this.isInitialized) return;
    
    this.music.init();
    this.sound.init();
    
    this.isInitialized = true;
    this.isMainMenu = true;
  }

  /**
   * Запуск длительного звукового эффекта с зацикливанием
   * 
   * @param {string} name - Имя звукового эффекта
   * @param {number} [volumeMultiplier=0.3] - Множитель громкости (0-1)
   * @returns {Audio|null} - Объект Audio для управления или null при ошибке
   */
  playEffect(name, volumeMultiplier = 0.3) {
    return this.sound.playEffect(name, volumeMultiplier);
  }

  /**
   * Остановка конкретного звука эффекта
   * 
   * @param {Audio} audio - Объект Audio, который нужно остановить
   * @returns {void}
   */
  stopEffectSound(audio) {
    this.sound.stopEffectSound(audio);
  }

  /**
   * Остановка всех активных звуков эффектов
   * 
   * @returns {void}
   */
  stopAllEffects() {
    this.sound.stopAllEffects();
  }

  /**
   * Определяет местоположение игрока и переключает музыку
   * Автоматически выбирает режим: 'game', 'safeRoom'
   * 
   * @returns {void}
   */
  updateMusicByLocation() {
    if (this.isMainMenu) return;
    if (this.music._hasLoadError) return; // Не переключаем при ошибке
    
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
   * 
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
   * 
   * @param {string} mode - Режим музыки ('game', 'menu', 'safeRoom')
   * @returns {void}
   */
  setMusicMode(mode) {
    this.music.setMode(mode);
  }

  /**
   * Принудительное переключение музыки с полной остановкой текущего трека
   * 
   * @param {string} mode - Режим музыки ('game', 'menu', 'safeRoom')
   * @returns {void}
   */
  forcePlayMusic(mode) {
    if (this.music._hasLoadError) {
      // Если была ошибка — пробуем перезагрузить
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
   * 
   * @returns {void}
   */
  pause() {
    this.music.pause();
  }

  /**
   * Возобновляет воспроизведение музыки
   * 
   * @returns {void}
   */
  resume() {
    if (this.music._hasLoadError) return; // Не возобновляем при ошибке
    
    if (this.isGameActive && this.music.isEnabled) {
      this.music.resume();
    } else if (this.isMainMenu && this.music.isEnabled) {
      this.music.resume();
    }
  }

  /**
   * Полная остановка музыки
   * 
   * @returns {void}
   */
  stop() {
    this.music.stop();
    this.music.isPlaying = false;
    this.isGameActive = false;
  }

  /**
   * Сброс аудиоменеджера в начальное состояние
   * 
   * @returns {void}
   */
  reset() {
    this.music.stop();
    this.music.isPlaying = false;
    this.isGameActive = false;
    this.music._hasLoadError = false;
    this.music._errorReported = false;
  }

  /**
   * Воспроизведение короткого звука
   * 
   * @param {string} name - Имя звука
   * @param {number|null} [volume=null] - Громкость (0-1) или null для стандартной
   * @returns {void}
   */
  playSound(name, volume = null) {
    this.sound.play(name, volume);
  }

  /**
   * Воспроизведение звука шага
   * 
   * @param {string|null} [dir=null] - Направление движения ('up', 'down', 'left', 'right')
   * @returns {void}
   */
  playStep(dir = null) {
    this.sound.playStep(dir);
  }

  /**
   * Обновление состояния шагов (кулдаун)
   * 
   * @returns {void}
   */
  updateSteps() {
    this.sound.updateSteps();
  }

  /**
   * Переключение звука (вкл/выкл)
   * @deprecated Используйте toggleMute()
   * 
   * @returns {void}
   */
  toggleSoundMute() {
    this.sound.toggleMute();
  }

  /**
   * Переключение звука (вкл/выкл)
   * 
   * @returns {void}
   */
  toggleMute() {
    this.sound.toggleMute();
  }

  /**
   * Установка громкости музыки
   * 
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setMusicVolume(value) {
    this.music.setVolume(value);
  }

  /**
   * Установка громкости звуковых эффектов
   * 
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setSoundVolume(value) {
    this.sound.setVolume(value);
  }

  /**
   * Установка громкости для всей аудиосистемы
   * 
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.setMusicVolume(value);
    this.setSoundVolume(value);
  }

  /**
   * Проверка, играет ли музыка
   * 
   * @returns {boolean} - true, если музыка играет
   */
  isMusicPlaying() {
    return this.music.isMusicPlaying();
  }

  /**
   * Проверка, активна ли игра
   * 
   * @returns {boolean} - true, если игра активна
   */
  isGameActive() {
    return this.isGameActive;
  }

  /**
   * Включение/отключение музыки
   * 
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
   * Обновление состояния музыки (синхронизация)
   * 
   * @returns {void}
   */
  updateMusicState() {
    this.music.updateState();
  }

  /**
   * Получение текущего режима музыки
   * 
   * @returns {string} - Режим музыки ('game', 'menu', 'safeRoom')
   */
  getMusicMode() {
    return this.music.getMode();
  }
}

/** @type {AudioManager} - Экспортируемый экземпляр менеджера аудио */
export const audio = new AudioManager();