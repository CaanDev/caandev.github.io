/**
 * @fileoverview Рендерер рун.
 * Отрисовывает магические руны на стенах и полу с анимацией мерцания,
 * свечением и искрами в зависимости от близости игрока.
 * 
 * @module systems/rendering/maze/runes
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Отрисовка всех рун в видимой области
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {{startX: number, endX: number, startY: number, endY: number}} visibleRange - Диапазон видимых клеток
 * @returns {void}
 */
export function drawRunes(ctx, visibleRange) {
  if (!state.runes || state.runes.length === 0) return;
  if (state.isBossLevel) return;
  
  const { startX, endX, startY, endY } = visibleRange;
  
  for (const rune of state.runes) {
    // Проверка видимости по диапазону клеток
    if (rune.x < startX || rune.x >= endX || rune.y < startY || rune.y >= endY) continue;
    
    if (!state.grid[rune.y] || !state.grid[rune.y][rune.x]) continue;
    if (!state.grid[rune.y][rune.x].revealed && !player.hasMap) continue;
    
    // В обычном лабиринте руны только на стенах, в комнате с алтарём — на полу
    if (!state.inShrineRoom && !state.grid[rune.y][rune.x].isWall) continue;
    
    const runeWorldX = rune.x * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetX * CONFIG.cellSize;
    const runeWorldY = rune.y * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetY * CONFIG.cellSize;
    const distToPlayer = Math.hypot(player.px - runeWorldX, player.py - runeWorldY);
    
    // Интенсивность свечения зависит от расстояния до игрока
    const maxDist = 400;
    const targetIntensity = Math.max(0, 1 - distToPlayer / maxDist);
    rune.glowIntensity = (rune.glowIntensity || 0) + (targetIntensity - (rune.glowIntensity || 0)) * 0.06;
    
    drawSingleRune(ctx, rune);
  }
}

/**
 * Отрисовка одной руны
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} rune - Объект руны
 * @param {number} rune.x - Координата X в сетке
 * @param {number} rune.y - Координата Y в сетке
 * @param {number} rune.offsetX - Смещение по X в долях клетки
 * @param {number} rune.offsetY - Смещение по Y в долях клетки
 * @param {number} rune.size - Размер руны (в долях клетки)
 * @param {string} rune.symbol - Символ руны
 * @param {string} rune.color - Цвет руны
 * @param {string} rune.type - Тип руны ('default', 'mimic', 'portal', 'shrine')
 * @param {number} rune.baseOpacity - Базовая прозрачность
 * @param {number} rune.rotation - Угол поворота
 * @param {number} rune.glowIntensity - Текущая интенсивность свечения
 * @param {boolean} rune.isOnFloor - Находится ли руна на полу
 * @param {number} rune.flickerPhase - Фаза мерцания
 * @param {number} rune.flickerSpeed - Скорость мерцания
 * @returns {void}
 * @private
 */
function drawSingleRune(ctx, rune) {
  const x = rune.x * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetX * CONFIG.cellSize;
  const y = rune.y * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetY * CONFIG.cellSize;
  const size = CONFIG.cellSize * rune.size;
  const glowIntensity = rune.glowIntensity || 0;
  const isOnFloor = rune.isOnFloor || false;
  
  // Анимация мерцания
  rune.flickerPhase = (rune.flickerPhase || 0) + (rune.flickerSpeed || 0.015);
  const flicker = 0.6 + Math.sin(rune.flickerPhase) * 0.4;
  
  // Расчёт прозрачности с учётом мерцания и свечения
  const baseOpacity = rune.baseOpacity * (0.5 + flicker * 0.5);
  const glowBoost = glowIntensity * 0.6;
  const opacity = baseOpacity + glowBoost * 0.5;
  
  if (opacity < 0.02) return;
  
  ctx.save();
  
  ctx.translate(x, y);
  ctx.rotate(rune.rotation || 0);
  
  // Тень/свечение руны
  const shadowSize = isOnFloor ? 12 + glowIntensity * 20 : 8 + glowIntensity * 15;
  ctx.shadowBlur = shadowSize * flicker;
  ctx.shadowColor = rune.color;
  ctx.globalAlpha = Math.min(0.9, opacity * 0.7 + glowBoost * 0.3);
  
  // Отрисовка символа руны
  ctx.font = `300 ${size}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rune.color;
  ctx.fillText(rune.symbol, 0, 0);
  
  // Белая подсветка для контраста
  ctx.shadowBlur = 0;
  ctx.globalAlpha = Math.min(0.4, opacity * 0.12 + glowBoost * 0.2);
  ctx.fillStyle = COLORS.player.shadow;
  ctx.fillText(rune.symbol, 0, 0);
  
  ctx.restore();
  
  // ===== СОЗДАНИЕ ИСКР ОТ РУНЫ =====
  if (glowIntensity > 0.15 && Math.random() < 0.015 + glowIntensity * 0.015) {
    const maxRuneSparks = CONFIG.maxParticles.rune || 40;
    let runeSparkCount = 0;
    if (state.sparks) {
      for (const s of state.sparks) {
        if (s.isRuneSpark) runeSparkCount++;
      }
    }
    
    if (runeSparkCount < maxRuneSparks) {
      const particleAngle = Math.random() * Math.PI * 2;
      const particleDist = size * (0.3 + Math.random() * 0.35);
      
      // Цвет искры зависит от типа руны
      let particleColor = COLORS.runes.spark.default;
      if (rune.type === 'mimic') particleColor = COLORS.runes.spark.mimic;
      else if (rune.type === 'portal') particleColor = COLORS.runes.spark.portal;
      else if (rune.type === 'shrine') particleColor = COLORS.runes.spark.shrine;
      
      const sparkLife = 60 + Math.random() * 40;
      
      state.sparks.push({
        x: x + Math.cos(particleAngle) * particleDist,
        y: y + Math.sin(particleAngle) * particleDist,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        life: sparkLife,
        maxLife: sparkLife,
        size: 0.4 + Math.random() * 0.6,
        color: particleColor,
        gravity: 0,
        glow: true,
        glowIntensity: 0.8 + Math.random() * 0.4,
        isRuneSpark: true,
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.008 + Math.random() * 0.012
      });
    }
  }
}