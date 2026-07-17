/**
 * @fileoverview Менеджер звуковых эффектов.
 * Управляет загрузкой, воспроизведением и остановкой звуков.
 */

import { state } from '../core/config/state.js';

/**
 * Класс SoundManager — управление звуковыми эффектами
 * 
 * @class SoundManager
 * @property {Object<string, Audio>} sounds - Хранилище загруженных звуков
 * @property {number} volume - Текущая громкость (0-1)
 * @property {boolean} isMuted - Выключен ли звук
 * @property {boolean} isInitialized - Инициализирован ли менеджер
 * @property {boolean} _hasLoadError - Флаг ошибки загрузки
 * @property {number} stepCooldown - Текущий кулдаун шагов
 * @property {number} stepInterval - Интервал между шагами в кадрах
 * @property {string|null} lastStepDir - Последнее направление шага
 * @property {Audio[]} activeEffectSounds - Массив активных звуков эффектов
 */
class SoundManager {
  constructor() {
    this.sounds = {};
    this.volume = 0.3;
    this.isMuted = false;
    this.isInitialized = false;
    this._hasLoadError = false;
    
    this.stepCooldown = 0;
    this.stepInterval = 25;
    this.lastStepDir = null;
    
    // Отслеживаем активные звуки эффектов для остановки
    this.activeEffectSounds = [];
  }

  /**
   * Инициализация звукового менеджера
   * Загружает все звуковые эффекты
   * 
   * @returns {void}
   */
  init() {
    if (this.isInitialized) return;
    
    // Игрок
    this.loadSound('playerStep', 'music/sounds/playerStep.ogg');
    // Лабиринт
    this.loadSound('wallDestroy', 'music/sounds/wallDestroy.ogg');
    this.loadSound('torchActivate', 'music/sounds/torchActivate.ogg');
    this.loadSound('portalActivate', 'music/sounds/portalActivate.ogg');
    // Монстры
    this.loadSound('monsterDeath', 'music/sounds/monsterDeath.ogg');
    // Лавка торговца
    this.loadSound('shopBuyItem', 'music/sounds/shopBuyItem.ogg');
    // Ловушки
    this.loadSound('trapSpikeActivate', 'music/sounds/trapSpikeActivate.ogg');
    this.loadSound('trapIceActivate', 'music/sounds/trapIceActivate.ogg');
    this.loadSound('trapIceFinish', 'music/sounds/trapIceFinish.ogg');
    this.loadSound('trapLightningActivate', 'music/sounds/trapLightningActivate.ogg');
    this.loadSound('trapLightningEffect', 'music/sounds/trapLightningEffect.ogg');
    // Достижения
    this.loadSound('achievementCompleted', 'music/sounds/achievementCompleted.ogg');
    // Прочее
    this.loadSound('dodge', 'music/sounds/dodge.ogg');
    
    this.isInitialized = true;
  }

  /**
   * Загрузка звука по имени и пути
   * 
   * @param {string} name - Имя звука (ключ)
   * @param {string} path - Путь к аудио-файлу
   * @returns {void}
   */
  loadSound(name, path) {
    const audio = new Audio(path);
    audio.volume = this.isMuted ? 0 : this.volume;
    audio.preload = 'auto';
    
    // Обработчик ошибок с отказоустойчивостью
    audio.addEventListener('error', (e) => {
      if (!this._hasLoadError) {
        this._hasLoadError = true;
        console.warn(`⚠️ Не удалось загрузить звук "${name}":`, e);
        console.warn('🔇 Режим отказоустойчивости: звуковые эффекты могут работать нестабильно');
      }
    });
    
    this.sounds[name] = audio;
  }

  /**
   * Воспроизведение звука
   * 
   * @param {string} name - Имя звука
   * @param {number|null} [volumeMultiplier=null] - Множитель громкости (0-1)
   * @returns {void}
   */
  play(name, volumeMultiplier = null) {
    if (this.isMuted) return;
    if (!this.sounds[name]) {
      // Не выводим предупреждение при каждом вызове, только если звук действительно нужен
      return;
    }
    
    try {
      const audio = this.sounds[name];
      
      // Проверяем, есть ли у аудио src
      if (!audio.src || audio.src === '') {
        return;
      }
      
      audio.currentTime = 0;
      
      if (volumeMultiplier !== null) {
        audio.volume = Math.max(0, Math.min(1, this.volume * volumeMultiplier));
      } else {
        audio.volume = this.volume;
      }
      
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            // Не выводим ошибку каждый раз, чтобы не засорять консоль
          }
        });
      }
    } catch (err) {
      // Игнорируем ошибки воспроизведения
    }
  }

  /**
   * Запуск длительного эффекта с зацикливанием
   * Создаёт новый Audio-объект для независимого управления
   * 
   * @param {string} name - Имя звука
   * @param {number} [volumeMultiplier=0.3] - Множитель громкости (0-1)
   * @returns {Audio|null} - Объект Audio для управления или null при ошибке
   */
  playEffect(name, volumeMultiplier = 0.3) {
    if (this.isMuted) return null;
    if (!this.sounds[name]) return null;
    
    try {
      const audio = new Audio(this.sounds[name].src);
      audio.volume = this.isMuted ? 0 : this.volume * volumeMultiplier;
      audio.loop = true;
      audio.preload = 'auto';
      
      audio.addEventListener('ended', () => {
        this.stopEffectSound(audio);
      });
      
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            // Игнорируем ошибку
          }
          const index = this.activeEffectSounds.indexOf(audio);
          if (index !== -1) {
            this.activeEffectSounds.splice(index, 1);
          }
        });
      }
      
      this.activeEffectSounds.push(audio);
      
      return audio;
    } catch (err) {
      return null;
    }
  }

  /**
   * Остановка конкретного звука эффекта
   * 
   * @param {Audio} audio - Объект Audio для остановки
   * @returns {void}
   */
  stopEffectSound(audio) {
    if (!audio) return;
    
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      audio.onended = null;
      
      const index = this.activeEffectSounds.indexOf(audio);
      if (index !== -1) {
        this.activeEffectSounds.splice(index, 1);
      }
      
      audio.src = '';
      audio.load();
    } catch (err) {
      // Игнорируем
    }
  }

  /**
   * Остановка всех активных звуков эффектов
   * 
   * @returns {void}
   */
  stopAllEffects() {
    for (const audio of this.activeEffectSounds) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
        audio.onended = null;
        audio.src = '';
        audio.load();
      } catch (err) {
        // Игнорируем
      }
    }
    this.activeEffectSounds = [];
  }

  /**
   * Воспроизведение звука шага с учётом кулдауна
   * 
   * @param {string|null} [dir=null] - Направление движения ('up', 'down', 'left', 'right')
   * @returns {void}
   */
  playStep(dir = null) {
    if (this.isMuted) return;
    if (this.stepCooldown > 0) return;
    if (!this.sounds.playerStep) return;
    if (typeof state !== 'undefined' && state.isShopOpen) return;
    
    if (!this._isPlayerMoving()) return;
    
    this.lastStepDir = dir;
    this.stepCooldown = this.stepInterval;
    
    const randomMultiplier = 0.85 + Math.random() * 0.15;
    this.play('playerStep', randomMultiplier);
  }

  /**
   * Обновление кулдауна шагов
   * Вызывается каждый кадр
   * 
   * @returns {void}
   */
  updateSteps() {
    if (this.stepCooldown > 0) {
      this.stepCooldown--;
    }
  }

  /**
   * Проверка, движется ли игрок
   * 
   * @returns {boolean} - true, если игрок движется
   * @private
   */
  _isPlayerMoving() {
    if (typeof state === 'undefined' || !state.keys) return false;
    return state.keys['w'] || state.keys['arrowup'] ||
           state.keys['s'] || state.keys['arrowdown'] ||
           state.keys['a'] || state.keys['arrowleft'] ||
           state.keys['d'] || state.keys['arrowright'];
  }

  /**
   * Переключение звука (вкл/выкл)
   * 
   * @returns {void}
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this._updateAllVolumes();
  }

  /**
   * Установка громкости
   * 
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this._updateAllVolumes();
  }

  /**
   * Обновление громкости всех звуков
   * 
   * @returns {void}
   * @private
   */
  _updateAllVolumes() {
    const targetVolume = this.isMuted ? 0 : this.volume;
    
    for (const key in this.sounds) {
      if (this.sounds[key]) {
        this.sounds[key].volume = targetVolume;
      }
    }
  }

  /**
   * Принудительное обновление громкости
   * Публичный метод для синхронизации
   * 
   * @returns {void}
   */
  updateVolume() {
    this._updateAllVolumes();
  }

  /**
   * Сброс звукового менеджера в начальное состояние
   * 
   * @returns {void}
   */
  reset() {
    this.isMuted = false;
    this.stepCooldown = 0;
    this.lastStepDir = null;
    this.stopAllEffects();
    this._updateAllVolumes();
  }
}

/** @type {SoundManager} - Экспортируемый экземпляр менеджера звуков */
export const sound = new SoundManager();