/**
 * @fileoverview Частицы зелий.
 * Создаёт анимированные частицы при использовании зелий,
 * которые летят к счётчику здоровья на UI.
 * 
 * @module systems/particles/potionParticles
 */

import { state } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';
import { goldParticlePool } from './goldParticles.js';

/**
 * Получение позиции счётчика здоровья на UI
 * 
 * @returns {{x: number, y: number}} - Координаты счётчика
 * @private
 */
function getHPCounterPosition() {
  const hpElement = document.getElementById('hp-val');
  if (hpElement) {
    const rect = hpElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  return { x: 200, y: 60 };
}

/**
 * Создание частиц зелья
 * 
 * @param {number} x - Координата X источника (пиксели)
 * @param {number} y - Координата Y источника (пиксели)
 * @param {number} healAmount - Количество восстанавливаемого здоровья
 * @param {boolean} [simple=true] - Упрощённый режим (меньше частиц)
 * @returns {void}
 */
export function createPotionParticles(x, y, healAmount, simple = true) {
  const activeCount = goldParticlePool.getActiveCount();
  const maxAllowed = CONFIG.maxParticles.potion;
  
  // Подсчёт активных частиц зелий
  let potionCount = 0;
  for (const p of goldParticlePool.active) {
    if (p.type === 'potion' && p.active) potionCount++;
  }
  
  // Проверка лимита
  if (potionCount >= maxAllowed) return;
  
  const target = getHPCounterPosition();
  let count = simple ? 3 + Math.floor(Math.random() * 5) : 5 + Math.floor(healAmount / 10);
  
  const availableSlots = maxAllowed - potionCount;
  count = Math.min(count, availableSlots);
  
  for (let i = 0; i < count; i++) {
    const particle = goldParticlePool.createPotionParticle(x, y, healAmount, simple);
    particle.targetX = target.x;
    particle.targetY = target.y;
    particle.isLootSpark = true;
    particle.glowIntensity = 0.5 + Math.random() * 0.3;
    particle.glowColor = '#2ecc71';
  }
}

/**
 * Отрисовка частиц зелий (заглушка, используется пул)
 * 
 * @deprecated Частицы отрисовываются через particleRenderer
 * @returns {void}
 */
export const drawPotionParticles = () => {};

/**
 * Очистка всех частиц зелий
 * 
 * @returns {void}
 */
export function clearPotionParticles() {
  for (const p of goldParticlePool.active) {
    if (p.type === 'potion') {
      goldParticlePool.release(p);
    }
  }
}