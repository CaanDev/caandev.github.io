/**
 * @fileoverview Рендеринг фонового неба и дальних огней.
 * Создаёт атмосферный фон с градиентом неба и мерцающими огнями вдали.
 * 
 * @module systems/rendering/maze/background
 */

import { CONFIG, state, player } from '../../../core/config/index.js';

/** @type {Object|null} - Кэш цветов фона */
let cachedColors = null;
/** @type {number} - Последний уровень для проверки кэша */
let lastLevel = -1;
/** @type {boolean} - Последнее состояние безопасной комнаты */
let lastSafeRoom = false;
/** @type {boolean} - Последнее состояние босс-уровня */
let lastBossLevel = false;
/** @type {string} - Последний тип комнаты */
let lastRoomType = '';

/** @type {Array|null} - Позиции дальних огней */
let lightPositions = null;
/** @type {number} - Последний seed для огней */
let lastLightSeed = -1;

/**
 * Генерация позиций для дальних огней
 * 
 * @param {number} seed - Seed для генерации
 * @param {number} count - Количество огней
 * @param {number} worldWidth - Ширина мира в пикселях
 * @param {number} worldHeight - Высота мира в пикселях
 * @returns {Array<{x: number, y: number, size: number, phase: number, side: number}>} - Массив позиций огней
 * @private
 */
function generateLightPositions(seed, count, worldWidth, worldHeight) {
  const positions = [];
  const pseudoRandom = (index) => {
    const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < count; i++) {
    const side = Math.floor(pseudoRandom(i + 1) * 4);
    let x, y;
    const margin = 10 + pseudoRandom(i + 2) * 80;
    const spread = 80 + pseudoRandom(i + 3) * 200;
    
    switch (side) {
      case 0: // Верх
        x = pseudoRandom(i + 4) * (worldWidth + spread * 2) - spread;
        y = -margin - pseudoRandom(i + 5) * 60;
        break;
      case 1: // Низ
        x = pseudoRandom(i + 6) * (worldWidth + spread * 2) - spread;
        y = worldHeight + margin + pseudoRandom(i + 7) * 60;
        break;
      case 2: // Лево
        x = -margin - pseudoRandom(i + 8) * 60;
        y = pseudoRandom(i + 9) * (worldHeight + spread * 2) - spread;
        break;
      case 3: // Право
        x = worldWidth + margin + pseudoRandom(i + 10) * 60;
        y = pseudoRandom(i + 11) * (worldHeight + spread * 2) - spread;
        break;
    }
    
    const size = 2 + Math.floor(pseudoRandom(i + 12) * 6);
    const phase = pseudoRandom(i + 13) * 10;
    
    positions.push({ x, y, size, phase, side });
  }
  
  return positions;
}

/**
 * Отрисовка фона
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @returns {void}
 */
export function drawBackground(ctx, canvas, camX, camY) {
  const time = Date.now() * 0.001;
  
  const colors = getBackgroundColors();
  
  drawSkyGradient(ctx, canvas, colors);
  drawDistantLightsOptimized(ctx, canvas, camX, camY, time, colors);
}

/**
 * Получение цветов фона в зависимости от текущей комнаты
 * 
 * @returns {{topColor: string, bottomColor: string, lightColor: string}} - Цвета фона
 * @private
 */
function getBackgroundColors() {
  const currentLevel = state.gameLevel;
  const currentSafeRoom = state.inSafeRoom;
  const currentBossLevel = state.isBossLevel;
  
  let roomType = 'default';
  if (currentSafeRoom) roomType = 'safeRoom';
  else if (currentBossLevel) roomType = `boss_${Math.floor(currentLevel / 5) * 5}`;
  else if (state.inTrapRoom) roomType = 'trapRoom';
  else if (state.inTreasureRoom) roomType = 'treasureRoom';
  else if (state.inShrineRoom) roomType = 'shrineRoom';
  
  // Проверка кэша
  if (cachedColors && 
      lastLevel === currentLevel && 
      lastSafeRoom === currentSafeRoom && 
      lastBossLevel === currentBossLevel &&
      lastRoomType === roomType) {
    return cachedColors;
  }
  
  // Цвета по умолчанию
  let topColor = '#0a0a1a';
  let bottomColor = '#0f0a1a';
  let lightColor = 'rgba(100, 80, 200, 0.6)';
  
  // ===== БЕЗОПАСНАЯ КОМНАТА =====
  if (state.inSafeRoom) {
    topColor = '#0a121a';
    bottomColor = '#0a1a20';
    lightColor = 'rgba(80, 180, 220, 0.5)';
  }
  // ===== БОСС-УРОВНИ =====
  else if (state.isBossLevel) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    
    if (bossLevel === 5) { // Демон
      topColor = '#0a0505';
      bottomColor = '#0d0505';
      lightColor = 'rgba(120, 20, 20, 0.5)';
    }
    else if (bossLevel === 10) { // Разум
      topColor = '#06101a';
      bottomColor = '#081a2a';
      lightColor = 'rgba(80, 200, 255, 0.7)';
    }
    else if (bossLevel === 15) { // Стражи
      topColor = '#1a1008';
      bottomColor = '#1a0a08';
      lightColor = 'rgba(220, 150, 50, 0.5)';
    }
  }
  // ===== КОМНАТА-ЛОВУШКА =====
  else if (state.inTrapRoom) {
    topColor = '#1a0808';
    bottomColor = '#1a0a0a';
    lightColor = 'rgba(200, 40, 40, 0.7)';
  }
  // ===== СОКРОВИЩНИЦА =====
  else if (state.inTreasureRoom) {
    topColor = '#0a0a08';
    bottomColor = '#1a1208';
    lightColor = 'rgba(220, 200, 100, 0.5)';
  }
  // ===== КОМНАТА С АЛТАРЁМ =====
  else if (state.inShrineRoom) {
    topColor = '#08081a';
    bottomColor = '#0a081a';
    lightColor = 'rgba(150, 100, 220, 0.6)';
  }
  
  cachedColors = { topColor, bottomColor, lightColor };
  lastLevel = currentLevel;
  lastSafeRoom = currentSafeRoom;
  lastBossLevel = currentBossLevel;
  lastRoomType = roomType;
  
  return cachedColors;
}

/**
 * Отрисовка градиента неба
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {{topColor: string, bottomColor: string}} colors - Цвета фона
 * @returns {void}
 * @private
 */
function drawSkyGradient(ctx, canvas, colors) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colors.topColor);
  gradient.addColorStop(1, colors.bottomColor);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Отрисовка дальних мерцающих огней
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} time - Текущее время
 * @param {{lightColor: string}} colors - Цвета фона
 * @returns {void}
 * @private
 */
function drawDistantLightsOptimized(ctx, canvas, camX, camY, time, colors) {
  const lightColor = colors.lightColor;
  const worldWidth = CONFIG.cols * CONFIG.cellSize;
  const worldHeight = CONFIG.rows * CONFIG.cellSize;
  
  const isSafeRoom = state.inSafeRoom;
  const isBossLevel = state.isBossLevel;
  const bossLevel = isBossLevel ? Math.floor(state.gameLevel / 5) * 5 : 0;
  const isBoss5 = isBossLevel && bossLevel === 5;
  
  const seed = state.gameLevel * 1000 + (isSafeRoom ? 777 : 333);
  
  // Количество огней зависит от типа комнаты
  const lightCount = isBoss5 ? 8 + Math.floor(state.gameLevel / 4) : 
                    (isSafeRoom ? 30 + Math.floor(state.gameLevel / 2) : 18 + Math.floor(state.gameLevel / 3));
  
  // Генерация позиций при смене seed
  if (!lightPositions || lastLightSeed !== seed) {
    lightPositions = generateLightPositions(seed, lightCount, worldWidth, worldHeight);
    lastLightSeed = seed;
  }
  
  // Парсинг цвета
  const colorMatch = lightColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const baseR = colorMatch ? parseInt(colorMatch[1]) : 100;
  const baseG = colorMatch ? parseInt(colorMatch[2]) : 80;
  const baseB = colorMatch ? parseInt(colorMatch[3]) : 200;
  
  for (let i = 0; i < lightPositions.length; i++) {
    const pos = lightPositions[i];
    
    const screenX = pos.x + camX;
    const screenY = pos.y + camY;
    
    // Отсечение за пределами экрана
    if (screenX < -80 || screenX > canvas.width + 80 ||
        screenY < -80 || screenY > canvas.height + 80) continue;
    
    const brightnessMultiplier = isBoss5 ? 0.5 : 1.0;
    
    // Мерцание огня
    const flicker = 0.4 + 0.6 * Math.sin(time * (0.15 + pos.phase * 0.05) + pos.phase * 2.3);
    const slowPulse = 0.7 + 0.3 * Math.sin(time * 0.08 + pos.phase * 1.1);
    const alpha = (isSafeRoom ? 0.4 : 0.3) * (0.3 + 0.7 * flicker) * slowPulse * brightnessMultiplier;
    
    // ===== БОСС 5 (Демон) — тусклые огни =====
    if (isBoss5) {
      if (alpha < 0.05) continue;
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.4 * alpha})`;
      ctx.shadowBlur = 5;
      ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, (1 + (pos.size % 3)) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // ===== БЕЗОПАСНАЯ КОМНАТА — звёзды =====
    else if (isSafeRoom) {
      const size = 8 + (pos.size % 8) * 3;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha * 0.4})`;
      ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.7 * alpha})`;
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', screenX, screenY);
      ctx.restore();
    }
    // ===== ОБЫЧНЫЙ ЛАБИРИНТ — туманные огни =====
    else {
      const size = 1.5 + (pos.size % 5) * 0.8;
      
      if (alpha > 0.1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha * 0.4})`;
        ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.7 * alpha})`;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${Math.min(255, baseR + 100)}, ${Math.min(255, baseG + 100)}, ${Math.min(255, baseB + 100)}, ${0.8 * alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.4 * alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}