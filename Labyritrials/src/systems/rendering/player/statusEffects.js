/**
 * @fileoverview Функции статусных эффектов игрока.
 * Определяет цвет, размер и интенсивность свечения игрока
 * в зависимости от текущих эффектов (шок, яд, заморозка, низкий HP, зарядка).
 * 
 * @module systems/rendering/player/statusEffects
 */

import { player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Получение цвета свечения игрока на основе текущего состояния
 * 
 * @returns {string} - RGBA-цвет свечения
 */
export function getPlayerGlowColor() {
  let color = COLORS.player.glow.normal;
  
  // Псионическая ловушка
  if (player.trapGlowColor && player.trapGlowTimer > 0) {
    return player.trapGlowColor;
  }
  
  // Шок (электрическая ловушка)
  if (player.shockTimer > 0) {
    const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
    return `rgba(255, 220, 50, ${0.9 * pulse})`;
  }
  
  // Яд (кислотная ловушка)
  if (player.poisonTimer > 0 && player.shockTimer <= 0) {
    const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    return `rgba(50, 255, 100, ${0.85 * pulse})`;
  }
  
  // Заморозка (ледяная ловушка)
  if (player.isFrozen && player.freezeTimer > 0 && player.shockTimer <= 0 && player.poisonTimer <= 0) {
    const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    return `rgba(80, 200, 255, ${0.9 * pulse})`;
  }
  
  // Зарядка атаки
  if (player.isCharging && player.chargeTime > 30 && 
      player.shockTimer <= 0 && player.poisonTimer <= 0 && !player.isFrozen) {
    if (player.meleeWeapon === 'vampire') {
      return COLORS.player.glow.vampire;
    } else if (player.meleeWeapon === 'stun') {
      return COLORS.player.glow.stun;
    }
    return COLORS.player.glow.charging;
  }
  
  return color;
}

/**
 * Получение размера свечения игрока
 * 
 * @returns {number} - Размер свечения в пикселях
 */
export function getGlowSize() {
  let size = 30;
  
  // Псионическая ловушка
  if (player.trapGlowColor && player.trapGlowTimer > 0) {
    const pulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.3;
    const intensity = Math.min(1, player.trapGlowTimer / 60) * pulse;
    return 45 * intensity + 20;
  }
  
  // Шок
  if (player.shockTimer > 0) {
    return 55 + Math.sin(Date.now() * 0.025) * 15;
  }
  
  // Яд
  if (player.poisonTimer > 0 && player.shockTimer <= 0) {
    return 50 + Math.sin(Date.now() * 0.004) * 10;
  }
  
  // Заморозка
  if (player.isFrozen && player.freezeTimer > 0 && player.shockTimer <= 0 && player.poisonTimer <= 0) {
    return 55 + Math.sin(Date.now() * 0.004) * 10;
  }
  
  // Низкий HP (пульсирующее свечение)
  if (player.shockTimer <= 0 && player.poisonTimer <= 0 && !player.isFrozen) {
    const hpPercent = player.hp / player.maxHp;
    if (hpPercent < 0.5) {
      const intensity = 1 - (hpPercent - 0) / 0.5;
      const clampedIntensity = Math.min(1, Math.max(0, intensity));
      const beatSpeed = 0.002 + (1 - hpPercent) * 0.004;
      const heartbeat = Math.sin(Date.now() * beatSpeed) * 0.5 + 0.5;
      const pulseFactor = 0.6 + heartbeat * 0.4;
      return 30 + clampedIntensity * 20 * pulseFactor;
    }
  }
  
  return size;
}

/**
 * Получение интенсивности свечения для низкого HP
 * 
 * @returns {number|null} - Интенсивность свечения или null, если эффект не активен
 */
export function getLowHpGlowAlpha() {
  if (player.shockTimer > 0 || player.poisonTimer > 0 || player.isFrozen) return null;
  
  const hpPercent = player.hp / player.maxHp;
  if (hpPercent >= 0.5) return null;
  
  const intensity = 1 - (hpPercent - 0) / 0.5;
  const clampedIntensity = Math.min(1, Math.max(0, intensity));
  const beatSpeed = 0.002 + (1 - hpPercent) * 0.004;
  const heartbeat = Math.sin(Date.now() * beatSpeed) * 0.5 + 0.5;
  const pulseFactor = 0.6 + heartbeat * 0.4;
  
  return clampedIntensity * 0.6 * pulseFactor;
}

/**
 * Получение цвета свечения для низкого HP
 * 
 * @returns {string|null} - RGBA-цвет свечения или null, если эффект не активен
 */
export function getLowHpGlowColor() {
  if (player.shockTimer > 0 || player.poisonTimer > 0 || player.isFrozen) return null;
  
  const hpPercent = player.hp / player.maxHp;
  if (hpPercent >= 0.5) return null;
  
  const intensity = 1 - (hpPercent - 0) / 0.5;
  const clampedIntensity = Math.min(1, Math.max(0, intensity));
  const beatSpeed = 0.002 + (1 - hpPercent) * 0.004;
  const heartbeat = Math.sin(Date.now() * beatSpeed) * 0.5 + 0.5;
  const pulseFactor = 0.6 + heartbeat * 0.4;
  const redIntensity = clampedIntensity * 0.6 * pulseFactor;
  const baseAlpha = 0.7 + clampedIntensity * 0.3 * pulseFactor;
  
  // Во время зарядки атаки — цвет зависит от оружия
  if (player.isCharging && player.chargeTime > 30) {
    if (player.meleeWeapon === 'stun') {
      return `rgba(100, 150, 255, ${baseAlpha * 0.7 + redIntensity * 0.3})`;
    }
    const r = 255;
    const g = Math.floor(180 - redIntensity * 150);
    const b = Math.floor(50 - redIntensity * 50);
    return `rgba(${r}, ${g}, ${b}, ${0.8 + clampedIntensity * 0.2 * pulseFactor})`;
  }
  
  // Красное свечение при низком HP
  const r = 255;
  const g = Math.floor(234 - redIntensity * 150);
  const b = Math.floor(167 - redIntensity * 100);
  return `rgba(${r}, ${g}, ${b}, ${0.8 + clampedIntensity * 0.2 * pulseFactor})`;
}

/**
 * Проверка, нужно ли отображать свечение игрока
 * 
 * @returns {boolean} - true, если игрок должен светиться
 */
export function isPlayerGlowing() {
  if (player.trapGlowColor && player.trapGlowTimer > 0) return true;
  if (player.shockTimer > 0) return true;
  if (player.poisonTimer > 0) return true;
  if (player.isFrozen && player.freezeTimer > 0) return true;
  if (player.isCharging && player.chargeTime > 30) return true;
  
  const hpPercent = player.hp / player.maxHp;
  if (hpPercent < 0.5) return true;
  
  return false;
}