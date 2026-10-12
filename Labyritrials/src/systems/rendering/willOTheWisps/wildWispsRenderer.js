/**
 * @fileoverview Рендерер диких блуждающих огоньков.
 * Визуально повторяет призванных огоньков, но другого цвета.
 * 
 * @module systems/rendering/willOTheWisps/wildWispsRenderer
 */

import { state } from '../../../core/config/index.js';
import { getDistanceVisibility } from '../../fog/index.js';
import { getWildWispSprite } from './wispsSpriteCache.js';

// Сортировка по глубине раз в 15 кадров
let _sortFrame = 0;
let _sortedCache = null;

/**
 * Отрисовка всех диких огоньков.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawWildWisps(ctx) {
  const list = state.wildWisps;
  if (!list || list.length === 0) return;

  // Сортировка по Y (глубина)
  _sortFrame++;
  if (!_sortedCache || _sortFrame % 15 === 0 || _sortedCache.length !== list.length) _sortedCache = [...list].sort((a, b) => a.y - b.y);

  for (const w of _sortedCache) {
    // Хвосты
    drawTrail(ctx, w);
    // Спрайты
    drawWispSprite(ctx, w);
  }
}

/**
 * Отрисовка хвоста дикого огонька.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} w - Объект огонька
 * @returns {void}
 * @private
 */
function drawTrail(ctx, w) {
  if (!w.trail) w.trail = [];
  if (!w.trailCounter) w.trailCounter = 0;

  w.trailCounter++;
  if (w.trailCounter >= 2) {
    w.trailCounter = 0;
    w.trail.push({ x: w.x, y: w.y });
    if (w.trail.length > 6) w.trail.shift();
  }

  if (w.trail.length < 2) return;

  const visibility = getDistanceVisibility(w.x, w.y);
  if (visibility <= 0.05) return;

  const trailLen = w.trail.length;
  const maxWidth = 10;
  const baseAlpha = 0.5 * visibility;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Слой 1: размытая дымка
  const left1 = [];
  const right1 = [];
  for (let i = 0; i < trailLen; i++) {
    const p = w.trail[i];
    const t = 1 - i / (trailLen - 1);
    const halfWidth = maxWidth * (1 - t) * 0.5;
    const prev = w.trail[Math.max(0, i - 1)];
    const next = w.trail[Math.min(trailLen - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    left1.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
    right1.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
  }
  ctx.globalAlpha = baseAlpha * 0.2;
  ctx.fillStyle = 'hsl(0, 100%, 65%)';
  ctx.beginPath();
  ctx.moveTo(left1[0].x, left1[0].y);
  for (let i = 1; i < left1.length; i++) ctx.lineTo(left1[i].x, left1[i].y);
  for (let i = right1.length - 1; i >= 0; i--) ctx.lineTo(right1[i].x, right1[i].y);
  ctx.closePath();
  ctx.fill();

  // Слой 2: основная форма
  const left2 = [];
  const right2 = [];
  for (let i = 0; i < trailLen; i++) {
    const p = w.trail[i];
    const t = 1 - i / (trailLen - 1);
    const halfWidth = maxWidth * (1 - t) * 0.5 * 0.8;
    const prev = w.trail[Math.max(0, i - 1)];
    const next = w.trail[Math.min(trailLen - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    left2.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
    right2.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
  }
  ctx.globalAlpha = baseAlpha * 0.5;
  ctx.fillStyle = 'hsl(0, 100%, 55%)';
  ctx.beginPath();
  ctx.moveTo(left2[0].x, left2[0].y);
  for (let i = 1; i < left2.length; i++) ctx.lineTo(left2[i].x, left2[i].y);
  for (let i = right2.length - 1; i >= 0; i--) ctx.lineTo(right2[i].x, right2[i].y);
  ctx.closePath();
  ctx.fill();

  // Слой 3: яркая сердцевина
  const innerMaxWidth = maxWidth * 0.4;
  const innerLeft = [];
  const innerRight = [];
  for (let i = 0; i < trailLen; i++) {
    const p = w.trail[i];
    const t = 1 - i / (trailLen - 1);
    const halfWidth = innerMaxWidth * (1 - t) * 0.5;
    const prev = w.trail[Math.max(0, i - 1)];
    const next = w.trail[Math.min(trailLen - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    innerLeft.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
    innerRight.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
  }
  ctx.globalAlpha = baseAlpha * 0.85;
  ctx.fillStyle = 'hsl(0, 100%, 80%)';
  ctx.beginPath();
  ctx.moveTo(innerLeft[0].x, innerLeft[0].y);
  for (let i = 1; i < innerLeft.length; i++) ctx.lineTo(innerLeft[i].x, innerLeft[i].y);
  for (let i = innerRight.length - 1; i >= 0; i--) ctx.lineTo(innerRight[i].x, innerRight[i].y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Отрисовка спрайта дикого огонька.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} w - Объект огонька
 * @returns {void}
 * @private
 */
function drawWispSprite(ctx, w) {
  const visibility = getDistanceVisibility(w.x, w.y);
  if (visibility <= 0.05) return;

  const pulse = 0.5 + 0.5 * Math.sin((w.pulsePhase || 0) * (w.pulseSpeed || 1));
  const scale = 1.0 + pulse * 0.1;

  // Эффект оглушения - мерцание
  let stunAlpha = 1.0;
  if (w.stunTimer > 0) stunAlpha = 0.5 + 0.3 * Math.sin(Date.now() * 0.006);

  const alpha = Math.min(1, visibility * 0.9 + 0.1) * stunAlpha;

  // Тёмная подложка (только на Ice-биоме для контраста)
  if (state.currentBiome === 'ice') {
    const darkRadius = 40 * scale;
    const darkGradient = ctx.createRadialGradient(
      w.x, w.y, 0,
      w.x, w.y, darkRadius
    );
    darkGradient.addColorStop(0, `rgba(20, 0, 0, ${0.35 * alpha})`);
    darkGradient.addColorStop(0.5, `rgba(20, 0, 0, ${0.18 * alpha})`);
    darkGradient.addColorStop(1, `rgba(20, 0, 0, 0)`);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = darkGradient;
    ctx.beginPath();
    ctx.arc(w.x, w.y, darkRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Спрайт огонька
  const sprite = getWildWispSprite();
  const size = 128 * scale;
  const half = size / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, w.x - half, w.y - half, size, size);
  ctx.restore();
}