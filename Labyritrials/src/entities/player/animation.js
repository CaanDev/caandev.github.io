/**
 * @fileoverview Управление анимацией атаки игрока.
 * Обновляет состояние зарядки, визуальные эффекты и индикаторы атаки.
 * 
 * @module entities/player/animation
 */

import { state, player } from '../../core/config/index.js';

/**
 * Обновление анимации и зарядки атаки
 * 
 * Выполняет следующие действия:
 * 1. Обновляет индикатор зарядки при зажатой атаке
 * 2. Отображает статус усиленного удара
 * 3. Управляет визуальными эффектами во время атаки
 * 4. Сбрасывает состояния после завершения атаки
 * 
 * @returns {void}
 */
export function updateAttackAnimation() {
  const chargeVal = document.getElementById('charge-val');
  
  // Защита: если анимация не должна быть активна
  if (state.gameOverShown) {
    player.isCharging = false;
    player.isAttacking = false;
    player.chargeTime = 0;
    player.attackTimer = 0;
    player.attackExecuted = false;
    // Сбрасываем аниматор
    import('../../sprites/index.js').then(({ playerAnimator }) => {
      if (playerAnimator.isAttackPlaying()) {
        playerAnimator.reset();
      }
    });
    if (chargeVal) chargeVal.innerText = "Обычный";
    return;
  }

  // ===== СОСТОЯНИЕ ЗАРЯДКИ =====
  if (player.isCharging) {
    player.chargeTime++;
    if (chargeVal) {
      chargeVal.innerText = player.chargeTime > 30 ? "🔥 УСИЛЕННЫЙ!" : "Зарядка...";
    }
    return;
  }

  // ===== СОСТОЯНИЕ АТАКИ =====
  if (player.isAttacking) {
    // Уменьшаем таймер синхронно
    player.attackTimer--;
    
    if (chargeVal) {
      chargeVal.innerText = player.chargeTime > 30 ? "💥 ВСПЫШКА!" : "⚔️ ВЗМАХ!";
    }
    
    // Если таймер истёк — сбрасываем состояние
    if (player.attackTimer <= 0) {
      // Проверяем, не играет ли ещё анимация
      import('../../sprites/index.js').then(({ playerAnimator }) => {
        if (!playerAnimator.isAttackPlaying()) {
          player.isAttacking = false;
          player.attackExecuted = false;
        }
      });
    }
    return;
  }

  // ===== НЕЙТРАЛЬНОЕ СОСТОЯНИЕ =====
  if (chargeVal) chargeVal.innerText = "Обычный";
  player.chargeTime = 0;
  player.attackExecuted = false;
}