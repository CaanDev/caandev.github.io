/**
 * @fileoverview Рендерер записок на стенах.
 * Отрисовывает метки записок на стенах.
 * 
 * @module systems/rendering/maze/walls/noteRenderer
 */

import { CONFIG } from '../../../../core/config/index.js';

/**
 * Отрисовка метки записки на стене
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} noteId - ID записки
 * @returns {void}
 */
export function drawNoteOnWall(ctx, dx, dy, noteId) {
  const cellSize = CONFIG.cellSize;
  const seed = noteId * 31 + 17;
  const seededRandom = (offset) => {
    const s = (seed + offset * 7 + 313) % 10000;
    return Math.abs((Math.sin(s) * 43758.5453) % 1);
  };
  
  const margin = 12;
  const availableWidth = cellSize - margin * 2;
  const availableHeight = cellSize - margin * 2;
  
  // Позиция метки (случайная в пределах стены)
  const posX = margin + seededRandom(100) * availableWidth;
  const posY = margin + seededRandom(200) * availableHeight;
  
  const time = Date.now() * 0.001;
  
  ctx.save();
  ctx.translate(dx + posX, dy + posY);
  
  // Размер звезды (фиксированный, зависит только от ID записки)
  const size = 6 + seededRandom(300) * 4;
  
  // Пульсация яркости
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.5 + noteId * 0.7);
  
  const glowSize = size * 3.2;
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
  glowGradient.addColorStop(0, `rgba(255, 230, 100, ${0.2 * pulse})`);
  glowGradient.addColorStop(0.15, `rgba(255, 225, 90, ${0.18 * pulse})`);
  glowGradient.addColorStop(0.35, `rgba(255, 215, 80, ${0.12 * pulse})`);
  glowGradient.addColorStop(0.6, `rgba(255, 200, 60, ${0.06 * pulse})`);
  glowGradient.addColorStop(0.85, `rgba(255, 190, 50, ${0.02 * pulse})`);
  glowGradient.addColorStop(1, 'rgba(255, 180, 40, 0)');
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
  ctx.fill();
  
  const rays = 4;
  
  for (let i = 0; i < rays; i++) {
    const angle = (Math.PI * 2 / rays) * i + time * 0.3;
    const rayLength = size * 1.5;
    const rayWidth = size * 0.2;
    
    ctx.save();
    ctx.rotate(angle);
    ctx.shadowBlur = 12 * pulse; // ← было 15, стало 12
    ctx.shadowColor = `rgba(255, 230, 100, ${0.5 * pulse})`;
    ctx.fillStyle = `rgba(255, 240, 150, ${0.4 + 0.3 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(0, -rayLength);
    ctx.lineTo(rayWidth, -size * 0.15);
    ctx.lineTo(0, -size * 0.05);
    ctx.lineTo(-rayWidth, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  ctx.shadowBlur = 20 * pulse;
  ctx.shadowColor = `rgba(255, 230, 100, ${0.7 * pulse})`;
  
  const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
  coreGradient.addColorStop(0, `rgba(255, 255, 240, ${0.9 + 0.1 * pulse})`);
  coreGradient.addColorStop(0.3, `rgba(255, 240, 180, ${0.75 + 0.15 * pulse})`);
  coreGradient.addColorStop(0.6, `rgba(255, 225, 130, ${0.5 + 0.15 * pulse})`);
  coreGradient.addColorStop(1, `rgba(255, 210, 90, ${0.2 + 0.1 * pulse})`);
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.3 * pulse})`;
  ctx.beginPath();
  ctx.arc(-size * 0.15, -size * 0.15, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}