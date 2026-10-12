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
  if (m.isTrapMonster) return false;
  // Проверка по ID для монстров в комнате-ловушке
  if (state.trapMonsterIds && state.trapMonsterIds.has(m.id)) return false;
  // Миньоны боссов не дропают предметы (если явно не разрешено)
  if (m.isMinion && m.canDropItems === false) return false;
  if (m.isTrapMonster || m.couldDropItems === false) return false;

  // Специальный дроп - крыло летучей мыши
  // На босс-уровнях не выпадает
  if (m.id === 'bat' && !state.isBossLevel) {
    const wingChance = getBatWingDropChance();
    if (wingChance > 0 && Math.random() < wingChance) {
      state.lootItems.push({
        x: m.x,
        y: m.y,
        type: 'batWing',
        value: 1,
        requiresInteraction: true,
      });
      // Крыло выпало - не делается обычный дроп
      return true;
    }
  }

  // Обычный дроп
  // Шанс дропа: 35% для обычных монстров, 10% для миньонов на босс-уровнях, 15% для миньонов на обычных уровнях
  let dropChance = (m.isMinion) ? (state.isBossLevel ? 0.10 : 0.15) : 0.35;
  
  if (Math.random() < dropChance) {
    // 30% - зелье, 70% - золото
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

/**
 * Получение шанса выпадения крыла летучей мыши.
 * 
 * @returns {number} - Шанс в диапазоне 0-1
 * @private
 */
function getBatWingDropChance() {
  const level = state.gameLevel || 1;
  // На первом уровне крылья не выпадают
  if (level < 2) return 0;

  // Проверка, активно ли задание торговца
  const isQuestActive = state.quests?.active?.some(q => q.id === 'traderWings') || false;

  // Страховка: если у игрока меньше 5 крыльев и живых мышей осталось мало,
  // делается 100% шанс дропа, чтобы игрок точно добил обязательное задание
  if (isQuestActive) {
    const currentWings = player.inventory?.items?.counts?.batWing || 0;
    const maxWings = 5;
    
    if (currentWings < maxWings) {
      const batsAlive = state.monsters.filter(m => m.id === 'bat' && m.hp > 0).length;
      const wingsNeeded = maxWings - currentWings;
      // Если живых мышей <= недостающих крыльев - каждая мышь дропает 100%
      if (batsAlive > 0 && batsAlive <= wingsNeeded) return 1.0;
    }
  }

  // На втором уровне + активное задание - шанс дропа 60%
  if (level === 2 && isQuestActive) return 0.60;
  // Во всех остальных случаях - шанс дропа 30%
  return 0.30;
}