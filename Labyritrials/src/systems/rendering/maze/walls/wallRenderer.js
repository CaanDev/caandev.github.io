/**
 * @fileoverview Основной рендерер стен с оптимизированным кэшированием.
 * @module systems/rendering/maze/walls/wallRenderer
 */

import { CONFIG, state, player } from '../../../../core/config/index.js';
import { getRandomSprite, getSpriteWithSize } from '../../../../sprites/index.js';
import {
  getWallTypeFromState,
  getWallColor,
  getWallBorderColor,
  getWallBorderWidth,
  getWallFeatures
} from './wallConfig.js';
import {
  drawCracks,
  drawDemonicGlow,
  drawPsiGlow,
  drawGuardianGlow,
  drawShrineGlow,
  drawTrapGlow,
  clearTreasureCrackCache
} from './wallFeatures.js';
import { drawBookshelf } from './bookshelfRenderer.js';
import { drawNoteOnWall } from './noteRenderer.js';

/** @type {string|null} - Предыдущий тип стены для очистки кэша */
let previousWallType = null;

/** @type {Map<string, Object>} - Кэш спрайтов стен */
const wallSpriteCache = new Map();

/** @type {number} - Максимальный размер кэша спрайтов стен */
const MAX_WALL_SPRITE_CACHE = 200;

/**
 * Получение спрайта стены из кэша или загрузка
 * 
 * @param {string} wallType - Тип стены
 * @param {string} wallBiome - Биом стены
 * @param {number} seed - Seed для выбора спрайта
 * @param {boolean} isCracked - Разрушаемая ли стена
 * @param {number} cellSize - Размер клетки
 * @returns {Object|null} - Спрайт или null
 * @private
 */
function getWallSprite(wallType, wallBiome, seed, isCracked, cellSize) {
  const group = isCracked ? 'wallCracked' : 'wall';
  const cacheKey = `${wallType}_${wallBiome}_${group}_${seed}`;
  
  // Проверка кэша
  if (wallSpriteCache.has(cacheKey)) return wallSpriteCache.get(cacheKey);
  
  // Определение имени спрайта
  let spriteName;
  
  if (state.isBossLevel) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    if (bossLevel === 5) spriteName = 'bossWall5';
    else if (bossLevel === 10) spriteName = 'bossWall10';
    else if (bossLevel === 15) spriteName = 'bossWall15';
    else spriteName = 'bossWall5';
  } else {
    spriteName = getRandomSprite(group, wallBiome, seed);
  }
  
  // Получение спрайта с размерами
  const sprite = spriteName ? getSpriteWithSize(spriteName, cellSize) : null;
  
  // Кэширование (ограничение размера кэша)
  if (sprite && wallSpriteCache.size < MAX_WALL_SPRITE_CACHE) {
    wallSpriteCache.set(cacheKey, sprite);
  } else if (wallSpriteCache.size >= MAX_WALL_SPRITE_CACHE) {
    // Если кэш переполнен - удаление половины записей
    const keys = Array.from(wallSpriteCache.keys());
    const toRemove = Math.floor(keys.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      wallSpriteCache.delete(keys[i]);
    }
    // Попытка добавить снова
    if (sprite) wallSpriteCache.set(cacheKey, sprite);
  }
  
  return sprite;
}

/**
 * Основной рендерер стен
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {{startX: number, endX: number, startY: number, endY: number}} visibleRange - Диапазон видимых клеток
 * @returns {void}
 */
export function drawWalls(ctx, visibleRange) {
  const { startX, endX, startY, endY } = visibleRange;
  
  const minX = Math.max(0, startX);
  const maxX = Math.min(CONFIG.cols, endX);
  const minY = Math.max(0, startY);
  const maxY = Math.min(CONFIG.rows, endY);
  
  // Определение типа стены
  const wallType = getWallTypeFromState(state);
  // Очистка кэша при выходе из сокровищницы
  if (previousWallType === 'TREASURE_ROOM' && wallType !== 'TREASURE_ROOM') clearTreasureCrackCache();

  previousWallType = wallType;

  // Определение биома для стен
  let wallBiome = state.currentBiome || 'cave';

  // Для тайных комнат и безопасной комнаты - используются специальные ID
  if (state.inSafeRoom) wallBiome = 'safeRoom';
  else if (state.inTrapRoom) wallBiome = 'trapRoom';
  else if (state.inShrineRoom) wallBiome = 'shrineRoom';
  else if (state.inTreasureRoom) wallBiome = 'treasureRoom';
  else if (state.isBossLevel) wallBiome = 'boss';
  
  const color = getWallColor(wallType);
  const borderColor = getWallBorderColor(wallType);
  const borderWidth = getWallBorderWidth(wallType);
  const features = getWallFeatures(wallType);

  const cellSize = CONFIG.cellSize;
  
  // Предварительная подготовка данных для пакетной отрисовки
  const wallSprites = new Map();
  const fallbackWalls = [];
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || (!cell.revealed && !player.hasMap)) continue;

      const dx = x * cellSize;
      const dy = y * cellSize;

      // Книжный шкаф
      if (cell.hasBookshelf) {
        drawBookshelf(ctx, dx, dy, x, y);
        continue;
      }
      
      if (cell.isWall) {
        const seed = ((x * 31 + y * 17) % 100) / 100;
        const isCracked = cell.isBreakable;
        
        // Получение спрайта из кэша
        const sprite = getWallSprite(wallType, wallBiome, seed, isCracked, cellSize);
        
        if (sprite) {
          // Сохранение для пакетной отрисовки (если нужно)
          wallSprites.set(`${x},${y}`, { sprite, dx, dy, cell, x, y });
        } else {
          // Fallback
          fallbackWalls.push({ dx, dy, color, borderColor, borderWidth });
        }
      }
    }
  }
  
  // Пакетная отрисовка стен
  // Группировка спрайтов по текстуре для уменьшения переключений контекста
  const textureGroups = new Map();
  
  for (const [key, data] of wallSprites) {
    const texture = data.sprite.texture;
    if (!textureGroups.has(texture)) textureGroups.set(texture, []);
    textureGroups.get(texture).push(data);
  }
  
  // Отрисовка каждой группы
  for (const [texture, items] of textureGroups) {
    for (const item of items) {
      const { sprite, dx, dy, cell, x, y } = item;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        dx + sprite.offsetX, dy + sprite.offsetY,
        sprite.drawW, sprite.drawH
      );
      
      // Особенности стен
      drawWallFeatures(ctx, dx, dy, features);
      
      if (cell.isBreakable) {
        const crackSeed = ((x * 31 + y * 17) % 100) / 100;
        const crackColor = wallType === 'TREASURE_ROOM' ? '#d4a800' : '#242d38';
        drawCracks(ctx, dx, dy, crackSeed, crackColor, wallType);
      }
      
      if (cell.hasNote && cell.noteId) drawNoteOnWall(ctx, dx, dy, cell.noteId);
    }
  }
  
  // Отрисовка fallback-стен (если спрайты не загрузились)
  for (const wall of fallbackWalls) {
    ctx.fillStyle = wall.color;
    ctx.fillRect(wall.dx, wall.dy, cellSize, cellSize);
    ctx.strokeStyle = wall.borderColor;
    ctx.lineWidth = wall.borderWidth;
    ctx.strokeRect(wall.dx, wall.dy, cellSize, cellSize);
  }
}

/**
 * Очистка кэша спрайтов стен
 * 
 * @param {boolean} [keepFrequent=true] - Сохранять часто используемые спрайты
 * @returns {void}
 */
export function clearWallSpriteCache(keepFrequent = true) {
  if (keepFrequent) {
    // Удаление старых записей (первые 50%)
    const keys = Array.from(wallSpriteCache.keys());
    const toRemove = Math.floor(keys.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      wallSpriteCache.delete(keys[i]);
    }
  } else {
    wallSpriteCache.clear();
  }
}

/**
 * Отрисовка особенностей стен
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {string[]} features - Массив особенностей
 * @returns {void}
 * @private
 */
function drawWallFeatures(ctx, dx, dy, features) {
  for (const feature of features) {
    switch (feature) {
      case 'demonicGlow': drawDemonicGlow(ctx, dx, dy); break;
      case 'psiGlow': drawPsiGlow(ctx, dx, dy); break;
      case 'guardianGlow': drawGuardianGlow(ctx, dx, dy); break;
      case 'shrineGlow': drawShrineGlow(ctx, dx, dy); break;
      case 'trapGlow': drawTrapGlow(ctx, dx, dy); break;
    }
  }
}