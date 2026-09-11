/**
 * @fileoverview Система светлячков.
 * Светлячки появляются рядом с неактивными порталами и указывают на их местоположение.
 * 
 * @module entities/objects/firefly
 */

import { CONFIG, SPRITE_SIZES, state, player, getFireflySize } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/** @type {number} - Минимальное количество светлячков */
const MIN_FIREFLIES = 4;
/** @type {number} - Максимальное количество светлячков */
const MAX_FIREFLIES = 10;

/**
 * @namespace PORTAL_TYPES
 * @description Цветовые схемы светлячков для разных типов порталов
 */
const PORTAL_TYPES = {
  treasure: { body: '#aaff66', glow: '#aaff66', core: '#ffffff' },
  shrine: { body: '#aaff66', glow: '#aaff66', core: '#ffffff' },
  trap: { body: '#aaff66', glow: '#aaff66', core: '#ffffff' },
  trap_activated: { body: '#ff4444', glow: '#ff4444', core: '#ffffff' }
};

// Цвета светлячков в зависимости от биома
const BIOME_FIREFLY_COLORS = {
  cave: {
    body: '#88ff66',
    glow: '#88ff66',
    core: '#ffffff',
    opacity: 0.4,
    sizeMultiplier: 1.0,
    glowSize: 6,
  },
  ice: {
    body: '#00ccff',
    glow: '#00ccff',
    core: '#ffffff',
    opacity: 0.9,
    sizeMultiplier: 1.5,
    glowSize: 10,
  },
  sand: {
    body: '#ffdd44',
    glow: '#ffdd44',
    core: '#ffffff',
    opacity: 0.9,
    sizeMultiplier: 1.5,
    glowSize: 12,
  },
};

/** @type {Set<string>} - Множество порталов, для которых уже сгенерированы светлячки */
export let generatedPortals = new Set();
/** @type {boolean} - Флаг, предотвращающий повторную генерацию */
let isGenerating = false;

/**
 * Класс светлячка
 * 
 * @class Firefly
 */
export class Firefly {
  /**
   * Создание светлячка
   * 
   * @param {number} cellX - Координата клетки X
   * @param {number} cellY - Координата клетки Y
   * @param {number} worldX - Мировая координата X
   * @param {number} worldY - Мировая координата Y
   * @param {number} portalX - Координата X портала
   * @param {number} portalY - Координата Y портала
   * @param {string} portalType - Тип портала ('treasure', 'shrine', 'trap')
   * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand')
   * @param {string|null} [forcedLayer=null] - Слой отрисовки ('background'|'foreground'|null)
   */
  constructor(cellX, cellY, worldX, worldY, portalX, portalY, portalType, biome = 'cave', forcedLayer = null) {
    this.cellX = cellX;
    this.cellY = cellY;
    this.worldX = worldX;
    this.worldY = worldY;
    this.portalX = portalX;
    this.portalY = portalY;
    this.portalType = portalType || 'treasure';
    this.biome = biome || 'cave';
    this.active = true;

    // Определение слоёв
    // Случайное распределение: ~70% за игроком, ~30% поверх
    this.layer = forcedLayer || (Math.random() < 0.7 ? 'background' : 'foreground');

    // Получение цвета в зависимости от биома
    const colors = this.getColorsForBiome(biome);
    this.bodyColor = colors.body;
    this.glowColor = colors.glow;
    this.coreColor = colors.core;
    this.baseOpacity = colors.opacity || 0.4;
    this.sizeMultiplier = colors.sizeMultiplier || 1.0;
    this.glowSize = colors.glowSize || 6;

    // Параметры движения
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = 0.002 + Math.random() * 0.005;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderSpeed = 0.004 + Math.random() * 0.008;
    this.wanderRadius = 10 + Math.random() * 15;
    this.radius = 8 + Math.random() * 18;
    this.radiusSpeed = 0.0015 + Math.random() * 0.004;
    this.radiusPhase = Math.random() * Math.PI * 2;
    
    // Параметры внешнего вида (с учётом множителя биома)
    const baseSize = SPRITE_SIZES.objects.fireflyBase + (Math.random() - 0.5) * 0.8;
    const size = getFireflySize(biome, baseSize);
    this.flickerPhase = Math.random() * Math.PI * 2;
    this.flickerSpeed = 0.008 + Math.random() * 0.015;
    this.opacity = this.baseOpacity + Math.random() * 0.3;
    this.x = worldX;
    this.y = worldY;
  }

  getColorsForBiome(biome) {
    return BIOME_FIREFLY_COLORS[biome] || BIOME_FIREFLY_COLORS.cave;
  }

  /**
   * Обновление положения светлячка
   * 
   * @returns {boolean} - true, если светлячок активен
   */
  update() {
    if (!this.active) return false;

    this.angle += this.angleSpeed;
    this.wanderAngle += this.wanderSpeed;
    const wanderX = Math.cos(this.wanderAngle) * this.wanderRadius;
    const wanderY = Math.sin(this.wanderAngle * 0.7) * this.wanderRadius;
    this.radiusPhase += this.radiusSpeed;
    const currentRadius = this.radius + Math.sin(this.radiusPhase) * 4;
    const baseX = this.worldX + Math.cos(this.angle) * currentRadius;
    const baseY = this.worldY + Math.sin(this.angle) * currentRadius;
    let newX = baseX + wanderX;
    let newY = baseY + wanderY;

    // Ограничение движения в пределах клетки
    const cellLeft = this.cellX * CONFIG.cellSize;
    const cellRight = cellLeft + CONFIG.cellSize;
    const cellTop = this.cellY * CONFIG.cellSize;
    const cellBottom = cellTop + CONFIG.cellSize;

    newX = Math.max(cellLeft + 8, Math.min(cellRight - 8, newX));
    newY = Math.max(cellTop + 8, Math.min(cellBottom - 8, newY));

    this.x = newX;
    this.y = newY;

    return true;
  }

  /**
   * Отрисовка светлячка
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @returns {void}
   */
  draw(ctx) {
    if (!this.active) return;

    this.flickerPhase += this.flickerSpeed;
    const flicker = 0.5 + Math.sin(this.flickerPhase) * 0.4;
    const alpha = this.opacity * (0.4 + flicker * 0.6);

    ctx.save();

    // Свечение
    const glowSize = this.glowSize || 6;
    ctx.shadowBlur = glowSize * (0.8 + flicker * 0.4);
    ctx.shadowColor = this.glowColor;
    ctx.globalAlpha = Math.min(0.9, alpha);

    // Тело светлячка
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Ядро светлячка
    ctx.fillStyle = this.coreColor;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Дополнительный внешний слой свечения
    ctx.shadowBlur = glowSize * 1.5 * (0.5 + flicker * 0.5);
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Изменение цветовой схемы светлячка
   * 
   * @param {string} type - Тип портала ('treasure', 'shrine', 'trap', 'trap_activated')
   * @returns {void}
   */
  setColorType(type) {
    const colors = PORTAL_TYPES[type] || PORTAL_TYPES.treasure;
    this.bodyColor = colors.body;
    this.glowColor = colors.glow;
    this.coreColor = colors.core;
    this.portalType = type;
  }
}

/**
 * Поиск проходимых клеток вокруг стены с порталом
 * 
 * @param {number} wallX - Координата X стены
 * @param {number} wallY - Координата Y стены
 * @returns {Array<{x: number, y: number}>} - Массив проходимых клеток
 * @private
 */
function findWalkableCellsAroundWall(wallX, wallY) {
  const cells = [];
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (let [dx, dy] of dirs) {
    const nx = wallX + dx;
    const ny = wallY + dy;

    if (nx < 1 || nx >= CONFIG.cols - 1 || ny < 1 || ny >= CONFIG.rows - 1) continue;

    const cell = state.grid[ny]?.[nx];
    if (cell && !cell.isWall && !cell.isPortal && !cell.isShrinePortal) cells.push({ x: nx, y: ny });
  }

  return cells;
}

/**
 * Генерация светлячков для портала
 * 
 * @param {Object} portal - Объект портала
 * @param {string} type - Тип портала
 * @param {string} biome - Биом
 * @returns {void}
 */
export function generateFirefliesForPortal(portal, type, biome = 'cave') {
  if (!portal || portal.active) return;

  const portalId = `${type}_${portal.x}_${portal.y}`;
  if (generatedPortals.has(portalId)) return;

  const walkableCells = findWalkableCellsAroundWall(portal.x, portal.y);
  if (walkableCells.length === 0) return;

  const randomIndex = Math.floor(Math.random() * walkableCells.length);
  const selectedCell = walkableCells[randomIndex];

  const fireflyCount = MIN_FIREFLIES + Math.floor(Math.random() * (MAX_FIREFLIES - MIN_FIREFLIES + 1));
  const worldX = selectedCell.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  const worldY = selectedCell.y * CONFIG.cellSize + CONFIG.cellSize / 2;

  for (let i = 0; i < fireflyCount; i++) {
    state.fireflies.push(new Firefly(
      selectedCell.x, selectedCell.y,
      worldX, worldY,
      portal.x, portal.y,
      type,
      biome
    ));
  }

  generatedPortals.add(portalId);
}

/**
 * Удаление светлячков у портала
 * 
 * @param {number} portalX - Координата X портала
 * @param {number} portalY - Координата Y портала
 * @returns {void}
 */
export function removeFirefliesForPortal(portalX, portalY) {
  if (!state.fireflies) return;

  for (let i = state.fireflies.length - 1; i >= 0; i--) {
    if (state.fireflies[i].portalX === portalX && state.fireflies[i].portalY === portalY) state.fireflies.splice(i, 1);
  }

  for (const id of generatedPortals) {
    if (id.includes(`${portalX}_${portalY}`)) {
      generatedPortals.delete(id);
      break;
    }
  }
}

/**
 * Обновление всех светлячков
 * 
 * @returns {void}
 */
export function updateFireflies() {
  if (!state.fireflies) return;
  for (const fly of state.fireflies) {
    fly.update();
  }
}

/**
 * Отрисовка светлячков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {string} [layer=null] - Слой для отрисовки ('background', 'foreground', или null для всех)
 * @returns {void}
 */
export function drawFireflies(ctx, layer = null) {
  if (!state.fireflies) return;
  
  for (const fly of state.fireflies) {
    if (layer !== null && fly.layer !== layer) continue;
    fly.draw(ctx);
  }
}

/**
 * Очистка всех светлячков
 * 
 * @returns {void}
 */
export function clearFireflies() {
  state.fireflies = [];
  generatedPortals.clear();
  isGenerating = false;
}

/**
 * Генерация светлячков для всех неактивных порталов
 * 
 * @returns {void}
 */
export function generateFirefliesForAllPortals() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    clearFireflies();

    if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) return;

    const biome = state.currentBiome || 'cave';

    // Портал в сокровищницу
    if (state.treasurePortal && !state.treasurePortal.active) {
      const { x, y } = state.treasurePortal;
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasTreasurePortal) {
        generateFirefliesForPortal(state.treasurePortal, 'treasure', biome);
      } else {
        state.treasurePortal = null;
      }
    }

    // Портал в комнату с алтарём
    if (state.shrinePortal && !state.shrinePortal.active) {
      const { x, y } = state.shrinePortal;
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasShrinePortal) {
        generateFirefliesForPortal(state.shrinePortal, 'shrine', biome);
      } else {
        state.shrinePortal = null;
      }
    }

    // Портал в комнату-ловушку
    if (state.trapPortal && !state.trapPortal.active) {
      const { x, y } = state.trapPortal;
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasTrapPortal) {
        generateFirefliesForPortal(state.trapPortal, 'trap', biome);
      } else {
        state.trapPortal = null;
      }
    }
  } finally {
    setTimeout(() => { isGenerating = false; }, 100);
  }
}

/**
 * Изменение цвета светлячков у портала
 * 
 * @param {number} portalX - Координата X портала
 * @param {number} portalY - Координата Y портала
 * @param {string} type - Новый тип портала
 * @returns {void}
 */
export function updateFirefliesColor(portalX, portalY, type) {
  if (!state.fireflies) return;

  const colors = PORTAL_TYPES[type] || PORTAL_TYPES.treasure;

  for (const fly of state.fireflies) {
    if (fly.portalX === portalX && fly.portalY === portalY) {
      fly.bodyColor = colors.body;
      fly.glowColor = colors.glow;
      fly.coreColor = colors.core;
      fly.portalType = type;
    }
  }
}