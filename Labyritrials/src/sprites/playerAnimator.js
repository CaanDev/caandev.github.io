/**
 * @fileoverview Анимационный контроллер игрока
 * @module sprites/PlayerAnimator
 */

import { getDirectionIndex, getDirectionName, getSpriteConfig } from './spriteConfig.js';
import { spriteAtlas } from './spriteAtlas.js';

/**
 * @class PlayerAnimator
 * @description Управляет анимациями игрока: переключение состояний, кадры, направления
 */
export class PlayerAnimator {
  constructor() {
    /** @type {string} - Текущее состояние ('idle', 'walk', 'attack') */
    this.currentState = 'idle';
    /** @type {string} - Предыдущее состояние */
    this.previousState = 'idle';
    /** @type {number} - Текущий индекс направления (0-7) */
    this.directionIndex = 0;
    /** @type {number} - Текущий индекс кадра в направлении */
    this.frameIndex = 0;
    /** @type {number} - Накопленное время для анимации (мс) */
    this.elapsedTime = 0;
    /** @type {number} - Время последнего обновления (мс) */
    this.lastUpdateTime = 0;
    /** @type {boolean} - Играет ли анимация атаки */
    this.isAttacking = false;
    /** @type {Function|null} - Колбэк завершения атаки */
    this.attackCallback = null;
    /** @type {number} - Количество кадров в атаке (для определения конца) */
    this.attackTotalFrames = 0;
    /** @type {number} - Текущий проигранный кадр атаки */
    this.attackFrameCount = 0;
    /** @type {Object} - Кэш последнего спрайта */
    this._lastSprite = null;
    /** @type {number} - Время начала атаки (для страховочного таймера) */
    this._attackStartTime = undefined;
    
    // ===== ЗАМОРОЗКА =====
    /** @type {boolean} - Заморожена ли анимация */
    this.isFrozen = false;
    /** @type {string} - Сохранённое состояние при заморозке */
    this.frozenState = 'idle';
    /** @type {number} - Сохранённый индекс направления при заморозке */
    this.frozenDirectionIndex = 0;
    /** @type {number} - Сохранённый индекс кадра при заморозке */
    this.frozenFrameIndex = 0;
    /** @type {Object} - Сохранённый спрайт при заморозке */
    this.frozenSprite = null;
  }

  /**
   * Загрузка всех спрайтов
   * @param {Function} onProgress - Колбэк прогресса
   * @returns {Promise<void>}
   */
  async loadSprites(onProgress = null) {
    await spriteAtlas.loadAll(onProgress);
  }

  /**
   * Установка состояния заморозки анимации
   * @param {boolean} frozen - Заморозить ли анимацию
   * @param {Object} [currentSprite] - Текущий спрайт для сохранения
   * @returns {void}
   */
  setFrozen(frozen, currentSprite = null) {
    if (frozen && !this.isFrozen) {
      // Замораживаем анимацию — сохраняем текущее состояние
      this.isFrozen = true;
      this.frozenState = this.currentState;
      this.frozenDirectionIndex = this.directionIndex;
      this.frozenFrameIndex = this.frameIndex;
      this.frozenSprite = currentSprite || this._lastSprite || this.getCurrentFrame();
    } else if (!frozen && this.isFrozen) {
      // Размораживаем анимацию
      this.isFrozen = false;
      this.frozenState = 'idle';
      this.frozenDirectionIndex = 0;
      this.frozenFrameIndex = 0;
      this.frozenSprite = null;
      // Сбрасываем кэш, чтобы следующий кадр пересчитался
      this._lastSprite = null;
    }
  }

  /**
   * Проверка, заморожена ли анимация
   * @returns {boolean} - true, если анимация заморожена
   */
  isFrozenAnimation() {
    return this.isFrozen;
  }

  /**
   * Обновление состояния анимации
   * @param {string} state - Новое состояние ('idle', 'walk', 'attack')
   * @param {number} dirX - Направление по X (-1, 0, 1)
   * @param {number} dirY - Направление по Y (-1, 0, 1)
   * @param {number} deltaTime - Время с последнего обновления (мс)
   * @param {Function} onAttackComplete - Колбэк при завершении атаки
   * @param {boolean} isStrong - Усиленная ли атака
   * @returns {void}
   */
  update(state, dirX, dirY, deltaTime, onAttackComplete = null, isStrong = false) {
    // ===== ЕСЛИ АНИМАЦИЯ ЗАМОРОЖЕНА — НЕ ОБНОВЛЯЕМ =====
    if (this.isFrozen) return;

    // ===== ОБРАБОТКА АТАКИ (всегда в приоритете) =====
    if (this.isAttacking) {
      const config = getSpriteConfig('attack');
      // Базовая скорость атаки — 18 FPS
      let fps = config.fps;
      // Для обычной атаки ускоряем до 24 FPS (на 33% быстрее)
      if (!isStrong) fps = 24;
      const frameDuration = 1000 / fps;

      // Накапливаем время
      this.elapsedTime += deltaTime;
      
      // Проверяем, нужно ли переключить кадр
      if (this.elapsedTime >= frameDuration) {
        this.elapsedTime = 0;
        this.frameIndex++;
        this.attackFrameCount++;

        // Проверяем завершение атаки
        if (this.attackFrameCount >= this.attackTotalFrames) {
          // Атака завершена
          this.isAttacking = false;
          this.frameIndex = 0;
          this.currentState = 'idle';
          this._lastSprite = null;
          this._attackStartTime = undefined;

          // Сбрасываем луч атаки
          import('../systems/rendering/player/trailManager.js').then(({ clearAttackTrails }) => {
            clearAttackTrails();
          });
          
          if (this.attackCallback) {
            this.attackCallback();
            this.attackCallback = null;
          }
          return;
        }
        this._lastSprite = null;
      }

      // Страховочный таймер
      // Если атака длится слишком долго (> 2 секунды) — принудительно завершаем
      if (this.attackFrameCount > 0 && this.attackFrameCount < this.attackTotalFrames) {
        // Проверяем, не зависла ли анимация
        if (this._attackStartTime === undefined) {
          this._attackStartTime = Date.now();
        }
        
        const elapsed = Date.now() - this._attackStartTime;
        // Если прошло больше 2 секунд, а анимация не завершилась — форсируем завершение
        if (elapsed > 2000) {
          this.isAttacking = false;
          this.frameIndex = 0;
          this.currentState = 'idle';
          this._lastSprite = null;
          this._attackStartTime = undefined;
          
          import('../systems/rendering/player/trailManager.js').then(({ clearAttackTrails }) => {
            clearAttackTrails();
          });
          
          if (this.attackCallback) {
            this.attackCallback();
            this.attackCallback = null;
          }
          return;
        }
      } else {
        // Сбрасываем таймер при начале новой атаки
        this._attackStartTime = undefined;
      }
      
      // Атака продолжается — не меняем состояние
      return;
    }

    // ===== НАЧАЛО АТАКИ =====
    if (state === 'attack' && !this.isAttacking) {
      // Начинаем атаку
      this.isAttacking = true;
      this.attackFrameCount = 0;
      this.attackCallback = onAttackComplete || null;
      // Запоминаем время начала
      this._attackStartTime = Date.now();
      
      const config = getSpriteConfig('attack');
      this.attackTotalFrames = config.framesPerDirection;
      
      // Сбрасываем таймер, чтобы анимация началась с первого кадра
      this.elapsedTime = 0;
      this.frameIndex = 0;
      
      this.currentState = 'attack';
      this._lastSprite = null;
      return;
    }

    // ===== ОБНОВЛЕНИЕ НАПРАВЛЕНИЯ =====
    const newDirection = getDirectionIndex(dirX, dirY);
    const directionChanged = newDirection !== this.directionIndex;
    this.directionIndex = newDirection;

    // ===== ОБНОВЛЕНИЕ СОСТОЯНИЯ =====
    // Проверяем смену состояния (только если не атака)
    if (state !== this.currentState) {
      this.currentState = state;
      this.frameIndex = 0;
      this.elapsedTime = 0;
      this._lastSprite = null;
    }

    // ===== ОБНОВЛЕНИЕ КАДРА =====
    // Обновляем время (даже если направление изменилось)
    this.elapsedTime += deltaTime;

    // Если направление изменилось — сбрасываем кадр
    if (directionChanged) {
      this.frameIndex = 0;
      this.elapsedTime = 0;
      this._lastSprite = null;
    }

    // Обновляем кадр для walk / idle
    const config = getSpriteConfig(this.currentState);
    if (config) {
      const fps = config.fps;
      const frameDuration = 1000 / fps;
      
      if (this.elapsedTime >= frameDuration) {
        this.elapsedTime = 0;
        // Для idle всегда кадр 0
        if (this.currentState === 'idle') {
          this.frameIndex = 0;
        } else {
          this.frameIndex = (this.frameIndex + 1) % config.framesPerDirection;
        }
        this._lastSprite = null;
      }
    }
  }

  /**
   * Получение текущего кадра для отрисовки
   * @returns {Object|null} - Данные кадра {texture, sx, sy, sw, sh} или null
   */
  getCurrentFrame() {
    // Если анимация заморожена — возвращаем сохранённый спрайт
    if (this.isFrozen && this.frozenSprite) return this.frozenSprite;

    if (this._lastSprite) return this._lastSprite;

    const texture = spriteAtlas.getTexture(this.currentState);
    if (!texture) return null;

    // Для idle всегда используем первый кадр
    let frameIndex = this.frameIndex;
    if (this.currentState === 'idle') {
      frameIndex = 0;
    }

    const frameData = spriteAtlas.getFrame(
      this.currentState,
      this.directionIndex,
      frameIndex
    );

    if (!frameData) return null;

    this._lastSprite = {
      texture,
      sx: frameData.x,
      sy: frameData.y,
      sw: frameData.w,
      sh: frameData.h,
    };

    return this._lastSprite;
  }

  /**
   * Получение текущего состояния анимации
   * @returns {string} - Текущее состояние
   */
  getState() {
    return this.isFrozen ? this.frozenState : this.currentState;
  }

  /**
   * Проверка, идёт ли атака
   * @returns {boolean} - true, если атака активна
   */
  isAttackPlaying() {
    return this.isAttacking;
  }

  /**
   * Получение прогресса атаки (0-1)
   * @returns {number} - Прогресс атаки
   */
  getAttackProgress() {
    if (!this.isAttacking || this.attackTotalFrames === 0) return 0;
    return Math.min(1, this.attackFrameCount / this.attackTotalFrames);
  }

  /**
   * Сброс анимации в начальное состояние
   * @returns {void}
   */
  reset() {
    this.currentState = 'idle';
    this.previousState = 'idle';
    this.frameIndex = 0;
    this.elapsedTime = 0;
    this.isAttacking = false;
    this.attackFrameCount = 0;
    this.attackTotalFrames = 0;
    this.attackCallback = null;
    this._lastSprite = null;
    this._attackStartTime = undefined;

    // Сбрасываем состояние заморозки
    this.isFrozen = false;
    this.frozenState = 'idle';
    this.frozenDirectionIndex = 0;
    this.frozenFrameIndex = 0;
    this.frozenSprite = null;
  }
}

/** @type {PlayerAnimator|null} - Синглтон аниматора */
let animatorInstance = null;

/**
 * Получение экземпляра PlayerAnimator
 * @returns {PlayerAnimator} - Экземпляр аниматора
 */
export function getPlayerAnimator() {
  if (!animatorInstance) {
    animatorInstance = new PlayerAnimator();
  }
  return animatorInstance;
}

export const playerAnimator = getPlayerAnimator();