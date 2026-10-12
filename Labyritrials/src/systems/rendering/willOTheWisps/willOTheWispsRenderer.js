/**
 * @fileoverview Рендерер блуждающих огоньков.
 * @module systems/rendering/willOTheWisps/willOTheWispsRenderer
 */

import { player } from '../../../core/config/index.js';
import { WISPS_VISUAL, WISPS_DEATH } from '../../../entities/objects/willOTheWisps/wispsData.js';
import { getWisps } from '../../../entities/objects/willOTheWisps/wispsState.js';
import { getWispSprite } from './wispsSpriteCache.js';

// Сортировка по глубине раз в 15 кадров (кэш)
let _sortFrame = 0;
let _sortedCache = null;

/**
 * Отрисовка всех огоньков
 * @param {CanvasRenderingContext2D} ctx
 * @returns {void}
 */
export function drawWisps(ctx) {
  const list = getWisps();
  if (!list || list.length === 0) return;

  // Подсветка игрока
  drawPlayerLight(ctx, list);

  // Сортировка по глубине
  _sortFrame++;
  if (!_sortedCache || _sortFrame % 15 === 0 || _sortedCache.length !== list.length) {
    _sortedCache = [...list].sort((a, b) => {
      const da = a.depthFactor ?? 0.5;
      const db = b.depthFactor ?? 0.5;
      return da - db;
    });
  }

  // Хвосты
  for (const w of _sortedCache) drawTrail(ctx, w);
  // Огоньки
  for (const w of _sortedCache) drawWispSprite(ctx, w);
}

/**
 * Отрисовка треугольного хвоста с сужением
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} w
 * @private
 */
function drawTrail(ctx, w) {
  if (w.dying) return;
  if (!w.trail || w.trail.length < 2) return;

  const depth = w.depthFactor ?? 0.5;
  const baseAlpha = 0.35 + depth * 0.45;
  if (baseAlpha <= 0.02) return;

  const trailLen = w.trail.length;
  const maxWidth = 10 * (0.7 + depth * 0.5);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Слой 1: мягкая размытая "дымка" (широкая)
  const leftSide1 = [];
  const rightSide1 = [];

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

    leftSide1.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
    rightSide1.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
  }

  ctx.globalAlpha = baseAlpha * 0.2;
  ctx.fillStyle = w.glowColor;
  ctx.beginPath();
  ctx.moveTo(leftSide1[0].x, leftSide1[0].y);
  for (let i = 1; i < leftSide1.length; i++) ctx.lineTo(leftSide1[i].x, leftSide1[i].y);
  for (let i = rightSide1.length - 1; i >= 0; i--) ctx.lineTo(rightSide1[i].x, rightSide1[i].y);
  ctx.closePath();
  ctx.fill();

  // Слой 2: основная форма (полупрозрачная)
  const leftSide2 = [];
  const rightSide2 = [];

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

    leftSide2.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
    rightSide2.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
  }

  ctx.globalAlpha = baseAlpha * 0.5;
  ctx.fillStyle = w.color;
  ctx.beginPath();
  ctx.moveTo(leftSide2[0].x, leftSide2[0].y);
  for (let i = 1; i < leftSide2.length; i++) ctx.lineTo(leftSide2[i].x, leftSide2[i].y);
  for (let i = rightSide2.length - 1; i >= 0; i--) ctx.lineTo(rightSide2[i].x, rightSide2[i].y);
  ctx.closePath();
  ctx.fill();

  // Слой 3: узкая яркая сердцевина
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
  ctx.fillStyle = w.brightColor;
  ctx.beginPath();
  ctx.moveTo(innerLeft[0].x, innerLeft[0].y);
  for (let i = 1; i < innerLeft.length; i++) ctx.lineTo(innerLeft[i].x, innerLeft[i].y);
  for (let i = innerRight.length - 1; i >= 0; i--) ctx.lineTo(innerRight[i].x, innerRight[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Отрисовка одного огонька через предрендеренный спрайт
 * 
 * Передаёт текущие параметры цвета (hue, sat, light, glowLight, brightLight)
 * в getWispSprite - это позволяет корректно отображать разные биомы
 * и "кровавое насыщение" с вампирским посохом.
 * 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} w
 * @private
 */
function drawWispSprite(ctx, w) {
  const x = w.currentX;
  const y = w.currentY;
  if (x === undefined || y === undefined) return;

  const depth = w.depthFactor ?? 0.5;
  const pulse = w.pulse ?? 0.5;
  const fade = w.dying ? Math.max(0, w.deathTimer / WISPS_DEATH.DURATION) : 1;
  const deathScale = w.dying ? Math.pow(w.deathTimer / WISPS_DEATH.DURATION, 1.5) : 1;
  const scale = (1.0 + pulse * 0.1) * fade * deathScale;
  const alpha = (0.9 + depth * 0.1) * fade;

  if (scale <= 0.01 || alpha <= 0.01) return;

  const hue = w.hue || '265';
  const sat = w.currentSat ?? 100;
  const light = w.currentLight ?? 70;
  const glowLight = w.currentGlowLight ?? 78;
  const brightLight = w.currentBrightLight ?? 90;
  const coreSat = w.currentCoreSat ?? 60;

  const sprite = getWispSprite(hue, sat, light, glowLight, brightLight, coreSat);
  const size = 128 * scale;
  const half = size / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - half, y - half, size, size);
  ctx.restore();
}

/**
 * Отрисовка мягкой подсветки игрока
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} list
 * @private
 */
function drawPlayerLight(ctx, list) {
  // Поиск ближайшего огонька
  let nearest = null;
  let nearestDist = Infinity;
  for (const w of list) {
    if (w.currentX === undefined) continue;
    const d = Math.hypot(w.currentX - player.px, w.currentY - player.py);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = w;
    }
  }
  if (!nearest || nearestDist > WISPS_VISUAL.PLAYER_LIGHT_RADIUS) return;

  const fade = nearest.dying ? Math.max(0, nearest.deathTimer / WISPS_DEATH.DURATION) : 1;
  const strength = Math.max(0, 1 - nearestDist / WISPS_VISUAL.PLAYER_LIGHT_RADIUS) * 0.25 * fade;
  if (strength <= 0.01) return;

  const grad = ctx.createRadialGradient(
    player.px,
    player.py - 8,
    5,
    player.px,
    player.py - 8,
    45
  );
  grad.addColorStop(0, nearest.brightColor);
  grad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = strength;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.px, player.py - 8, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}