/**
 * @fileoverview Проверка и сброс адаптаций монстров.
 * Управляет активацией адаптаций при достижении пороговых значений
 * и полным сбросом системы адаптаций.
 * 
 * @module entities/monsters/adaptations/checker
 */

import { state } from '../../../core/config/index.js';
import { ADAPTATIONS } from './config.js';

/**
 * Проверка всех адаптаций на активацию
 * 
 * Проходит по всем доступным адаптациям, проверяет,
 * превышен ли порог срабатывания, и активирует адаптацию,
 * если она ещё не активна.
 * 
 * @returns {void}
 */
export function checkAdaptations() {
  for (let key in ADAPTATIONS) {
    const adaptation = ADAPTATIONS[key];
    const threshold = adaptation.getThreshold();
    const total = adaptation.getTotal();

    // Если количество атак превысило порог и адаптация ещё не активна
    if (total > threshold && !adaptation.isActive()) {
      adaptation.apply();
    }
  }
}

/**
 * Полный сброс системы адаптаций монстров
 * 
 * Сбрасывает все активные адаптации, обнуляет счётчики атак
 * и восстанавливает исходные параметры монстров (HP).
 * 
 * @returns {void}
 */
export function resetAdaptations() {
  // Сбрасываем флаги адаптаций
  state.monsterAdaptation = {
    fireImmunity: false,
    stunImmunity: false,
    healingBlock: false,
    healthBoost: false,
  };

  // Обнуляем счётчики атак
  state.totalAttacks = {
    fireball: 0,
    stun: 0,
    vampirism: 0,
    magic: 0,
  };

  // Восстанавливаем HP монстров, которые были усилены адаптацией "Закалка"
  for (let monster of state.monsters) {
    if (monster.isAdaptationBoosted) {
      monster.maxHp = monster.originalMaxHp || monster.maxHp;
      monster.hp = Math.min(monster.maxHp, monster.originalHp || monster.hp);
      monster.isAdaptationBoosted = false;
    }
  }
}