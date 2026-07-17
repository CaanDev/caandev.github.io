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
import { checkTrapWaveComplete } from '../../world/rooms/trapRoom.js';

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
// ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ
// ============================================================

/**
 * Основной цикл обновления состояния игрока
 * 
 * Выполняется каждый кадр в следующем порядке:
 * 1. Обновление эффектов (заморозка, шок, отравление)
 * 2. Перезарядка огненного шара
 * 3. Движение и туман войны
 * 4. Сбор предметов
 * 5. Взаимодействие с объектами
 * 6. Проверка порталов
 * 7. Проверка ловушек
 * 8. Анимация атаки
 * 9. Проверка завершения волны в комнате-ловушке
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
  
  // ===== 2. ПЕРЕЗАРЯДКА ОГНЕННОГО ШАРА =====
  if (player.fireballCooldown > 0) {
    player.fireballCooldown--;
  }
  
  // ===== 3. ДВИЖЕНИЕ И ТУМАН ВОЙНЫ =====
  updateMovement();
  updateTorchActivation();
  updateFogOfWar();
  updateShopPrompt();
  
  // ===== 4. СБОР ПРЕДМЕТОВ =====
  collectLoot();
  collectArtifacts();
  
  // ===== 5. ВЗАИМОДЕЙСТВИЕ С ОБЪЕКТАМИ =====
  interactWithChests();
  interactWithShrines();
  checkNoteInteraction();
  
  // ===== 6. ПОРТАЛЫ =====
  if (checkSecretPortal()) return;
  if (checkExitPortal()) return;
  if (checkShrinePortal()) return;
  if (checkShrineRoomExit()) return;
  if (checkTrapPortal()) return;
  if (checkTrapRoomExit()) return;
  if (checkFakeTrapPortal()) return;
  if (checkSafePortal()) return;
  if (checkSafeRoomExit()) return;
  
  // ===== 7. ЛОВУШКИ =====
  checkTraps();
  
  // ===== 8. АНИМАЦИЯ АТАКИ =====
  updateAttackAnimation();

  // ===== 9. КОМНАТА-ЛОВУШКА: ПРОВЕРКА ВОЛНЫ =====
  if (state.inTrapRoom && state.trapActivated) {
    checkTrapWaveComplete();
  }
}