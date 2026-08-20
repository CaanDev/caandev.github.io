/**
 * @fileoverview Менеджер звуковых эффектов
 * @module audio/sounds/soundManager
 */

import { soundLoader } from './soundLoader.js';
import { getSoundConfig, hasSound } from './soundConfig.js';
import { logger } from '../../utils/logger.js';
import { state } from '../../core/config/state.js';

/**
 * @class SoundManager
 * @description Управление воспроизведением звуковых эффектов
 */
class SoundManager {
  constructor() {
    /** @type {number} - Текущая громкость (0-1) */
    this.volume = 0.3;
    /** @type {boolean} - Выключен ли звук */
    this.isMuted = false;
    /** @type {boolean} - Инициализирован ли менеджер */
    this.initialized = false;
    /** @type {boolean} - Флаг ошибки загрузки */
    this._hasLoadError = false;

    /** @type {number} - Текущий кулдаун шагов */
    this.stepCooldown = 0;
    /** @type {number} - Интервал между шагами в кадрах */
    this.stepInterval = 28;
    /** @type {string|null} - Последнее направление шага */
    this.lastStepDir = null;

    /** @type {string} - Кэш последнего использованного звука шага */
    this._lastStepKey = null;

    /** @type {Audio|null} - Звук низкого HP (сердцебиение) */
    this.lowHPSound = null;
    /** @type {boolean} - Активен ли звук низкого HP */
    this.lowHPActive = false;
    /** @type {number} - Текущий темп сердцебиения (множитель скорости) */
    this.currentLowHPSpeed = 1.0;
    /** @type {number} - Целевой темп сердцебиения */
    this.targetLowHPSpeed = 1.0;
    /** @type {number} - Скорость плавного изменения темпа */
    this.lowHPSpeedSmoothness = 0.03;
    /** @type {number} - Прогресс затухания (0-1) */
    this.lowHPFadeProgress = 0;
    /** @type {boolean} - Идёт ли затухание */
    this.lowHPIsFading = false;

    /** @type {Audio[]} - Активные звуки эффектов для остановки */
    this.activeEffectSounds = [];
  }

  /**
   * Инициализация менеджера звуков
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;
    await soundLoader.init();
    this.initialized = true;
  }

  /**
   * Воспроизведение звука
   * @param {string} key - Ключ звука (например, 'interactions.wallDestroy')
   * @param {number|null} volumeMultiplier - Множитель громкости (0-1)
   * @returns {Promise<void>}
   */
  async play(key, volumeMultiplier = null) {
    if (this.isMuted) return;

    if (!this.initialized) {
      await this.init();
    }

    if (!hasSound(key)) {
      return;
    }

    // Проверяем, загружен ли звук
    let audio = soundLoader.getSound(key);

    if (!audio) {
      // Ленивая загрузка
      audio = await soundLoader.loadSound(key);
      if (!audio) return;
    }

    try {
      audio.currentTime = 0;

      const config = getSoundConfig(key);
      const baseVolume = config?.volume || 0.3;
      
      // Если передан множитель — применяем его к базовой громкости
      // Иначе используем только базовую громкость
      if (volumeMultiplier !== null) {
        audio.volume = Math.max(0, Math.min(1, this.volume * baseVolume * volumeMultiplier));
      } else {
        audio.volume = this.volume * baseVolume;
      }

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    } catch (err) {
      // Игнорируем ошибки воспроизведения
    }
  }

  /**
   * Запуск длительного эффекта с зацикливанием
   * @param {string} key - Ключ звука
   * @param {number} volumeMultiplier - Множитель громкости (0-1)
   * @returns {Audio|null} - Объект Audio для управления или null
   */
  playEffect(key, volumeMultiplier = 0.3) {
    if (this.isMuted) return null;

    // Проверяем, есть ли звук
    const config = getSoundConfig(key);
    if (!config) return null;

    try {
      const audio = new Audio(config.path);
      audio.volume = this.isMuted ? 0 : this.volume * volumeMultiplier;
      audio.loop = true;
      audio.preload = 'auto';

      // Если это звук lowHP — не добавляем в activeEffectSounds
      // Он управляется отдельно через updateLowHPSound
      if (key === 'player.lowHP') {
        return audio;
      }

      audio.addEventListener('ended', () => {
        this.stopEffectSound(audio);
      });

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            // Игнорируем
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
   * @returns {void}
   */
  stopAllEffects() {
    // Останавливаем эффекты
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
    
    // Останавливаем lowHP
    this.stopLowHPSound();
  }

  /**
   * Определение типа поверхности для звука шага
   * @returns {string} - Ключ поверхности ('stone', 'snow', 'sand')
   * @private
   */
  _getSurfaceType() {
    // Если игра только загружена — используем камень (безопасное значение)
    if (state.justLoaded) return 'stone';
    // В безопасной комнате, тайных комнатах и на босс-уровнях — камень
    if (state.inSafeRoom || state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.isBossLevel) return 'stone';

    // В обычном лабиринте — в зависимости от биома
    const biome = state.currentBiome || 'cave';
    
    switch (biome) {
      case 'ice':
        return 'snow';
      case 'sand':
        return 'sand';
      case 'cave':
      default:
        return 'stone';
    }
  }

  /**
   * Получение ключа звука шага для текущей поверхности
   * @returns {string} - Ключ звука шага
   * @private
   */
  _getStepSoundKey() {
    const surface = this._getSurfaceType();
    
    // Соответствие поверхность → ключ звука
    const surfaceMap = {
      stone: 'player.steps.stone',
      snow: 'player.steps.snow',
      sand: 'player.steps.sand',
    };

    return surfaceMap[surface] || 'player.steps.stone';
  }

  /**
   * Воспроизведение звука шага с учётом кулдауна
   * @param {string|null} dir - Направление движения
   * @returns {void}
   */
  playStep(dir = null) {
    if (this.isMuted) return;
    if (this.stepCooldown > 0) return;
    if (typeof state !== 'undefined' && state.isShopOpen) return;

    if (!this._isPlayerMoving()) return;

    this.lastStepDir = dir;
    this.stepCooldown = this.stepInterval;

    // Получаем правильный звук шага для текущей поверхности
    const stepKey = this._getStepSoundKey();

    // Проверяем, существует ли звук в конфигурации
    if (!hasSound(stepKey)) {
      // Fallback на камень
      this.play('player.steps.stone', 0.3);
      return;
    }

    const randomMultiplier = 0.85 + Math.random() * 0.15;
    this.play(stepKey, randomMultiplier);
  }

  /**
   * Обновление кулдауна шагов
   * @returns {void}
   */
  updateSteps() {
    if (this.stepCooldown > 0) {
      this.stepCooldown--;
    }
  }

  /**
   * Проверка, движется ли игрок
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
 * Определение целевой скорости сердцебиения на основе HP
 * 
 * @param {number} hpPercent - Процент HP (0-1)
 * @returns {number} - Множитель скорости (playbackRate)
 * @private
 */
_getTargetLowHPSpeed(hpPercent) {
  // HP >= 35% — звук не должен играть
  if (hpPercent >= 0.35) return 0;
  
  // ===== ЗОНА 1: 30-35% =====
  // 35% -> 0.40x, 30% -> 0.45x
  if (hpPercent >= 0.30) {
    const t = (0.35 - hpPercent) / 0.05;
    return 0.40 + t * 0.05;
  }
  
  // ===== ЗОНА 2: 25-30% =====
  // 30% -> 0.45x, 25% -> 0.50x
  if (hpPercent >= 0.25) {
    const t = (0.30 - hpPercent) / 0.05;
    return 0.45 + t * 0.05;
  }
  
  // ===== ЗОНА 3: 20-25% =====
  // 25% -> 0.50x, 20% -> 0.55x
  if (hpPercent >= 0.20) {
    const t = (0.25 - hpPercent) / 0.05;
    return 0.50 + t * 0.05;
  }
  
  // ===== ЗОНА 4: 15-20% =====
  // 20% -> 0.55x, 15% -> 0.60x
  if (hpPercent >= 0.15) {
    const t = (0.20 - hpPercent) / 0.05;
    return 0.55 + t * 0.05;
  }
  
  // ===== ЗОНА 5: 10-15% =====
  // 15% -> 0.60x, 10% -> 0.70x
  if (hpPercent >= 0.10) {
    const t = (0.15 - hpPercent) / 0.05;
    return 0.60 + t * 0.10;
  }
  
  // ===== ЗОНА 6: 5-10% =====
  // 10% -> 0.70x, 5% -> 0.90x
  if (hpPercent >= 0.05) {
    const t = (0.10 - hpPercent) / 0.05;
    return 0.70 + t * 0.20;
  }
  
  // HP < 5% — максимальное
  return 0.90;
}

  /**
   * Проверка, должно ли играть сердцебиение
   * @param {number} hpPercent - Процент HP (0-1)
   * @returns {boolean} - true, если звук должен играть
   * @private
   */
  _shouldPlayLowHP(hpPercent) {
    // Игрок жив
    if (hpPercent <= 0) return false;
    // HP < 50%
    return hpPercent < 0.50;
  }

  /**
   * Проверка, открыто ли любое модальное окно (кроме паузы)
   * @returns {boolean}
   * @private
   */
  _isAnyModalOpen() {
    // Пауза обрабатывается отдельно через принудительную остановку в pauseMenu.js
    // Поэтому здесь проверяем только остальные окна
    const modalSelectors = [
      'achievements-ui',
      'game-over-ui',
      'final-screen-ui',
      'level-up-ui',
      'settings-ui',
      'shop-ui',
      'inventory-ui',
      'bookshelf-ui',
      'note-reader'
    ];
    
    for (const id of modalSelectors) {
      const el = document.getElementById(id);
      if (el) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Проверка, можно ли воспроизводить звук lowHP в текущем состоянии
   * @returns {boolean} - true, если можно играть
   * @private
   */
  _canPlayLowHP() {
    if (this.isMuted) return false;
    
    const modalOpen = this._isAnyModalOpen();
    return !modalOpen;
  }

  /**
   * Обновление состояния звука низкого HP (сердцебиение)
   * Вызывается каждый кадр
   * @param {number} hpPercent - Процент HP игрока (0-1)
   * @returns {void}
   */
  updateLowHPSound(hpPercent) {
    // Проверяем, должен ли звук играть
    const shouldPlay = this._shouldPlayLowHP(hpPercent) && this._canPlayLowHP();
    
    // Если не должен играть
    if (!shouldPlay) {
      // Если звук активен — запускаем затухание
      if (this.lowHPActive || this.lowHPIsFading) {
        this._startLowHPFade();
      }
      return;
    }

    // Если звук должен играть, но он не активен — создаём
    if (!this.lowHPActive || !this.lowHPSound) {
      const targetSpeed = this._getTargetLowHPSpeed(hpPercent);
      this._startLowHPSound(targetSpeed);
      return;
    }

    // Если звук активен, но мы в состоянии, где он не должен играть — останавливаем
    if (!this._canPlayLowHP()) {
      if (this.lowHPActive || this.lowHPIsFading) {
        this._startLowHPFade();
      }
      return;
    }

    // Плавно меняем темп (существующая логика)
    const targetSpeed = this._getTargetLowHPSpeed(hpPercent);
    this.targetLowHPSpeed = targetSpeed;
    const diff = this.targetLowHPSpeed - this.currentLowHPSpeed;
    
    if (Math.abs(diff) > 0.01) {
      this.currentLowHPSpeed += Math.sign(diff) * Math.min(this.lowHPSpeedSmoothness, Math.abs(diff));
    } else {
      this.currentLowHPSpeed = this.targetLowHPSpeed;
    }

    if (this.lowHPSound) {
      try {
        this.lowHPSound.playbackRate = this.currentLowHPSpeed;
      } catch (e) {
        // Игнорируем
      }
    }
  }

  /**
   * Запуск звука сердцебиения
   * @param {number} initialSpeed - Начальная скорость
   * @returns {void}
   * @private
   */
  _startLowHPSound(initialSpeed) {
    // Если уже есть старый звук — останавливаем
    if (this.lowHPSound) {
      try {
        this.lowHPSound.pause();
        this.lowHPSound = null;
      } catch (e) {
        // Игнорируем
      }
    }

    const config = getSoundConfig('player.lowHP');
    if (!config) return;

    try {
      const audio = new Audio(config.path);
      audio.loop = true;
      audio.volume = 0; // Начинаем с 0 для плавного появления
      audio.playbackRate = initialSpeed || 1.0;
      
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
      
      this.lowHPSound = audio;
      this.lowHPActive = true;
      this.lowHPIsFading = false;
      this.currentLowHPSpeed = initialSpeed || 1.0;
      this.targetLowHPSpeed = initialSpeed || 1.0;
      this.lowHPFadeProgress = 0;
      
      // Плавно увеличиваем громкость до целевой
      this._fadeLowHPVolume(0, config.volume || 0.4);
      
    } catch (err) {
      logger.warn('⚠️ Не удалось запустить звук сердцебиения:', err);
    }
  }

  /**
   * Плавное изменение громкости сердцебиения
   * @param {number} from - Начальная громкость (0-1)
   * @param {number} to - Конечная громкость (0-1)
   * @param {number} duration - Длительность в мс
   * @returns {void}
   * @private
   */
  _fadeLowHPVolume(from, to, duration = 500) {
    if (!this.lowHPSound) return;
    
    const startTime = Date.now();
    const startVolume = from;
    const targetVolume = to;
    
    const fadeStep = () => {
      if (!this.lowHPSound || !this.lowHPActive) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Плавная кривая
      const smoothProgress = progress * progress * (3 - 2 * progress); // smoothstep
      const currentVolume = startVolume + (targetVolume - startVolume) * smoothProgress;
      
      try {
        this.lowHPSound.volume = currentVolume;
      } catch (e) {
        // Игнорируем
      }
      
      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      }
    };
    
    fadeStep();
  }

  /**
   * Запуск затухания звука сердцебиения
   * @returns {void}
   * @private
   */
  _startLowHPFade() {
    if (this.lowHPIsFading) return;
    if (!this.lowHPSound || !this.lowHPActive) {
      this.lowHPActive = false;
      this.lowHPSound = null;
      return;
    }
    
    this.lowHPIsFading = true;
    this.lowHPFadeProgress = 0;
    
    const startVolume = this.lowHPSound.volume || 0.4;
    const startTime = Date.now();
    const duration = 800; // 0.8 секунды на затухание
    
    const fadeStep = () => {
      if (!this.lowHPSound) {
        this.lowHPActive = false;
        this.lowHPIsFading = false;
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Плавное затухание
      const currentVolume = startVolume * (1 - progress);
      
      try {
        this.lowHPSound.volume = currentVolume;
      } catch (e) {
        // Игнорируем
      }
      
      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      } else {
        // Полностью останавливаем
        try {
          this.lowHPSound.pause();
          this.lowHPSound = null;
        } catch (e) {
          // Игнорируем
        }
        this.lowHPActive = false;
        this.lowHPIsFading = false;
      }
    };
    
    fadeStep();
  }

  /**
   * Остановка звука сердцебиения (мгновенно)
   * @returns {void}
   */
  stopLowHPSound() {
    if (this.lowHPSound) {
      try {
        this.lowHPSound.pause();
        this.lowHPSound = null;
      } catch (e) {
        // Игнорируем
      }
    }
    this.lowHPActive = false;
    this.lowHPIsFading = false;
    this.currentLowHPSpeed = 1.0;
    this.targetLowHPSpeed = 1.0;
  }

  /**
   * Переключение звука (вкл/выкл)
   * @returns {void}
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this._updateAllVolumes();
  }

  /**
   * Установка громкости
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this._updateAllVolumes();
  }

  /**
   * Обновление громкости всех звуков в кэше
   * @returns {void}
   * @private
   */
  _updateAllVolumes() {
    const targetVolume = this.isMuted ? 0 : this.volume;

    // Проверяем, что soundLoader.getAllLoaded() существует и возвращает Map
    const loadedSounds = soundLoader.getAllLoaded?.() || new Map();
    
    for (const [key, audio] of loadedSounds) {
      const config = getSoundConfig(key);
      const baseVolume = config?.volume || 0.3;
      audio.volume = targetVolume * baseVolume;
    }
    
    // Обновляем громкость lowHP звука, если он активен
    if (this.lowHPSound && this.lowHPActive) {
      const config = getSoundConfig('player.lowHP');
      const baseVolume = config?.volume || 0.4;
      this.lowHPSound.volume = targetVolume * baseVolume * (1 - this.lowHPFadeProgress);
    }
  }

  /**
   * Принудительное обновление громкости (публичный метод)
   * @returns {void}
   */
  updateVolume() {
    this._updateAllVolumes();
  }

  /**
   * Сброс менеджера в начальное состояние
   * @returns {void}
   */
  reset() {
    this.isMuted = false;
    this.stepCooldown = 0;
    this.lastStepDir = null;
    this.stopAllEffects();
    this.stopLowHPSound();
    this._updateAllVolumes();
  }

  /**
   * Получение статуса загрузки звука
   * @param {string} key - Ключ звука
   * @returns {boolean} - true, если звук загружен
   */
  isSoundLoaded(key) {
    return soundLoader.isLoaded(key);
  }
}

/** @type {SoundManager} - Экземпляр менеджера звуков */
export const sound = new SoundManager();