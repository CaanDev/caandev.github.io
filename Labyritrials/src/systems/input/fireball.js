/**
 * @fileoverview Функция запуска огненного шара игроком.
 * Обрабатывает условие использования, кулдаун и создание снаряда.
 * 
 * @module systems/input/fireball
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Запуск огненного шара игроком
 * 
 * Проверяет, что игрок владеет огненным шаром, кулдаун прошёл,
 * и босс не находится в стадии появления. Создаёт снаряд,
 * направленный в сторону цели игрока.
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

  // Обновляем статистику использования оружия
  state.gameStats.weaponHits.fireball++;
  
  // Устанавливаем кулдаун
  player.fireballCooldown = player.fireballMaxCooldown;
  
  // Определяем направление полёта шара
  const dx = player.targetX - player.px;
  const dy = player.targetY - player.py;
  const length = Math.hypot(dx, dy);
  
  let dirX, dirY;
  if (length > 5) {
    dirX = dx / length;
    dirY = dy / length;
  } else {
    // Если цель слишком близко — используем последнее направление движения
    dirX = player.dirX || 0;
    dirY = player.dirY || 1;
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