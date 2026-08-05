/**
 * @fileoverview Система мух над сундуками-мимиками.
 * Мухи служат визуальным индикатором того, что сундук является мимиком.
 * 
 * @module entities/objects/fly
 */

import { state } from '../../core/config/index.js';

/**
 * Получение цвета мух в зависимости от биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {Object} - Цвета для мух
 */
function getFlyColors(biome) {
  // В тайных комнатах и безопасной комнате — цвет по умолчанию
  const isSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  
  if (isSecretRoom) {
    return {
      body: 'rgba(160, 160, 160, 0.8)',
      glow: 'rgba(140, 140, 140, 0.6)',
      wing: 'rgba(180, 180, 180, 0.4)',
    };
  }
  
  switch (biome) {
    case 'ice':
      return {
        body: 'rgba(200, 230, 255, 0.8)',
        glow: 'rgba(180, 220, 255, 0.6)',
        wing: 'rgba(220, 240, 255, 0.4)',
      };
    case 'sand':
      return {
        body: 'rgba(200, 180, 150, 0.8)',
        glow: 'rgba(190, 170, 140, 0.6)',
        wing: 'rgba(210, 200, 180, 0.4)',
      };
    case 'cave':
    default:
      return {
        body: 'rgba(160, 160, 160, 0.8)',
        glow: 'rgba(140, 140, 140, 0.6)',
        wing: 'rgba(180, 180, 180, 0.4)',
      };
  }
}

/**
 * Создание мух над сундуком-мимиком
 * 
 * @param {number} x - Координата X сундука (пиксели)
 * @param {number} y - Координата Y сундука (пиксели)
 * @param {string} [biome] - Биом (если не передан, используется state.currentBiome)
 * @returns {void}
 */
export function createFlies(x, y, biome = null) {
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
  const currentBiome = biome || state.currentBiome || 'cave';
  const colors = getFlyColors(currentBiome);

  for (let i = 0; i < flyCount; i++) {
    state.flies.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y - 20 - Math.random() * 30,
      startX: x,
      startY: y,
      radius: 20,
      angle: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
      radiusOffset: 15 + Math.random() * 20,
      life: Infinity,
      size: 1 + Math.random(),
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.003 + Math.random() * 0.003,
      // ===== ЦВЕТА В ЗАВИСИМОСТИ ОТ БИОМА =====
      bodyColor: colors.body,
      glowColor: colors.glow,
      wingColor: colors.wing,
      biome: currentBiome,
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
    
    // Обновляем мерцание
    fly.flickerPhase = (fly.flickerPhase || 0) + (fly.flickerSpeed || 0.003);
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