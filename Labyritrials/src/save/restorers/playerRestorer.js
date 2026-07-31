/**
 * @fileoverview Восстановление данных игрока.
 * 
 * @module save/restorers/playerRestorer
 */

import { state, player } from '../../core/config/index.js';
import { EMOJIS } from '../../emojis.js';

/**
 * Восстановление данных о состоянии игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restorePlayerData(save) {
  player.maxHp = (typeof save.maxHp === 'number' && !isNaN(save.maxHp) && save.maxHp > 0) ? save.maxHp : 100;
  player.hp = (typeof save.hp === 'number' && !isNaN(save.hp) && save.hp > 0) ? save.hp : player.maxHp;
  player.gold = (typeof save.gold === 'number' && !isNaN(save.gold) && save.gold >= 0) ? save.gold : 0;
  player.baseDamage = (typeof save.baseDamage === 'number' && !isNaN(save.baseDamage) && save.baseDamage > 0) ? save.baseDamage : 20;
  player.originalSpeed = save.originalSpeed;
  player.baseSpeed = (typeof save.baseSpeed === 'number' && !isNaN(save.baseSpeed) && save.baseSpeed > 0) ? save.baseSpeed : 7;
  player.speed = (typeof save.speed === 'number' && !isNaN(save.speed) && save.speed > 0) ? save.speed : player.baseSpeed;
  player.hpCost = (typeof save.hpCost === 'number' && !isNaN(save.hpCost) && save.hpCost > 0) ? save.hpCost : 30;
  player.dmgCost = (typeof save.dmgCost === 'number' && !isNaN(save.dmgCost) && save.dmgCost > 0) ? save.dmgCost : 40;
  player.hasMap = save.hasMap || false;
  player.artifactsCollected = (typeof save.artifactsCollected === 'number' && !isNaN(save.artifactsCollected) && save.artifactsCollected >= 0) ? save.artifactsCollected : 0;
  player.emoji = EMOJIS.player.default;
  player.goldMultiplier = save.goldMultiplier || 1.0;
  player.vampMultiplier = save.vampMultiplier || 1.0;
  
  if (save.inventory) {
    player.inventory = save.inventory;
  }
}

/**
 * Восстановление данных об оружии игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreWeaponData(save) {
  player.meleeWeapon = save.meleeWeapon || 'default';
  player.ownedMeleeWeapons = save.ownedMeleeWeapons || ['default'];
  player.rangedWeapon = save.rangedWeapon || null;
  player.ownedRangedWeapons = save.ownedRangedWeapons || [];
  player.fireballCooldown = save.fireballCooldown || 0;
}

/**
 * Восстановление данных об эффектах игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restoreEffectData(save) {
  player.isFrozen = save.isFrozen || false;
  player.freezeTimer = save.freezeTimer || 0;
  player.shockTimer = save.shockTimer || 0;
  player.shockSlowAmount = save.shockSlowAmount || 0.6;
  player.shockTick = save.shockTick || 0;
  player.poisonTimer = save.poisonTimer || 0;
  player.poisonTick = save.poisonTick || 0;
  player.slowTimer = save.slowTimer || 0;
  player.isCharging = false;
  player.chargeTime = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
}

/**
 * Восстановление данных о позиции игрока
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restorePositionData(save) {
  player.px = save.px || 180;
  player.py = save.py || 180;
  player.x = save.x || 1;
  player.y = save.y || 1;
  player.dirX = save.dirX || 0;
  player.dirY = save.dirY || 1;
}