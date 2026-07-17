/**
 * @fileoverview Система освещения в тумане войны.
 * Управляет отрисовкой света от факелов и огненных шаров.
 * 
 * @module systems/fog/fogLight
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/** @type {Array} - Кэш позиций огненных шаров для оптимизации */
let lastFireballPositions = [];
/** @type {number} - Кэш количества огненных шаров */
let lastFireballCount = 0;

/**
 * Отрисовка света от активных факелов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawTorchLight(ctx, canvas) {
  // Свет факелов не отображается на босс-арене и в комнате-ловушке
  if (state.isBossLevel || state.inTrapRoom) return;
  if (!state.torches || state.torches.length === 0) return;
  
  const camX = canvas.width / 2 - player.px;
  const camY = canvas.height / 2 - player.py;
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // Цвет факелов зависит от типа арены
  const isMindBossArena = state.isBossLevel && state.gameLevel === 10;
  const torchLight = isMindBossArena ? COLORS.torches.light.mind : COLORS.torches.light.warm;
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    
    if (!state.grid[torch.y] || !state.grid[torch.y][torch.x]) continue;
    if (!state.grid[torch.y][torch.x].revealed && !player.hasMap) continue;
    
    const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const screenX = camX + torchWorldX;
    const screenY = camY + torchWorldY;
    
    const distToPlayer = Math.hypot(torchWorldX - player.px, torchWorldY - player.py);
    
    // Интенсивность зависит от расстояния до игрока
    const intensity = Math.max(0, 1 - distToPlayer / 400);
    if (intensity < 0.05) continue;
    
    // Мерцание факела
    const flicker = 0.7 + Math.sin(torch.flickerPhase || 0) * 0.3;
    torch.flickerPhase = (torch.flickerPhase || 0) + CONFIG.torchFlickerSpeed;
    
    const radius = 300 * flicker * intensity;
    
    // Радиальный градиент света
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
    gradient.addColorStop(0, `${torchLight.stop0}${0.25 * intensity})`);
    gradient.addColorStop(0.2, `${torchLight.stop1}${0.2 * intensity})`);
    gradient.addColorStop(0.4, `${torchLight.stop2}${0.15 * intensity})`);
    gradient.addColorStop(0.6, `${torchLight.stop3}${0.08 * intensity})`);
    gradient.addColorStop(0.8, `${torchLight.stop4}${0.03 * intensity})`);
    gradient.addColorStop(1, torchLight.stop5);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Отрисовка тёплого свечения от ближайшего факела
 * 
 * Создаёт общее тёплое свечение вокруг игрока,
 * если рядом есть активный факел.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawTorchWarmth(ctx, canvas) {
  // Не показываем в определённых комнатах
  if (state.isBossLevel) return;
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) return;
  
  // Поиск ближайшего факела
  let nearestTorchDist = Infinity;
  let nearestTorch = null;
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    
    const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const dist = Math.hypot(player.px - torchWorldX, player.py - torchWorldY);
    
    if (dist < nearestTorchDist) {
      nearestTorchDist = dist;
      nearestTorch = torch;
    }
  }
  
  // Если нет факела или он слишком далеко
  if (!nearestTorch || nearestTorchDist > 400) return;
  
  const maxIntensity = 0.55;
  const progress = Math.max(0, 1 - nearestTorchDist / 400);
  const intensity = maxIntensity * progress * progress;
  
  if (intensity < 0.02) return;
  
  const warmthRadius = state.fogState.currentRadius || 550;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  
  const isMindBossArena = state.isBossLevel && state.gameLevel === 10;
  const torchLight = isMindBossArena ? COLORS.torches.light.mind : COLORS.torches.light.warm;
  
  // Цвет свечения
  const warmthColor = isMindBossArena 
    ? { r: 100, g: 160, b: 255 }
    : { r: 255, g: 180, b: 70 };
  
  const baseColor = { r: 10, g: 10, b: 20 };
  
  // Смешивание цветов
  const mixFactor = progress;
  const finalR = Math.floor(baseColor.r + (warmthColor.r - baseColor.r) * intensity * mixFactor);
  const finalG = Math.floor(baseColor.g + (warmthColor.g - baseColor.g) * intensity * mixFactor);
  const finalB = Math.floor(baseColor.b + (warmthColor.b - baseColor.b) * intensity * mixFactor);
  
  // Градиент тепла
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, warmthRadius);
  
  gradient.addColorStop(0, `rgba(${finalR}, ${finalG}, ${finalB}, ${intensity * 1.0})`);
  gradient.addColorStop(0.2, `rgba(${finalR}, ${finalG}, ${finalB}, ${intensity * 0.85})`);
  gradient.addColorStop(0.4, `rgba(${finalR}, ${finalG}, ${finalB}, ${intensity * 0.6})`);
  gradient.addColorStop(0.65, `rgba(${finalR}, ${finalG}, ${finalB}, ${intensity * 0.3})`);
  gradient.addColorStop(0.85, `rgba(${finalR}, ${finalG}, ${finalB}, ${intensity * 0.1})`);
  gradient.addColorStop(1, `rgba(${finalR}, ${finalG}, ${finalB}, 0)`);
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/**
 * Отрисовка света от огненных шаров игрока
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawFireballLight(ctx, canvas) {
  // Сброс кэша при отсутствии шаров
  if (!state.fireballs || state.fireballs.length === 0) {
    if (lastFireballPositions.length > 0) {
      lastFireballPositions = [];
      lastFireballCount = 0;
    }
    return;
  }
  
  const camX = canvas.width / 2 - player.px;
  const camY = canvas.height / 2 - player.py;
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  for (let fb of state.fireballs) {
    // Пропускаем кольцевые снаряды боссов (они слишком большие)
    if (fb.isRingProjectile && fb.ringActive) continue;
    if (fb.isFromBoss && !fb.isFromPlayer) continue;
    
    const screenX = fb.x + camX;
    const screenY = fb.y + camY;
    
    // Проверяем, что шар виден на экране
    if (screenX < -50 || screenX > canvas.width + 50 ||
        screenY < -50 || screenY > canvas.height + 50) continue;
    
    // Радиус освещения зависит от оставшегося времени жизни шара
    const lifeProgress = fb.life / 180; // 180 — максимальная жизнь
    const radius = 150 + 100 * lifeProgress;
    const intensity = 0.6 + 0.4 * lifeProgress;
    
    // Тёплый оранжевый свет
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, radius
    );
    
    gradient.addColorStop(0, `rgba(255, 200, 100, ${0.25 * intensity})`);
    gradient.addColorStop(0.2, `rgba(255, 180, 80, ${0.15 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 140, 40, ${0.08 * intensity})`);
    gradient.addColorStop(0.8, `rgba(255, 100, 20, ${0.03 * intensity})`);
    gradient.addColorStop(1, 'rgba(255, 60, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}