/**
 * @fileoverview Частицы артефактов.
 * Создаёт анимированные частицы при сборе артефактов,
 * которые летят к счётчику урона на UI.
 * 
 * @module systems/particles/artifactParticles
 */

import { state } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';
import { goldParticlePool } from './goldParticles.js';

/**
 * Получение позиции счётчика артефактов на UI
 * 
 * @returns {{x: number, y: number}} - Координаты счётчика
 * @private
 */
function getArtifactCounterPosition() {
  const dmgElement = document.getElementById('dmg-val');
  if (dmgElement) {
    const rect = dmgElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  return { x: 120, y: 130 };
}

/**
 * Создание частиц артефакта
 * 
 * @param {number} x - Координата X источника (пиксели)
 * @param {number} y - Координата Y источника (пиксели)
 * @param {boolean} [simple=true] - Упрощённый режим (меньше частиц)
 * @returns {void}
 */
export function createArtifactParticles(x, y, simple = true) {
  const activeCount = goldParticlePool.getActiveCount();
  const maxAllowed = CONFIG.maxParticles.artifact;
  
  // Подсчёт активных частиц артефактов
  let artifactCount = 0;
  for (const p of goldParticlePool.active) {
    if (p.type === 'artifact' && p.active) artifactCount++;
  }
  
  // Проверка лимита
  if (artifactCount >= maxAllowed) return;
  
  const target = getArtifactCounterPosition();
  let count = simple ? 6 + Math.floor(Math.random() * 6) : 12 + Math.floor(Math.random() * 8);
  
  const availableSlots = maxAllowed - artifactCount;
  count = Math.min(count, availableSlots);
  
  for (let i = 0; i < count; i++) {
    const particle = goldParticlePool.createArtifactParticle(x, y, simple);
    particle.targetX = target.x;
    particle.targetY = target.y;
    particle.isLootSpark = true;
    particle.glowIntensity = 0.8 + Math.random() * 0.4;
    particle.glowColor = '#9b59b6';
  }
}

/**
 * Отрисовка частиц артефактов (заглушка, используется пул)
 * 
 * @deprecated Частицы отрисовываются через particleRenderer
 * @returns {void}
 */
export const drawArtifactParticles = () => {};

/**
 * Очистка всех частиц артефактов
 * 
 * @returns {void}
 */
export function clearArtifactParticles() {
  for (const p of goldParticlePool.active) {
    if (p.type === 'artifact') {
      goldParticlePool.release(p);
    }
  }
}