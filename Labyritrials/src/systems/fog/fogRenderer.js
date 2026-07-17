/**
 * @fileoverview Основной рендерер тумана войны.
 * Координирует отрисовку всех слоёв тумана: основной туман,
 * свет от факелов, эффекты событий и эффекты низкого здоровья.
 * 
 * @module systems/fog/fogRenderer
 */

import { state, player } from '../../core/config/index.js';
import { updateFogMemorySmart, forceUpdateAllFog } from './fogOptimizer.js';
import { updateDynamicRadius } from './fogCore.js';
import { drawMainFog } from './fogCore.js';
import { drawTorchLight, drawTorchWarmth, drawFireballLight } from './fogLight.js';
import { drawEventFogEffect } from './fogEvents.js';
import { drawLowHealthFogEffect, drawLowHealthVignette } from './fogHealth.js';

/** @type {number} - Счётчик кадров для рендерера */
let currentFrame = 0;

/**
 * Основная функция отрисовки тумана войны
 * 
 * В зависимости от типа комнаты выбирает набор слоёв для отрисовки:
 * - Босс-уровень, комната-ловушка, безопасная комната: только эффекты HP
 * - Сокровищница, комната с алтарём: туман + свет + эффекты HP
 * - Обычный лабиринт: полный набор (туман + свет + события + эффекты HP)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawFogOfWar(ctx, canvas) {
  currentFrame++;

  // ===== БОСС-УРОВЕНЬ, КОМНАТА-ЛОВУШКА, БЕЗОПАСНАЯ КОМНАТА =====
  if (state.isBossLevel || state.inTrapRoom || state.inSafeRoom) {
    // Только эффекты низкого здоровья
    drawLowHealthFogEffect(ctx, canvas);
    drawLowHealthVignette(ctx, canvas);
    return;
  }

  // ===== СОКРОВИЩНИЦА, КОМНАТА С АЛТАРЁМ =====
  if (state.inTreasureRoom || state.inShrineRoom) {
    // Туман + свет + эффекты HP (без событий)
    updateFogMemorySmart();
    updateDynamicRadius();
    drawMainFog(ctx, canvas);
    drawTorchLight(ctx, canvas);
    drawTorchWarmth(ctx, canvas);
    drawFireballLight(ctx, canvas);
    drawLowHealthFogEffect(ctx, canvas);
    drawLowHealthVignette(ctx, canvas);
    return;
  }

  // ===== ОБЫЧНЫЙ ЛАБИРИНТ =====
  // Полный набор: туман + свет + события + эффекты HP
  updateFogMemorySmart();
  updateDynamicRadius();
  drawMainFog(ctx, canvas);
  drawTorchLight(ctx, canvas);
  drawTorchWarmth(ctx, canvas);
  drawFireballLight(ctx, canvas);
  drawEventFogEffect(ctx, canvas);
  drawLowHealthFogEffect(ctx, canvas);
  drawLowHealthVignette(ctx, canvas);
}

/**
 * Полное обновление тумана (принудительно)
 * 
 * @returns {void}
 */
export function refreshFogCompletely() {
  forceUpdateAllFog();
}

/**
 * Экспорт функции обновления зон света
 * @see module:systems/fog/fogUtils
 */
export { updateLightZones } from './fogUtils.js';