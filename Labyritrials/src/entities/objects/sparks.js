/**
 * @fileoverview Создание искр при разрушении стен и других эффектах.
 * Генерирует частицы огня и пыли при разрушении стены.
 * 
 * @module entities/objects/sparks
 */

import { state, CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Создание искр при разрушении стены
 * 
 * @param {number} x - Координата X стены (пиксели)
 * @param {number} y - Координата Y стены (пиксели)
 * @returns {void}
 */
export function createSparks(x, y) {
  if (!state.sparks) state.sparks = [];

  // ===== ОСНОВНЫЕ ИСКРЫ (огонь) =====
  const sparkCount = 12 + Math.floor(Math.random() * 8);

  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const life = 30 + Math.random() * 30;
    const size = 2 + Math.random() * 4;

    // Выбор цвета искры
    let color;
    const colorRand = Math.random();
    if (colorRand < 0.6) color = COLORS.sparks.fire;
    else if (colorRand < 0.85) color = COLORS.sparks.fireDark;
    else color = COLORS.sparks.fireRed;

    state.sparks.push({
      x: x + CONFIG.cellSize / 2,
      y: y + CONFIG.cellSize / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      size: size,
      color: color,
      gravity: 0.15
    });
  }

  // ===== ЧАСТИЦЫ ПЫЛИ =====
  for (let i = 0; i < 5; i++) {
    state.sparks.push({
      x: x + CONFIG.cellSize / 2 + (Math.random() - 0.5) * 30,
      y: y + CONFIG.cellSize / 2 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      size: 3 + Math.random() * 5,
      color: COLORS.sparks.dust,
      gravity: 0.05,
      isDust: true
    });
  }
}