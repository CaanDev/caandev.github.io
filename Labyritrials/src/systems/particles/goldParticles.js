/**
 * @fileoverview Частицы золота.
 * Создаёт анимированные частицы при сборе золота,
 * которые летят к счётчику золота на UI.
 * 
 * @module systems/particles/goldParticles
 */

import { state } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';
import { ParticlePool } from './particlePool.js';

/**
 * @type {ParticlePool} - Пул частиц для золота, артефактов и зелий
 */
export const goldParticlePool = new ParticlePool(40, CONFIG.maxParticles.gold);

/**
 * Получение позиции счётчика золота на UI
 * 
 * @returns {{x: number, y: number}} - Координаты счётчика
 * @private
 */
function getGoldCounterPosition() {
  const goldElement = document.getElementById('gold-val');
  if (goldElement) {
    const rect = goldElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  return { x: 120, y: 100 };
}

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
 * Создание частиц золота
 * 
 * @param {number} x - Координата X источника (пиксели)
 * @param {number} y - Координата Y источника (пиксели)
 * @param {number} value - Количество золота (влияет на количество частиц)
 * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand', 'treasure')
 * @param {boolean} [simple=true] - Упрощённый режим (меньше частиц)
 * @returns {void}
 */
export function createGoldParticles(x, y, value, biome = 'cave', simple = true) {
  const activeCount = goldParticlePool.getActiveCount();
  const maxAllowed = CONFIG.maxParticles.gold;
  
  if (activeCount >= maxAllowed) return;
  
  const target = getGoldCounterPosition();
  let count;
  if (simple) {
    count = Math.min(20, 8 + Math.floor(value / 10));
  } else {
    count = Math.min(35, 12 + Math.floor(value / 6));
  }
  
  const availableSlots = maxAllowed - activeCount;
  count = Math.min(count, availableSlots);
  
  for (let i = 0; i < count; i++) {
    const particle = goldParticlePool.createGoldParticle(x, y, value, biome, simple);
    particle.targetX = target.x;
    particle.targetY = target.y;
    particle.attractionDelay = simple ? 2 + i * 0.5 + Math.random() * 5 : 3 + i * 0.8 + Math.random() * 8;
    particle.isLootSpark = true;
    particle.glowIntensity = 0.6 + Math.random() * 0.4;
  }
}

/**
 * Обновление целевой позиции для частиц золота (при ресайзе окна)
 * 
 * @returns {void}
 */
export function updateGoldParticlesTarget() {
  const target = getGoldCounterPosition();
  
  for (const p of goldParticlePool.active) {
    if (p.type === 'gold' && p.active) {
      p.targetX = target.x;
      p.targetY = target.y;
    }
  }
}

/**
 * Обновление всех частиц (золото, артефакты, зелья)
 * 
 * @returns {void}
 */
export function updateGoldParticles() {
  const goldTarget = getGoldCounterPosition();
  const artifactTarget = getArtifactCounterPosition();
  const potionTarget = getHPCounterPosition();
  
  goldParticlePool.updateAll((p) => {
    if (!p.active) return false;
    
    p.life--;
    
    // Обновление целевой позиции в зависимости от типа
    if (p.type === 'gold') {
      p.targetX = goldTarget.x;
      p.targetY = goldTarget.y;
    } else if (p.type === 'artifact') {
      p.targetX = artifactTarget.x;
      p.targetY = artifactTarget.y;
      p.rotation += p.rotSpeed;
    } else if (p.type === 'potion') {
      p.targetX = potionTarget.x;
      p.targetY = potionTarget.y;
      p.rotation += p.rotSpeed;
    }
    
    // Задержка перед притяжением к цели
    if (p.attractionDelay > 0) {
      p.attractionDelay--;
    } else {
      p.attracted = true;
    }
    
    // Смерть частицы
    if (p.life <= 0) {
      return true;
    }
    
    // Движение к цели
    if (p.attracted) {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const distance = Math.hypot(dx, dy);
      
      const threshold = p.type === 'artifact' ? 15 : (p.type === 'potion' ? 12 : 10);
      
      if (distance < threshold) {
        return true;
      }
      
      const speed = 5 + (1 - p.life / p.maxLife) * 7;
      const angle = Math.atan2(dy, dx);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.x += p.vx;
      p.y += p.vy;
    } else {
      // Свободное падение до начала притяжения
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    
    return false;
  });
}

// Заглушки для совместимости (отрисовка через particleRenderer)
export const drawGoldParticles = () => {};
export const drawArtifactParticles = () => {};
export const drawPotionParticles = () => {};
export const updateArtifactParticles = () => {};
export const updatePotionParticles = () => {};

/**
 * Очистка частиц золота
 * 
 * @returns {void}
 */
export function clearGoldParticles() {
  goldParticlePool.releaseAll();
}

/**
 * Очистка всех частиц лута (золото, артефакты, зелья)
 * 
 * @returns {void}
 */
export function clearAllLootParticles() {
  goldParticlePool.releaseAll();
}