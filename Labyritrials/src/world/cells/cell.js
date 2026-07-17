/**
 * @fileoverview Класс клетки лабиринта.
 * Представляет одну клетку в сетке лабиринта с её свойствами и состоянием.
 * 
 * @module world/cells/cell
 */

/**
 * Класс клетки лабиринта
 * 
 * @class Cell
 */
export class Cell {
  /**
   * Создание экземпляра клетки
   * 
   * @param {number} x - Координата X в сетке
   * @param {number} y - Координата Y в сетке
   */
  constructor(x, y) {
    /** @type {number} - Координата X в сетке */
    this.x = x;
    /** @type {number} - Координата Y в сетке */
    this.y = y;
    
    /** @type {boolean} - Является ли клетка стеной */
    this.isWall = true;
    /** @type {boolean} - Можно ли разрушить стену */
    this.isBreakable = false;
    /** @type {boolean} - Посещена ли клетка при генерации */
    this.visited = false;
    /** @type {boolean} - Открыта ли клетка на карте (туман войны) */
    this.revealed = false;
    /** @type {number} - Номер кадра, когда клетка была последний раз видна */
    this.lastSeenFrame = 0;
    /** @type {number} - Интенсивность тумана (0-1) */
    this.fogIntensity = 0;
    
    /** @type {boolean} - Есть ли секретный портал (устаревшее) */
    this.hasSecretPortal = false;
    /** @type {boolean} - Является ли клетка секретным порталом (устаревшее) */
    this.isSecretPortalCell = false;
    /** @type {boolean} - Является ли клетка порталом */
    this.isPortal = false;
    /** @type {boolean} - Является ли клетка колонной */
    this.isPillar = false;
    
    /** @type {boolean} - Есть ли записка на стене */
    this.hasNote = false;
    /** @type {number|null} - ID записки, если есть */
    this.noteId = null;
    /** @type {boolean} - Есть ли книжный шкаф */
    this.hasBookshelf = false;
  }
}