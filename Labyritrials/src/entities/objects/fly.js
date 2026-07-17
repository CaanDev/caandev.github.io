/**
 * @fileoverview Система мух над сундуками-мимиками.
 * Мухи служат визуальным индикатором того, что сундук является мимиком.
 * 
 * @module entities/objects/fly
 */

import { state } from '../../core/config/index.js';

/**
 * Создание мух над сундуком-мимиком
 * 
 * @param {number} x - Координата X сундука (пиксели)
 * @param {number} y - Координата Y сундука (пиксели)
 * @returns {void}
 */
export function createFlies(x, y) {
  if (state.isBossLevel) return;

  if (!state.flies) state.flies = [];

  // Проверяем, есть ли уже мухи в этой позиции
  const existingFlies = state.flies.filter(fly =>
    Math.abs(fly.startX - x) < 10 && Math.abs(fly.startY - y) < 10
  );

  if (existingFlies.length > 0) {
    return;
  }

  const flyCount = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < flyCount; i++) {
    state.flies.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y - 20 - Math.random() * 30,
      startX: x,
      startY: y,
      radius: 20,
      angle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      radiusOffset: 15 + Math.random() * 20,
      life: Infinity,
      size: 1 + Math.random(),
      flickerPhase: Math.random() * Math.PI * 2
    });
  }
}

/**
 * Обновление позиций мух
 * Вызывается каждый кадр
 * 
 * @returns {void}
 */
export function updateFlies() {
  if (!state.flies) return;

  for (let fly of state.flies) {
    fly.angle += fly.speed;
    fly.x = fly.startX + Math.cos(fly.angle) * fly.radiusOffset;
    fly.y = fly.startY - 25 + Math.sin(fly.angle * 1.5) * fly.radiusOffset * 0.5;
  }
}

/**
 * Удаление мух у сундука
 * 
 * @param {number} x - Координата X сундука (пиксели)
 * @param {number} y - Координата Y сундука (пиксели)
 * @returns {void}
 */
export function removeFlies(x, y) {
  if (!state.flies) return;

  for (let i = state.flies.length - 1; i >= 0; i--) {
    if (Math.abs(state.flies[i].startX - x) < 50 &&
        Math.abs(state.flies[i].startY - y) < 50) {
      state.flies.splice(i, 1);
    }
  }
}

/**
 * Очистка всех мух
 * 
 * @returns {void}
 */
export function clearAllFlies() {
  if (state.flies) {
    state.flies = [];
  }
}