/**
 * @fileoverview Особенности стен: трещины и свечения.
 * Содержит функции для отрисовки трещин на разрушаемых стенах
 * и различных типов свечений в зависимости от типа комнаты.
 * 
 * @module systems/rendering/maze/walls/wallFeatures
 */

import { CONFIG, state } from '../../../../core/config/index.js';
import { getCrackTemplate } from './crackTemplates.js';

/** @type {HTMLCanvasElement|null} - Кэш для трещин сокровищницы */
let treasureCrackCache = null;
/** @type {string} - Ключ последнего кэша трещин */
let lastTreasureCrackKey = '';

/**
 * Генерация кэша трещин для сокровищницы
 * 
 * Создаёт оффскрин-канвас со всеми трещинами для оптимизации отрисовки.
 * 
 * @returns {HTMLCanvasElement} - Канвас с нарисованными трещинами
 * @private
 */
function generateTreasureCrackCache() {
  const cols = CONFIG.cols;
  const rows = CONFIG.rows;
  const cellSize = CONFIG.cellSize;
  const wallThickness = CONFIG.wallThickness || 6;
  
  // Создаём оффскрин-канвас
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext('2d');
  
  // Проходим по всем клеткам
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || !cell.isWall || !cell.isBreakable) continue;
      
      const dx = x * cellSize;
      const dy = y * cellSize;
      const seed = ((x * 31 + y * 17) % 100) / 100;
      
      // Рисуем трещины на кэш
      drawSingleCrackOnCache(ctx, dx, dy, seed, cellSize, wallThickness);
    }
  }
  
  return canvas;
}

/**
 * Рисование одной трещины на кэше
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} seed - Seed для выбора шаблона
 * @param {number} cellSize - Размер клетки в пикселях
 * @param {number} wallThickness - Толщина стены
 * @returns {void}
 * @private
 */
function drawSingleCrackOnCache(ctx, dx, dy, seed, cellSize, wallThickness) {
  const templatesCount = 3;
  const templateIndex = Math.floor(seed * templatesCount) % templatesCount;
  const selectedTemplate = getCrackTemplate(templateIndex);
  
  const pad = wallThickness;
  ctx.save();
  
  // Используем clip только для одной клетки
  ctx.beginPath();
  ctx.rect(dx + pad, dy + pad, cellSize - pad * 2, cellSize - pad * 2);
  ctx.clip();
  
  ctx.strokeStyle = '#d4a800';
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Рисуем трещину
  selectedTemplate(ctx, dx, dy);
  
  ctx.restore();
}

/**
 * Отрисовка трещин на разрушаемой стене
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} seed - Seed для выбора шаблона трещин
 * @param {string} crackColor - Цвет трещин
 * @param {string|null} [wallType=null] - Тип стены (для сокровищницы используется кэш)
 * @returns {void}
 */
export function drawCracks(ctx, dx, dy, seed, crackColor, wallType = null) {
  // Для сокровищницы используем кэшированный вариант
  if (wallType === 'TREASURE_ROOM') {
    const key = `${CONFIG.cols}_${CONFIG.rows}_${state.gameLevel}`;
    
    // Обновляем кэш при изменении уровня или комнаты
    if (!treasureCrackCache || lastTreasureCrackKey !== key) {
      treasureCrackCache = generateTreasureCrackCache();
      lastTreasureCrackKey = key;
    }
    
    // Рисуем из кэша (только нужную часть)
    ctx.drawImage(
      treasureCrackCache,
      dx, dy, CONFIG.cellSize, CONFIG.cellSize,
      dx, dy, CONFIG.cellSize, CONFIG.cellSize
    );
    return;
  }
  
  // Обычные трещины
  const templatesCount = 3;
  const templateIndex = Math.floor(seed * templatesCount) % templatesCount;
  const selectedTemplate = getCrackTemplate(templateIndex);
  
  ctx.save();
  
  const pad = CONFIG.wallThickness;
  ctx.beginPath();
  ctx.rect(dx + pad, dy + pad, CONFIG.cellSize - pad * 2, CONFIG.cellSize - pad * 2);
  ctx.clip();
  
  ctx.strokeStyle = crackColor;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  selectedTemplate(ctx, dx, dy);
  
  ctx.restore();
}

/**
 * Очистка кэша трещин сокровищницы
 * 
 * @returns {void}
 */
export function clearTreasureCrackCache() {
  treasureCrackCache = null;
  lastTreasureCrackKey = '';
}

/**
 * Отрисовка демонического свечения (арена демона, уровень 5)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawDemonicGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7);
  
  ctx.save();
  ctx.globalAlpha = 0.06 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 50, 0, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 30, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка псионического свечения (арена разума, уровень 10)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawPsiGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.6 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.05 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(68, 136, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(68, 136, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(68, 136, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения стражей (арена стражей, уровень 15)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawGuardianGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.5 + (dx + dy) * 0.008);
  
  ctx.save();
  ctx.globalAlpha = 0.04 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 180, 50, 0.2)');
  gradient.addColorStop(0.5, 'rgba(255, 150, 30, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения алтаря (комната с алтарём)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawShrineGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.5 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.04 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(155, 89, 182, 0.25)');
  gradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.08)');
  gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}

/**
 * Отрисовка свечения ловушки (комната-ловушка)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawTrapGlow(ctx, dx, dy) {
  const time = Date.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7 + (dx + dy) * 0.01);
  
  ctx.save();
  ctx.globalAlpha = 0.05 * pulse;
  
  const cx = dx + CONFIG.cellSize / 2;
  const cy = dy + CONFIG.cellSize / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.cellSize);
  gradient.addColorStop(0, 'rgba(255, 40, 40, 0.25)');
  gradient.addColorStop(0.5, 'rgba(255, 20, 20, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
  ctx.restore();
}