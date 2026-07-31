/**
 * @fileoverview Основной рендерер игры.
 * Отвечает за отрисовку всех игровых объектов в правильном порядке.
 */

import { CONFIG, state, player } from './config/index.js';
import { COLORS } from './config/colors.js';
import { getSettings } from '../systems/ui/settings/index.js';
import { drawFloor, drawWalls } from '../systems/rendering/mazeRenderer.js';
import { drawBackground, drawBossSummonCircle, drawBossLightFade } from '../systems/rendering/maze/index.js';
import { drawSnow } from '../systems/weather/snowRenderer.js';
import { drawBloodPuddles } from '../systems/rendering/bloodRenderer.js';
import { drawTorches, updateTorchParticles } from '../systems/rendering/torchRenderer.js';
import { drawAllPortals, drawShop } from '../systems/rendering/index.js';
import { drawTraps } from '../systems/rendering/trapRenderer.js';
import { drawShrines } from '../systems/rendering/shrineRenderer.js';
import { drawLoot, drawChests, drawFlies } from '../systems/rendering/chestRenderer.js';
import { drawMonsters } from '../systems/rendering/monsterRenderer.js';
import { drawFireballs, drawDamageTexts, drawSparks, drawBeams, drawPsionicWave } from '../systems/rendering/projectileRenderer.js';
import { drawPlayer } from '../systems/rendering/player/playerRenderer.js';
import { drawBloodDrops, drawLightningSparks } from '../systems/rendering/player/particleSpawner.js';
import { drawAllParticles } from '../systems/rendering/particleRenderer.js';
import { drawFogOfWar, updateLightZones } from '../systems/fog/index.js';
import { drawMiniMap, drawEventIndicator, drawAdaptationIndicator, drawBossHealthBar, drawRoomLabel } from '../systems/rendering/uiRenderer.js';
import { drawBossExplosions, drawShockwave } from '../systems/particles/bossExplosion.js';
import { drawFireflies } from '../entities/objects/firefly.js';
import { drawRealityShift } from '../systems/rendering/realityShiftRenderer.js';
import { getVisibleCellRange } from '../systems/rendering/visibilityUtils.js';
import { drawPlayerTrails } from '../entities/objects/playerTrails.js';
import { drawExplosion } from '../entities/objects/explosion.js';
import { drawPillars } from '../systems/rendering/maze/pillars.js';

/** @type {number} - Кэшированная ширина холста для оптимизации */
let cachedWidth = 0;
/** @type {number} - Кэшированная высота холста для оптимизации */
let cachedHeight = 0;

/**
 * Отрисовка эффекта появления босса
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 * @private
 */
function drawBossSpawnEffect(ctx, canvas) {
  if (!state.bossSpawnTriggered || state.bossSpawned) return;
  
  const progress = Math.min(1, state.bossSpawnTimer / 60);
  const alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
  
  ctx.save();
  ctx.globalAlpha = alpha * (1 - progress);
  
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 50,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillStyle = COLORS.ui.textGold;
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ БОСС ПРОСЫПАЕТСЯ... ⚔️', canvas.width / 2, canvas.height / 2 - 50);
  
  ctx.restore();
}

/**
 * @namespace Renderer
 * @description Основной объект рендерера.
 * Управляет порядком отрисовки всех игровых элементов.
 */
export const Renderer = {
  /** @type {CanvasRenderingContext2D|null} */
  ctx: null,
  /** @type {HTMLCanvasElement|null} */
  canvas: null,
  
  /** @type {number} - Последняя X-координата камеры */
  _lastCamX: 0,
  /** @type {number} - Последняя Y-координата камеры */
  _lastCamY: 0,
  /** @type {Object|null} - Кэшированный диапазон видимых клеток */
  _visibleRange: null,

  /**
   * Основной метод отрисовки всех игровых объектов
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {HTMLCanvasElement} canvas - Элемент холста
   * @returns {void}
   */
  draw(ctx, canvas) {
    // Если игрок мёртв — заливаем чёрным фоном
    if (player.hp <= 0) {
      ctx.fillStyle = COLORS.background.main;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Применение настройки сглаживания
    const settings = getSettings();
    ctx.imageSmoothingEnabled = settings.smoothingEnabled !== false;
    ctx.imageSmoothingQuality = 'high';

    // Обновляем кэш размеров холста
    if (cachedWidth !== canvas.width || cachedHeight !== canvas.height) {
      cachedWidth = canvas.width;
      cachedHeight = canvas.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Расчёт камеры
    let camX = canvas.width / 2 - player.px;
    let camY = canvas.height / 2 - player.py;

    // Эффект тряски экрана
    if (state.screenShake > 0) {
      camX += (Math.random() - 0.5) * state.screenShake;
      camY += (Math.random() - 0.5) * state.screenShake;
      state.screenShake *= 0.9;
      if (state.screenShake < 0.5) state.screenShake = 0;
    }

    this._lastCamX = camX;
    this._lastCamY = camY;
    
    // Определяем размеры карты
    let cols = CONFIG.cols;
    let rows = CONFIG.rows;

    // Если это босс-уровень, используем размер арены
    if (state.isBossLevel) {
      cols = CONFIG.bossArenaSize || 25;
      rows = CONFIG.bossArenaSize || 25;
    }

    // Принудительная установка клетки (0,1) как стены
    // На босс-уровне клетка (0,1) всегда должна быть стеной
    if (state.isBossLevel && state.grid[1] && state.grid[1][0]) {
      state.grid[1][0].isWall = true;
      state.grid[1][0].isBreakable = false;
      state.grid[1][0].revealed = false;
      state.grid[1][0].hasSafePortal = false;
      state.grid[1][0].isPortal = false;
    }

    // Вычисляем видимый диапазон клеток
    this._visibleRange = getVisibleCellRange(
      camX, camY, canvas.width, canvas.height, 
      CONFIG.cellSize, cols, rows, 2
    );

    // Отрисовка
    // Фон и задний план
    drawBackground(ctx, canvas, camX, camY);
    
    ctx.save();
    ctx.translate(camX, camY);

    // Пол и следы
    drawFloor(ctx, this._visibleRange);
    drawPlayerTrails(ctx);
    drawBloodPuddles(ctx);
    drawPillars(ctx, this._visibleRange);

    // Круг призыва босса
    if (state.isBossLevel && 
        (state.bossSummonCircle?.fadeProgress < 1 || 
         state.bossSummonCircle?.particles?.length > 0)) {
      drawBossSummonCircle(ctx);
    }
    
    // Стены и объекты лабиринта
    drawWalls(ctx, this._visibleRange);
    
    // Лавка торговца, факелы, порталы, ловушки, алтари
    drawTorches(ctx, camX, camY, canvas);
    updateTorchParticles(ctx, camX, camY);
    drawShop(ctx);
    drawAllPortals(ctx);
    
    drawTraps(ctx);
    drawShrines(ctx);
    drawLoot(ctx);
    drawChests(ctx);
    drawFlies(ctx);
    drawFireflies(ctx);
    
    // Монстры
    drawMonsters(ctx, camX, camY, canvas);
    
    // Снаряды и эффекты
    drawFireballs(ctx);
    drawBeams(ctx);
    drawPsionicWave(ctx);
    
    // Игрок
    drawPlayer(ctx);
    
    // Тексты урона и частицы
    drawDamageTexts(ctx);
    drawAllParticles(ctx);
    drawSparks(ctx);
    drawBloodDrops(ctx);
    drawLightningSparks(ctx);
    drawExplosion(ctx);

    ctx.restore();

    // Наложения поверх всего
    drawFogOfWar(ctx, canvas);
    drawSnow(ctx, canvas, camX, camY);
    drawBossLightFade(ctx, canvas, camX, camY);
    drawRealityShift(ctx, canvas);
    
    // Эффект появления босса
    if (state.isBossLevel && state.bossSpawnTriggered && !state.bossSpawned) {
      drawBossSpawnEffect(ctx, canvas);
    }
    
    // UI-элементы
    drawBossHealthBar(ctx);
    drawMiniMap(ctx, canvas);
    drawEventIndicator(ctx, canvas);
    drawAdaptationIndicator(ctx, canvas);
    drawRoomLabel(ctx, canvas);

    // Взрывы боссов
    drawBossExplosions(ctx, camX, camY);

    // Ударная волна
    if (state.shockwave) {
      drawShockwave(ctx, camX, camY);
    }
  }
};