/**
 * @fileoverview Основной рендерер стен.
 * Отрисовывает стены с учётом их типа, состояния (разрушаемые, с записками),
 * а также книжные шкафы и декоративные элементы.
 * 
 * @module systems/rendering/maze/walls/wallRenderer
 */

import { CONFIG, state, player } from '../../../../core/config/index.js';
import {
  getWallTypeFromState,
  getWallColor,
  getWallBorderColor,
  getWallBorderWidth,
  getWallFeatures,
  hasWallFeature
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

/** @type {string|null} - Предыдущий тип стены для очистки кэша */
let previousWallType = null;

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
        // Основная заливка
        ctx.fillStyle = color;
        ctx.fillRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
        
        // Обводка
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(dx, dy, CONFIG.cellSize, CONFIG.cellSize);
        
        // Трещины на разрушаемой стене
        if (cell.isBreakable) {
          const seed = ((x * 31 + y * 17) % 100) / 100;
          let crackColor = '#242d38';
          
          // Для сокровищницы — золотые трещины
          if (wallType === 'TREASURE_ROOM') {
            crackColor = '#d4a800';
          }
          
          drawCracks(ctx, dx, dy, seed, crackColor, wallType);
        }
        
        // Особенности стен
        drawWallFeatures(ctx, dx, dy, features);
        
        // Метка записки на стене
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

/**
 * Отрисовка книжного шкафа (вид спереди — корешки книг)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке (для генерации seed)
 * @param {number} gridY - Координата Y в сетке (для генерации seed)
 * @returns {void}
 * @private
 */
function drawBookshelf(ctx, dx, dy, gridX, gridY) {
  const cellSize = CONFIG.cellSize;
  const padding = 4;
  const width = cellSize - padding * 2;
  const height = cellSize - padding * 2;
  const seed = gridX * 31 + gridY * 17 + 13;
  const seededRandom = (offset) => {
    const s = (seed + offset * 7 + 313) % 10000;
    return Math.abs((Math.sin(s) * 43758.5453) % 1);
  };
  
  ctx.save();
  
  // Фон полки
  const gradient = ctx.createLinearGradient(dx, dy, dx + cellSize, dy);
  gradient.addColorStop(0, '#1a0e06');
  gradient.addColorStop(0.3, '#2a1a0a');
  gradient.addColorStop(0.7, '#2a1a0a');
  gradient.addColorStop(1, '#1a0e06');
  
  ctx.fillStyle = gradient;
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(dx + padding, dy + padding, width, height);
  ctx.shadowBlur = 0;
  
  // Рамка полки
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(dx + padding, dy + padding, width, height);
  
  // Внутренняя часть
  const innerPadding = 3;
  ctx.fillStyle = '#1a0e06';
  ctx.fillRect(
    dx + padding + innerPadding,
    dy + padding + innerPadding,
    width - innerPadding * 2,
    height - innerPadding * 2
  );
  
  // Полки
  const shelfCount = 5;
  const shelfHeight = (height - innerPadding * 2) / shelfCount;
  const startX = dx + padding + innerPadding;
  const startY = dy + padding + innerPadding;
  const shelfWidth = width - innerPadding * 2;
  
  ctx.strokeStyle = '#4a2a12';
  ctx.lineWidth = 1.5;
  
  for (let i = 1; i < shelfCount; i++) {
    const yPos = startY + i * shelfHeight;
    ctx.beginPath();
    ctx.moveTo(startX + 4, yPos);
    ctx.lineTo(startX + shelfWidth - 4, yPos);
    ctx.stroke();
    
    // Тень под полкой
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX + 4, yPos + 1);
    ctx.lineTo(startX + shelfWidth - 4, yPos + 1);
    ctx.stroke();
    ctx.strokeStyle = '#4a2a12';
    ctx.lineWidth = 1.5;
  }
  
  // ===== КНИГИ =====
  const bookColors = [
    '#8B0000', '#2E4A6A', '#4A6A2E', '#6A3A2E', 
    '#2A4A6A', '#8A6A2A', '#4A2A6A', '#6A2A2A',
    '#2A4A4A', '#6A4A2A', '#3A2A6A', '#8A3A2A',
    '#1A4A6A', '#6A2A4A', '#4A6A4A', '#8A4A2A'
  ];
  
  for (let shelf = 0; shelf < shelfCount; shelf++) {
    const shelfY = startY + shelf * shelfHeight + 3;
    const shelfBottom = startY + (shelf + 1) * shelfHeight - 3;
    const bookMaxHeight = shelfBottom - shelfY - 2;
    const bookCount = 16 + Math.floor(seededRandom(shelf * 100 + 50) * 7);
    
    const totalGaps = bookCount - 1;
    const gapWidth = 1;
    const availableWidth = shelfWidth - 8 - totalGaps * gapWidth;
    let bookWidth = availableWidth / bookCount;
    
    let totalBookWidth = 0;
    const bookWidths = [];
    const hOffsets = [];
    const colorOffsets = [];
    
    for (let b = 0; b < bookCount; b++) {
      const wOffset = seededRandom(shelf * 1000 + b * 50 + 10);
      const hOffset = seededRandom(shelf * 1000 + b * 50 + 20);
      const colorOffset = seededRandom(shelf * 1000 + b * 50 + 30);
      
      let w = bookWidth * (0.7 + wOffset * 0.6);
      
      if (b === bookCount - 1) {
        w = availableWidth - totalBookWidth;
        if (w < 1) w = bookWidth * 0.5;
      }
      
      bookWidths.push(w);
      hOffsets.push(hOffset);
      colorOffsets.push(colorOffset);
      totalBookWidth += w;
    }
    
    // Корректировка ширин при нестандартной последней книге
    if (bookWidths[bookCount - 1] < 2 || bookWidths[bookCount - 1] > bookWidth * 1.8) {
      for (let b = 0; b < bookCount; b++) {
        const wOffset = seededRandom(shelf * 1000 + b * 50 + 10);
        bookWidths[b] = bookWidth * (0.75 + wOffset * 0.5);
      }
      const sum = bookWidths.reduce((a, b) => a + b, 0);
      for (let b = 0; b < bookCount; b++) {
        bookWidths[b] = (bookWidths[b] / sum) * availableWidth;
      }
    }
    
    let currentX = startX + 4;
    const bookRadius = 1.5;
    const rightEdge = startX + shelfWidth - 4;
    const allowLeaning = (shelf !== 1 && shelf !== 4);
    
    let leaningIndices = [];
    
    // Выбор книг для наклона
    if (allowLeaning) {
      const leaningCount = 1 + Math.floor(seededRandom(shelf * 100 + 200) * 1.5);
      
      for (let l = 0; l < leaningCount; l++) {
        let attempt = 0;
        let found = false;
        
        while (!found && attempt < 30) {
          attempt++;
          const idx = 2 + Math.floor(seededRandom(shelf * 1000 + l * 300 + attempt * 50 + 100) * (bookCount - 4));
          
          if (idx >= 2 && idx < bookCount - 2 && !leaningIndices.includes(idx)) {
            let hasNearLeaning = false;
            for (const li of leaningIndices) {
              if (Math.abs(li - idx) < 3) {
                hasNearLeaning = true;
                break;
              }
            }
            if (!hasNearLeaning) {
              leaningIndices.push(idx);
              found = true;
            }
          }
        }
      }
    }
    
    for (let b = 0; b < bookCount; b++) {
      let bookW = bookWidths[b];
      const hOffset = hOffsets[b];
      const colorOffset = colorOffsets[b];
      const bookH = bookMaxHeight * (0.85 + hOffset * 0.15);
      let bookX = currentX;
      const bookY = shelfBottom - bookH;
      const colorIndex = Math.floor(colorOffset * bookColors.length) % bookColors.length;
      const isLeaning = leaningIndices.includes(b);
      
      if (isLeaning && b > 0) {
        bookWidths[b - 1] += 3;
        bookX += 3;
      }
      
      if (bookX < startX + 4) {
        bookX = startX + 4;
      }
      if (bookX + bookW > rightEdge) {
        bookW = rightEdge - bookX;
        if (bookW < 1) bookW = 2;
      }
      
      if (isLeaning) {
        drawLeaningBook(ctx, bookX, bookY, bookW, bookH, bookColors[colorIndex], bookRadius, seededRandom, shelf, b);
        currentX += bookW + gapWidth + 4;
      } else {
        drawNormalBook(ctx, bookX, bookY, bookW, bookH, bookColors[colorIndex], bookRadius, seededRandom, shelf, b);
        currentX += bookW + gapWidth;
      }
    }
  }
  
  // Нижняя планка
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(startX, startY + shelfCount * shelfHeight, shelfWidth, 2);
  
  // Верхняя планка
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(startX, startY, shelfWidth, 2);
  
  ctx.restore();
}

/**
 * Отрисовка прямой книги
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} bookX - Координата X книги
 * @param {number} bookY - Координата Y книги
 * @param {number} bookW - Ширина книги
 * @param {number} bookH - Высота книги
 * @param {string} color - Цвет обложки
 * @param {number} bookRadius - Радиус скругления
 * @param {Function} seededRandom - Функция псевдослучайных чисел
 * @param {number} shelf - Номер полки
 * @param {number} b - Номер книги
 * @returns {void}
 * @private
 */
function drawNormalBook(ctx, bookX, bookY, bookW, bookH, color, bookRadius, seededRandom, shelf, b) {
  ctx.fillStyle = color;
  
  ctx.beginPath();
  ctx.moveTo(bookX + bookRadius, bookY);
  ctx.lineTo(bookX + bookW - bookRadius, bookY);
  ctx.quadraticCurveTo(bookX + bookW, bookY, bookX + bookW, bookY + bookRadius);
  ctx.lineTo(bookX + bookW, bookY + bookH);
  ctx.lineTo(bookX, bookY + bookH);
  ctx.lineTo(bookX, bookY + bookRadius);
  ctx.quadraticCurveTo(bookX, bookY, bookX + bookRadius, bookY);
  ctx.closePath();
  ctx.fill();
  
  // Светлая полоса на корешке
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(bookX + 1, bookY + 2, 1.5, bookH - 4);
  
  // Горизонтальные линии (декор)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fillRect(bookX + 1, bookY + 2, bookW - 2, 1);
  ctx.fillRect(bookX + 1, bookY + bookH - 3, bookW - 2, 1);
  
  // Текст на корешке (вертикальные линии)
  if (seededRandom(shelf * 1000 + b * 50 + 40) > 0.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const lineCount = 2 + Math.floor(seededRandom(shelf * 1000 + b * 50 + 50) * 2);
    for (let l = 0; l < lineCount; l++) {
      const ly = bookY + 4 + (l + 1) * (bookH - 8) / (lineCount + 1);
      ctx.fillRect(bookX + 1, ly, bookW - 2, 0.5);
    }
  }
  
  // Декоративная точка (орнамент)
  if (seededRandom(shelf * 1000 + b * 50 + 60) > 0.4) {
    ctx.fillStyle = 'rgba(200, 180, 100, 0.12)';
    const dotX = bookX + bookW / 2 - 1.5;
    const dotY = bookY + bookH / 2 - 1.5;
    ctx.fillRect(dotX, dotY, 3, 3);
  }
}

/**
 * Отрисовка наклонённой книги
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} bookX - Координата X книги
 * @param {number} bookY - Координата Y книги
 * @param {number} bookW - Ширина книги
 * @param {number} bookH - Высота книги
 * @param {string} color - Цвет обложки
 * @param {number} bookRadius - Радиус скругления
 * @param {Function} seededRandom - Функция псевдослучайных чисел
 * @param {number} shelf - Номер полки
 * @param {number} b - Номер книги
 * @returns {void}
 * @private
 */
function drawLeaningBook(ctx, bookX, bookY, bookW, bookH, color, bookRadius, seededRandom, shelf, b) {
  const leanAngle = -(0.2 + seededRandom(shelf * 1000 + b * 50 + 200) * 0.2);
  
  ctx.save();
  ctx.translate(bookX + bookW / 2, bookY + bookH);
  ctx.rotate(leanAngle);
  
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  
  const darkColor = darkenColor(color, 25);
  ctx.fillStyle = darkColor;
  
  ctx.beginPath();
  ctx.moveTo(-bookW / 2 + bookRadius, -bookH);
  ctx.lineTo(bookW / 2 - bookRadius, -bookH);
  ctx.quadraticCurveTo(bookW / 2, -bookH, bookW / 2, -bookH + bookRadius);
  ctx.lineTo(bookW / 2, 0);
  ctx.lineTo(-bookW / 2, 0);
  ctx.lineTo(-bookW / 2, -bookH + bookRadius);
  ctx.quadraticCurveTo(-bookW / 2, -bookH, -bookW / 2 + bookRadius, -bookH);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Светлая полоса
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(-bookW / 2 + 2, -bookH + 2, 1.5, bookH - 4);
  
  ctx.restore();
}

/**
 * Затемнение цвета
 * 
 * @param {string} hex - HEX-цвет (#RRGGBB)
 * @param {number} amount - Количество затемнения (0-255)
 * @returns {string} - Затемнённый цвет в формате rgb(r, g, b)
 * @private
 */
function darkenColor(hex, amount) {
  let r = parseInt(hex.slice(1, 2), 16);
  let g = parseInt(hex.slice(2, 3), 16);
  let b = parseInt(hex.slice(3, 4), 16);
  
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Отрисовка метки записки на стене
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} noteId - ID записки
 * @returns {void}
 * @private
 */
function drawNoteOnWall(ctx, dx, dy, noteId) {
  const cellSize = CONFIG.cellSize;
  const seed = noteId * 31 + 17;
  const seededRandom = (offset) => {
    const s = (seed + offset * 7 + 313) % 10000;
    return Math.abs((Math.sin(s) * 43758.5453) % 1);
  };
  
  const margin = 12;
  const availableWidth = cellSize - margin * 2;
  const availableHeight = cellSize - margin * 2;
  
  const posX = margin + seededRandom(100) * availableWidth;
  const posY = margin + seededRandom(200) * availableHeight;
  
  const size = 14 + seededRandom(300) * 6;
  const halfSize = size / 2;
  const thickness = 1.8;
  
  const rotationIndex = Math.floor(seededRandom(400) * 3);
  let finalRotation;
  if (rotationIndex === 0) finalRotation = 0;
  else if (rotationIndex === 1) finalRotation = Math.PI / 4;
  else finalRotation = 3 * Math.PI / 4;
  
  const time = Date.now() * 0.001;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2 + noteId);
  
  ctx.save();
  ctx.translate(dx + posX, dy + posY);
  ctx.rotate(finalRotation);
  
  const alpha = 0.7 + 0.3 * pulse;
  ctx.shadowBlur = 10 * pulse;
  ctx.shadowColor = `rgba(200, 200, 100, ${0.3 * pulse})`;
  
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Горизонтальная линия (крест)
  const lineGradient = ctx.createLinearGradient(-halfSize, 0, halfSize, 0);
  lineGradient.addColorStop(0, `rgba(200, 200, 100, ${0.05 * alpha})`);
  lineGradient.addColorStop(0.15, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradient.addColorStop(0.4, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradient.addColorStop(0.6, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradient.addColorStop(0.85, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradient.addColorStop(1, `rgba(200, 200, 100, ${0.05 * alpha})`);
  
  ctx.strokeStyle = lineGradient;
  ctx.beginPath();
  ctx.moveTo(-halfSize, 0);
  ctx.lineTo(halfSize, 0);
  ctx.stroke();
  
  // Вертикальная линия
  const lineGradientV = ctx.createLinearGradient(0, -halfSize, 0, halfSize);
  lineGradientV.addColorStop(0, `rgba(200, 200, 100, ${0.05 * alpha})`);
  lineGradientV.addColorStop(0.15, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradientV.addColorStop(0.4, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradientV.addColorStop(0.6, `rgba(200, 200, 100, ${0.7 * alpha})`);
  lineGradientV.addColorStop(0.85, `rgba(200, 200, 100, ${0.3 * alpha})`);
  lineGradientV.addColorStop(1, `rgba(200, 200, 100, ${0.05 * alpha})`);
  
  ctx.strokeStyle = lineGradientV;
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(0, halfSize);
  ctx.stroke();
  
  // Дополнительное свечение
  ctx.shadowBlur = 20 * pulse;
  ctx.shadowColor = `rgba(200, 200, 100, ${0.12 * pulse})`;
  
  ctx.strokeStyle = `rgba(255, 255, 200, ${0.12 * alpha})`;
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(-halfSize * 0.4, 0);
  ctx.lineTo(halfSize * 0.4, 0);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, -halfSize * 0.4);
  ctx.lineTo(0, halfSize * 0.4);
  ctx.stroke();
  
  ctx.restore();
}