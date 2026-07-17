/**
 * @fileoverview Спавнер факелов.
 * Размещает факелы на стенах лабиринта и на аренах боссов.
 * 
 * @module entities/objects/spawners/torchSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { EMOJIS } from '../../../emojis.js';

/**
 * Создание факелов в лабиринте
 * 
 * @returns {void}
 */
export function spawnTorches() {
  state.torches = [];

  const MIN_DISTANCE = 5;

  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (!state.grid[y] || !state.grid[y][x]) continue;

      // Факелы только на неразрушаемых стенах
      if (state.grid[y][x].isWall && !state.grid[y][x].isBreakable) {
        if (Math.random() < CONFIG.torchSpawnChance) {
          // Не спавним рядом со стартовой позицией
          if (Math.abs(x - 1) < 3 && Math.abs(y - 1) < 3) continue;
          // Не спавним рядом с выходом
          if (Math.abs(x - CONFIG.goal.x) < 3 && Math.abs(y - CONFIG.goal.y) < 3) continue;

          // Проверка расстояния между факелами
          let tooClose = false;
          for (let existing of state.torches) {
            const dist = Math.hypot(existing.x - x, existing.y - y);
            if (dist < MIN_DISTANCE) {
              tooClose = true;
              break;
            }
          }
          if (tooClose) continue;

          state.torches.push({
            x: x,
            y: y,
            flickerPhase: Math.random() * Math.PI * 2,
            intensity: 0.7 + Math.random() * 0.3,
            active: false, // активируются при приближении игрока
            flameColor: COLORS.torches.flame,
            glowColor: COLORS.torches.glow,
            particleColor: COLORS.torches.particle,
            emoji: EMOJIS.torches.normal
          });
        }
      }
    }
  }
}

/**
 * Создание факелов на арене босса
 * 
 * @param {number} arenaSize - Размер арены
 * @param {string} [bossType='demon'] - Тип босса ('demon', 'mind', 'duo')
 * @returns {void}
 */
export function spawnBossTorches(arenaSize, bossType = 'demon') {
  state.torches = [];

  let flameColor = COLORS.torches.flame;
  let glowColor = COLORS.torches.glow;
  let particleColor = COLORS.torches.particle;
  let emoji = EMOJIS.torches.normal;

  // Особые цвета для арены Разума
  if (bossType === 'mind') {
    flameColor = COLORS.torches.flameMind;
    glowColor = COLORS.torches.glowMind;
    particleColor = COLORS.torches.particleMind;
    emoji = EMOJIS.torches.magic;
  }

  // Факелы по периметру арены
  for (let i = 0; i < arenaSize; i++) {
    // Верхняя стена
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: i,
        y: 0,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: flameColor,
        glowColor: glowColor,
        particleColor: particleColor,
        emoji: emoji
      });
    }

    // Нижняя стена
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: i,
        y: arenaSize - 1,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: flameColor,
        glowColor: glowColor,
        particleColor: particleColor,
        emoji: emoji
      });
    }

    // Левая стена
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: 0,
        y: i,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: flameColor,
        glowColor: glowColor,
        particleColor: particleColor,
        emoji: emoji
      });
    }

    // Правая стена
    if (i % 2 === 0 && i > 0 && i < arenaSize - 1) {
      state.torches.push({
        x: arenaSize - 1,
        y: i,
        flickerPhase: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
        active: true,
        flameColor: flameColor,
        glowColor: glowColor,
        particleColor: particleColor,
        emoji: emoji
      });
    }
  }
}

/**
 * Активация всех факелов (для тайных комнат)
 * 
 * @returns {void}
 */
export function activateAllTorches() {
  if (state.torches) {
    for (let torch of state.torches) {
      torch.active = true;
      torch.appearTimer = 1;
    }
  }
}