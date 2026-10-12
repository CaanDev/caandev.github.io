/**
 * @fileoverview Логика призыва блуждающих огоньков.
 * @module entities/objects/willOTheWisps/wispsSummon
 */

import { state, player } from '../../../core/config/index.js';
import { WISPS_CONFIG } from './wispsData.js';
import { initWispsState, isWispsActive } from './wispsState.js';
import { createWisp } from './wispsBehavior.js';

/**
 * Проверка, экипирован ли предмет willOTheWisps
 * @returns {boolean}
 */
export function hasWispsEquipped() {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes('willOTheWisps');
}

/**
 * Проверка, экипирован ли талисман охотника на мимиков
 * @returns {boolean}
 */
export function hasMimicHunterEquipped() {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes('talismanMimicHunter');
}

/**
 * Проверка, есть ли предмет willOTheWisps в инвентаре (не обязательно экипирован)
 * @returns {boolean}
 */
export function hasWispsInInventory() {
  if (player.inventory?.items?.equipment?.includes('willOTheWisps')) return true;
  if (Object.values(player.inventory?.equipped || {}).includes('willOTheWisps')) return true;
  return false;
}

/**
 * Расчёт текущей доли HP за призыв
 * @returns {number} - Доля (0.1 - 0.333)
 */
export function getHpCostFraction() {
  // Если предмет ещё не получен - базовая доля
  if (player.wispsAcquiredAtLevel === null) return WISPS_CONFIG.HP_BASE_FRACTION;
  const bosses = player.wispsBossesDefeated || 0;
  const raw = WISPS_CONFIG.HP_BASE_FRACTION - WISPS_CONFIG.HP_BOSS_REDUCTION * bosses;
  return Math.max(WISPS_CONFIG.HP_MIN_FRACTION, raw);
}

/**
 * Отметка о получении willOTheWisps
 * @param {number} level - Уровень, на котором получен предмет
 * @returns {void}
 */
export function markWispsAcquired(level) {
  player.wispsAcquiredAtLevel = level;
  player.wispsBossesDefeated = 0;
}

/**
 * Попытка призыва огоньков
 * @returns {boolean} - true, если призыв успешен
 */
export function summonWisps() {
  if (player.hp <= 0) return false;
  if (!hasWispsEquipped()) return false;
  if (isWispsActive()) return false;

  // Проверка кулдауна повторного призыва
  if (state.wisps && state.wisps.resummonCooldown > 0) {
    showError('Призыв невозможен!');
    return false;
  }

  // Проверка выносливости
  if (player.stamina < WISPS_CONFIG.STAMINA_COST) {
    showError('Призыв невозможен!');
    return false;
  }

  // Проверка HP
  const fraction = getHpCostFraction();
  const hpCost = Math.floor(player.maxHp * fraction);
  if (player.hp <= hpCost) {
    showError('Призыв невозможен!');
    return false;
  }

  // Списание
  player.stamina -= WISPS_CONFIG.STAMINA_COST;
  player.hp -= hpCost;

  // Инициализация
  initWispsState();
  state.wisps.active = true;
  state.wisps.borrowedHpPerWisp = Math.floor(hpCost / WISPS_CONFIG.COUNT);
  state.wisps.borrowedHp = state.wisps.borrowedHpPerWisp * WISPS_CONFIG.COUNT;
  state.wisps.list = [];

  // Очистка старых частиц от прошлых сессий
  if (state.sparks) state.sparks = state.sparks.filter(s => !s.isWispsDeath);

  // Создание огоньков
  for (let i = 0; i < WISPS_CONFIG.COUNT; i++) {
    state.wisps.list.push(createWisp(i, player.px, player.py));
  }

  // Тряска экрана
  state.screenShake = 10;
  return true;
}

/**
 * Показ сообщения об ошибке
 * @param {string} text
 * @private
 */
function showError(text) {
  state.damageTexts.push({
    x: player.px,
    y: player.py - 50,
    text,
    color: '#ff4444',
    size: 18,
    life: 40,
    speedy: 0.5,
  });
}