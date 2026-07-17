/**
 * @fileoverview Шаблоны трещин для разрушаемых стен.
 * Содержит три различных узора трещин, которые случайным образом
 * наносятся на разрушаемые стены для визуального разнообразия.
 * 
 * @module systems/rendering/maze/walls/crackTemplates
 */

import { CONFIG } from '../../../../core/config/index.js';

/**
 * Первый шаблон трещин — сеть трещин с центральной точкой
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawCracksFirst(ctx, dx, dy) {
  ctx.beginPath();
  
  let cx = dx + CONFIG.cellSize / 2 - 5;
  let cy = dy + CONFIG.cellSize / 2 + 12;
  
  // Основные трещины от центра вверх
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 12, cy - 18);
  ctx.lineTo(cx - 8,  cy - 28);
  ctx.lineTo(cx - 24, cy - 36);
  ctx.lineTo(cx - 20, cy - 48);
  ctx.lineTo(cx - 38, cy - 54);
  
  // Ветвь от верхней трещины
  ctx.moveTo(cx - 24, cy - 36);
  ctx.lineTo(cx - 32, cy - 32);
  ctx.lineTo(cx - 42, cy - 40);
  
  // Основные трещины от центра вниз
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 14, cy + 10);
  ctx.lineTo(cx + 9,  cy + 22);
  ctx.lineTo(cx + 25, cy + 30);
  ctx.lineTo(cx + 34, cy + 24);
  ctx.lineTo(cx + 46, cy + 38);
  ctx.lineTo(cx + 42, cy + 48);
  
  // Ветвь от нижней трещины
  ctx.moveTo(cx + 25, cy + 30);
  ctx.lineTo(cx + 22, cy + 42);
  ctx.lineTo(cx + 30, cy + 50);
  
  // Основные трещины от центра вправо
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 18, cy - 8);
  ctx.lineTo(cx + 24, cy - 22);
  ctx.lineTo(cx + 40, cy - 28);
  ctx.lineTo(cx + 36, cy - 42);
  ctx.lineTo(cx + 50, cy - 48);
  
  // Ветвь от левой трещины
  ctx.moveTo(cx - 12, cy - 18); 
  ctx.lineTo(cx - 26, cy - 14);
  ctx.lineTo(cx - 32, cy - 24);
  ctx.lineTo(cx - 48, cy - 20);
  
  ctx.stroke();
}

/**
 * Второй шаблон трещин — множество мелких трещин по всей клетке
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawCracksSecond(ctx, dx, dy) {
  const size = CONFIG.cellSize;
  const cx = dx + size / 2;
  const cy = dy + size / 2;
  
  // Угловые трещины
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.05, dy + size * 0.05);
  ctx.lineTo(dx + size * 0.15, dy + size * 0.15);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.20);
  ctx.lineTo(dx + size * 0.35, dy + size * 0.30);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.95, dy + size * 0.95);
  ctx.lineTo(dx + size * 0.85, dy + size * 0.85);
  ctx.lineTo(dx + size * 0.75, dy + size * 0.80);
  ctx.lineTo(dx + size * 0.65, dy + size * 0.70);
  ctx.stroke();
  
  // Горизонтальные трещины в верхней части
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.30, dy + size * 0.08);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.12);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.60, dy + size * 0.08);
  ctx.lineTo(dx + size * 0.65, dy + size * 0.12);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.50, dy + size * 0.02);
  ctx.lineTo(dx + size * 0.48, dy + size * 0.08);
  ctx.stroke();
  
  // Горизонтальные трещины в нижней части
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.30, dy + size * 0.92);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.88);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.60, dy + size * 0.92);
  ctx.lineTo(dx + size * 0.65, dy + size * 0.88);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.50, dy + size * 0.98);
  ctx.lineTo(dx + size * 0.52, dy + size * 0.92);
  ctx.stroke();
  
  // Вертикальные трещины в левой части
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.08, dy + size * 0.30);
  ctx.lineTo(dx + size * 0.12, dy + size * 0.25);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.08, dy + size * 0.60);
  ctx.lineTo(dx + size * 0.12, dy + size * 0.65);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.02, dy + size * 0.45);
  ctx.lineTo(dx + size * 0.08, dy + size * 0.48);
  ctx.stroke();
  
  // Вертикальные трещины в правой части
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.92, dy + size * 0.30);
  ctx.lineTo(dx + size * 0.88, dy + size * 0.25);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.92, dy + size * 0.60);
  ctx.lineTo(dx + size * 0.88, dy + size * 0.65);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.98, dy + size * 0.45);
  ctx.lineTo(dx + size * 0.92, dy + size * 0.48);
  ctx.stroke();
  
  // Диагональные трещины в центре
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.40, dy + size * 0.40);
  ctx.lineTo(dx + size * 0.35, dy + size * 0.45);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.40, dy + size * 0.60);
  ctx.lineTo(dx + size * 0.35, dy + size * 0.55);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.60, dy + size * 0.60);
  ctx.lineTo(dx + size * 0.65, dy + size * 0.55);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.45, dy + size * 0.35);
  ctx.lineTo(dx + size * 0.50, dy + size * 0.40);
  ctx.stroke();
  
  // Трещины с ветвлением
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.85, dy + size * 0.35);
  ctx.lineTo(dx + size * 0.80, dy + size * 0.28);
  ctx.lineTo(dx + size * 0.82, dy + size * 0.22);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.15, dy + size * 0.65);
  ctx.lineTo(dx + size * 0.20, dy + size * 0.72);
  ctx.lineTo(dx + size * 0.18, dy + size * 0.78);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.85, dy + size * 0.65);
  ctx.lineTo(dx + size * 0.80, dy + size * 0.72);
  ctx.lineTo(dx + size * 0.82, dy + size * 0.78);
  ctx.stroke();
  
  // Мелкие трещины по краям
  for (let i = 0; i < 4; i++) {
    const xPos = dx + size * (0.15 + i * 0.20);
    ctx.beginPath();
    ctx.moveTo(xPos, dy + size * 0.02);
    ctx.lineTo(xPos + size * 0.03, dy + size * 0.08);
    ctx.stroke();
  }
  
  for (let i = 0; i < 4; i++) {
    const xPos = dx + size * (0.15 + i * 0.20);
    ctx.beginPath();
    ctx.moveTo(xPos, dy + size * 0.98);
    ctx.lineTo(xPos + size * 0.03, dy + size * 0.92);
    ctx.stroke();
  }
  
  for (let i = 0; i < 3; i++) {
    const yPos = dy + size * (0.20 + i * 0.30);
    ctx.beginPath();
    ctx.moveTo(dx + size * 0.02, yPos);
    ctx.lineTo(dx + size * 0.08, yPos + size * 0.03);
    ctx.stroke();
  }
  
  for (let i = 0; i < 3; i++) {
    const yPos = dy + size * (0.20 + i * 0.30);
    ctx.beginPath();
    ctx.moveTo(dx + size * 0.98, yPos);
    ctx.lineTo(dx + size * 0.92, yPos + size * 0.03);
    ctx.stroke();
  }
}

/**
 * Третий шаблон трещин — хаотичная сеть трещин с ветвлениями
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @returns {void}
 */
export function drawCracksThird(ctx, dx, dy) {
  const size = CONFIG.cellSize;
  
  // Основная диагональная сеть
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.08, dy + size * 0.12);
  ctx.lineTo(dx + size * 0.20, dy + size * 0.22);
  ctx.lineTo(dx + size * 0.28, dy + size * 0.18);
  ctx.lineTo(dx + size * 0.38, dy + size * 0.32);
  ctx.stroke();
  
  // Верхние трещины
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.10, dy + size * 0.05);
  ctx.lineTo(dx + size * 0.22, dy + size * 0.08);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.35, dy + size * 0.03);
  ctx.lineTo(dx + size * 0.48, dy + size * 0.07);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.55, dy + size * 0.06);
  ctx.lineTo(dx + size * 0.68, dy + size * 0.04);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.75, dy + size * 0.04);
  ctx.lineTo(dx + size * 0.88, dy + size * 0.08);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.90, dy + size * 0.08);
  ctx.lineTo(dx + size * 0.96, dy + size * 0.12);
  ctx.stroke();
  
  // Нижние трещины
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.12, dy + size * 0.95);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.92);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.32, dy + size * 0.97);
  ctx.lineTo(dx + size * 0.45, dy + size * 0.93);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.55, dy + size * 0.94);
  ctx.lineTo(dx + size * 0.68, dy + size * 0.96);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.78, dy + size * 0.96);
  ctx.lineTo(dx + size * 0.92, dy + size * 0.92);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.92, dy + size * 0.92);
  ctx.lineTo(dx + size * 0.96, dy + size * 0.88);
  ctx.stroke();
  
  // Левая сторона
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.05, dy + size * 0.20);
  ctx.lineTo(dx + size * 0.08, dy + size * 0.32);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.03, dy + size * 0.40);
  ctx.lineTo(dx + size * 0.07, dy + size * 0.52);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.06, dy + size * 0.55);
  ctx.lineTo(dx + size * 0.04, dy + size * 0.68);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.04, dy + size * 0.70);
  ctx.lineTo(dx + size * 0.08, dy + size * 0.82);
  ctx.stroke();
  
  // Правая сторона
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.95, dy + size * 0.20);
  ctx.lineTo(dx + size * 0.92, dy + size * 0.32);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.97, dy + size * 0.40);
  ctx.lineTo(dx + size * 0.93, dy + size * 0.52);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.94, dy + size * 0.55);
  ctx.lineTo(dx + size * 0.96, dy + size * 0.68);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.92, dy + size * 0.85);
  ctx.lineTo(dx + size * 0.94, dy + size * 0.92);
  ctx.stroke();
  
  // Центральные трещины
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.35, dy + size * 0.35);
  ctx.lineTo(dx + size * 0.45, dy + size * 0.37);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.45, dy + size * 0.30);
  ctx.lineTo(dx + size * 0.55, dy + size * 0.33);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.38, dy + size * 0.50);
  ctx.lineTo(dx + size * 0.40, dy + size * 0.60);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.55, dy + size * 0.40);
  ctx.lineTo(dx + size * 0.65, dy + size * 0.43);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.62, dy + size * 0.55);
  ctx.lineTo(dx + size * 0.60, dy + size * 0.65);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.48, dy + size * 0.65);
  ctx.lineTo(dx + size * 0.45, dy + size * 0.72);
  ctx.stroke();
  
  // Трещины с ветвлением в углах
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.15, dy + size * 0.45);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.42);
  ctx.lineTo(dx + size * 0.22, dy + size * 0.38);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.85, dy + size * 0.45);
  ctx.lineTo(dx + size * 0.75, dy + size * 0.42);
  ctx.lineTo(dx + size * 0.78, dy + size * 0.38);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.15, dy + size * 0.55);
  ctx.lineTo(dx + size * 0.25, dy + size * 0.58);
  ctx.lineTo(dx + size * 0.22, dy + size * 0.62);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(dx + size * 0.85, dy + size * 0.55);
  ctx.lineTo(dx + size * 0.75, dy + size * 0.58);
  ctx.lineTo(dx + size * 0.78, dy + size * 0.62);
  ctx.stroke();
  
  // Мелкие трещины
  for (let i = 0; i < 3; i++) {
    const xPos = dx + size * (0.10 + i * 0.35);
    ctx.beginPath();
    ctx.moveTo(xPos, dy + size * 0.02);
    ctx.lineTo(xPos + size * 0.05, dy + size * 0.05);
    ctx.stroke();
  }
  
  for (let i = 0; i < 3; i++) {
    const xPos = dx + size * (0.10 + i * 0.35);
    ctx.beginPath();
    ctx.moveTo(xPos, dy + size * 0.98);
    ctx.lineTo(xPos + size * 0.05, dy + size * 0.95);
    ctx.stroke();
  }
  
  for (let i = 0; i < 3; i++) {
    const yPos = dy + size * (0.15 + i * 0.35);
    ctx.beginPath();
    ctx.moveTo(dx + size * 0.02, yPos);
    ctx.lineTo(dx + size * 0.05, yPos + size * 0.05);
    ctx.stroke();
  }
  
  for (let i = 0; i < 3; i++) {
    const yPos = dy + size * (0.15 + i * 0.35);
    ctx.beginPath();
    ctx.moveTo(dx + size * 0.98, yPos);
    ctx.lineTo(dx + size * 0.95, yPos + size * 0.05);
    ctx.stroke();
  }
}

/**
 * Получение шаблона трещин по индексу
 * 
 * @param {number} index - Индекс шаблона (используется остаток от деления)
 * @returns {Function} - Функция отрисовки шаблона
 */
export function getCrackTemplate(index) {
  const templates = [
    drawCracksFirst,
    drawCracksSecond,
    drawCracksThird
  ];
  
  const templateIndex = index % templates.length;
  return templates[templateIndex] || templates[0];
}