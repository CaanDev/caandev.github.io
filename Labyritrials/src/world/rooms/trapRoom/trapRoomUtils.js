/**
 * @fileoverview Вспомогательные функции для комнаты-ловушки.
 * Содержит утилиты для создания кровавых следов, управления факелами
 * и отображения уведомлений.
 * 
 * @module world/rooms/trapRoom/trapRoomUtils
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { createBloodPuddle } from '../../../entities/objects/utils/bloodSystem.js';

/**
 * Создаёт постоянные следы крови в комнате-ловушке
 * 
 * Размещает случайные кровавые пятна по комнате, создавая атмосферу
 * опасности. Пятна отмечаются как постоянные (isPermanent) и не исчезают
 * со временем. При выходе из комнаты они удаляются.
 * 
 * @returns {void}
 */
export function spawnTrapRoomBloodstains() {
  const bloodstainCount = 6 + Math.floor(Math.random() * 6);
  const cellSize = CONFIG.cellSize;
  const roomSize = CONFIG.cols;
  
  for (let i = 0; i < bloodstainCount; i++) {
    let attempts = 0;
    let x, y;
    let found = false;
    
    while (!found && attempts < 100) {
      attempts++;
      x = Math.floor(Math.random() * (roomSize - 2)) + 1;
      y = Math.floor(Math.random() * (roomSize - 2)) + 1;
      
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      
      if (x === Math.floor(roomSize / 2) && y === Math.floor(roomSize / 2)) continue;
      if (x === 1 && y === 1) continue;
      
      let tooClose = false;
      for (const stain of state.bloodPuddles) {
        const stainX = Math.floor(stain.x / cellSize);
        const stainY = Math.floor(stain.y / cellSize);
        if (Math.hypot(stainX - x, stainY - y) < 1.5) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        found = true;
      }
    }
    
    if (found) {
      const posX = x * cellSize + cellSize / 2 + (Math.random() - 0.5) * 30;
      const posY = y * cellSize + cellSize / 2 + (Math.random() - 0.5) * 30;
      
      createBloodPuddle(posX, posY, false);
      
      const recentPuddles = state.bloodPuddles.slice(-8);
      for (const puddle of recentPuddles) {
        const dist = Math.hypot(puddle.x - posX, puddle.y - posY);
        if (dist < 80) {
          puddle.life = 99999;
          puddle.maxLife = 99999;
          puddle.isPermanent = true;
          puddle.isTrapRoomBlood = true;
        }
      }
    }
  }
}

/**
 * Изменение цвета факелов в комнате-ловушке
 * 
 * @param {string} flameColor - Новый цвет пламени (HEX)
 * @param {string} glowColor - Новый цвет свечения (HEX)
 * @returns {void}
 */
export function setTorchesColor(flameColor, glowColor) {
  for (const torch of state.torches) {
    if (torch.isTrapTorch) {
      torch.flameColor = flameColor;
      torch.glowColor = glowColor;
      torch.particleColor = flameColor;
    }
  }
}

/**
 * Показ уведомления об активации комнаты-ловушки
 * 
 * @returns {void}
 */
export function showTrapRoomActivationNotification() {
  state.damageTexts.push({
    x: player.px,
    y: player.py - 120,
    text: '🔥 КОМНАТА-ЛОВУШКА АКТИВИРОВАНА! 🔥',
    color: '#ff2200',
    size: 28,
    life: 100,
    speedy: 0.2
  });

  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: '⚔️ ГОТОВЬТЕСЬ К БИТВЕ! ⚔️',
    color: '#ff6600',
    size: 22,
    life: 90,
    speedy: 0.3
  });

  state.screenShake = 15;
}

/**
 * Показ уведомления о начале волны
 * 
 * @param {number} wave - Номер волны (1-3)
 * @returns {void}
 */
export function showTrapWaveNotification(wave) {
  const WAVE_CONFIG = {
    1: { label: '⚔️ ВОЛНА 1! ⚔️' },
    2: { label: '⚔️ ВОЛНА 2! ⚔️' },
    3: { label: '⚔️ ВОЛНА 3! ⚔️' }
  };
  
  const waveConfig = WAVE_CONFIG[wave];
  if (!waveConfig) return;

  const text = waveConfig.label;

  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: text,
    color: '#ff4444',
    size: 32,
    life: 80,
    speedy: 0.3
  });

  state.screenShake = 10;
}

/**
 * Показ уведомления об открытии выхода
 * 
 * @returns {void}
 */
export function showTrapExitNotification() {
  state.damageTexts.push({
    x: player.px,
    y: player.py - 80,
    text: '🚪 ВЫХОД ОТКРЫТ! 🚪',
    color: '#2ecc71',
    size: 28,
    life: 80,
    speedy: 0.3
  });

  state.screenShake = 8;
}