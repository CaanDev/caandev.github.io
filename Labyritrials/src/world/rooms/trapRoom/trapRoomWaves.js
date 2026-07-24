/**
 * @fileoverview Управление волнами монстров в комнате-ловушке.
 * Содержит логику запуска волн, спавна монстров и проверки завершения.
 * 
 * @module world/rooms/trapRoom/trapRoomWaves
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { logger } from '../../../utils/logger.js';
import { showRealExitPortal } from './trapRoomSetup.js';
import { showTrapWaveNotification } from './trapRoomUtils.js';

/**
 * @namespace WAVE_CONFIG
 * @description Конфигурация волн монстров в комнате-ловушке
 */
const WAVE_CONFIG = {
  1: { 
    count: 7, 
    multiplier: 1.0, 
    label: '⚔️ ВОЛНА 1! ⚔️',
    types: ['pumpkin', 'bat']
  },
  2: { 
    count: 12, 
    multiplier: 1.15, 
    label: '⚔️ ВОЛНА 2! ⚔️',
    types: ['demon', 'skull']
  },
  3: { 
    count: 15, 
    multiplier: 1.3, 
    label: '⚔️ ВОЛНА 3! ⚔️',
    types: ['scorpion', 'ghost']
  }
};

/**
 * Запуск следующей волны монстров
 * 
 * Проверяет, все ли монстры текущей волны убиты, и запускает
 * следующую волну или открывает выход после 3-й волны.
 * 
 * @returns {void}
 */
export function startNextWave() {
  if (state.trapWave >= 3) return;
  
  const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);
  
  if (aliveMonsters.length > 0) {
    state.trapWaveActive = true;
    return;
  }

  if (state.trapWaveLoaded) {
    state.trapWaveLoaded = false;
    state.trapWave++;
    state.trapWaveActive = true;
    
    if (state.trapWave >= 3) {
      showRealExitPortal();
    } else {
      setTimeout(() => {
        startNextWave();
      }, 500);
    }
    return;
  }

  if (state.trapMonsters.length > 0 && aliveMonsters.length === 0) {
    if (state.trapWave >= 3) {
      showRealExitPortal();
      return;
    }
    state.trapWave++;
    state.trapWaveActive = true;
    const waveConfig = WAVE_CONFIG[state.trapWave];
    const monsterCount = waveConfig.count;
    const waveTypes = waveConfig.types;
    showTrapWaveNotification(state.trapWave);
    spawnTrapMonsters(monsterCount, waveConfig.multiplier, waveTypes);
    return;
  }

  state.trapWave++;
  state.trapWaveActive = true;

  const waveConfig = WAVE_CONFIG[state.trapWave];
  const monsterCount = waveConfig.count;
  const waveTypes = waveConfig.types;

  showTrapWaveNotification(state.trapWave);
  spawnTrapMonsters(monsterCount, waveConfig.multiplier, waveTypes);
}

/**
 * Проверка завершения текущей волны монстров
 * 
 * Вызывается каждый кадр из игрового цикла.
 * Если все монстры волны убиты — запускает следующую волну
 * или открывает выход после 3-й волны.
 * 
 * @returns {void}
 */
export function checkTrapWaveComplete() {
  if (!state.inTrapRoom) return;
  if (!state.trapActivated) return;
  if (state.trapWave >= 3 && state.trapExitRevealed) return;

  const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);

  if (aliveMonsters.length === 0 && state.trapMonsters.length === 0) {
    state.trapWaveActive = false;

    if (state.trapWave >= 3) {
      showRealExitPortal();
    } else {
      setTimeout(() => {
        if (state.trapMonsters.filter(m => m.hp > 0).length === 0) {
          startNextWave();
        }
      }, 500);
    }
  } else {
    state.trapWaveActive = true;
  }
}

/**
 * Спавн монстров для волны
 * 
 * @param {number} count - Количество монстров
 * @param {number} multiplier - Множитель сложности
 * @param {string[]} waveTypes - Типы монстров в волне
 * @returns {void}
 */
export function spawnTrapMonsters(count, multiplier, waveTypes) {
  if (!waveTypes || !Array.isArray(waveTypes)) {
    logger.warn('⚠️ waveTypes не определён, используем типы по умолчанию');
    waveTypes = ['pumpkin', 'bat'];
  }

  const scaling = 1 + (state.gameLevel - 1) * 0.15 * multiplier;

  const typeMap = {
    pumpkin: { emoji: '🎃', hp: 60, damage: 14, radius: 24, name: 'Тыква', speed: 2.2, vision: 350 },
    bat: { emoji: '🦇', hp: 25, damage: 6, radius: 18, name: 'Летучая мышь', speed: 3.0, vision: 280 },
    demon: { emoji: '😈', hp: 120, damage: 28, radius: 28, name: 'Демон', speed: 1.8, vision: 400 },
    skull: { emoji: '💀', hp: 90, damage: 20, radius: 22, name: 'Череп', speed: 2.4, vision: 350 },
    scorpion: { emoji: '🦂', hp: 130, damage: 24, radius: 26, name: 'Скорпион', speed: 1.6, vision: 350, poisonOnHit: true },
    ghost: { emoji: '👻', hp: 35, damage: 8, radius: 22, name: 'Призрак', speed: 1.5, vision: 260, isGhost: true }
  };

  let availableTypes = waveTypes
    .map(type => typeMap[type])
    .filter(t => t !== undefined);

  if (availableTypes.length === 0) {
    logger.warn('⚠️ Нет доступных типов монстров для волны, используем fallback');
    availableTypes = [typeMap['pumpkin']];
  }

  const roomSize = CONFIG.cols;
  const centerX = Math.floor(roomSize / 2);
  const centerY = Math.floor(roomSize / 2);

  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);

  const MIN_SPAWN_DISTANCE = 3;

  let spawned = 0;
  let attempts = 0;
  const maxAttempts = 400;

  while (spawned < count && attempts < maxAttempts) {
    attempts++;

    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 2.5;
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance);

    if (x < 1 || x >= roomSize - 1 || y < 1 || y >= roomSize - 1) continue;
    if (x === 1 && y === 1) continue;
    if (x === centerX && y === centerY) continue;

    const distToPlayer = Math.hypot(x - playerGridX, y - playerGridY);
    if (distToPlayer < MIN_SPAWN_DISTANCE) continue;

    if (state.grid[y] && state.grid[y][x] && !state.grid[y][x].isWall) {
      const base = availableTypes[Math.floor(Math.random() * availableTypes.length)];

      const monster = {
        x: x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: y * CONFIG.cellSize + CONFIG.cellSize / 2,
        startX: x * CONFIG.cellSize + CONFIG.cellSize / 2,
        startY: y * CONFIG.cellSize + CONFIG.cellSize / 2,
        hp: Math.floor(base.hp * scaling),
        maxHp: Math.floor(base.hp * scaling),
        damage: Math.floor(base.damage * scaling),
        emoji: base.emoji,
        radius: base.radius,
        name: base.name,
        speed: base.speed,
        vision: base.vision,
        dir: 1,
        isHorizontal: Math.random() < 0.5,
        patrolRange: CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1),
        state: 'chase',
        lastHit: 0,
        stunTimer: 0,
        poisonOnHit: base.poisonOnHit || false,
        isGhost: base.isGhost || false,
        justSpawned: true,
        justSpawnedTimer: 30,
        isTrapMonster: true,
        canDropItems: false
      };

      state.monsters.push(monster);
      state.trapMonsters.push(monster);
      spawned++;
    }
  }

  state.trapMonstersTotal = count;
  state.trapMonstersKilled = 0;
}