/**
 * @fileoverview Спавнер рун.
 * Размещает руны на стенах и полу, с разными цветами в зависимости от близости к объектам.
 * 
 * @module entities/objects/spawners/runeSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { isPortalCell } from '../utils/spawnUtils.js';

/** @type {string[]} - Все доступные символы рун */
const RUNE_SYMBOLS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ',
  'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛇ', 'ᛉ', 'ᛊ',
  'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛟ', 'ᛞ',
  'ᚡ', 'ᚪ', 'ᚫ', 'ᚬ', 'ᚭ', 'ᚮ', 'ᚯ', 'ᚰ'
];

/** @type {string[]} - Все символы (копия) */
const ALL_SYMBOLS = [...RUNE_SYMBOLS];

/**
 * @namespace COLOR_PALETTES
 * @description Цветовые палитры для разных типов рун
 */
const COLOR_PALETTES = {
  default: { hue: 220, saturation: 50, lightness: 65, weight: 60 },
  mimic: { hue: 350, saturation: 70, lightness: 55, weight: 0 },
  portal: { hue: 140, saturation: 65, lightness: 55, weight: 0 },
  shrine: { hue: 270, saturation: 60, lightness: 60, weight: 0 }
};

/**
 * Проверка, есть ли руна рядом
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @param {number} [radius=1] - Радиус проверки в клетках
 * @returns {boolean} - true, если руна есть рядом
 * @private
 */
function isRuneNearby(gridX, gridY, radius = 1) {
  for (const rune of state.runes) {
    const dist = Math.hypot(rune.x - gridX, rune.y - gridY);
    if (dist <= radius) {
      return true;
    }
  }
  return false;
}

/**
 * Проверка, есть ли мимик рядом
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @param {number} [radius=3] - Радиус проверки в клетках
 * @returns {boolean} - true, если мимик есть рядом
 * @private
 */
function isNearMimic(gridX, gridY, radius = 3) {
  for (const chest of state.chests) {
    if (chest.type !== 'mimic' || chest.opened) continue;
    const chestX = Math.floor(chest.x / CONFIG.cellSize);
    const chestY = Math.floor(chest.y / CONFIG.cellSize);
    const dist = Math.hypot(gridX - chestX, gridY - chestY);
    if (dist <= radius) return true;
  }
  return false;
}

/**
 * Проверка, есть ли скрытый портал рядом
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @param {number} [radius=3] - Радиус проверки в клетках
 * @returns {boolean} - true, если скрытый портал есть рядом
 * @private
 */
function isNearHiddenPortal(gridX, gridY, radius = 3) {
  if (state.treasurePortal && !state.treasurePortal.active) {
    const { x, y } = state.treasurePortal;
    if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasTreasurePortal) {
      const dist = Math.hypot(gridX - x, gridY - y);
      if (dist <= radius) return true;
    } else {
      state.treasurePortal = null;
    }
  }

  if (state.shrinePortal && !state.shrinePortal.active) {
    const { x, y } = state.shrinePortal;
    if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasShrinePortal) {
      const dist = Math.hypot(gridX - x, gridY - y);
      if (dist <= radius) return true;
    } else {
      state.shrinePortal = null;
    }
  }

  if (state.trapPortal && !state.trapPortal.active) {
    const { x, y } = state.trapPortal;
    if (state.grid[y] && state.grid[y][x] && state.grid[y][x].hasTrapPortal) {
      const dist = Math.hypot(gridX - x, gridY - y);
      if (dist <= radius) return true;
    } else {
      state.trapPortal = null;
    }
  }

  return false;
}

/**
 * Проверка, есть ли факел на стене
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @returns {boolean} - true, если факел есть на стене
 * @private
 */
function hasTorchOnWall(gridX, gridY) {
  if (!state.torches) return false;
  for (const torch of state.torches) {
    if (torch.x === gridX && torch.y === gridY) {
      return true;
    }
  }
  return false;
}

/**
 * Выбор цветовой палитры для руны
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @returns {Object} - Объект палитры
 * @private
 */
function selectColorPalette(gridX, gridY) {
  if (state.inShrineRoom) {
    return COLOR_PALETTES.shrine;
  }

  if (isNearMimic(gridX, gridY, 3)) {
    return COLOR_PALETTES.mimic;
  }

  if (isNearHiddenPortal(gridX, gridY, 3)) {
    return COLOR_PALETTES.portal;
  }

  return COLOR_PALETTES.default;
}

/**
 * Создание рун на клетке
 * 
 * @param {number} gridX - Координата X по сетке
 * @param {number} gridY - Координата Y по сетке
 * @param {Object} palette - Цветовая палитра
 * @param {number} count - Количество рун на клетке
 * @param {boolean} isShrineRoom - Является ли комната комнатой с алтарём
 * @param {Array} existingPositions - Массив уже занятых позиций на клетке
 * @returns {void}
 * @private
 */
function createRunesOnCell(gridX, gridY, palette, count, isShrineRoom, existingPositions) {
  if (!state.grid[gridY] || !state.grid[gridY][gridX]) return;

  const isOnFloor = isShrineRoom && !state.grid[gridY][gridX].isWall;

  for (let r = 0; r < count; r++) {
    const symbol = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    let size;
    if (isShrineRoom) {
      size = 0.12 + Math.random() * 0.15;
    } else {
      size = 0.15 + Math.random() * 0.2;
    }

    const hue = palette.hue + (Math.random() - 0.5) * 12;
    const saturation = palette.saturation + (Math.random() - 0.5) * 15;
    const lightness = palette.lightness + (Math.random() - 0.5) * 15;

    const flickerPhase = Math.random() * Math.PI * 2;
    const flickerSpeed = 0.008 + Math.random() * 0.015;
    const rotation = (Math.random() - 0.5) * Math.PI / 2;

    const pixelSize = CONFIG.cellSize * size;
    const maxOffset = (CONFIG.cellSize - pixelSize) / 2 / CONFIG.cellSize * 0.9;
    let offsetX, offsetY;

    // Поиск свободной позиции на клетке
    let attempts = 0;
    let placed = false;

    while (!placed && attempts < 20) {
      attempts++;
      const testOffsetX = (Math.random() - 0.5) * maxOffset * 2;
      const testOffsetY = (Math.random() - 0.5) * maxOffset * 2;

      const isOccupied = existingPositions.some(pos => {
        const dx = pos.offsetX - testOffsetX;
        const dy = pos.offsetY - testOffsetY;
        return (dx * dx + dy * dy) < 0.0064;
      });

      if (!isOccupied) {
        offsetX = testOffsetX;
        offsetY = testOffsetY;
        placed = true;
        existingPositions.push({ offsetX, offsetY });
      }
    }

    if (!placed) {
      offsetX = (Math.random() - 0.5) * maxOffset * 2;
      offsetY = (Math.random() - 0.5) * maxOffset * 2;
      existingPositions.push({ offsetX, offsetY });
    }

    // Прозрачность руны
    let baseOpacity;
    if (isShrineRoom) {
      baseOpacity = 0.4 + Math.random() * 0.3;
    } else if (palette === COLOR_PALETTES.mimic || palette === COLOR_PALETTES.portal) {
      baseOpacity = 0.35 + Math.random() * 0.3;
    } else {
      baseOpacity = 0.2 + Math.random() * 0.25;
    }

    state.runes.push({
      x: gridX,
      y: gridY,
      symbol: symbol,
      size: size,
      color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      flickerPhase: flickerPhase,
      flickerSpeed: flickerSpeed,
      baseOpacity: isOnFloor ? Math.min(0.95, baseOpacity * 1.3) : baseOpacity,
      offsetX: offsetX,
      offsetY: offsetY,
      rotation: rotation,
      glowIntensity: 0,
      type: palette === COLOR_PALETTES.mimic ? 'mimic' :
            palette === COLOR_PALETTES.portal ? 'portal' :
            palette === COLOR_PALETTES.shrine ? 'shrine' : 'default',
      isOnFloor: isOnFloor
    });
  }
}

/**
 * Генерация позиций рун на полу в комнате с алтарём
 * 
 * @returns {Array<{gridX: number, gridY: number}>} - Массив позиций
 * @private
 */
function generateShrineFloorRunes() {
  const centerX = Math.floor(CONFIG.cols / 2);
  const centerY = Math.floor(CONFIG.rows / 2);

  const circles = [
    { radius: 1.5, count: 6 },
    { radius: 3.0, count: 10 }
  ];

  const positions = [];

  for (const circle of circles) {
    for (let i = 0; i < circle.count; i++) {
      const angle = (Math.PI * 2 / circle.count) * i + Math.random() * 0.08;
      const x = centerX + Math.cos(angle) * circle.radius;
      const y = centerY + Math.sin(angle) * circle.radius;

      const gridX = Math.round(x);
      const gridY = Math.round(y);

      if (gridX < 1 || gridX >= CONFIG.cols - 1 || gridY < 1 || gridY >= CONFIG.rows - 1) continue;

      const cell = state.grid[gridY]?.[gridX];
      if (!cell || cell.isWall) continue;

      // Пропускаем центр, выход и стартовую позицию
      if (gridX === centerX && gridY === centerY) continue;
      if (state.shrineExitPortal && gridX === state.shrineExitPortal.x && gridY === state.shrineExitPortal.y) continue;
      if (gridX === 1 && gridY === 1) continue;

      const isDuplicate = positions.some(p => p.gridX === gridX && p.gridY === gridY);
      if (!isDuplicate) {
        positions.push({ gridX, gridY });
      }
    }
  }

  return positions;
}

/**
 * Создание рун на уровне
 * 
 * @param {number} [density=0.05] - Плотность рун (0-1)
 * @returns {void}
 */
export function spawnRunes(density = 0.05) {
  if (state.isBossLevel) return;
  if (state.inTreasureRoom) return;

  const isShrineRoom = state.inShrineRoom;
  state.runes = [];

  const occupiedPositions = {};

  // ===== КОМНАТА С АЛТАРЁМ =====
  if (isShrineRoom) {
    const palette = COLOR_PALETTES.shrine;

    // Руны на стенах
    for (let y = 1; y < CONFIG.rows - 1; y++) {
      for (let x = 1; x < CONFIG.cols - 1; x++) {
        const cell = state.grid[y]?.[x];
        if (!cell || !cell.isWall) continue;
        if (hasTorchOnWall(x, y)) continue;
        if (isPortalCell(x, y)) continue;
        if (isRuneNearby(x, y, 0.5)) continue;

        const cellKey = `${x},${y}`;
        if (!occupiedPositions[cellKey]) {
          occupiedPositions[cellKey] = [];
        }

        const runeCount = 1 + Math.floor(Math.random() * 2);
        createRunesOnCell(x, y, palette, runeCount, isShrineRoom, occupiedPositions[cellKey]);
      }
    }

    // Руны на полу (круги)
    const floorPositions = generateShrineFloorRunes();
    for (const pos of floorPositions) {
      const cellKey = `${pos.gridX},${pos.gridY}`;
      if (!occupiedPositions[cellKey]) {
        occupiedPositions[cellKey] = [];
      }

      if (isRuneNearby(pos.gridX, pos.gridY, 0.5)) continue;

      const runeCount = 1 + Math.floor(Math.random() * 2);
      createRunesOnCell(pos.gridX, pos.gridY, palette, runeCount, isShrineRoom, occupiedPositions[cellKey]);
    }

    return;
  }

  // ===== ОБЫЧНЫЙ ЛАБИРИНТ =====
  const occupiedCells = new Set();

  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || !cell.isWall) continue;
      if (hasTorchOnWall(x, y)) continue;
      if (isPortalCell(x, y)) continue;

      // Проверка, не заблокирована ли клетка
      const cellKey = `${x},${y}`;
      let isBlocked = false;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborKey = `${x + dx},${y + dy}`;
          if (occupiedCells.has(neighborKey) || isRuneNearby(x + dx, y + dy, 0.3)) {
            isBlocked = true;
            break;
          }
        }
        if (isBlocked) break;
      }
      if (isBlocked) continue;

      // Шанс появления руны
      if (Math.random() > density) continue;
      if (Math.abs(x - CONFIG.goal.x) < 2 && Math.abs(y - CONFIG.goal.y) < 2) continue;
      if (x === CONFIG.shopPos.x && y === CONFIG.shopPos.y) continue;
      if (Math.abs(x - 1) < 2 && Math.abs(y - 1) < 2) continue;

      occupiedCells.add(cellKey);

      if (isRuneNearby(x, y, 0.5)) continue;

      const palette = selectColorPalette(x, y);
      const isSpecial = (palette === COLOR_PALETTES.mimic || palette === COLOR_PALETTES.portal);
      const runeCount = isSpecial
        ? 1 + Math.floor(Math.random() * 2)
        : 1 + (Math.random() < 0.15 ? Math.floor(Math.random() * 2) + 1 : 0);

      const cellKeyInner = `${x},${y}`;
      if (!occupiedPositions[cellKeyInner]) {
        occupiedPositions[cellKeyInner] = [];
      }

      createRunesOnCell(x, y, palette, runeCount, false, occupiedPositions[cellKeyInner]);
    }
  }
}

/**
 * Создание рун специально для комнаты с алтарём
 * 
 * @returns {void}
 */
export function spawnRunesForShrineRoom() {
  if (!state.inShrineRoom) return;

  const palette = COLOR_PALETTES.shrine;
  state.runes = [];

  const occupiedPositions = {};

  // ===== РУНЫ НА СТЕНАХ =====
  for (let y = 1; y < CONFIG.rows - 1; y++) {
    for (let x = 1; x < CONFIG.cols - 1; x++) {
      const cell = state.grid[y]?.[x];
      if (!cell || !cell.isWall) continue;
      if (hasTorchOnWall(x, y)) continue;
      if (isPortalCell(x, y)) continue;
      if (Math.random() > 0.4) continue;
      if (isRuneNearby(x, y, 0.5)) continue;

      const cellKey = `${x},${y}`;
      if (!occupiedPositions[cellKey]) {
        occupiedPositions[cellKey] = [];
      }

      const runeCount = 1 + Math.floor(Math.random() * 2);
      createRunesOnCell(x, y, palette, runeCount, true, occupiedPositions[cellKey]);
    }
  }

  // ===== РУНЫ НА ПОЛУ (КРУГИ) =====
  const floorPositions = generateShrineFloorRunes();
  for (const pos of floorPositions) {
    const cellKey = `${pos.gridX},${pos.gridY}`;
    if (!occupiedPositions[cellKey]) {
      occupiedPositions[cellKey] = [];
    }

    if (isRuneNearby(pos.gridX, pos.gridY, 0.5)) continue;

    const runeCount = 1 + Math.floor(Math.random() * 2);
    createRunesOnCell(pos.gridX, pos.gridY, palette, runeCount, true, occupiedPositions[cellKey]);
  }
}

/**
 * Очистка всех рун
 * 
 * @returns {void}
 */
export function clearRunes() {
  state.runes = [];
}