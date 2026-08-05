/**
 * @fileoverview Мини-карта лабиринта.
 * Отображает уменьшенную карту уровня с открытыми клетками,
 * стенами, колоннами, магазином, порталом выхода и позицией игрока.
 * 
 * @module systems/rendering/ui/miniMap
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { getImage, isImageLoaded } from '../../../utils/imageLoader.js';
import { UI_IMAGES } from '../../../images/uiImages.js';

/**
 * Получение ключа фона мини-карты в зависимости от биома
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {string} - Ключ изображения фона
 */
function getMiniMapBgKey(biome) {
  if (biome === 'ice') return 'minimapBgIce';
  if (biome === 'sand') return 'minimapBgSand';
  return 'minimapBg';
}

/**
 * Отрисовка мини-карты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawMiniMap(ctx, canvas) {
  // Не показываем мини-карту на босс-уровнях
  if (state.isBossLevel) return;
  // Мини-карта не отображается в тайных комнатах и безопасной комнате
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  if (!player.hasMap) return;
  
  const mSize = 160;
  const padding = 20;
  const rx = canvas.width - mSize - padding;
  const ry = padding;
  const radius = 6;
  
  // ===== ФОН =====
  const biome = state.currentBiome || 'cave';
  const bgKey = getMiniMapBgKey(biome);
  
  if (isImageLoaded(bgKey)) {
    const img = getImage(bgKey);
    if (img) {
      ctx.save();
      ctx.drawImage(img, rx - 40, ry - 40, mSize + 80, mSize + 80);
      ctx.restore();
    }
  } else {
    // Fallback: стандартный фон
    const fallbackKey = 'minimapBg';
    if (isImageLoaded(fallbackKey)) {
      const img = getImage(fallbackKey);
      if (img) {
        ctx.save();
        ctx.drawImage(img, rx - 40, ry - 40, mSize + 80, mSize + 80);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = COLORS.ui.minimap.bg;
      ctx.fillRect(rx, ry, mSize, mSize);
    }
  }
  
  // ===== МИНИ-КАРТА =====
  ctx.save();
  
  // Закруглённые углы
  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + mSize - radius, ry);
  ctx.quadraticCurveTo(rx + mSize, ry, rx + mSize, ry + radius);
  ctx.lineTo(rx + mSize, ry + mSize - radius);
  ctx.quadraticCurveTo(rx + mSize, ry + mSize, rx + mSize - radius, ry + mSize);
  ctx.lineTo(rx + radius, ry + mSize);
  ctx.quadraticCurveTo(rx, ry + mSize, rx, ry + mSize - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
  ctx.clip();
  
  // Определение размеров карты
  let mapCols = CONFIG.cols;
  let mapRows = CONFIG.rows;
  
  if (state.isBossLevel) {
    mapCols = CONFIG.bossArenaSize || 25;
    mapRows = CONFIG.bossArenaSize || 25;
  }
  
  const pSizeX = mSize / mapCols;
  const pSizeY = mSize / mapRows;
  
  // ===== ОТРИСОВКА КЛЕТОК КАРТЫ =====
  for (let y = 0; y < mapRows; y++) {
    for (let x = 0; x < mapCols; x++) {
      const isBossSafePortal = state.isBossLevel && x === 0 && y === 1;
      const isRevealed = state.grid[y]?.[x]?.revealed || isBossSafePortal;
      
      if (state.grid[y] && state.grid[y][x] && isRevealed) {
        const cell = state.grid[y][x];
        const bx = rx + x * pSizeX;
        const by = ry + y * pSizeY;
        
        if (cell.isWall || isBossSafePortal) {
          // Стены
          ctx.fillStyle = 'rgba(28, 37, 48, 0.9)';
          ctx.fillRect(bx, by, pSizeX, pSizeY);
        } else if (cell.isPillar) {
          // Колонны
          ctx.fillStyle = 'rgba(28, 37, 48, 0.9)';
          ctx.fillRect(bx, by, pSizeX, pSizeY);
          ctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(bx, by, pSizeX, pSizeY);
        } else {
          // Пол
          ctx.fillStyle = 'rgba(15, 20, 28, 0.05)';
          ctx.fillRect(bx, by, pSizeX, pSizeY);
        }
        
        // Магазин
        if (x === CONFIG.shopPos.x && y === CONFIG.shopPos.y) {
          ctx.fillStyle = 'rgba(211, 84, 0, 0.9)';
          ctx.fillRect(bx, by, pSizeX, pSizeY);
        }
        
        // Портал выхода
        if (!state.inTreasureRoom && x === CONFIG.goal.x && y === CONFIG.goal.y) {
          let canShowPortal = false;
          
          if (!state.isBossLevel) {
            canShowPortal = true;
          } else {
            if (state.bossSpawned) {
              const bossLevel = Math.floor(state.gameLevel / 5) * 5;
              
              if (bossLevel === 15) {
                const chaserAlive = state.monsters.some(m => m.duoRole === 'chaser' && m.hp > 0);
                const shooterAlive = state.monsters.some(m => m.duoRole === 'shooter' && m.hp > 0);
                const hasMinions = state.monsters.some(m => m.isMinion === true);
                canShowPortal = !chaserAlive && !shooterAlive && !hasMinions;
              } else {
                const hasAliveBoss = state.monsters.some(m => m.isBoss === true && m.hp > 0);
                const hasMinions = state.monsters.some(m => m.isMinion === true);
                canShowPortal = !hasAliveBoss && !hasMinions;
              }
            }
          }
          
          if (canShowPortal) {
            ctx.fillStyle = 'rgba(139,0,255, 1)';
            ctx.fillRect(bx, by, pSizeX, pSizeY);
          }
        }
      }
    }
  }
  
  // ===== ПОЗИЦИЯ ИГРОКА =====
  const pbx = rx + player.x * pSizeX;
  const pby = ry + player.y * pSizeY;
  ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
  ctx.beginPath();
  ctx.arc(pbx + pSizeX / 2, pby + pSizeY / 2, Math.min(pSizeX, pSizeY) / 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}