/**
 * @fileoverview Менеджер фоновой музыки.
 * Управляет загрузкой, воспроизведением и переключением музыкальных треков.
 */

/**
 * Класс MusicManager — управление фоновой музыкой
 * 
 * @class MusicManager
 * @property {Audio|null} gameMusic - Аудио-объект для фоновой музыки игры
 * @property {Audio|null} menuMusic - Аудио-объект для музыки меню
 * @property {Audio|null} safeRoomMusic - Аудио-объект для музыки безопасной комнаты
 * @property {Audio|null} currentTrack - Текущий воспроизводимый трек
 * @property {boolean} isPlaying - Играет ли музыка в данный момент
 * @property {number} volume - Текущая громкость (0-1)
 * @property {boolean} isInitialized - Инициализирован ли менеджер
 * @property {number} playAttempts - Количество попыток воспроизведения
 * @property {number} maxPlayAttempts - Максимальное количество попыток
 * @property {boolean} isEnabled - Включена ли музыка
 * @property {string} currentMode - Текущий режим ('menu', 'game', 'safeRoom')
 * @property {boolean} _isLoading - Флаг загрузки
 * @property {boolean} _hasLoadError - Флаг ошибки загрузки
 * @property {boolean} _errorReported - Был ли отчёт об ошибке
 */
class MusicManager {
  constructor() {
    this.gameMusic = null;
    this.menuMusic = null;
    this.safeRoomMusic = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.4;
    this.isInitialized = false;
    this.playAttempts = 0;
    this.maxPlayAttempts = 5;
    this.isEnabled = true;
    this.currentMode = 'menu';
    this._isLoading = false;
    this._hasLoadError = false;
    this._errorReported = false;
  }

  /**
   * Инициализация музыкальных треков
   * Создаёт Audio-объекты и устанавливает обработчики ошибок
   * 
   * @returns {void}
   */
  init() {
    if (this.isInitialized) return;
    
    this.gameMusic = new Audio('music/themes/gameBackground.ogg');
    this.gameMusic.loop = true;
    this.gameMusic.volume = this.volume;
    this.gameMusic.preload = 'auto';
    
    this.menuMusic = new Audio('music/themes/mainMenu.ogg');
    this.menuMusic.loop = true;
    this.menuMusic.volume = this.volume;
    this.menuMusic.preload = 'auto';
    
    this.safeRoomMusic = new Audio('music/themes/safeRoom.ogg');
    this.safeRoomMusic.loop = true;
    this.safeRoomMusic.volume = this.volume;
    this.safeRoomMusic.preload = 'auto';
    
    // Обработчики ошибок с повторными попытками
    this.gameMusic.addEventListener('error', (e) => {
      console.warn('⚠️ Не удалось загрузить музыку игры:', e);
      this._handleLoadError('game');
    });
    
    this.menuMusic.addEventListener('error', (e) => {
      console.warn('⚠️ Не удалось загрузить музыку меню:', e);
      this._handleLoadError('menu');
    });
    
    this.safeRoomMusic.addEventListener('error', (e) => {
      console.warn('⚠️ Не удалось загрузить музыку безопасной комнаты:', e);
      this._handleLoadError('safeRoom');
    });
    
    this.isInitialized = true;
  }

  /**
   * Обработка ошибки загрузки аудио
   * Переводит менеджер в отказоустойчивый режим
   * 
   * @param {string} mode - Режим, в котором произошла ошибка
   * @returns {void}
   * @private
   */
  _handleLoadError(mode) {
    this._hasLoadError = true;
    if (!this._errorReported) {
      this._errorReported = true;
      console.warn('🔇 Режим отказоустойчивости: музыка отключена');
    }
    // Автоматически отключаем музыку при ошибке
    this.isEnabled = false;
    this.isPlaying = false;
    this._isLoading = false;
  }

  /**
   * Воспроизведение музыки в указанном режиме
   * 
   * @param {string} [mode='menu'] - Режим воспроизведения ('menu', 'game', 'safeRoom')
   * @returns {void}
   */
  play(mode = 'menu') {
    if (!this.isInitialized) return;
    if (!this.isEnabled) {
      this.currentMode = mode;
      return;
    }
    if (this._hasLoadError) {
      // Если была ошибка загрузки — не пытаемся воспроизводить
      return;
    }
    if (this._isLoading) return;
    if (this.currentMode === mode && this.isPlaying) return;
    
    this._isLoading = true;
    this.stop();
    
    this.currentMode = mode;
    let audio;
    
    switch (mode) {
      case 'menu':
        audio = this.menuMusic;
        break;
      case 'game':
        audio = this.gameMusic;
        break;
      case 'safeRoom':
        audio = this.safeRoomMusic;
        break;
      default:
        audio = this.menuMusic;
    }
    
    this.currentTrack = audio;
    
    if (!audio || !audio.src) {
      console.warn('⚠️ Аудио не инициализировано');
      this._isLoading = false;
      return;
    }

    // Проверяем, есть ли у аудио src (не пустой)
    if (!audio.src || audio.src === '') {
      console.warn('⚠️ Аудио файл не найден:', mode);
      this._isLoading = false;
      this._handleLoadError(mode);
      return;
    }
    
    setTimeout(() => {
      if (!this.isEnabled) {
        this._isLoading = false;
        return;
      }
      
      try {
        audio.currentTime = 0;
        const promise = audio.play();
        
        if (promise !== undefined) {
          promise
            .then(() => {
              this.isPlaying = true;
              this.playAttempts = 0;
              this._isLoading = false;
              this._hasLoadError = false; // Сбрасываем ошибку при успехе
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
              // Любая другая ошибка — включаем отказоустойчивый режим
              console.warn('⚠️ Ошибка воспроизведения музыки:', err.name, err.message);
              this._handleLoadError(mode);
            });
        } else {
          this._isLoading = false;
        }
      } catch (err) {
        this._isLoading = false;
        if (err.name !== 'AbortError') {
          console.warn('⚠️ Не удалось запустить музыку:', err.name);
          this._handleLoadError(mode);
        }
      }
    }, 50);
  }

  /**
   * Постановка музыки на паузу
   * 
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
        console.warn('⚠️ Не удалось поставить на паузу:', err);
      }
    }
  }

  /**
   * Возобновление воспроизведения музыки
   * 
   * @returns {void}
   */
  resume() {
    if (this.isPlaying) return;
    if (!this.isEnabled) return;
    if (!this.currentTrack) return;
    if (this._isLoading) return;
    if (this._hasLoadError) return; // Не возобновляем при ошибке
    
    try {
      const promise = this.currentTrack.play();
      
      if (promise !== undefined) {
        promise
          .then(() => {
            this.isPlaying = true;
          })
          .catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn('⚠️ Не удалось возобновить:', err);
              this._handleLoadError(this.currentMode);
            }
          });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('⚠️ Не удалось возобновить:', err);
        this._handleLoadError(this.currentMode);
      }
    }
  }

  /**
   * Полная остановка музыки с перемоткой на начало
   * 
   * @returns {void}
   */
  stop() {
    this._isLoading = false;
    
    try {
      if (this.gameMusic) {
        this.gameMusic.pause();
        this.gameMusic.currentTime = 0;
      }
      if (this.menuMusic) {
        this.menuMusic.pause();
        this.menuMusic.currentTime = 0;
      }
      if (this.safeRoomMusic) {
        this.safeRoomMusic.pause();
        this.safeRoomMusic.currentTime = 0;
      }
      this.isPlaying = false;
      this.currentTrack = null;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('⚠️ Не удалось остановить музыку:', err);
      }
    }
  }

  /**
   * Установка громкости музыки
   * 
   * @param {number} value - Громкость (0-1)
   * @returns {void}
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gameMusic) {
      this.gameMusic.volume = this.volume;
    }
    if (this.menuMusic) {
      this.menuMusic.volume = this.volume;
    }
    if (this.safeRoomMusic) {
      this.safeRoomMusic.volume = this.volume;
    }
  }

  /**
   * Проверка, играет ли музыка
   * 
   * @returns {boolean} - true, если музыка играет
   */
  isMusicPlaying() {
    return this.isPlaying;
  }

  /**
   * Включение/отключение музыки
   * 
   * @param {boolean} enabled - true — музыка включена
   * @returns {void}
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.pause();
    } else {
      if (this._hasLoadError) {
        // Если была ошибка — пробуем перезагрузить
        this._hasLoadError = false;
        this._errorReported = false;
        this.reload();
      } else if (this.currentTrack && this.currentTrack.src) {
        this.resume();
      } else {
        this.play(this.currentMode);
      }
    }
  }

  /**
   * Перезагрузка аудио-файлов
   * 
   * @returns {void}
   */
  reload() {
    // Перезагружаем аудио-файлы
    this._hasLoadError = false;
    this._errorReported = false;
    this._isLoading = false;
    
    // Сбрасываем источники
    if (this.gameMusic) {
      this.gameMusic.load();
    }
    if (this.menuMusic) {
      this.menuMusic.load();
    }
    if (this.safeRoomMusic) {
      this.safeRoomMusic.load();
    }
    
    // Пробуем воспроизвести заново
    setTimeout(() => {
      if (this.isEnabled) {
        this.play(this.currentMode);
      }
    }, 100);
  }

  /**
   * Обновление состояния музыки
   * Проверяет и восстанавливает воспроизведение при необходимости
   * 
   * @returns {void}
   */
  updateState() {
    if (this._hasLoadError) return; // Не пытаемся обновлять при ошибке
    
    if (this.isEnabled && !this.isPlaying && this.currentTrack && !this._isLoading) {
      this.resume();
    } else if (!this.isEnabled && this.isPlaying) {
      this.pause();
    }
  }

  /**
   * Установка режима музыки
   * 
   * @param {string} mode - Режим ('menu', 'game', 'safeRoom')
   * @returns {void}
   */
  setMode(mode) {
    if (this._hasLoadError) return; // Не переключаем при ошибке
    if (this.currentMode === mode && this.isPlaying) return;
    this.play(mode);
  }

  /**
   * Получение текущего режима музыки
   * 
   * @returns {string} - Текущий режим ('menu', 'game', 'safeRoom')
   */
  getMode() {
    return this.currentMode;
  }
}

/** @type {MusicManager} - Экспортируемый экземпляр менеджера музыки */
export const music = new MusicManager();