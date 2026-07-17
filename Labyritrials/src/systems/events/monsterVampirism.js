/**
 * @fileoverview Вампиризм монстров во время события "Кровавая луна".
 * Монстры восстанавливают здоровье при нанесении урона игроку.
 * 
 * @module systems/events/monsterVampirism
 */

import { state } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Обработка вампиризма монстра при нанесении урона
 * 
 * Во время события "Кровавая луна" монстры с вампиризмом
 * восстанавливают 30% от нанесённого урона.
 * 
 * @param {Object} monster - Объект монстра, наносящего урон
 * @param {number} damage - Количество нанесённого урона
 * @returns {void}
 */
export function handleMonsterVampirism(monster, damage) {
  // Проверяем условия: событие "Кровавая луна", монстр имеет вампиризм и жив
  if (state.currentEvent === 'bloodMoon' && monster.hasVampirism && monster.hp > 0) {
    // Восстанавливаем 30% от нанесённого урона
    const healAmount = Math.floor(damage * 0.3);
    monster.hp = Math.min(monster.maxHp, monster.hp + healAmount);
    
    // Визуальный эффект восстановления
    state.damageTexts.push({
      x: monster.x,
      y: monster.y - 25,
      text: `🧛 +${healAmount}`,
      color: COLORS.effects.blood,
      size: 16,
      life: 30,
      speedy: 0.8
    });
  }
}