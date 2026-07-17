/**
 * @fileoverview Ядро системы тумана войны.
 * Управляет отрисовкой основного тумана, затуханием памяти клеток
 * и динамическим радиусом видимости.
 * 
 * @module systems/fog/fogCore
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { updateFogMemorySmart, forceUpdateAllFog } from './fogOptimizer.js';

/** @type {number} - Счётчик кадров для обновления памяти тумана */
let currentFrame = 0;

/**
 * Отрисовка основного тумана войны
 * 
 * Создаёт радиальный градиент от центра экрана (игрок) к краям.
 * В безопасной комнате, на босс-уровне и в комнате-ловушке туман не отображается.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawMainFog(ctx, canvas) {
  // Туман не отображается в некоторых комнатах
  if (state.isBossLevel || state.inTrapRoom || state.inSafeRoom) return;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = state.fogState.currentRadius || 550;
  
  // Создаём радиальный градиент
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const fogGradients = COLORS.fog.gradient;
  gradient.addColorStop(0, fogGradients.center);
  gradient.addColorStop(0.05, fogGradients.center);
  gradient.addColorStop(0.12, fogGradients.inner);
  gradient.addColorStop(0.25, fogGradients.mid);
  gradient.addColorStop(0.45, fogGradients.outer);
  gradient.addColorStop(0.65, fogGradients.far);
  gradient.addColorStop(0.80, fogGradients.farther);
  gradient.addColorStop(0.93, fogGradients.edge);
  gradient.addColorStop(1, fogGradients.full);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем затухание памяти клеток
  drawMemoryFade(ctx, canvas);
}

/**
 * Отрисовка затухания памяти клеток
 * 
 * Показывает полупрозрачные клетки, которые были открыты,
 * но уже не видны игроку.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawMemoryFade(ctx, canvas) {
  if (state.isBossLevel || state.inTrapRoom) return;
  
  const camX = canvas.width / 2 - player.px;
  const camY = canvas.height / 2 - player.py;

  const padding = 2;
  const startX = Math.max(0, Math.floor((-camX - padding * CONFIG.cellSize) / CONFIG.cellSize));
  const endX = Math.min(CONFIG.cols, Math.ceil((canvas.width - camX + padding * CONFIG.cellSize) / CONFIG.cellSize));
  const startY = Math.max(0, Math.floor((-camY - padding * CONFIG.cellSize) / CONFIG.cellSize));
  const endY = Math.min(CONFIG.rows, Math.ceil((canvas.height - camY + padding * CONFIG.cellSize) / CONFIG.cellSize));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      if (cell.fogIntensity <= 0.02) continue;

      const screenX = x * CONFIG.cellSize + camX + CONFIG.cellSize / 2;
      const screenY = y * CONFIG.cellSize + camY + CONFIG.cellSize / 2;
      const distToPlayer = Math.hypot(screenX - canvas.width / 2, screenY - canvas.height / 2);

      // Не показываем затухание в центре экрана
      if (distToPlayer < state.fogState.currentRadius * 0.7) continue;

      const alpha = cell.fogIntensity * 0.6;
      const size = CONFIG.cellSize;
      ctx.fillStyle = `rgba(5, 5, 15, ${alpha})`;
      ctx.fillRect(x * CONFIG.cellSize + camX, y * CONFIG.cellSize + camY, size, size);
    }
  }
}

/**
 * Обновление динамического радиуса видимости
 * 
 * Радиус зависит от:
 * - Активного события (уменьшает/увеличивает видимость)
 * - Инверсии управления (уменьшает видимость)
 * - Близости к активным факелам (увеличивает видимость)
 * 
 * @returns {void}
 */
export function updateDynamicRadius() {
  // В тайных комнатах используем базовый радиус
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) {
    state.fogState.currentRadius = CONFIG.fog.baseRadius || 550;
    return;
  }
  
  // На босс-уровне и в комнате-ловушке радиус не меняется
  if (state.isBossLevel || state.inTrapRoom) return;
  
  let baseRadius = CONFIG.fog.baseRadius || 550;
  
  // Модификаторы от событий
  if (state.currentEvent === 'bloodMoon') {
    baseRadius *= 0.85;
  } else if (state.currentEvent === 'iceWind') {
    baseRadius *= 0.9;
  } else if (state.currentEvent === 'blessing') {
    baseRadius *= 1.1;
  }
  
  // Инверсия управления уменьшает видимость
  if (player.controlsInverted) {
    baseRadius *= 0.8;
  }
  
  // Бонус от ближайшего факела
  let torchBonus = 0;
  let nearestTorchDist = Infinity;
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    
    const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const dist = Math.hypot(player.px - torchWorldX, player.py - torchWorldY);
    
    if (dist < nearestTorchDist) {
      nearestTorchDist = dist;
    }
  }
  
  // Расчёт бонуса от факелов
  if (nearestTorchDist < Infinity) {
    const maxBonus = 150;
    const torchInfluenceRadius = 400;
    const progress = Math.max(0, 1 - nearestTorchDist / torchInfluenceRadius);
    torchBonus = Math.floor(maxBonus * progress * progress);
  }

  // Мерцание бонуса от факелов
  if (torchBonus > 5) {
    const flicker = 0.85 + Math.sin(Date.now() * 0.003) * 0.15;
    torchBonus = Math.floor(torchBonus * flicker);
  }
  
  // Итоговый радиус с ограничениями
  let finalRadius = baseRadius + torchBonus;
  
  const minRadius = CONFIG.fog.minRadius || 300;
  const maxRadius = CONFIG.fog.maxRadius || 900;
  finalRadius = Math.max(minRadius, Math.min(maxRadius, finalRadius));
  
  // Плавное изменение радиуса
  const currentRadius = state.fogState.currentRadius || baseRadius;
  state.fogState.currentRadius += (finalRadius - currentRadius) * 0.06;
}

/**
 * Обновление памяти тумана (интенсивность затухания клеток)
 * 
 * Для каждой открытой клетки рассчитывает интенсивность затухания
 * в зависимости от времени, прошедшего с последнего посещения.
 * 
 * @returns {void}
 */
export function updateFogMemory() {
  if (state.isBossLevel || state.inTrapRoom) return;
  
  const fadeDelay = CONFIG.fog.memoryFadeDelay || 600;
  const fadeDuration = CONFIG.fog.memoryFadeDuration || 600;
  
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell) continue;
      
      if (cell.revealed && !cell.isWall) {
        const distToPlayer = Math.hypot(
          (x + 0.5) * CONFIG.cellSize - player.px,
          (y + 0.5) * CONFIG.cellSize - player.py
        );
        
        // Если клетка в радиусе видимости — полностью открыта
        if (distToPlayer < state.fogState.currentRadius) {
          cell.lastSeenFrame = currentFrame;
          cell.fogIntensity = 0;
        } else {
          // Иначе рассчитываем затухание
          const framesSinceSeen = currentFrame - cell.lastSeenFrame;
          if (framesSinceSeen > fadeDelay) {
            const fadeProgress = Math.min(1, (framesSinceSeen - fadeDelay) / fadeDuration);
            cell.fogIntensity = Math.min(0.8, fadeProgress * 0.8);
          } else {
            cell.fogIntensity = 0;
          }
        }
      }
    }
  }
}