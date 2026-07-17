/**
 * @fileoverview Утилиты проверки видимости объектов на экране.
 * Предоставляет функции для определения, находится ли объект
 * в пределах видимой области с учётом камеры и отступов.
 * 
 * @module systems/rendering/visibilityUtils
 */

/**
 * Проверка, виден ли объект на экране
 * 
 * @param {number} objX - Мировая координата X объекта
 * @param {number} objY - Мировая координата Y объекта
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} canvasWidth - Ширина холста
 * @param {number} canvasHeight - Высота холста
 * @param {number} [padding=100] - Дополнительный отступ за пределами экрана
 * @returns {boolean} - true, если объект виден
 */
export function isVisible(objX, objY, camX, camY, canvasWidth, canvasHeight, padding = 100) {
  const screenX = objX + camX;
  const screenY = objY + camY;
  
  return screenX > -padding && screenX < canvasWidth + padding &&
         screenY > -padding && screenY < canvasHeight + padding;
}

/**
 * Проверка видимости объекта с учётом его радиуса
 * 
 * @param {number} objX - Мировая координата X объекта
 * @param {number} objY - Мировая координата Y объекта
 * @param {number} objRadius - Радиус объекта
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} canvasWidth - Ширина холста
 * @param {number} canvasHeight - Высота холста
 * @returns {boolean} - true, если объект виден
 */
export function isVisibleWithRadius(objX, objY, objRadius, camX, camY, canvasWidth, canvasHeight) {
  const padding = objRadius + 50;
  return isVisible(objX, objY, camX, camY, canvasWidth, canvasHeight, padding);
}

/**
 * Проверка видимости клетки по её координатам в сетке
 * 
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} canvasWidth - Ширина холста
 * @param {number} canvasHeight - Высота холста
 * @param {number} cellSize - Размер клетки в пикселях
 * @param {number} [padding=1] - Дополнительный отступ в клетках
 * @returns {boolean} - true, если клетка видна
 */
export function isCellVisible(gridX, gridY, camX, camY, canvasWidth, canvasHeight, cellSize, padding = 1) {
  const worldX = gridX * cellSize + cellSize / 2;
  const worldY = gridY * cellSize + cellSize / 2;
  const radius = cellSize / 2 + padding * cellSize;
  return isVisibleWithRadius(worldX, worldY, radius, camX, camY, canvasWidth, canvasHeight);
}

/**
 * Упрощённая проверка видимости клетки (без учёта радиуса)
 * 
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} canvasWidth - Ширина холста
 * @param {number} canvasHeight - Высота холста
 * @param {number} cellSize - Размер клетки в пикселях
 * @returns {boolean} - true, если клетка видна
 */
export function isCellVisibleSimple(gridX, gridY, camX, camY, canvasWidth, canvasHeight, cellSize) {
  const screenX = gridX * cellSize + camX + cellSize / 2;
  const screenY = gridY * cellSize + camY + cellSize / 2;
  return screenX > -cellSize && screenX < canvasWidth + cellSize &&
         screenY > -cellSize && screenY < canvasHeight + cellSize;
}

/**
 * Получение диапазона видимых клеток для оптимизации отрисовки
 * 
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {number} canvasWidth - Ширина холста
 * @param {number} canvasHeight - Высота холста
 * @param {number} cellSize - Размер клетки в пикселях
 * @param {number} cols - Количество колонок в сетке
 * @param {number} rows - Количество строк в сетке
 * @param {number} [padding=2] - Дополнительный отступ в клетках
 * @returns {{startX: number, endX: number, startY: number, endY: number}} - Диапазон видимых клеток
 */
export function getVisibleCellRange(camX, camY, canvasWidth, canvasHeight, cellSize, cols, rows, padding = 2) {
  // Преобразование координат камеры в мировые
  const minWorldX = -camX - padding * cellSize;
  const maxWorldX = -camX + canvasWidth + padding * cellSize;
  const minWorldY = -camY - padding * cellSize;
  const maxWorldY = -camY + canvasHeight + padding * cellSize;
  
  // Преобразование в индексы сетки
  const startX = Math.max(0, Math.floor(minWorldX / cellSize));
  const endX = Math.min(cols, Math.ceil(maxWorldX / cellSize));
  const startY = Math.max(0, Math.floor(minWorldY / cellSize));
  const endY = Math.min(rows, Math.ceil(maxWorldY / cellSize));
  
  return { startX, endX, startY, endY };
}