/**
 * @fileoverview Система дропа предметов с монстров.
 * Определяет, какие предметы выпадают при смерти монстра,
 * с учётом типа монстра, уровня игры и модификаторов.
 * 
 * @module entities/monsters/drop
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { logger } from '../../utils/logger.js';
import { getEventGoldMultiplier } from '../../systems/events/index.js';
import { getRandomSprite } from '../../sprites/spriteLoader.js';

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
    logger.debug(`🚫 Монстр-ловушка (${m.emoji}) не даёт предметов (isTrapMonster)`);
    return false;
  }

  // Проверка по ID для монстров в комнате-ловушке
  if (state.trapMonsterIds && state.trapMonsterIds.has(m.id)) {
    logger.debug(`🚫 Монстр-ловушка (${m.emoji}) не даёт предметов (по ID)`);
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
      amount = m.isMinion
        ? Math.floor((Math.random() * 8) + 3 + state.gameLevel)
        : Math.floor((Math.random() * 12) + 6 + state.gameLevel);
      amount = Math.floor(amount * player.goldMultiplier);
      
      // Определение биома для золота
      let goldBiome = state.currentBiome || 'cave';
      // В сокровищнице используется treasure
      if (state.inTreasureRoom) goldBiome = 'treasure';
      
      // Получение спрайта для золота
      const spriteName = getRandomSprite('gold', goldBiome) || 'goldCave1';
      
      state.lootItems.push({
        x: m.x,
        y: m.y,
        type: 'gold',
        value: getEventGoldMultiplier(amount),
        goldSpriteName: spriteName,
        goldBiome: goldBiome,
      });
    } else {
      // Зелье: количество зависит от уровня
      amount = m.isMinion
        ? Math.floor(10 + state.gameLevel)
        : Math.floor(20 + state.gameLevel * 2);
      
      // Определение биома для зелья
      let potionBiome = state.currentBiome || 'cave';
      // В сокровищнице используется treasure
      if (state.inTreasureRoom) potionBiome = 'treasure';
      
      // Получение спрайта для зелья
      const spriteName = getRandomSprite('potion', potionBiome) || 'potionCave1';
      
      // Добавление зелья на пол
      state.lootItems.push({
        x: m.x,
        y: m.y,
        type: 'potion',
        value: amount,
        potionSpriteName: spriteName,
        potionBiome: potionBiome,
      });
    }
    return true;
  }
  return false;
}