/**
 * @fileoverview Система дропа предметов с монстров.
 * Определяет, какие предметы выпадают при смерти монстра,
 * с учётом типа монстра, уровня игры и модификаторов.
 * 
 * @module entities/monsters/drop
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { getEventGoldMultiplier } from '../../systems/events/index.js';

/**
 * Обработка выпадения предметов с монстра
 * 
 * Проверяет, может ли монстр дропать предметы, затем с заданным шансом
 * создаёт золото или зелье в позиции монстра. Количество зависит от
 * уровня игры, типа монстра и модификаторов золота.
 * 
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если предмет выпал
 */
export function handleMonsterDrop(m) {
  // Монстры в комнате-ловушке не дропают предметы
  if (m.isTrapMonster) {
    console.log(`🚫 Монстр-ловушка (${m.emoji}) не даёт предметов (isTrapMonster)`);
    return false;
  }

  // Проверка по ID для монстров в комнате-ловушке
  if (state.trapMonsterIds && state.trapMonsterIds.has(m.id)) {
    console.log(`🚫 Монстр-ловушка (${m.emoji}) не даёт предметов (по ID)`);
    return false;
  }

  // Миньоны боссов не дропают предметы (если явно не разрешено)
  if (m.isMinion && m.canDropItems === false) return false;
  if (m.isTrapMonster || m.couldDropItems === false) return false;

  // Шанс дропа: 35% для обычных монстров, 15% для миньонов
  const dropChance = m.isMinion ? 0.15 : 0.35;
  
  if (Math.random() < dropChance) {
    // 30% — зелье, 70% — золото
    const potionChance = 0.30;
    let itemType = Math.random() < potionChance ? 'potion' : 'gold';
    let amount;

    if (itemType === 'gold') {
      // Расчёт золота с учётом типа монстра и уровня
      amount = m.isMinion
        ? Math.floor((Math.random() * 8) + 3 + state.gameLevel)
        : Math.floor((Math.random() * 12) + 6 + state.gameLevel);
      // Применяем модификатор золота (события, алтари)
      amount = Math.floor(amount * player.goldMultiplier);
    } else {
      // Зелье: количество зависит от уровня
      amount = m.isMinion
        ? Math.floor(10 + state.gameLevel)
        : Math.floor(20 + state.gameLevel * 2);
    }

    // Добавляем предмет на пол
    state.lootItems.push({
      x: m.x,
      y: m.y,
      type: itemType,
      value: getEventGoldMultiplier(amount)
    });
    return true;
  }
  return false;
}