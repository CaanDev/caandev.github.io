/**
 * @fileoverview Основной рендерер пола с оптимизированным кэшированием.
 * @module systems/rendering/maze/floors/floorRenderer
 */

import { CONFIG, state, player } from '../../../../core/config/index.js';
import { getRandomSprite, getSpriteWithSize } from '../../../../sprites/index.js';
import { getFloorColorForBiome } from '../../../../core/config/biomes.js';
import { getFloorTypeFromState, getFloorColors, getFloorMainColor, isCheckered } from './floorConfig.js';
import { drawMagicCircle, drawCornerRunes, drawShrineGlow, drawTrapGlow } from './features.js';

/** @type {Map<string, Object>} - Кэш спрайтов пола */
const floorSpriteCache = new Map();

/** @type {number} - Максимальный размер кэша спрайтов пола */
const MAX_FLOOR_SPRITE_CACHE = 100;

/**
 * Получение спрайта пола из кэша или загрузка
 * 
 * @param {string} floorBiome - Биом пола
 * @param {number} seed - Seed для выбора спрайта
 * @param {number} cellSize - Размер клетки
 * @returns {Object|null} - Спрайт или null
 * @private
 */
function getFloorSprite(floorBiome, seed, cellSize) {
  const cacheKey = `${floorBiome}_${seed}_${cellSize}`;
  // Проверка кэша
  if (floorSpriteCache.has(cacheKey)) return floorSpriteCache.get(cacheKey);
  
  const spriteName = getRandomSprite('floor', floorBiome, seed);
  const sprite = spriteName ? getSpriteWithSize(spriteName, cellSize) : null;
  
  // Кэширование
  if (sprite && floorSpriteCache.size < MAX_FLOOR_SPRITE_CACHE) floorSpriteCache.set(cacheKey, sprite);
  return sprite;
}

/**
 * Основной рендерер пола
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {{startX: number, endX: number, startY: number, endY: number}} visibleRange - Диапазон видимых клеток
 * @returns {void}
 */
export function drawFloor(ctx, visibleRange) {
  const { startX, endX, startY, endY } = visibleRange;
  
  const minX = Math.max(0, startX);
  const maxX = Math.min(CONFIG.cols, endX);
  const minY = Math.max(0, startY);
  const maxY = Math.min(CONFIG.rows, endY);
  
  // Определение типа пола
  const floorType = getFloorTypeFromState(state);
  const colors = getFloorColors(floorType);
  const isCheckeredFloor = isCheckered(floorType);
  
  // Определение биома для пола
  let floorBiome = state.currentBiome || 'cave';
  
  // Для тайных комнат и безопасной комнаты - используются специальные ID
  if (state.inSafeRoom) floorBiome = 'safeRoom';
  else if (state.inTrapRoom) floorBiome = 'trapRoom';
  else if (state.inShrineRoom) floorBiome = 'shrineRoom';
  else if (state.inTreasureRoom) floorBiome = 'treasureRoom';
  else if (state.isBossLevel) floorBiome = 'boss';
  
  const cellSize = CONFIG.cellSize;
  
  // Для шахматного пола используются цвета из конфигурации
  const color1 = colors[0] || '#1a2a3a';
  const color2 = colors[1] || '#2d4a60';
  
  // Для обычного пола - цвет из биома
  const defaultColor = getFloorMainColor(floorType) || getFloorColorForBiome(state.currentBiome) || '#0b0d13';
  
  // Предварительная подготовка данных для пакетной отрисовки
  const floorSprites = new Map();
  const fallbackFloors = [];
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || (!cell.revealed && !player.hasMap)) continue;
      if (cell.isWall) continue;
      
      const dx = x * cellSize;
      const dy = y * cellSize;
      const seed = ((x * 31 + y * 17) % 100) / 100;
      
      // Шахматный пол (безопасная комната)
      if (isCheckeredFloor) {
        drawCheckeredFloor(ctx, dx, dy, x, y, color1, color2, cellSize);
        continue;
      }
      
      // Обычный пол (спрайты из атласа)
      const sprite = getFloorSprite(floorBiome, seed, cellSize);
      
      if (sprite) floorSprites.set(`${x},${y}`, { sprite, dx, dy });
      else fallbackFloors.push({ dx, dy, color: defaultColor });
    }
  }
  
  // Пакетная отрисовка пола
  // Группировка спрайтов по текстуре
  const textureGroups = new Map();
  
  for (const [key, data] of floorSprites) {
    const texture = data.sprite.texture;
    if (!textureGroups.has(texture)) textureGroups.set(texture, []);
    textureGroups.get(texture).push(data);
  }
  
  // Отрисовка каждой группы
  for (const [texture, items] of textureGroups) {
    for (const item of items) {
      const { sprite, dx, dy } = item;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        dx + sprite.offsetX, dy + sprite.offsetY,
        sprite.drawW, sprite.drawH
      );
    }
  }
  
  // Отрисовка fallback-пола (если спрайты не загрузились)
  for (const floor of fallbackFloors) {
    ctx.fillStyle = floor.color;
    ctx.fillRect(floor.dx, floor.dy, cellSize, cellSize);
  }
  
  // Особенности пола
  drawFloorFeatures(ctx);
}

/**
 * Отрисовка шахматного пола (безопасная комната)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} x - Координата X в сетке
 * @param {number} y - Координата Y в сетке
 * @param {string} color1 - Первый цвет
 * @param {string} color2 - Второй цвет
 * @param {number} cellSize - Размер клетки
 * @returns {void}
 * @private
 */
function drawCheckeredFloor(ctx, dx, dy, x, y, color1, color2, cellSize) {
  const thirdSize = cellSize / 3;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const globalX = x * 3 + col;
      const globalY = y * 3 + row;
      const isEven = (globalX + globalY) % 2 === 0;
      
      ctx.fillStyle = isEven ? color1 : color2;
      ctx.fillRect(
        dx + col * thirdSize,
        dy + row * thirdSize,
        thirdSize,
        thirdSize
      );
    }
  }
}

/**
 * Отрисовка особенностей пола
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawFloorFeatures(ctx) {
  if (state.inSafeRoom) {
    drawMagicCircle(ctx);
    drawCornerRunes(ctx);
  }
  
  if (state.inShrineRoom) {
    for (const shrine of state.shrines) {
      if (!shrine.activated) drawShrineGlow(ctx, shrine.x, shrine.y);
    }
  }
  
  if (state.inTrapRoom && state.trapPortal) {
    const x = state.trapPortal.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = state.trapPortal.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    drawTrapGlow(ctx, x, y);
  }
}

/**
 * Очистка кэша спрайтов пола
 * 
 * @param {boolean} [keepFrequent=true] - Сохранять часто используемые спрайты
 * @returns {void}
 */
export function clearFloorSpriteCache(keepFrequent = true) {
  if (keepFrequent) {
    // Удаление старых записей (первые 50%)
    const keys = Array.from(floorSpriteCache.keys());
    const toRemove = Math.floor(keys.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      floorSpriteCache.delete(keys[i]);
    }
  } else {
    floorSpriteCache.clear();
  }
}