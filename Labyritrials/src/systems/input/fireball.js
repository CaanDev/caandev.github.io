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
  // Если игрок отключен - нет запуска огненного шара
  if (state.isPlayerDisabled) return;

  // Блокировка огненного шара: если босс появляется
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

  // Проверка наличия оружия
  if (player.rangedWeapon !== 'fireball') return;
  
  // Проверка кулдауна
  if (player.fireballCooldown > 0) {
    state.damageTexts.push({
      x: player.px, y: player.py - 30,
      text: `⏳ Перезарядка: ${Math.ceil(player.fireballCooldown / 60)}с`,
      color: COLORS.effects.fire,
      size: 16, life: 30, speedy: 0.5
    });
    return;
  }

  // Проверка выносливости
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

  // Списание выносливости
  player.stamina -= STAMINA_COST.fireball;

  // Запуск анимации атаки
  // Определение направления атаки (в сторону цели)
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

  // Обновление статистики использования оружия
  state.gameStats.weaponHits.fireball++;
  // Установка кулдауна
  player.fireballCooldown = player.fireballMaxCooldown;
  
  // Определение направления полёта шара
  let dirX = player.dirX;
  let dirY = player.dirY;

  if (length > 5) {
    dirX = dx / length;
    dirY = dy / length;
  } else {
    // Если цель слишком близко - используется последнее направление движения
    dirX = player.lastMoveDirX || 0;
    dirY = player.lastMoveDirY || 1;
  }
  
  // Создание огненного шара
  const fireball = {
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
  };

  // Мужской персонаж: урон +20%
  if (player.genderBonuses?.fireballDamageBonus) fireball.damage = Math.floor(fireball.damage * (1 + player.genderBonuses.fireballDamageBonus));
  // Женский персонаж: скорость +30%
  if (player.genderBonuses?.fireballSpeedBonus) fireball.speed = Math.floor(fireball.speed * (1 + player.genderBonuses.fireballSpeedBonus));

  state.fireballs.push(fireball);
  
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