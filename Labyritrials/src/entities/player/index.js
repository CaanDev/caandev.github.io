/**
 * @fileoverview Точка входа для логики игрока.
 * Экспортирует основные функции и управляет обновлением состояния игрока.
 * 
 * @module entities/player
 */

import { state, player } from '../../core/config/index.js';
import { updateMimicHealthBars, updateMimicsState } from './mimicCombat.js';
import { updateFreezeEffect, updateShockEffect, updatePoisonEffect, updatePlayerEffects } from './effects.js';
import { updateMovement, updateTorchActivation, updateFogOfWar, updateShopPrompt } from './movement.js';
import { collectLoot, collectArtifacts } from './loot.js';
import { interactWithChests, checkNoteInteraction, checkInteractiveItems } from './interaction.js';
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
import { playerAnimator } from '../../sprites/index.js';

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
 * @param {number} deltaTime - Время с последнего обновления (сек)
 * @returns {void}
 */
function updateStamina(deltaTime) {
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
  
  // Рассчитываем восстановление за кадр
  const regenAmount = regenRate * deltaTime;
  
  // Применяем восстановление
  player.stamina = Math.min(player.maxStamina, player.stamina + regenAmount);
}

// ============================================================
// ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ АНИМАЦИИ
// ============================================================

/**
 * Определение текущего состояния анимации игрока
 * 
 * @returns {string} - 'idle', 'walk' или 'attack'
 */
function getPlayerAnimationState() {
  // Атака
  if (player.isAttacking && player.attackTimer > 5) return 'attack';

  // Проверяем фактическое движение
  return player.isMoving ? 'walk' : 'idle';
}

/**
 * Получение направления для анимации
 * 
 * @returns {{dirX: number, dirY: number}} - Направление движения
 */
function getAnimationDirection() {
  let dirX = 0, dirY = 0;
  
  // Используем фактическое движение (учитываем инверсию)
  // Определяем направление из нажатых клавиш с учётом инверсии
  if (!player.isFrozen) {
    let rawX = 0, rawY = 0;
    if (state.keys['w'] || state.keys['arrowup']) rawY = -1;
    if (state.keys['s'] || state.keys['arrowdown']) rawY = 1;
    if (state.keys['a'] || state.keys['arrowleft']) rawX = -1;
    if (state.keys['d'] || state.keys['arrowright']) rawX = 1;

    // Применяем инверсию управления
    if (player.controlsInverted) {
      dirX = -rawX;
      dirY = -rawY;
    } else {
      dirX = rawX;
      dirY = rawY;
    }
  }

  // Если есть движение — используем его и обновляем последнее направление
  if (dirX !== 0 || dirY !== 0) {
    player.lastMoveDirX = dirX;
    player.lastMoveDirY = dirY;
    return { dirX, dirY };
  }
  
  // Если игрок атакует или заряжает — используем направление атаки
  // или последнее направление (если оно задано)
  if (player.isAttacking || player.isCharging) {
    // Сначала проверяем lastMoveDir (оно всегда есть, если игрок хоть раз двигался)
    if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) {
      return { dirX: player.lastMoveDirX, dirY: player.lastMoveDirY };
    }
    // Если lastMoveDir нет, используем направление атаки
    if (player.dirX !== 0 || player.dirY !== 0) {
      player.lastMoveDirX = player.dirX;
      player.lastMoveDirY = player.dirY;
      return { dirX: player.dirX, dirY: player.dirY };
    }
  }
  
  // Используем последнее направление движения
  if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) {
    return { dirX: player.lastMoveDirX, dirY: player.lastMoveDirY };
  }
  
  // По умолчанию — юг
  return { dirX: 0, dirY: 1 };
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
 * 10. Обновление спрайтовой анимации
 * 11. Проверка завершения волны в комнате-ловушке
 * 12. Мимики
 * 
 * @param {number} deltaTime - Время с последнего обновления (сек)
 * @returns {void}
 */
export function updatePlayer(deltaTime = 1/60) {
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
  updateStamina(deltaTime);
  
  // ===== 3. ПЕРЕЗАРЯДКА ОГНЕННОГО ШАРА =====
  if (player.fireballCooldown > 0) {
    player.fireballCooldown--;
  }
  
  // ===== 4. ДВИЖЕНИЕ И ТУМАН ВОЙНЫ =====
  updateMovement(deltaTime * 1000); // Передаем в миллисекундах
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
  checkInteractiveItems();
  
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

  // ===== 10. ОБНОВЛЕНИЕ СПРАЙТОВОЙ АНИМАЦИИ =====
  const animState = getPlayerAnimationState();
  const { dirX, dirY } = getAnimationDirection();
  
  // Время в миллисекундах для аниматора
  const animDeltaTime = deltaTime * 1000;
  
  // Колбэк завершения атаки (сбрасываем флаги)
  const onAttackComplete = () => {
    player.isAttacking = false;
    player.attackExecuted = false;
    player.attackTimer = 0;
    player.isFireballAttack = false;

    // Очищаем следы атаки
    import('../../systems/rendering/player/trailManager.js').then(({ clearAttackTrails }) => {
      clearAttackTrails();
    });
  };

  // Определяем, усиленная ли атака
  const isStrong = player.chargeTime > 30;
  
  // Обновляем анимацию
  if (animState === 'attack') {
    // Запускаем или продолжаем анимацию атаки
    // передаём направление атаки (dirX, dirY)
    if (!playerAnimator.isAttackPlaying()) {
      // Запускаем новую атаку с направлением
      playerAnimator.update('attack', dirX, dirY, animDeltaTime, onAttackComplete, isStrong);
    } else {
      // Продолжаем текущую атаку
      playerAnimator.update('attack', dirX, dirY, animDeltaTime, undefined, isStrong);
    }
  } else {
    // Обычное обновление (не атака)
    playerAnimator.update(animState, dirX, dirY, animDeltaTime);
  }

  // ===== 11. КОМНАТА-ЛОВУШКА: ПРОВЕРКА ВОЛНЫ =====
  if (state.inTrapRoom && state.trapActivated) {
    checkTrapWaveComplete();
  }

  // ===== 12. МИМИКИ =====
  // Обновление состояния мимиков
  updateMimicsState();
  // Обновление полосок HP мимиков
  updateMimicHealthBars();
}