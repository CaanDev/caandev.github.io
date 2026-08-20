/**
 * @fileoverview Функция запуска огненного шара игроком.
 * Обрабатывает условие использования, кулдаун, проверку выносливости
 * и создание снаряда.
 * 
 * @module systems/input/fireball
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * @namespace STAMINA_COST
 * @description Стоимость действий в единицах выносливости
 */
const STAMINA_COST = {
  /** @type {number} - Стоимость огненного шара */
  fireball: 25,
};

/**
 * Запуск огненного шара игроком
 * 
 * Проверяет, что игрок владеет огненным шаром, кулдаун прошёл,
 * есть достаточно выносливости, и босс не находится в стадии появления.
 * Создаёт снаряд, направленный в сторону цели игрока.
 * 
 * @returns {void}
 */
export function shootFireball() {
  // Блокируем огненный шар, если босс появляется
  if (state.isBossLevel && state.bossSpawnTriggered && !state.bossReady) {
    state.damageTexts.push({
      x: player.px, y: player.py - 30,
      text: '⏳ Подождите появления босса...',
      color: COLORS.ui.textGold,
      size: 16,
      life: 30,
      speedy: 0.5
    });
    return;
  }

  // Проверяем наличие оружия
  if (player.rangedWeapon !== 'fireball') return;
  
  // Проверяем кулдаун
  if (player.fireballCooldown > 0) {
    state.damageTexts.push({
      x: player.px, y: player.py - 30,
      text: `⏳ Перезарядка: ${Math.ceil(player.fireballCooldown / 60)}с`,
      color: COLORS.effects.fire,
      size: 16, life: 30, speedy: 0.5
    });
    return;
  }

  // ===== ПРОВЕРКА ВЫНОСЛИВОСТИ =====
  if (player.stamina < STAMINA_COST.fireball) {
    state.damageTexts.push({
      x: player.px,
      y: player.py - 60,
      text: '⚡ Недостаточно выносливости!',
      color: '#ffcc00',
      size: 20,
      life: 40,
      speedy: 0.5
    });
    return;
  }

  // Списываем выносливость
  player.stamina -= STAMINA_COST.fireball;

  // Запускаем анимацию атаки
  // Определяем направление атаки (в сторону цели)
  const dx = player.targetX - player.px;
  const dy = player.targetY - player.py;
  const length = Math.hypot(dx, dy);
  
  if (length > 5) {
    player.dirX = dx / length;
    player.dirY = dy / length;
  } else {
    player.dirX = player.lastMoveDirX || 0;
    player.dirY = player.lastMoveDirY || 1;
  }
  
  player.isAttacking = true;
  player.attackTimer = 50;
  player.attackExecuted = true;
  player.isFireballAttack = true;

  // Обновляем статистику использования оружия
  state.gameStats.weaponHits.fireball++;
  
  // Устанавливаем кулдаун
  player.fireballCooldown = player.fireballMaxCooldown;
  
  // Определяем направление полёта шара
  let dirX = player.dirX;
  let dirY = player.dirY;

  if (length > 5) {
    dirX = dx / length;
    dirY = dy / length;
  } else {
    // Если цель слишком близко — используем последнее направление движения
    dirX = player.lastMoveDirX || 0;
    dirY = player.lastMoveDirY || 1;
  }
  
  // Создаём огненный шар
  state.fireballs.push({
    x: player.px,
    y: player.py,
    dirX: dirX,
    dirY: dirY,
    radius: 20,
    speed: 8,
    damage: player.baseDamage * 2,
    life: 180,
    hitMonsters: [],
    isFromBoss: false,
    isFromPlayer: true,
  });
  
  // Визуальные эффекты
  state.screenShake = 8;
  state.damageTexts.push({
    x: player.px,
    y: player.py - 20,
    text: `🔥 ОГНЕННЫЙ ШАР! 🔥`,
    color: COLORS.effects.fire,
    size: 20,
    life: 40,
    speedy: 0.8
  });
}