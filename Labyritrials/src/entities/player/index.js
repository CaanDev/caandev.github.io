/**
 * @fileoverview Точка входа для логики игрока.
 * Экспортирует основные функции и управляет обновлением состояния игрока.
 * 
 * @module entities/player
 */

import { state, player } from '../../core/config/index.js';
import { updateMimicHealthBars, updateMimicsState } from './mimicCombat.js';
import { updateBloodTrails, drawBloodTrails } from './bloodTrails.js';
import { updateFreezeEffect, updateShockEffect, updatePoisonEffect, updatePlayerEffects } from './effects.js';
import { updateChargeParticles } from './chargeParticles.js';
import { updateMovement, updateTorchActivation } from './movement.js';
import { updateInteractionPrompts } from './interactions/index.js';
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
// WAITING: КОНСТАНТЫ И СОСТОЯНИЕ
// ============================================================

/** @type {number} - Порог простоя для запуска анимации waiting (мс) */
const IDLE_THRESHOLD_MS = 15000;

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
  // Если выносливость уже полная - ничего не делается
  if (player.stamina >= player.maxStamina) return;

  // Защита от деления на ноль
  if (player.maxStamina <= 0) {
    player.maxStamina = 80;
    player.stamina = 80;
    return;
  }
  
  const now = Date.now();
  const timeSinceLastAttack = now - player.lastAttackTime;
  
  // Определение статуса "в бою" (атака была менее 3 секунд назад)
  const isInCombat = timeSinceLastAttack < 3000;
  
  // Определение скорости восстановления с учётом эффектов
  let regenRate = isInCombat ? player.staminaRegenInCombat : player.staminaRegenOutOfCombat;
  
  // Эффекты, влияющие на восстановление
  // Заморозка - полная блокировка
  if (player.isFrozen && player.freezeTimer > 0) regenRate = 0;
  // Отравление - сильное замедление
  else if (player.poisonTimer > 0) regenRate = Math.min(regenRate, 2);
  // Шок - умеренное замедление
  else if (player.shockTimer > 0) regenRate = Math.min(regenRate, 4);
  
  // Если регенерация отключена - выход
  if (regenRate <= 0) return;
  
  // Рассчёт восстановления за кадр
  const regenAmount = regenRate * deltaTime;
  
  // Применение восстановления
  player.stamina = Math.min(player.maxStamina, player.stamina + regenAmount);
}

// ============================================================
// WAITING: ЛОГИКА АНИМАЦИИ ОЖИДАНИЯ (только для female)
// ============================================================

/**
 * Проверка, находится ли игрок в состоянии полного покоя.
 * Учитывается: не атакует, не заряжает, не стреляет, не двигается.
 * 
 * @returns {boolean} - true, если игрок в покое
 */
function isPlayerIdle() {
  // Атака / зарядка / огненный шар
  if (player.isAttacking || player.isCharging || player.isFireballAttack) return false;
  
  // Движение - проверка по нажатым клавишам
  const k = state.keys || {};
  const moving = 
    k['w'] || k['arrowup'] ||
    k['s'] || k['arrowdown'] ||
    k['a'] || k['arrowleft'] ||
    k['d'] || k['arrowright'];
  
  return !moving;
}

/**
 * Обновление логики анимации ожидания (waiting).
 * 
 * Условия запуска:
 * - Игрок - female
 * - Игрок в покое (не двигается, не атакует)
 * - Прошло 15 секунд непрерывного покоя
 * 
 * Особенности:
 * - Модальные окна не сбрасывают таймер (по требованию)
 * - После завершения анимации - сразу новый отсчёт 15 секунд
 * - При начале движения/атаки во время waiting - анимация прерывается
 * 
 * @param {number} deltaTime - Время с последнего кадра (сек)
 * @returns {void}
 */
function updateWaitingLogic(deltaTime) {
  // Только для female
  if (player.gender !== 'female') {
    state.idleTime = 0;
    return;
  }
  
  // Игрок мёртв / отключён
  if (state.isPlayerDisabled || player.hp <= 0) {
    state.idleTime = 0;
    return;
  }
  
  // Если играет анимация waiting - время не считается
  if (playerAnimator.isWaitingPlaying()) return;
  
  // Если игрок не в покое - сброс таймера
  if (!isPlayerIdle()) {
    state.idleTime = 0;
    return;
  }
  
  // Накопление времени
  state.idleTime += deltaTime * 1000;
  
  // Триггер: прошло 15 секунд покоя
  if (state.idleTime >= IDLE_THRESHOLD_MS) {
    state.idleTime = 0;
    startWaitingAnimation();
  }
}

/**
 * Запуск анимации ожидания (waiting).
 * 
 * @returns {void}
 */
function startWaitingAnimation() {
  // Запуск через animator
  playerAnimator.update(
    'waiting',
    0, 1,             // dirX, dirY (south)
    0,                // deltaTime = 0, чтобы начать с 0-го кадра
    null,             // onAttackComplete
    false,            // isStrong
    onWaitingComplete // onWaitingComplete - колбэк
  );
}

/**
 * Колбэк завершения анимации waiting.
 * Сбрасывает направление игрока на юг, чтобы после анимации
 * персонаж смотрел вниз, пока не начнёт двигаться.
 * 
 * @returns {void}
 */
function onWaitingComplete() {
  player.lastMoveDirX = 0;
  player.lastMoveDirY = 1;
}

/**
 * Сброс состояния waiting (при респавне, смене пола и т.п.)
 * 
 * @returns {void}
 */
export function resetWaitingState() {
  state.idleTime = 0;
}

// ============================================================
// ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ АНИМАЦИИ
// ============================================================

/**
 * Определение текущего состояния анимации игрока
 * 
 * @returns {string} - 'idle', 'walk', 'attack' или 'waiting'
 */
function getPlayerAnimationState() {
  // Приоритет 1: waiting - только если игрок всё ещё в покое
  if (playerAnimator.isWaitingPlaying() && isPlayerIdle()) return 'waiting';
  // Приоритет 2: attack
  if (player.isAttacking && player.attackTimer > 5) return 'attack';
  // Приоритет 3: walk / idle
  return player.isMoving ? 'walk' : 'idle';
}

/**
 * Получение направления для анимации
 * 
 * @returns {{dirX: number, dirY: number}} - Направление движения
 */
function getAnimationDirection() {
  let dirX = 0, dirY = 0;
  
  // Используется фактическое движение (учитывается инверсия)
  // Определение направления из нажатых клавиш с учётом инверсии
  if (!player.isFrozen) {
    let rawX = 0, rawY = 0;
    if (state.keys['w'] || state.keys['arrowup']) rawY = -1;
    if (state.keys['s'] || state.keys['arrowdown']) rawY = 1;
    if (state.keys['a'] || state.keys['arrowleft']) rawX = -1;
    if (state.keys['d'] || state.keys['arrowright']) rawX = 1;

    // Применение инверсии управления
    if (player.controlsInverted) {
      dirX = -rawX;
      dirY = -rawY;
    } else {
      dirX = rawX;
      dirY = rawY;
    }
  }

  // Если есть движение - обновление последнего направления
  if (dirX !== 0 || dirY !== 0) {
    player.lastMoveDirX = dirX;
    player.lastMoveDirY = dirY;
    return { dirX, dirY };
  }
  
  // Если игрок атакует или заряжает - используется направление атаки
  // или последнее направление (если оно задано)
  if (player.isAttacking || player.isCharging) {
    // Сначала проверяется lastMoveDir (оно всегда есть, если игрок хоть раз двигался)
    if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) return { dirX: player.lastMoveDirX, dirY: player.lastMoveDirY };
    // Если lastMoveDir нет, используется направление атаки
    if (player.dirX !== 0 || player.dirY !== 0) {
      player.lastMoveDirX = player.dirX;
      player.lastMoveDirY = player.dirY;
      return { dirX: player.dirX, dirY: player.dirY };
    }
  }
  
  // Использование последнего направления движения
  if (player.lastMoveDirX !== 0 || player.lastMoveDirY !== 0) return { dirX: player.lastMoveDirX, dirY: player.lastMoveDirY };
  // По умолчанию - юг
  return { dirX: 0, dirY: 1 };
}

// ============================================================
// ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ
// ============================================================

/**
 * Основной цикл обновления состояния игрока
 * Выполняется каждый кадр
 * 
 * @param {number} deltaTime - Время с последнего обновления (сек)
 * @returns {void}
 */
export function updatePlayer(deltaTime = 1/60) {
  // Проверка: игрок отключен
  if (state.isPlayerDisabled) return;

  // Специальный режим: появление босса
  // Если босс появляется - обновляются только эффекты
  if (state.isBossLevel && state.bossSpawnTriggered && !state.bossReady) {
    updateFreezeEffect();
    if (updateShockEffect()) return;
    if (updatePoisonEffect()) return;
    updatePlayerEffects();
    return;
  }

  // 1. Эффекты
  updateFreezeEffect();
  if (updateShockEffect()) return;
  if (updatePoisonEffect()) return;
  updatePlayerEffects();
  
  // 2. Восстановление выносливости
  updateStamina(deltaTime);
  
  // 3. Перезарядка огненного шара
  if (player.fireballCooldown > 0) player.fireballCooldown--;

  // 4. Логика waiting
  updateWaitingLogic(deltaTime);
  
  // 5. Движение и туман войны
  updateMovement(deltaTime * 1000);
  updateTorchActivation();
  updateInteractionPrompts();
  
  // 6. Сбор предметов
  collectLoot();
  collectArtifacts();

  // 7. Обновление следов крови
  updateBloodTrails(deltaTime);
  
  // 8. Взаимодействие с объектами
  interactWithChests();
  interactWithShrines();
  checkNoteInteraction();
  checkInteractiveItems();
  
  // 9. Порталы
  if (checkSecretPortal()) return;
  if (checkExitPortal()) return;
  if (checkShrinePortal()) return;
  if (checkShrineRoomExit()) return;
  if (checkTrapPortal()) return;
  if (checkTrapRoomExit()) return;
  if (checkFakeTrapPortal()) return;
  if (checkSafePortal()) return;
  if (checkSafeRoomExit()) return;
  
  // 10. Ловушки
  checkTraps();
  
  // 11. Анимация атаки
  updateAttackAnimation();
  updateChargeParticles(deltaTime);

  // 12. Обновление спрайтовой анимации
  const animState = getPlayerAnimationState();
  const { dirX, dirY } = getAnimationDirection();
  
  // Время в миллисекундах для аниматора
  const animDeltaTime = deltaTime * 1000;
  
  // Колбэк завершения атаки (сброс флагов)
  const onAttackComplete = () => {
    player.isAttacking = false;
    player.attackExecuted = false;
    player.attackTimer = 0;
    player.isFireballAttack = false;

    // Очистка следов атаки
    import('../../systems/rendering/player/trailManager.js').then(({ clearAttackTrails }) => {
      clearAttackTrails();
    });
  };

  // Определение, усиленная ли атака
  const isStrong = player.chargeTime > 30;
  
  // Обновление анимации
  if (animState === 'attack') {
    // Запуск или продолжение анимации атаки
    if (!playerAnimator.isAttackPlaying()) {
      // Запуск новой атаки с направлением
      playerAnimator.update('attack', dirX, dirY, animDeltaTime, onAttackComplete, isStrong);
    } else {
      // Продолжение текущей атаки
      playerAnimator.update('attack', dirX, dirY, animDeltaTime, undefined, isStrong);
    }
  } else {
    // Обычное обновление (не атака)
    playerAnimator.update(animState, dirX, dirY, animDeltaTime);
  }

  // 13. Комната-ловушка: проверка волны
  if (state.inTrapRoom && state.trapActivated) checkTrapWaveComplete();

  // 14. Мимики
  // Обновление состояния мимиков
  updateMimicsState();
  // Обновление полосок HP мимиков
  updateMimicHealthBars();
}

export { playerTakeDamageFromMonster } from './combat.js';