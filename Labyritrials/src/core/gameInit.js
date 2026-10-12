/**
 * @fileoverview Инициализация игрового мира.
 * Выполняет начальную настройку игры: генерацию лабиринта, сброс параметров игрока.
 */

import { generateMaze } from '../world/maze.js';
import { player, state } from './config/index.js';
import { Renderer } from './renderer.js';
import { teleportWispsToPlayer } from '../save/restorers/willOTheWispsRestorer.js';
import { audio } from '../audio/audioManager.js';
import { resetStressWindow } from '../systems/difficulty/index.js';

/**
 * @namespace GameInit
 * @description Объект для первичной инициализации игрового мира.
 * Создаёт лабиринт и устанавливает начальные параметры игрока.
 */
export const GameInit = {
  /** @type {CanvasRenderingContext2D|null} */
  ctx: null,
  /** @type {HTMLCanvasElement|null} */
  canvas: null,

  /**
   * Инициализация игрового мира
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {HTMLCanvasElement} canvas - Элемент холста
   * @returns {void}
   */
  init(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    // Принудительный сброс скорости при инициализации
    player.baseSpeed = 6;
    player.speed = 6;
    player.originalSpeed = undefined;

    // Сброс окна стресса и установка времени старта
    resetStressWindow();
    state.levelStartTime = Date.now();
    state.recentLevelDurations = [];

    // Восстановление выносливости
    player.stamina = player.maxStamina;
    player.lastAttackTime = 0;
    
    generateMaze();
    teleportWispsToPlayer();

    /**
     * Обработчик изменения размера окна
     * Обновляет позицию частиц золота при ресайзе
     * 
     * @listens window#resize
     */
    window.addEventListener('resize', () => {
      import('../systems/particles/goldParticles.js').then(module => {
        module.updateGoldParticlesTarget();
      });
    });
  }
};