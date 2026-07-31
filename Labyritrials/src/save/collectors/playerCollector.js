/**
 * @fileoverview Сбор данных игрока.
 * 
 * @module save/collectors/playerCollector
 */

import { state, player } from '../../core/config/index.js';

/**
 * Сбор данных о состоянии игрока
 * 
 * @returns {Object} - Данные игрока
 */
export function collectPlayerData() {
  return {
    maxHp: player.maxHp || 100,
    hp: (typeof player.hp === 'number' && !isNaN(player.hp)) ? player.hp : 100,
    gold: player.gold || 0,
    baseDamage: player.baseDamage || 20,
    originalSpeed: player.originalSpeed,
    baseSpeed: player.baseSpeed || 7,
    speed: player.speed || 7,
    hpCost: player.hpCost || 30,
    dmgCost: player.dmgCost || 40,
    hasMap: player.hasMap || false,
    artifactsCollected: player.artifactsCollected || 0,
    goldMultiplier: player.goldMultiplier || 1.0,
    vampMultiplier: player.vampMultiplier || 1.0,
    inventory: player.inventory || null,
  };
}

/**
 * Сбор данных об оружии игрока
 * 
 * @returns {Object} - Данные об оружии
 */
export function collectWeaponData() {
  return {
    meleeWeapon: player.meleeWeapon,
    ownedMeleeWeapons: player.ownedMeleeWeapons,
    rangedWeapon: player.rangedWeapon,
    ownedRangedWeapons: player.ownedRangedWeapons,
    fireballCooldown: player.fireballCooldown
  };
}

/**
 * Сбор данных об эффектах игрока
 * 
 * @returns {Object} - Данные об эффектах
 */
export function collectEffectData() {
  return {
    isFrozen: player.isFrozen,
    freezeTimer: player.freezeTimer,
    shockTimer: player.shockTimer,
    shockSlowAmount: player.shockSlowAmount,
    shockTick: player.shockTick,
    poisonTimer: player.poisonTimer,
    poisonTick: player.poisonTick,
    slowTimer: player.slowTimer
  };
}

/**
 * Сбор данных о позиции игрока
 * 
 * @returns {Object} - Данные о позиции
 */
export function collectPositionData() {
  return {
    px: player.px,
    py: player.py,
    x: player.x,
    y: player.y,
    dirX: player.dirX,
    dirY: player.dirY
  };
}