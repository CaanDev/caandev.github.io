/**
 * @fileoverview Логика пленения диких блуждающих огоньков.
 * @module entities/player/interactions/spiritCatcher
 */

import { state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { audio } from '../../../audio/audioManager.js';
import { INTERACTION_CONFIG } from './config.js';

/** @type {number} - Максимальное количество пойманных огоньков */
const MAX_CAUGHT_WISPS = 4;

/**
 * Проверка, экипирован ли "Ловец духов" в любой слот.
 * 
 * @returns {boolean}
 */
export function hasSpiritCatcherEquipped() {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes('spiritCatcher');
}

/**
 * Получение текущего количества пойманных огоньков.
 * 
 * @returns {number}
 */
export function getCaughtWispCount() {
  return player.inventory?.items?.counts?.caughtWisp || 0;
}

/**
 * Проверка, достигнут ли лимит пойманных огоньков.
 * 
 * @returns {boolean}
 */
export function isCaughtWispLimitReached() {
  return getCaughtWispCount() >= MAX_CAUGHT_WISPS;
}

/**
 * Поиск ближайшего оглушённого дикого огонька в радиусе взаимодействия.
 * 
 * @returns {Object|null} - Ближайший оглушённый огонёк или null
 */
export function getNearestStunnedWisp() {
  if (!state.wildWisps || state.wildWisps.length === 0) return null;

  const radius = INTERACTION_CONFIG.spiritCatcher.radius;
  let nearest = null;
  let nearestDist = Infinity;

  for (const wisp of state.wildWisps) {
    if (wisp.hp <= 0) continue;
    if (!wisp.stunTimer || wisp.stunTimer <= 0) continue;

    const dist = Math.hypot(player.px - wisp.x, player.py - wisp.y);
    if (dist < radius && dist < nearestDist) {
      nearestDist = dist;
      nearest = wisp;
    }
  }

  return nearest;
}

/**
 * Проверка, доступно ли пленение огонька прямо сейчас.
 * 
 * Условия:
 * - "Ловец духов" экипирован
 * - Лимит пойманных огоньков не достигнут
 * - Рядом есть оглушённый огонёк
 * 
 * @returns {boolean}
 */
export function canCatchWisp() {
  if (!hasSpiritCatcherEquipped()) return false;
  if (isCaughtWispLimitReached()) return false;
  return getNearestStunnedWisp() !== null;
}

/**
 * Попытка пленения ближайшего оглушённого огонька.
 * 
 * @returns {boolean} - true, если огонёк пойман
 */
export function tryCatchWisp() {
  if (!canCatchWisp()) return false;

  const wisp = getNearestStunnedWisp();
  if (!wisp) return false;

  // Удаление огонька из мира
  const index = state.wildWisps.indexOf(wisp);
  if (index !== -1) state.wildWisps.splice(index, 1);

  // Добавление в инвентарь
  if (!player.inventory) player.inventory = { items: {} };
  if (!player.inventory.items) player.inventory.items = {};
  if (!player.inventory.items.counts) player.inventory.items.counts = {};
  if (!player.inventory.items.available) player.inventory.items.available = [];

  const current = player.inventory.items.counts['caughtWisp'] || 0;
  player.inventory.items.counts['caughtWisp'] = current + 1;

  // Показ предмета в инвентаре (один раз)
  if (!player.inventory.items.available.includes('caughtWisp')) {
    player.inventory.items.available.push('caughtWisp');
  }

  const totalCaught = getCaughtWispCount();
  state.damageTexts.push({
    x: player.px,
    y: player.py - 60,
    text: `✨ ${totalCaught}/${MAX_CAUGHT_WISPS}`,
    color: COLORS.ui.textGold,
    size: 20,
    life: 60,
    speedy: 0.5,
  });

  return true;
}

export { MAX_CAUGHT_WISPS };