/**
 * @fileoverview Точка входа для логики игрока.
 * Экспортирует основные функции и управляет обновлением состояния игрока.
 * 
 * @module entities/player
 */

import { state, player } from '../../core/config/index.js';
import { updateFreezeEffect, updateShockEffect, updatePoisonEffect, updatePlayerEffects } from './effects.js';
import { updateMovement, updateTorchActivation, updateFogOfWar, updateShopPrompt } from './movement.js';
import { collectLoot, collectArtifacts } from './loot.js';
import { interactWithChests, checkNoteInteraction } from './interaction.js';
import { interactWithShrines } from './shrines.js';
import { 
  checkSecretPortal, checkExitPortal, 
  checkShrinePortal, checkShrineRoomExit, 
  checkTrapPortal, checkTrapRoomExit, checkFakeTrapPortal,
  checkSafePortal, checkSafeRoomExit
} from './portals.js';
import { checkTraps } from './traps.js';
import { updateAttackAnimation } from './animation.js';
import { checkTrapWaveComplete } from '../../world/rooms/trapRoom/index.js';

// ============================================================
// ЭКСПОРТЫ
// ============================================================

/**
 * Экспорт функций обработки смерти
 * @see module:entities/player/gameOver
 */
export { triggerGameOver, initRestartHandler } from './gameOver.js';

/**
 * Экспорт функции атаки
 * @see module:entities/player/combat
 */
export { executeAttack } from './combat.js';

// ============================================================
// ВЫНОСЛИВОСТЬ
// ============================================================

/**
 * Обновление выносливости игрока (восстановление)
 * Вызывается каждый кадр из gameLoop
 * 
 * @returns {void}
 */
function updateStamina() {
  // Если выносливость уже полная — ничего не делаем
  if (player.stamina >= player.maxStamina) return;

  // Защита от деления на ноль
  if (player.maxStamina <= 0) {
    player.maxStamina = 80;
    player.stamina = 80;
    return;
  }
  
  const now = Date.now();
  const timeSinceLastAttack = now - player.lastAttackTime;
  
  // Определяем статус "в бою" (атака была менее 3 секунд назад)
  const isInCombat = timeSinceLastAttack < 3000;
  
  // Определяем скорость восстановления с учётом эффектов
  let regenRate = isInCombat ? player.staminaRegenInCombat : player.staminaRegenOutOfCombat;
  
  // ===== ЭФФЕКТЫ, ВЛИЯЮЩИЕ НА ВОССТАНОВЛЕНИЕ =====
  // Заморозка — полная блокировка
  if (player.isFrozen && player.freezeTimer > 0) {
    regenRate = 0;
  }
  // Отравление — сильно замедляет
  else if (player.poisonTimer > 0) {
    regenRate = Math.min(regenRate, 2);
  }
  // Шок — умеренно замедляет
  else if (player.shockTimer > 0) {
    regenRate = Math.min(regenRate, 4);
  }
  
  // Если регенерация отключена — выходим
  if (regenRate <= 0) return;
  
  // Рассчитываем восстановление за кадр (при 60 FPS — 1/60 секунды)
  const deltaTime = 1 / 60;
  const regenAmount = regenRate * deltaTime;
  
  // Применяем восстановление
  player.stamina = Math.min(player.maxStamina, player.stamina + regenAmount);
}

// ============================================================
// ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ
// ============================================================

/**
 * Основной цикл обновления состояния игрока
 * 
 * Выполняется каждый кадр в следующем порядке:
 * 1. Обновление эффектов (заморозка, шок, отравление)
 * 2. Восстановление выносливости
 * 3. Перезарядка огненного шара
 * 4. Движение и туман войны
 * 5. Сбор предметов
 * 6. Взаимодействие с объектами
 * 7. Проверка порталов
 * 8. Проверка ловушек
 * 9. Анимация атаки
 * 10. Проверка завершения волны в комнате-ловушке
 * 
 * @returns {void}
 */
export function updatePlayer() {
  // ===== СПЕЦИАЛЬНЫЙ РЕЖИМ: ПОЯВЛЕНИЕ БОССА =====
  // Если босс появляется - обновляем только эффекты
  if (state.isBossLevel && state.bossSpawnTriggered && !state.bossReady) {
    updateFreezeEffect();
    if (updateShockEffect()) return;
    if (updatePoisonEffect()) return;
    updatePlayerEffects();
    return;
  }

  // ===== 1. ЭФФЕКТЫ =====
  updateFreezeEffect();
  if (updateShockEffect()) return;
  if (updatePoisonEffect()) return;
  updatePlayerEffects();
  
  // ===== 2. ВОССТАНОВЛЕНИЕ ВЫНОСЛИВОСТИ =====
  updateStamina();
  
  // ===== 3. ПЕРЕЗАРЯДКА ОГНЕННОГО ШАРА =====
  if (player.fireballCooldown > 0) {
    player.fireballCooldown--;
  }
  
  // ===== 4. ДВИЖЕНИЕ И ТУМАН ВОЙНЫ =====
  updateMovement();
  updateTorchActivation();
  updateFogOfWar();
  updateShopPrompt();
  
  // ===== 5. СБОР ПРЕДМЕТОВ =====
  collectLoot();
  collectArtifacts();
  
  // ===== 6. ВЗАИМОДЕЙСТВИЕ С ОБЪЕКТАМИ =====
  interactWithChests();
  interactWithShrines();
  checkNoteInteraction();
  
  // ===== 7. ПОРТАЛЫ =====
  if (checkSecretPortal()) return;
  if (checkExitPortal()) return;
  if (checkShrinePortal()) return;
  if (checkShrineRoomExit()) return;
  if (checkTrapPortal()) return;
  if (checkTrapRoomExit()) return;
  if (checkFakeTrapPortal()) return;
  if (checkSafePortal()) return;
  if (checkSafeRoomExit()) return;
  
  // ===== 8. ЛОВУШКИ =====
  checkTraps();
  
  // ===== 9. АНИМАЦИЯ АТАКИ =====
  updateAttackAnimation();

  // ===== 10. КОМНАТА-ЛОВУШКА: ПРОВЕРКА ВОЛНЫ =====
  if (state.inTrapRoom && state.trapActivated) {
    checkTrapWaveComplete();
  }
}