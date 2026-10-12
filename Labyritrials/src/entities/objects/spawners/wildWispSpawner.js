/**
 * @fileoverview Спавнер диких блуждающих огоньков.
 * Размещает одиночных диких огоньков на обычных уровнях.
 * 
 * @module entities/objects/spawners/wildWispSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { getRandomFreeCells, markCellUsed } from '../utils/spawnUtils.js';

/** @type {number} - Минимальный уровень для появления диких огоньков */
const MIN_LEVEL = 7;
/** @type {number} - Минимальное количество огоньков на уровне */
const MIN_COUNT = 1;
/** @type {number} - Максимальное количество огоньков на уровне */
const MAX_COUNT = 2;
/** @type {number} - Радиус столкновения огонька */
const WISP_RADIUS = 20;
/** @type {number} - Скорость огонька */
const WISP_SPEED = 2.2;
/** @type {number} - Радиус видимости */
const WISP_VISION = 320;
/** @type {number} - Урон игроку */
const WISP_DAMAGE = 8;
/** @type {number} - HP в абстрактных "очках" */
const WISP_HP = 3;

/**
 * Спавн диких блуждающих огоньков на уровне.
 * 
 * Условия:
 * - Уровень >= 7
 * - Не босс-уровень, не тайная комната и не безопасная комната
 * 
 * @returns {void}
 */
export function spawnWildWisps() {
  // Очистка массива диких огоньков
  state.wildWisps = [];

  // Проверка уровня
  if (state.gameLevel < MIN_LEVEL) return;
  // Проверка типа уровня
  if (state.isBossLevel) return;
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;

  // Определение количества
  const count = MIN_COUNT + Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1));

  // Поиск свободных клеток
  const cells = getRandomFreeCells(count * 3, (x, y) => {
    // Не рядом со стартом
    if (Math.abs(x - 1) < 4 && Math.abs(y - 1) < 4) return false;
    // Не на выходе
    if (x === CONFIG.goal.x && y === CONFIG.goal.y) return false;
    // Не рядом с выходом
    if (Math.hypot(x - CONFIG.goal.x, y - CONFIG.goal.y) < 3) return false;
    return true;
  });

  if (cells.length === 0) return;

  // Спавн
  let spawned = 0;
  for (const cell of cells) {
    if (spawned >= count) break;

    const x = cell.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = cell.y * CONFIG.cellSize + CONFIG.cellSize / 2;

    state.wildWisps.push({
      id: `wildWisp_${Date.now()}_${Math.random()}`,
      x,
      y,
      startX: x,
      startY: y,
      hp: WISP_HP,
      maxHp: WISP_HP,
      damage: WISP_DAMAGE,
      radius: WISP_RADIUS,
      speed: WISP_SPEED,
      vision: WISP_VISION,
      state: 'patrol',
      stunTimer: 0,
      lastHit: 0,
      isWildWisp: true,
      // Визуал
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.8 + Math.random() * 0.6,
    });

    markCellUsed(cell.x, cell.y);
    spawned++;
  }
}