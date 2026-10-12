/**
 * @fileoverview Вспомогательные утилиты для отрисовки UI.
 * Предоставляет функции для рисования скруглённых прямоугольников
 * с полным скруглением или скруглением только с одной стороны.
 * 
 * @module systems/rendering/ui/utils
 */

/**
 * Отрисовка скруглённого прямоугольника со всеми скруглёнными углами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} x - Координата X левого верхнего угла
 * @param {number} y - Координата Y левого верхнего угла
 * @param {number} w - Ширина прямоугольника
 * @param {number} h - Высота прямоугольника
 * @param {number} r - Радиус скругления
 * @returns {void}
 */
export function roundedRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
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
 * Отрисовка прямоугольника со скруглёнными левыми углами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} x - Координата X левого верхнего угла
 * @param {number} y - Координата Y левого верхнего угла
 * @param {number} w - Ширина прямоугольника
 * @param {number} h - Высота прямоугольника
 * @param {number} r - Радиус скругления
 * @returns {void}
 */
export function roundedRectLeft(ctx, x, y, w, h, r) {
  if (w < r) r = w;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Отрисовка прямоугольника со скруглёнными правыми углами
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} x - Координата X левого верхнего угла
 * @param {number} y - Координата Y левого верхнего угла
 * @param {number} w - Ширина прямоугольника
 * @param {number} h - Высота прямоугольника
 * @param {number} r - Радиус скругления
 * @returns {void}
 */
export function roundedRectRight(ctx, x, y, w, h, r) {
  if (w < r) r = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}