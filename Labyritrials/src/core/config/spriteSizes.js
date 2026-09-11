/**
 * @fileoverview Централизованная конфигурация размеров спрайтов
 * Все размеры спрайтов в игре собраны в одном месте для удобного управления.
 * 
 * @module core/config/spriteSizes
 */

/**
 * @namespace SPRITE_SIZES
 * @description Размеры всех спрайтов в игре
 * 
 * @property {Object} player - Размеры игрока
 * @property {Object} ui - Размеры UI-элементов
 * @property {Object} objects - Размеры объектов в мире
 * @property {Object} loot - Размеры предметов на полу
 * @property {Object} creatures - Размеры существ (светлячки, мухи)
 * @property {Object} cells - Множители относительно размера клетки
 * @property {Object} inventory - Размеры спрайтов в инвентаре
 * @property {Object} shop - Размеры спрайтов в магазине
 */
export const SPRITE_SIZES = {
  /**
   * Размеры игрока
   */
  player: {
    /** @type {number} - Размер отображения игрока в пикселях */
    displaySize: 150,
  },

  /**
   * Размеры UI-элементов
   */
  ui: {
    /** @type {number} - Размер мини-карты в пикселях */
    minimapSize: 160,
    /** @type {number} - Размер фона мини-карты (с отступами) */
    minimapBackgroundSize: 180,
  },

  /**
   * Размеры объектов в мире (фиксированные)
   */
  objects: {
    /** @type {number} - Размер факела в пикселях */
    torch: 50,
    /** @type {number} - Размер ловушки в пикселях */
    trap: 40,
    /** @type {number} - Базовый размер светлячка в пикселях */
    fireflyBase: 1.8,
  },

  /**
   * Размеры предметов на полу
   */
  loot: {
    /** @type {number} - Размер золота в пикселях */
    gold: 30,
    /** @type {number} - Размер зелья в пикселях */
    potion: 35,
    /** @type {number} - Размер артефакта в пикселях */
    artifact: 35,
    /** @type {number} - Размер талисмана в пикселях */
    talisman: 40,
    /** @type {number} - Размер содержимого открытого сундука */
    chestContent: 30,
  },

  /**
   * Размеры существ
   */
  creatures: {
    /** @type {number} - Размер мухи (вычисляется динамически) */
    flyBase: 12,
    /** @type {Object} - Размеры светлячков по биомам (множители) */
    firefly: {
      cave: 1.0,
      ice: 1.5,
      sand: 1.5,
    },
  },

  /**
   * Множители относительно размера клетки (cellSize)
   * Используются для объектов, которые масштабируются с размером карты
   */
  cells: {
    /** @type {number} - Алтарь: 110% от клетки */
    altar: 1.1,
    /** @type {number} - Лавка торговца: 100% от клетки */
    shop: 1,
    /** @type {number} - Книжные полки: 100% от клетки */
    bookshelf: 1,
    /** @type {number} - Ступеньки (выход): 85% от клетки */
    stairs: 0.85,
    /** @type {number} - Сундуки: 40% от клетки */
    chest: 0.4,
    /** @type {number} - Мимики: 50% от клетки */
    mimic: 0.5,
    /** @type {number} - Факелы на стене: 50% от клетки (для справки) */
    torchOnWall: 0.3,
  },

  /**
   * Размеры спрайтов в инвентаре
   */
  inventory: {
    /** @type {number} - Размер иконки оружия в инвентаре */
    weapon: 60,
    /** @type {number} - Размер иконки снаряжения в инвентаре */
    equipment: 60,
    /** @type {number} - Размер иконки предмета в инвентаре */
    item: 60,
  },

  /**
   * Размеры спрайтов в магазине
   */
  shop: {
    /** @type {number} - Размер иконки товара в магазине */
    item: 50,
    /** @type {number} - Размер иконки золота (монета) */
    goldCoin: 16,
    /** @type {number} - Размер иконки стопки золота */
    stackGold: 24,
  },
};

/**
 * Получение размера с учётом размера клетки
 * 
 * @param {string} key - Ключ из SPRITE_SIZES.cells
 * @param {number} cellSize - Размер клетки (CONFIG.cellSize)
 * @returns {number} - Вычисленный размер
 */
export function getCellBasedSize(key, cellSize) {
  const multiplier = SPRITE_SIZES.cells[key];
  if (multiplier === undefined) {
    console.warn(`⚠️ Не найден множитель для "${key}" в SPRITE_SIZES.cells`);
    return cellSize * 0.8; // fallback
  }
  return Math.round(cellSize * multiplier);
}

/**
 * Получение размера предмета на полу
 * 
 * @param {string} type - Тип предмета ('gold', 'potion', 'artifact', 'talisman')
 * @returns {number} - Размер в пикселях
 */
export function getLootSize(type) {
  const size = SPRITE_SIZES.loot[type];
  if (size === undefined) {
    console.warn(`⚠️ Не найден размер для "${type}" в SPRITE_SIZES.loot`);
    return 36; // fallback
  }
  return size;
}

/**
 * Получение размера светлячка для биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {number} baseSize - Базовый размер (обычно FIREFLY_SIZE)
 * @returns {number} - Размер с учётом множителя биома
 */
export function getFireflySize(biome, baseSize = 1.8) {
  const multiplier = SPRITE_SIZES.creatures.firefly[biome] || 1.0;
  return baseSize * multiplier;
}

/**
 * Получение размера иконки инвентаря
 * 
 * @param {string} type - Тип ('weapon', 'equipment', 'item')
 * @returns {number} - Размер в пикселях
 */
export function getInventorySize(type) {
  const size = SPRITE_SIZES.inventory[type];
  if (size === undefined) {
    console.warn(`⚠️ Не найден размер для "${type}" в SPRITE_SIZES.inventory`);
    return 60; // fallback
  }
  return size;
}

/**
 * Получение размера иконки магазина
 * 
 * @param {string} type - Тип ('item', 'goldCoin', 'stackGold')
 * @returns {number} - Размер в пикселях
 */
export function getShopSize(type) {
  const size = SPRITE_SIZES.shop[type];
  if (size === undefined) {
    console.warn(`⚠️ Не найден размер для "${type}" в SPRITE_SIZES.shop`);
    return 50; // fallback
  }
  return size;
}

/**
 * Получение размера мимика с учётом размера клетки
 * 
 * @param {number} cellSize - Размер клетки
 * @returns {number} - Размер мимика в пикселях
 */
export function getMimicSize(cellSize) {
  return Math.round(cellSize * SPRITE_SIZES.cells.mimic);
}

export default SPRITE_SIZES;