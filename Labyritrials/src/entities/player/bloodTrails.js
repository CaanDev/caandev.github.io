/**
 * @fileoverview Система следов крови игрока.
 * Создаёт временные следы при получении урона и следы при низком HP.
 * 
 * @module entities/player/bloodTrails
 */

import { state, player } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';

/** @type {Array} - Массив следов крови */
let bloodTrails = [];

/** @type {number} - Интервал спавна следов при низком HP (кадры) */
const LOW_HP_SPAWN_INTERVAL_MIN = 20;
const LOW_HP_SPAWN_INTERVAL_MAX = 45;

/** @type {number} - Время жизни следа крови (кадры) - 30 секунд для всех следов */
const BLOOD_TRAIL_LIFETIME = 1800;

/** @type {number} - Максимальное количество следов от урона */
const MAX_DAMAGE_TRAILS = 50;

/** @type {number} - Максимальное количество следов при низком HP */
const MAX_LOW_HP_TRAILS = 100;

/** @type {number} - Счётчик кадров для спавна следов при низком HP */
let lowHpSpawnCounter = 0;

/** @type {number} - Следующий интервал спавна (кадры) */
let nextSpawnInterval = LOW_HP_SPAWN_INTERVAL_MIN;

/** @type {number} - Порог HP для следов (30%) */
const BLOOD_TRAIL_THRESHOLD = 0.3;

/**
 * Универсальная функция ограничения количества следов
 * 
 * @param {string} type - Тип следов ('damage' или 'lowHp')
 * @param {number} maxCount - Максимальное количество
 * @returns {void}
 */
function trimTrailsByType(type, maxCount) {
  const filtered = bloodTrails.filter(t => 
    type === 'damage' ? t.isDamageTrail : t.isLowHpTrail
  );
  
  if (filtered.length > maxCount) {
    const toRemove = filtered.length - maxCount;
    let removed = 0;
    for (let i = 0; i < bloodTrails.length && removed < toRemove; i++) {
      const trail = bloodTrails[i];
      if (type === 'damage' ? trail.isDamageTrail : trail.isLowHpTrail) {
        bloodTrails.splice(i, 1);
        i--;
        removed++;
      }
    }
  }
}

/**
 * Создание следа крови при получении урона
 * 
 * @param {number} x - Координата X в пикселях
 * @param {number} y - Координата Y в пикселях
 * @param {number} damage - Полученный урон (влияет на размер следа)
 * @returns {void}
 */
export function spawnDamageBloodTrail(x, y, damage) {
  const baseSize = 10 + Math.min(damage, 50) * 0.4;
  const count = 2 + Math.floor(Math.random() * 3);
  
  // Основное пятно
  const mainSize = baseSize * (0.8 + Math.random() * 0.4);
  const angle = Math.random() * Math.PI * 2;
  const dist = 2 + Math.random() * 6;
  
  bloodTrails.push({
    x: x + Math.cos(angle) * dist,
    y: y + Math.sin(angle) * dist,
    size: mainSize,
    life: BLOOD_TRAIL_LIFETIME + Math.random() * 60,
    maxLife: BLOOD_TRAIL_LIFETIME + 60,
    isDamageTrail: true,
    isLowHpTrail: false,
    isMain: true,
    opacity: 0.5 + Math.random() * 0.2,
    rotation: Math.random() * Math.PI * 2,
  });
  
  // Дополнительные капли
  for (let i = 0; i < count; i++) {
    const angle2 = Math.random() * Math.PI * 2;
    const distance = mainSize * (0.6 + Math.random() * 0.8);
    const dropSize = mainSize * (0.3 + Math.random() * 0.3);
    
    bloodTrails.push({
      x: x + Math.cos(angle2) * distance,
      y: y + Math.sin(angle2) * distance,
      size: dropSize,
      life: BLOOD_TRAIL_LIFETIME + Math.random() * 40,
      maxLife: BLOOD_TRAIL_LIFETIME + 60,
      isDamageTrail: true,
      isLowHpTrail: false,
      isMain: false,
      opacity: 0.4 + Math.random() * 0.2,
      rotation: Math.random() * Math.PI * 2,
    });
  }
  
  trimTrailsByType('damage', MAX_DAMAGE_TRAILS);
}

/**
 * Создание следа крови при низком HP
 * 
 * @param {number} x - Координата X в пикселях
 * @param {number} y - Координата Y в пикселях
 * @returns {void}
 */
function spawnLowHpBloodTrail(x, y) {
  const baseSize = 8 + Math.random() * 10;
  const mainSize = baseSize * (0.8 + Math.random() * 0.4);
  
  bloodTrails.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    size: mainSize,
    life: BLOOD_TRAIL_LIFETIME + Math.random() * 120,
    maxLife: BLOOD_TRAIL_LIFETIME + 120,
    isDamageTrail: false,
    isLowHpTrail: true,
    isMain: true,
    opacity: 0.35 + Math.random() * 0.2,
    rotation: Math.random() * Math.PI * 2,
  });
  
  // Дополнительные капли
  const dropCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < dropCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = mainSize * (0.5 + Math.random() * 0.7);
    const dropSize = mainSize * (0.25 + Math.random() * 0.3);
    
    bloodTrails.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: dropSize,
      life: BLOOD_TRAIL_LIFETIME + Math.random() * 100,
      maxLife: BLOOD_TRAIL_LIFETIME + 120,
      isDamageTrail: false,
      isLowHpTrail: true,
      isMain: false,
      opacity: 0.3 + Math.random() * 0.2,
      rotation: Math.random() * Math.PI * 2,
    });
  }
  
  trimTrailsByType('lowHp', MAX_LOW_HP_TRAILS);
}

/**
 * Обновление следов крови
 */
export function updateBloodTrails(deltaTime = 1/60) {
  const hpPercent = player.hp / player.maxHp;
  
  if (hpPercent < BLOOD_TRAIL_THRESHOLD && hpPercent > 0) {
    lowHpSpawnCounter++;
    
    if (lowHpSpawnCounter >= nextSpawnInterval) {
      lowHpSpawnCounter = 0;
      nextSpawnInterval = LOW_HP_SPAWN_INTERVAL_MIN + 
        Math.floor(Math.random() * (LOW_HP_SPAWN_INTERVAL_MAX - LOW_HP_SPAWN_INTERVAL_MIN));
      
      const isMoving = player.isMoving || 
                       (state.keys['w'] || state.keys['arrowup'] ||
                        state.keys['s'] || state.keys['arrowdown'] ||
                        state.keys['a'] || state.keys['arrowleft'] ||
                        state.keys['d'] || state.keys['arrowright']);
      
      if (isMoving) spawnLowHpBloodTrail(player.px, player.py);
    }
  } else {
    lowHpSpawnCounter = 0;
    nextSpawnInterval = LOW_HP_SPAWN_INTERVAL_MIN + 
      Math.floor(Math.random() * (LOW_HP_SPAWN_INTERVAL_MAX - LOW_HP_SPAWN_INTERVAL_MIN));
  }
  
  for (let i = bloodTrails.length - 1; i >= 0; i--) {
    const trail = bloodTrails[i];
    trail.life -= deltaTime * 60;
    if (trail.life <= 0) bloodTrails.splice(i, 1);
  }
}

/**
 * Отрисовка следов крови
 */
export function drawBloodTrails(ctx) {
  if (bloodTrails.length === 0) return;
  
  for (const trail of bloodTrails) {
    let alpha = trail.opacity || 0.5;
    
    const lifeProgress = trail.life / trail.maxLife;
    
    alpha *= (lifeProgress < 0.2) ? (lifeProgress / 0.2) : (0.5 + lifeProgress * 0.5);
    
    if (alpha < 0.02) continue;
    
    ctx.save();
    ctx.globalAlpha = Math.min(alpha, 0.6);
    ctx.translate(trail.x, trail.y);
    ctx.rotate(trail.rotation || 0);
    
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    
    const colorStops = [
      'rgba(140, 20, 20, 0.85)',
      'rgba(100, 15, 15, 0.7)',
      'rgba(70, 10, 10, 0.5)',
      'rgba(40, 5, 5, 0)'
    ];
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, trail.size);
    gradient.addColorStop(0, colorStops[0]);
    gradient.addColorStop(0.4, colorStops[1]);
    gradient.addColorStop(0.7, colorStops[2]);
    gradient.addColorStop(1, colorStops[3]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, trail.size, trail.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(120, 15, 15, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, trail.size * 0.4, trail.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Очистка всех следов крови
 */
export function clearBloodTrails() {
  bloodTrails = [];
  lowHpSpawnCounter = 0;
  nextSpawnInterval = LOW_HP_SPAWN_INTERVAL_MIN;
}

/**
 * Получение массива следов крови
 */
export function getBloodTrails() {
  return bloodTrails;
}

/**
 * Проверка, есть ли активные следы крови
 */
export function hasBloodTrails() {
  return bloodTrails.length > 0;
}