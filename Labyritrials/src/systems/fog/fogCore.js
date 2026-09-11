/**
 * @fileoverview Ядро системы тумана войны.
 * Управляет отрисовкой основного тумана, затуханием памяти клеток
 * и динамическим радиусом видимости.
 * 
 * @module systems/fog/fogCore
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { Game } from '../../core/game.js';
import { COLORS } from '../../core/config/colors.js';
import { getFogColorsForBiome, getMemoryFadeColorForBiome, getBiomeByLevel } from '../../data/biomes.js';
import { updateFogMemorySmart, forceUpdateAllFog } from './fogOptimizer.js';

/** @type {number} - Счётчик кадров для обновления памяти тумана */
let currentFrame = 0;

/**
 * Получение градиента тумана для текущего биома
 */
function getFogGradientForBiome() {
  const biome = state.currentBiome || 'cave';
  
  // В тайных комнатах и безопасной комнате используется нейтральный туман
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return getFogColorsForBiome('cave');
  return getFogColorsForBiome(biome);
}

/**
 * Отрисовка основного тумана войны
 * 
 * Создаёт радиальный градиент от центра экрана (игрок) к краям.
 * Автоматически адаптируется под количество слоёв в конфигурации биома.
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

  // Получение всех цветов тумана для текущего биома
  const fogColors = getFogColorsForBiome(state.currentBiome || 'cave');
  // Определение всех слоёв тумана
  const layerKeys = Object.keys(fogColors).filter(key => key !== 'memoryFade');

  // Сортировка слоёв в правильном порядке
  const priorityOrder = [
    'center', 
    'inner1', 'inner2', 'inner3', 'inner', 
    'mid1', 'mid2', 'mid3', 'mid', 
    'outer1', 'outer2', 'outer3', 'outer', 
    'far1', 'far2', 'far', 
    'farther', 
    'edge', 
    'full'
  ];

  const sortedKeys = layerKeys.sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a);
    const bIdx = priorityOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  // Если слоёв нет - выход
  if (sortedKeys.length === 0) return;
  
  // Создание радиального градиента
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  // Автоматическое распределение слоёв по радиусу
  const totalLayers = sortedKeys.length;
  
  for (let i = 0; i < totalLayers; i++) {
    // Позиция от 0 до 1 с плавным распределением
    let pos = i / (totalLayers - 1);
    
    // Использование квадратичной кривой для более плавного перехода
    // Чем больше слоёв, тем ближе к линейному
    const smoothness = Math.min(1, totalLayers / 10);
    const smoothPos = pos * pos * (3 - 2 * pos) * smoothness + pos * (1 - smoothness);
    
    const color = fogColors[sortedKeys[i]];
    if (color) gradient.addColorStop(smoothPos, color);
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Отрисовка затухания памяти клеток
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
  // Получение цвета памяти для текущего биома
  const memoryFadeColor = getMemoryFadeColorForBiome(state.currentBiome || 'cave');

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || cell.isWall) continue;
      if (cell.fogIntensity <= 0.02) continue;

      const screenX = x * CONFIG.cellSize + camX + CONFIG.cellSize / 2;
      const screenY = y * CONFIG.cellSize + camY + CONFIG.cellSize / 2;
      const distToPlayer = Math.hypot(screenX - canvas.width / 2, screenY - canvas.height / 2);

      // Затухание в центре экрана не показывается
      if (distToPlayer < state.fogState.currentRadius * 0.7) continue;

      const alpha = cell.fogIntensity * 0.6;
      const size = CONFIG.cellSize;
      ctx.fillStyle = memoryFadeColor + alpha + ')';
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
  // В тайных комнатах используется базовый радиус
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) {
    state.fogState.currentRadius = CONFIG.fog.baseRadius || 550;
    return;
  }
  
  // На босс-уровне и в комнате-ловушке радиус не меняется
  if (state.isBossLevel || state.inTrapRoom) return;
  
  let baseRadius = CONFIG.fog.baseRadius || 550;
  
  // Модификаторы от событий
  switch (state.currentEvent) {
    case 'bloodMoon': baseRadius *= 0.85; break;
    case 'iceWind': baseRadius *= 0.9; break;
    case 'blessing': baseRadius *= 1.1; break;
  }
  
  // Инверсия управления уменьшает видимость
  if (player.controlsInverted) baseRadius *= 0.8;
  
  // Бонус от ближайшего факела
  let torchBonus = 0;
  let nearestTorchDist = Infinity;
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    
    const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const dist = Math.hypot(player.px - torchWorldX, player.py - torchWorldY);
    
    if (dist < nearestTorchDist) nearestTorchDist = dist;
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