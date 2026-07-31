/**
 * @fileoverview Основной рендерер стен.
 * Отрисовывает стены с учётом их типа, состояния (разрушаемые, с записками).
 * 
 * @module systems/rendering/maze/walls/wallRenderer
 */

import { CONFIG, state, player } from '../../../../core/config/index.js';
import { getWallImage, WALL_IMAGES } from '../../../../images/wallImages.js';
import { getImage, isImageLoaded } from '../../../../utils/imageLoader.js';
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

/**
 * Получение ключа изображения для стены
 * 
 * @param {string} biomeId - ID биома
 * @param {boolean} isCracked - Разрушаемая ли стена
 * @param {number} seed - Seed для детерминированного выбора
 * @returns {string|null} - Ключ изображения или null
 * @private
 */
function getCachedWallImageKey(biomeId, isCracked, seed) {
  // Для безопасной комнаты и комнаты-ловушки нет разрушаемых стен
  if (biomeId === 'safeRoom' || biomeId === 'trapRoom' || biomeId === 'shrineRoom') {
    isCracked = false;
  }
  
  // Для босс-арен игнорируем isCracked (разрушаемых стен нет)
  const actualIsCracked = (biomeId === 'boss' || biomeId === 'bossArena') ? false : isCracked;
  const type = actualIsCracked ? 'cracked' : 'wall';
  
  // Получаем конфигурацию биома
  const biome = WALL_IMAGES[biomeId];
  if (!biome) return null;
  
  const images = actualIsCracked ? biome.cracked : biome.wall;
  if (!images || images.length === 0) {
    // Если нет cracked изображений, используем обычные
    if (actualIsCracked && biome.wall && biome.wall.length > 0) {
      const index = Math.floor(seed * biome.wall.length) % biome.wall.length;
      return `${biomeId}_wall_${index}`;
    }
    return null;
  }
  
  const index = Math.floor(seed * images.length) % images.length;
  const cacheKey = `${biomeId}_${type}_${index}`;
  
  // Проверяем, что такое изображение действительно существует
  const imagePath = getWallImage(biomeId, actualIsCracked, null, seed);
  if (!imagePath) {
    return null;
  }
  
  return cacheKey;
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
  
  // Определяем тип стены
  const wallType = getWallTypeFromState(state);
  
  // Очищаем кэш при выходе из сокровищницы
  if (previousWallType === 'TREASURE_ROOM' && wallType !== 'TREASURE_ROOM') {
    clearTreasureCrackCache();
  }
  previousWallType = wallType;

  // ===== ОПРЕДЕЛЯЕМ БИОМ ДЛЯ СТЕН =====
  let wallBiome = state.currentBiome || 'cave';

  // Для тайных комнат и безопасной комнаты — используем специальные ID
  if (state.inSafeRoom) {
    wallBiome = 'safeRoom';
  } else if (state.inTrapRoom) {
    wallBiome = 'trapRoom';
  } else if (state.inShrineRoom) {
    wallBiome = 'shrineRoom';
  } else if (state.inTreasureRoom) {
    wallBiome = 'treasureRoom';
  } else if (state.isBossLevel) {
    wallBiome = 'boss';
  }
  
  const color = getWallColor(wallType);
  const borderColor = getWallBorderColor(wallType);
  const borderWidth = getWallBorderWidth(wallType);
  const features = getWallFeatures(wallType);
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (!state.grid[y]?.[x]) continue;
      if (!state.grid[y][x].revealed && !player.hasMap) continue;
      
      const cell = state.grid[y][x];
      const dx = x * CONFIG.cellSize;
      const dy = y * CONFIG.cellSize;
      
      // Книжный шкаф
      if (cell.hasBookshelf) {
        drawBookshelf(ctx, dx, dy, x, y);
        continue;
      }
      
      if (cell.isWall) {
        const seed = ((x * 31 + y * 17) % 100) / 100;
        
        // Определяем, нужны ли изображения для разрушаемой стены
        let isCracked = cell.isBreakable;
        let imageKey = null;
        
        // Для сокровищницы используем отдельную логику с cracked
        if (state.inTreasureRoom && cell.isBreakable) {
          // Используем изображения разрушаемых стен сокровищницы
          imageKey = getCachedWallImageKey('treasureRoom', true, seed);
        } else {
          imageKey = getCachedWallImageKey(wallBiome, isCracked, seed);
        }
        
        // Для босс-арен: если ключ не найден, используем boss_wall_0
        if (state.isBossLevel && (!imageKey || !isImageLoaded(imageKey))) {
          imageKey = 'boss_wall_0';
        }
        
        const hasImage = imageKey && isImageLoaded(imageKey);
        // Используем изображение, если оно есть
        const useImageWalls = hasImage;
        
        // Пытаемся загрузить изображение стены
        if (useImageWalls) {
          const img = getImage(imageKey);
          if (img) {
            ctx.save();
            
            let drawSize = CONFIG.cellSize;
            // Увеличиваем только для безопасной комнаты на 17%
            if (wallBiome === 'safeRoom') {
              drawSize = CONFIG.cellSize * 1.17;
              const offset = (drawSize - CONFIG.cellSize) / 2;
              ctx.drawImage(img, dx - offset, dy - offset, drawSize, drawSize);
            } else {
              ctx.drawImage(img, dx, dy, CONFIG.cellSize, CONFIG.cellSize);
            }
            
            ctx.restore();
            
            drawWallFeatures(ctx, dx, dy, features);
            
            if (cell.hasNote && cell.noteId) {
              drawNoteOnWall(ctx, dx, dy, cell.noteId);
            }
            
            continue;
          }
        }
        
        // ===== FALLBACK: Рисуем стены цветом =====
        ctx.fillStyle = color;
        ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
        
        if (cell.isBreakable) {
          const seed = ((x * 31 + y * 17) % 100) / 100;
          let crackColor = '#242d38';
          
          if (wallType === 'TREASURE_ROOM') {
            crackColor = '#d4a800';
          }
          
          drawCracks(ctx, dx, dy, seed, crackColor, wallType);
        }
        
        drawWallFeatures(ctx, dx, dy, features);
        
        if (cell.hasNote && cell.noteId) {
          drawNoteOnWall(ctx, dx, dy, cell.noteId);
        }
      }
    }
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
      case 'demonicGlow':
        drawDemonicGlow(ctx, dx, dy);
        break;
      case 'psiGlow':
        drawPsiGlow(ctx, dx, dy);
        break;
      case 'guardianGlow':
        drawGuardianGlow(ctx, dx, dy);
        break;
      case 'shrineGlow':
        drawShrineGlow(ctx, dx, dy);
        break;
      case 'trapGlow':
        drawTrapGlow(ctx, dx, dy);
        break;
    }
  }
}