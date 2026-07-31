/**
 * @fileoverview Ядро игрового движка.
 * Управляет игровым циклом, рендерингом, FPS и состояниями игры.
 */

import { updateUI } from '../systems/ui/index.js';
import { createGameLoop } from './gameLoop.js';
import { state } from './config/index.js';
import { startPlayTimeTracking, stopPlayTimeTracking, resetPlayTime, pausePlayTimeTracking, resumePlayTimeTracking } from '../game/playTimeTracker.js';
import { getSettings, updateFpsDisplay, shouldSkipFrame } from '../systems/ui/settings/index.js';

/**
 * @namespace Game
 * @description Главный объект управления игрой.
 * Содержит методы для инициализации, запуска/остановки игрового цикла,
 * управления FPS и состояниями игры.
 */
export const Game = {
  /** @type {CanvasRenderingContext2D|null} */
  ctx: null,
  /** @type {HTMLCanvasElement|null} */
  canvas: null,
  /** @type {number|null} */
  animationId: null,
  /** @type {boolean} */
  isRunning: false,
  /** @type {Function|null} */
  loopFunc: null,
  /** @type {number} */
  frameCount: 0,
  /** @type {number} */
  lastFpsUpdate: 0,
  /** @type {number} */
  currentFps: 0,
  /** @type {boolean} */
  vsyncEnabled: true,
  /** @type {number|null} */
  timeoutId: null,

  /**
   * Инициализация игры
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {HTMLCanvasElement} canvas - Элемент холста
   * @returns {void}
   */
  init(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    const settings = getSettings();
    this.vsyncEnabled = settings.vsyncEnabled !== false;
    
    import('./gameInit.js').then(module => {
      module.GameInit.init(ctx, canvas);
    });
    
    this.updateUI();
    
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;
  },

  /**
   * Запуск игрового цикла
   * 
   * @returns {void}
   */
  startLoop() {
    this.stopLoop();
    this.isRunning = true;

    startPlayTimeTracking();

    this.loopFunc = createGameLoop(() => this.updateUI(), this.ctx, this.canvas);
    
    // Выбираем режим рендеринга
    if (this.vsyncEnabled) {
      this._runVsyncLoop();
    } else {
      this._runUnlimitedLoop();
    }
  },

  /**
   * VSync-режим: синхронизация с монитором через requestAnimationFrame
   * 
   * @returns {void}
   * @private
   */
  _runVsyncLoop() {
    const self = this;
    
    function animate() {
      if (!self.isRunning) return;
      
      // Проверяем, не переключился ли режим
      const settings = getSettings();
      if (!settings.vsyncEnabled) {
        // Переключаемся на режим без VSync
        self.vsyncEnabled = false;
        self._runUnlimitedLoop();
        return;
      }
      
      // Проверяем FPS-лимит
      if (!shouldSkipFrame()) {
        if (self.loopFunc) self.loopFunc();
        self.updateFps();
      }
      
      self.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  },

  /**
   * Режим без VSync: максимальная производительность через setTimeout
   * 
   * @returns {void}
   * @private
   */
  _runUnlimitedLoop() {
    const self = this;
    
    function tick() {
      if (!self.isRunning) return;
      
      // Проверяем, не переключился ли режим
      const settings = getSettings();
      if (settings.vsyncEnabled) {
        // Переключаемся обратно на VSync
        self.vsyncEnabled = true;
        self._runVsyncLoop();
        return;
      }
      
      // Проверяем FPS-лимит
      if (!shouldSkipFrame()) {
        if (self.loopFunc) self.loopFunc();
        self.updateFps();
      }
      
      // Планируем следующий кадр как можно скорее
      self.timeoutId = setTimeout(tick, 0);
    };
    
    this.timeoutId = setTimeout(tick, 0);
  },

  /**
   * Остановка игрового цикла
   * 
   * @returns {void}
   */
  stopLoop() {
    this.isRunning = false;

    stopPlayTimeTracking();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    this.loopFunc = null;
  },

  /**
   * Пауза отслеживания времени игры
   * 
   * @returns {void}
   */
  pauseTime() {
    pausePlayTimeTracking();
  },

  /**
   * Возобновление отслеживания времени игры
   * 
   * @returns {void}
   */
  resumeTime() {
    resumePlayTimeTracking();
  },

  /**
   * Полный сброс игры
   * 
   * @returns {void}
   */
  fullReset() {
    this.stopLoop();

    resetPlayTime();
    
    import('./config/functions.js').then(module => {
      module.resetGameFull();
    });
    
    import('../world/mazeGenerator.js').then(module => {
      module.setSeed(null);
    });
    
    state.monsters = [];
    state.lootItems = [];
    state.traps = [];
    state.artifacts = [];
    state.chests = [];
    state.shrines = [];
    state.fireballs = [];
    state.damageTexts = [];
    state.torches = [];
    state.flies = [];
    state.bloodPuddles = [];
    state.sparks = [];
    
    this.updateUI();
  },

  /**
   * Показ финального экрана
   * 
   * @returns {void}
   */
  showFinalScreen() {
    import('../game/finalScreen.js').then(module => {
      module.showFinalScreen();
    });
  },

  /**
   * Обновление пользовательского интерфейса
   * 
   * @returns {void}
   */
  updateUI() {
    updateUI();
  },

  /**
   * Обновление FPS-счётчика
   * 
   * @returns {void}
   */
  updateFps() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastFpsUpdate;
    
    if (delta >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      updateFpsDisplay(this.currentFps);
    }
  }
};