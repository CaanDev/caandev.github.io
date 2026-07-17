/**
 * @fileoverview Рендерер порталов и магазина.
 * Отрисовывает все типы порталов с анимацией частиц и лавку торговца.
 * 
 * @module systems/rendering/portalRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getDistanceVisibility } from '../fog/index.js';

/**
 * Отрисовка одного портала
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} portal - Объект портала
 * @param {string} baseColor - Базовый цвет портала (HEX)
 * @param {string} emoji - Эмодзи для отображения в центре
 * @param {Object} [customOptions=null] - Дополнительные настройки
 * @param {string} [customOptions.border] - Цвет рамки
 * @param {number} [customOptions.borderWidth] - Толщина рамки
 * @returns {void}
 * @private
 */
function drawPortalGate(ctx, portal, baseColor, emoji, customOptions = null) {
  if (!portal || portal.x === undefined || portal.y === undefined) return;
  if (!state.grid[portal.y] || !state.grid[portal.y][portal.x]) return;

  const px = portal.x * CONFIG.cellSize;
  const py = portal.y * CONFIG.cellSize;
  
  const isCellVisible = state.grid[portal.y] && 
                        state.grid[portal.y][portal.x] &&
                        (state.grid[portal.y][portal.x].revealed || player.hasMap);
  
  if (!isCellVisible) return;
  
  const centerX = px + CONFIG.cellSize / 2;
  const centerY = py + CONFIG.cellSize / 2;
  
  const visibility = getDistanceVisibility(centerX, centerY);
  if (visibility <= 0.05) return;
  
  ctx.save();
  ctx.globalAlpha = Math.min(1, visibility * 0.9 + 0.1);
  
  const maxRadius = CONFIG.cellSize / 2;
  
  // Парсинг базового цвета
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  // ===== ОСНОВНОЙ ГРАДИЕНТ ПОРТАЛА =====
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    let brightness;
    if (t < 0.15) {
      brightness = 1.0 - t * 2;
    } else {
      brightness = Math.pow(1 - (t - 0.15) / 0.85, 1.8) * 0.5;
    }
    
    const cr = Math.min(255, Math.floor(r + brightness * (255 - r)));
    const cg = Math.min(255, Math.floor(g + brightness * (255 - g)));
    const cb = Math.min(255, Math.floor(b + brightness * (255 - b)));
    
    gradient.addColorStop(t, `rgb(${cr}, ${cg}, ${cb})`);
  }
  
  ctx.beginPath();
  ctx.roundRect(px, py, CONFIG.cellSize, CONFIG.cellSize, 15);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // ===== РАМКА ПОРТАЛА =====
  const borderColor = customOptions?.border || COLORS.maze.wallBorder;
  const borderWidth = customOptions?.borderWidth || CONFIG.wallThickness + 2;
  
  ctx.beginPath();
  ctx.roundRect(px, py, CONFIG.cellSize, CONFIG.cellSize, 15);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  
  // ===== ВНУТРЕННЕЕ СВЕЧЕНИЕ =====
  const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.25 * visibility})`);
  coreGradient.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, ${0.12 * visibility})`);
  coreGradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.05 * visibility})`);
  coreGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.01 * visibility})`);
  coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  
  ctx.beginPath();
  ctx.roundRect(px, py, CONFIG.cellSize, CONFIG.cellSize, 15);
  ctx.fillStyle = coreGradient;
  ctx.fill();
  
  // ===== ЧАСТИЦЫ ПОРТАЛА (инициализация при первом рендере) =====
  if (!portal.particles) {
    portal.particles = [];
    for (let i = 0; i < 60; i++) {
      portal.particles.push({
        x: px + 8 + Math.random() * (CONFIG.cellSize - 16),
        y: py + 8 + Math.random() * (CONFIG.cellSize - 16),
        life: 150 + Math.random() * 200,
        maxLife: 350,
        size: 1 + Math.random() * 2.5,
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.003 + Math.random() * 0.005,
        startX: px + 8 + Math.random() * (CONFIG.cellSize - 16),
        startY: py + 8 + Math.random() * (CONFIG.cellSize - 16)
      });
    }
  }
  
  drawPortalParticles(ctx, px, py, portal, r, g, b, visibility);
  
  // ===== ЦЕНТРАЛЬНАЯ ИКОНКА =====
  if (emoji && emoji.trim().length > 0) {
    const alpha = (0.6 + Math.sin(Date.now() * 0.004) * 0.2) * visibility;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, centerX, centerY);
  }
  
  ctx.restore();
}

/**
 * Полифилл roundRect для Canvas
 * 
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @param {number} w - Ширина
 * @param {number} h - Высота
 * @param {number} r - Радиус скругления
 * @returns {CanvasRenderingContext2D} - Контекст для цепочки вызовов
 * @private
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Отрисовка анимированных частиц внутри портала
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} px - Координата X левого верхнего угла клетки
 * @param {number} py - Координата Y левого верхнего угла клетки
 * @param {Object} portal - Объект портала
 * @param {number} r - Красный компонент цвета
 * @param {number} g - Зелёный компонент цвета
 * @param {number} b - Синий компонент цвета
 * @param {number} visibility - Коэффициент видимости
 * @returns {void}
 * @private
 */
function drawPortalParticles(ctx, px, py, portal, r, g, b, visibility) {
  for (let i = 0; i < portal.particles.length; i++) {
    const p = portal.particles[i];
    
    p.life--;
    p.x = p.startX;
    p.y = p.startY;
    
    if (p.life <= 0) {
      p.life = 150 + Math.random() * 200;
      p.maxLife = 350;
      p.startX = px + 8 + Math.random() * (CONFIG.cellSize - 16);
      p.startY = py + 8 + Math.random() * (CONFIG.cellSize - 16);
      p.x = p.startX;
      p.y = p.startY;
      p.size = 1 + Math.random() * 2.5;
      p.flickerPhase = Math.random() * Math.PI * 2;
    }
    
    const lifeProgress = p.life / p.maxLife;
    const baseOpacity = 0.3 + lifeProgress * 0.2;
    
    p.flickerPhase = (p.flickerPhase || 0) + (p.flickerSpeed || 0.004);
    const flickerVal = 0.6 + Math.sin(p.flickerPhase) * 0.25;
    const opacity = baseOpacity * (0.5 + flickerVal * 0.3) * visibility;
    
    if (opacity <= 0.02) continue;
    
    ctx.shadowBlur = 2 * lifeProgress;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    
    const cr = Math.min(255, Math.floor(r + 55 * lifeProgress));
    const cg = Math.min(255, Math.floor(g + 95 * lifeProgress));
    const cb = Math.min(255, Math.floor(b + 40 * lifeProgress));
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + lifeProgress * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${opacity})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 100, ${opacity * 0.5})`;
    ctx.fill();
  }
}

/**
 * Отрисовка магазина и всех порталов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShopAndPortal(ctx) {
  // ===== ЛАВКА ТОРГОВЦА =====
  drawShop(ctx);

  // ===== ПОРТАЛ ПЕРЕХОДА НА СЛЕДУЮЩИЙ УРОВЕНЬ =====
  drawExitPortal(ctx);

  // ===== ПОРТАЛ В БЕЗОПАСНУЮ КОМНАТУ =====
  drawSafeRoomPortal(ctx);

  // ===== ПОРТАЛ ВЫХОДА ИЗ БЕЗОПАСНОЙ КОМНАТЫ =====
  drawSafeRoomExitPortal(ctx);

  // ===== ПОРТАЛЫ В ТАЙНЫЕ КОМНАТЫ =====
  drawSecretRoomPortals(ctx);

  // ===== ПОРТАЛЫ ВЫХОДА ИЗ ТАЙНЫХ КОМНАТ =====
  drawSecretRoomExitPortals(ctx);
}

/**
 * Отрисовка магазина
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawShop(ctx) {
  if (state.grid && CONFIG.shopPos && 
      CONFIG.shopPos.x !== undefined && CONFIG.shopPos.y !== undefined &&
      CONFIG.shopPos.x >= 0 && CONFIG.shopPos.y >= 0) {

    if (CONFIG.shopPos.y < CONFIG.rows && CONFIG.shopPos.x < CONFIG.cols) {
      const cell = state.grid[CONFIG.shopPos.y]?.[CONFIG.shopPos.x];
      if (cell && !cell.isWall && (cell.revealed || player.hasMap)) {
        let sdx = CONFIG.shopPos.x * CONFIG.cellSize;
        let sdy = CONFIG.shopPos.y * CONFIG.cellSize;
        
        const shopCenterX = sdx + CONFIG.cellSize / 2;
        const shopCenterY = sdy + CONFIG.cellSize / 2;
        const visibility = getDistanceVisibility(shopCenterX, shopCenterY);
        
        if (visibility > 0.05) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
          
          // Фон магазина
          ctx.beginPath();
          ctx.roundRect(sdx + 15, sdy + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
          ctx.fillStyle = COLORS.ui.shop.bg;
          ctx.fill();
          
          // Рамка магазина
          ctx.beginPath();
          ctx.roundRect(sdx + 15, sdy + 15, CONFIG.cellSize - 30, CONFIG.cellSize - 30, 12);
          ctx.strokeStyle = COLORS.ui.shop.border;
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.globalAlpha = 1.0;
          ctx.restore();
          
          // Иконка магазина
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '36px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.shop, sdx + CONFIG.cellSize / 2, sdy + CONFIG.cellSize / 2);
        }
      }
    }
  }
}

/**
 * Отрисовка портала выхода с уровня
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawExitPortal(ctx) {
  if (!CONFIG.goal) return;
  if (CONFIG.goal.y === undefined || CONFIG.goal.x === undefined) return;
  
  if (!state.inTreasureRoom && CONFIG.goal.x >= 0 && CONFIG.goal.y >= 0) {
    if (state.grid[CONFIG.goal.y] && state.grid[CONFIG.goal.y][CONFIG.goal.x]) {
      if (state.grid[CONFIG.goal.y][CONFIG.goal.x].revealed || player.hasMap) {
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
          let gdx = CONFIG.goal.x * CONFIG.cellSize;
          let gdy = CONFIG.goal.y * CONFIG.cellSize;
          
          const portalCenterX = gdx + CONFIG.cellSize / 2;
          const portalCenterY = gdy + CONFIG.cellSize / 2;
          const visibility = getDistanceVisibility(portalCenterX, portalCenterY);
          
          if (visibility > 0.05) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, visibility * 0.85 + 0.1);
            
            ctx.beginPath();
            ctx.roundRect(gdx + 20, gdy + 20, CONFIG.cellSize - 40, CONFIG.cellSize - 40, 12);
            ctx.fillStyle = COLORS.portals.exit;
            ctx.fill();
            
            ctx.beginPath();
            ctx.roundRect(gdx + 20, gdy + 20, CONFIG.cellSize - 40, CONFIG.cellSize - 40, 12);
            ctx.strokeStyle = COLORS.portals.shrine;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
            ctx.restore();
            
            ctx.fillStyle = COLORS.player.shadow;
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(EMOJIS.items.portal, gdx + CONFIG.cellSize / 2, gdy + CONFIG.cellSize / 2);
          }
        }
      }
    }
  }
}

/**
 * Отрисовка портала в безопасную комнату
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawSafeRoomPortal(ctx) {
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;
  if (!isBossLevel && !state.inSafeRoom && state.safePortal && state.safePortal.active && !state.safePortal.hidden) {
    const cell = state.grid[state.safePortal.y]?.[state.safePortal.x];
    if (cell && cell.isPortal) {
      drawPortalGate(ctx, state.safePortal, COLORS.safeRoom.portalColor, '');
    }
  }
}

/**
 * Отрисовка портала выхода из безопасной комнаты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawSafeRoomExitPortal(ctx) {
  if (state.inSafeRoom && state.safeExitPortal && state.safeExitPortal.active) {
    const safeRoomOptions = {
      border: '#0d1a2a',
      borderWidth: CONFIG.wallThickness - 1.5
    };
    drawPortalGate(ctx, state.safeExitPortal, COLORS.safeRoom.portalColor, EMOJIS.items.portalExit, safeRoomOptions);
  }
}

/**
 * Отрисовка порталов в тайные комнаты
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawSecretRoomPortals(ctx) {
  if (!state.inTreasureRoom && state.treasurePortal && state.treasurePortal.active && !state.treasurePortal.hidden) 
    drawPortalGate(ctx, state.treasurePortal, COLORS.portals.treasure, EMOJIS.items.gold);
  if (!state.inShrineRoom && state.shrinePortal && state.shrinePortal.active && !state.shrinePortal.hidden) 
    drawPortalGate(ctx, state.shrinePortal, COLORS.portals.shrine, EMOJIS.items.portal);
  if (!state.inTrapRoom && state.trapPortal && state.trapPortal.active && !state.trapPortal.hidden) 
    drawPortalGate(ctx, state.trapPortal, COLORS.portals.treasure, EMOJIS.items.gold);
}

/**
 * Отрисовка порталов выхода из тайных комнат
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawSecretRoomExitPortals(ctx) {
  if (state.inTreasureRoom && state.treasureExitPortal && state.treasureExitPortal.active) 
    drawPortalGate(ctx, state.treasureExitPortal, COLORS.portals.treasureExit, EMOJIS.items.portalExit);
  if (state.inShrineRoom && state.shrineExitPortal && state.shrineExitPortal.active) 
    drawPortalGate(ctx, state.shrineExitPortal, COLORS.portals.shrineExit, EMOJIS.items.portalExit);
  if (state.inTrapRoom && state.trapFakePortal && state.trapFakePortal.active) 
    drawPortalGate(ctx, state.trapFakePortal, COLORS.portals.treasureExit, EMOJIS.items.portalExit);
  if (state.inTrapRoom && state.trapExitPortal && state.trapExitPortal.active) 
    drawPortalGate(ctx, state.trapExitPortal, COLORS.portals.treasureExit, EMOJIS.items.portalExit);
}

// Полифилл roundRect для всех браузеров
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}