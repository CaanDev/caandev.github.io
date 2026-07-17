/**
 * @fileoverview Главный модуль обновления монстров.
 * Координирует все системы монстров: ИИ, эффекты, бой, боссы, адаптации.
 * 
 * @module entities/monsters/index
 */

import { state, player } from '../../core/config/index.js';
import { updateFireballs } from './fireballUpdater.js';
import { 
  updateFreezeEffect, updateShockEffect, restoreMonsterSpeed, 
  updatePoisonEffect, updateGhostGlow, updateTrapGlowTimer
} from './effects.js';
import { updateMonsterState, updateChaseMovement, updatePatrolMovement, updateLostGhostBehavior, updateFleeMovement } from './ai.js';
import { updateBossLogic, updateBossAttack, updateBossState, updateBossMovement } from './bosses/index.js';
import { handleMonsterTrapInteraction, updateMonsterDodgeAnimations } from './trapInteraction.js';
import { handleMonsterDamageToPlayer } from './combat.js';
import { checkAdaptations } from './adaptations/index.js';

/**
 * Основная функция обновления всех монстров
 * 
 * Выполняется каждый кадр в следующем порядке:
 * 1. Обновляет анимации уворота монстров
 * 2. Обновляет все огненные шары
 * 3. Для каждого монстра применяет эффекты (шок, отравление, заморозка)
 * 4. Обновляет ИИ и движение (обычные монстры или боссы)
 * 5. Проверяет нанесение урона игроку
 * 6. Проверяет адаптации монстров
 * 
 * @returns {void}
 */
export function updateMonsters() {
  const now = Date.now();

  // Обновление анимаций уворота монстров
  updateMonsterDodgeAnimations();
  
  // Обновление огненных шаров
  updateFireballs();

  // Обработка каждого монстра
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    let monsterDied = false;

    // Босс ещё не готов к бою (анимация появления)
    if ((m.isBoss || m.isDuoBoss) && !state.bossReady) continue;
    
    // Монстр в анимации уворота — движение пропускаем
    if (m.dodgeAnimation && m.dodgeAnimation.active) continue;

    // Обновляем таймер свечения от ловушек
    updateTrapGlowTimer(m);

    // ===== ПРИМЕНЕНИЕ ЭФФЕКТОВ =====
    // Шок (электрическая ловушка) — может убить монстра
    if (updateShockEffect(m, i)) { 
      monsterDied = true; 
      continue; 
    }
    
    // Отравление (кислотная ловушка) — может убить монстра
    if (updatePoisonEffect(m, i)) { 
      monsterDied = true; 
      continue; 
    }
    
    // Заморозка (ледяная ловушка)
    updateFreezeEffect(m);
    
    // Восстановление скорости (после шока)
    restoreMonsterSpeed(m);
    
    // Обновление свечения призрака
    updateGhostGlow(m);

    // Уменьшение таймера оглушения
    if (m.stunTimer > 0) m.stunTimer--;

    // Расстояние до игрока
    const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);

    // ===== ОБНОВЛЕНИЕ ДВИЖЕНИЯ =====
    if (m.isBoss || m.isDuoBoss) {
      // Боссы: логика, атаки, состояние, движение
      updateBossLogic(m, i);
      updateBossAttack(m);
      updateBossState(m, distToPlayer);
      updateBossMovement(m);
    } else {
      // Обычные монстры: ИИ и движение
      updateMonsterState(m, distToPlayer);

      if (m.state === 'chase') {
        // Преследование
        if (m.stunTimer <= 0 && !m.isFrozen) updateChaseMovement(m);
        if (handleMonsterTrapInteraction(m, i)) continue;
        updateLostGhostBehavior(m);
      } else if (m.state === 'flee') {
        // Бегство от игрока
        if (m.stunTimer <= 0 && !m.isFrozen) updateFleeMovement(m);
      } else {
        // Патруль
        updatePatrolMovement(m);
      }
    }

    // ===== НАНЕСЕНИЕ УРОНА ИГРОКУ =====
    // Если игрок умер — выходим
    if (handleMonsterDamageToPlayer(m, now)) return;
  }

  // ===== ПРОВЕРКА АДАПТАЦИЙ МОНСТРОВ =====
  checkAdaptations();
}