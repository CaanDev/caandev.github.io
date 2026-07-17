/**
 * @fileoverview Боевая система монстров.
 * Обрабатывает нанесение урона игроку монстрами с учётом модификаторов,
 * эффектов отравления и вампиризма.
 * 
 * @module entities/monsters/combat
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { handleMonsterVampirism } from '../../systems/events/index.js';
import { triggerGameOver } from '../player/gameOver.js';

/**
 * Обработка нанесения урона игроку монстром
 * 
 * Проверяет расстояние до игрока, применяет множитель входящего урона,
 * сбрасывает флаг "Железный человек", применяет эффекты отравления и вампиризма.
 * 
 * @param {Object} m - Объект монстра, наносящего урон
 * @param {number} now - Текущее время (в миллисекундах) для проверки кулдауна атаки
 * @returns {boolean} - true, если игрок умер
 */
export function handleMonsterDamageToPlayer(m, now) {
  const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);

  // Проверяем, находится ли игрок в радиусе атаки и прошёл ли кулдаун
  if (distToPlayer < m.radius + 24 && (now - m.lastHit > 1000)) {
    // Расчёт урона с учётом множителя входящего урона
    let damageTaken = m.damage;
    if (player.incomingDamageMultiplier) {
      damageTaken = Math.floor(damageTaken * player.incomingDamageMultiplier);
    }
    
    // Применяем урон
    player.hp -= damageTaken;
    m.lastHit = now;

    // Сбрасываем флаг "Железный человек" (достижение)
    state.ironManActive = false;

    // Вампиризм монстра (восстановление HP при атаке)
    handleMonsterVampirism(m, m.damage);

    // Эффект отравления (скорпионы)
    if (m.poisonOnHit) {
      player.poisonTimer = 300;
      player.poisonTick = 0;
      state.damageTexts.push({
        x: player.px, y: player.py - 30,
        text: `🦂 ОТРАВЛЕН!`,
        color: COLORS.effects.poison,
        size: 18, life: 50, speedy: 1.0
      });
    }

    // Визуальные эффекты
    state.screenShake = 20;
    state.damageTexts.push({
      x: player.px, y: player.py - 20,
      text: `-${damageTaken}`,
      color: COLORS.ui.textRed,
      size: 22, life: 40, speedy: 1.3
    });

    // Проверка смерти игрока
    if (player.hp <= 0) {
      triggerGameOver();
      return true;
    }
  }
  return false;
}