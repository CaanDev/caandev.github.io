/**
 * @fileoverview Рендерер записок на стенах.
 * Отрисовывает метки записок на разрушаемых стенах.
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
  
  const posX = margin + seededRandom(100) * availableWidth;
  const posY = margin + seededRandom(200) * availableHeight;
  
  const size = 14 + seededRandom(300) * 6;
  const halfSize = size / 2;
  const thickness = 1.8;
  
  const rotationIndex = Math.floor(seededRandom(400) * 3);
  let finalRotation;
  if (rotationIndex === 0) finalRotation = 0;
  else if (rotationIndex === 1) finalRotation = Math.PI / 4;
  else finalRotation = 3 * Math.PI / 4;
  
  const time = Date.now() * 0.001;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2 + noteId);
  
  ctx.save();
  ctx.translate(dx + posX, dy + posY);
  ctx.rotate(finalRotation);
  
  const alpha = 0.7 + 0.3 * pulse;
  ctx.shadowBlur = 10 * pulse;
  ctx.shadowColor = `rgba(200, 200, 100, ${0.3 * pulse})`;
  
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const lineGradient = ctx.createLinearGradient(-halfSize, 0, halfSize, 0);
  lineGradient.addColorStop(0, `rgba(200, 200, 100, ${0.05 * alpha})`);
  lineGradient.addColorStop(0.15, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradient.addColorStop(0.4, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradient.addColorStop(0.6, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradient.addColorStop(0.85, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradient.addColorStop(1, `rgba(200, 200, 100, ${0.05 * alpha})`);
  
  ctx.strokeStyle = lineGradient;
  ctx.beginPath();
  ctx.moveTo(-halfSize, 0);
  ctx.lineTo(halfSize, 0);
  ctx.stroke();
  
  const lineGradientV = ctx.createLinearGradient(0, -halfSize, 0, halfSize);
  lineGradientV.addColorStop(0, `rgba(200, 200, 100, ${0.05 * alpha})`);
  lineGradientV.addColorStop(0.15, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradientV.addColorStop(0.4, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradientV.addColorStop(0.6, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradientV.addColorStop(0.85, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradientV.addColorStop(1, `rgba(200, 200, 100, ${0.05 * alpha})`);
  
  ctx.strokeStyle = lineGradientV;
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(0, halfSize);
  ctx.stroke();
  
  ctx.shadowBlur = 20 * pulse;
  ctx.shadowColor = `rgba(200, 200, 100, ${0.12 * pulse})`;
  
  ctx.strokeStyle = `rgba(255, 255, 200, ${0.12 * alpha})`;
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(-halfSize * 0.4, 0);
  ctx.lineTo(halfSize * 0.4, 0);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, -halfSize * 0.4);
  ctx.lineTo(0, halfSize * 0.4);
  ctx.stroke();
  
  ctx.restore();
}