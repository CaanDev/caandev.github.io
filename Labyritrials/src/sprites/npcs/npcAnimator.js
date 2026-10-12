/**
 * @fileoverview Аниматор NPC.
 * Управляет воспроизведением анимаций NPC с зацикливанием.
 * 
 * @module sprites/npcs/npcAnimator
 */

import { getNpcAnimationConfig, getNpcSpriteName } from './npcConfig.js';
import { getSprite } from '../spriteLoader.js';

/**
 * @class NpcAnimator
 * @description Аниматор одного NPC. Ведёт собственное состояние кадров.
 */
export class NpcAnimator {
  /**
   * @param {string} npcId - ID NPC ('researcher')
   * @param {string} [animation='write'] - Начальная анимация
   * @param {string} [direction='south'] - Начальное направление
   */
  constructor(npcId, animation = 'write', direction = 'south') {
    /** @type {string} - ID NPC */
    this.npcId = npcId;
    /** @type {string} - Текущая анимация */
    this.animation = animation;
    /** @type {string} - Текущее направление */
    this.direction = direction;
    /** @type {number} - Текущий индекс кадра */
    this.frameIndex = 0;
    /** @type {number} - Накопленное время (мс) */
    this.elapsedTime = 0;

    const config = getNpcAnimationConfig(npcId, animation);
    /** @type {number} - Количество кадров в текущей анимации */
    this.totalFrames = config ? config.framesPerDirection : 1;
    /** @type {number} - FPS анимации */
    this.fps = config ? config.fps : 8;
  }

  /**
   * Установка анимации.
   * 
   * @param {string} animation - Название анимации
   * @returns {void}
   */
  setAnimation(animation) {
    if (this.animation === animation) return;
    const config = getNpcAnimationConfig(this.npcId, animation);
    if (!config) return;

    this.animation = animation;
    this.totalFrames = config.framesPerDirection;
    this.fps = config.fps;
    this.frameIndex = 0;
    this.elapsedTime = 0;
  }

  /**
   * Установка направления.
   * 
   * @param {string} direction - Направление
   * @returns {void}
   */
  setDirection(direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.frameIndex = 0;
    this.elapsedTime = 0;
  }

  /**
   * Обновление анимации.
   * 
   * @param {number} deltaTime - Время с прошлого кадра (мс)
   * @returns {void}
   */
  update(deltaTime) {
    if (this.totalFrames <= 1) return;

    const frameDuration = 1000 / this.fps;
    this.elapsedTime += deltaTime;

    if (this.elapsedTime >= frameDuration) {
      this.elapsedTime = 0;
      this.frameIndex = (this.frameIndex + 1) % this.totalFrames;
    }
  }

  /**
   * Получение текущего спрайта (обрезанного) для отрисовки.
   * 
   * @returns {Object|null} - Спрайт { texture, sx, sy, sw, sh } или null
   */
  getCurrentFrame() {
    const spriteName = getNpcSpriteName(
      this.npcId,
      this.animation,
      this.direction,
      this.frameIndex
    );
    if (!spriteName) return null;

    const sprite = getSprite(spriteName);
    if (!sprite) return null;

    return {
      texture: sprite.texture,
      sx: sprite.x,
      sy: sprite.y,
      sw: sprite.w,
      sh: sprite.h,
    };
  }

  /**
   * Сброс анимации.
   * 
   * @returns {void}
   */
  reset() {
    this.frameIndex = 0;
    this.elapsedTime = 0;
  }
}

/**
 * Создание аниматора для NPC.
 * 
 * @param {string} npcId - ID NPC
 * @param {string} [animation='write'] - Начальная анимация
 * @param {string} [direction='south'] - Начальное направление
 * @returns {NpcAnimator} - Новый аниматор
 */
export function createNpcAnimator(npcId, animation = 'write', direction = 'south') {
  return new NpcAnimator(npcId, animation, direction);
}