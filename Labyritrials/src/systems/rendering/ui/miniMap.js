/**
 * @fileoverview Мини-карта лабиринта.
 * Отображает уменьшенную карту уровня с открытыми клетками,
 * стенами, колоннами, магазином, порталом выхода и позицией игрока.
 * 
 * @module systems/rendering/ui/miniMap
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';

/**
 * Отрисовка мини-карты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawMiniMap(ctx, canvas) {
  // Мини-карта не отображается в тайных комнатах и безопасной комнате
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  if (!player.hasMap) return;
  
  const mSize = 160;
  const padding = 20;
  const rx = canvas.width - mSize - padding;
  const ry = padding;
  
  // ===== ФОН МИНИ-КАРТЫ =====
  ctx.fillStyle = COLORS.ui.minimap.bg;
  ctx.fillRect(rx, ry, mSize, mSize);
  ctx.strokeStyle = COLORS.ui.minimap.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, mSize, mSize);
  
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
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].revealed) {
        const cell = state.grid[y][x];
        const bx = rx + x * pSizeX;
        const by = ry + y * pSizeY;
        
        // Стены
        if (cell.isWall) {
          ctx.fillStyle = COLORS.ui.minimap.wall;
          ctx.fillRect(bx, by, pSizeX, pSizeY);
        } 
        // Колонны
        else if (cell.isPillar) {
          ctx.fillStyle = COLORS.ui.minimap.pillar;
          ctx.fillRect(bx, by, pSizeX, pSizeY);
          ctx.strokeStyle = COLORS.ui.minimap.pillarBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(bx, by, pSizeX, pSizeY);
        } 
        // Пол
        else {
          ctx.fillStyle = COLORS.ui.minimap.floor;
          ctx.fillRect(bx, by, pSizeX, pSizeY);
        }
        
        // Магазин
        if (x === CONFIG.shopPos.x && y === CONFIG.shopPos.y) {
          ctx.fillStyle = COLORS.ui.minimap.shop;
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
            ctx.fillStyle = COLORS.ui.minimap.portal;
            ctx.fillRect(bx, by, pSizeX, pSizeY);
          }
        }
      }
    }
  }
  
  // ===== ПОЗИЦИЯ ИГРОКА =====
  const pbx = rx + player.x * pSizeX;
  const pby = ry + player.y * pSizeY;
  ctx.fillStyle = COLORS.ui.minimap.player;
  ctx.beginPath();
  ctx.arc(pbx + pSizeX / 2, pby + pSizeY / 2, Math.min(pSizeX, pSizeY) / 1.5, 0, Math.PI * 2);
  ctx.fill();
}