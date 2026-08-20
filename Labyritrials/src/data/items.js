/**
 * @fileoverview Данные о всех предметах в игре.
 * Содержит характеристики, описания, цены и условия покупки/использования.
 * 
 * @module data/items
 */

/**
 * @typedef {Object} ItemData
 * @property {string} id - Уникальный идентификатор
 * @property {string} name - Название предмета
 * @property {string} icon - Эмодзи для отображения
 * @property {string} imageKey - Ключ для загрузки изображения
 * @property {string} desc - Описание для магазина и инвентаря
 * @property {string} type - Тип предмета ('utility', 'consumable', 'artifact', 'equipment')
 * @property {number} price - Цена в магазине
 * @property {number} minLevel - Минимальный уровень для покупки
 * @property {number|null} hideUntilLevel - Уровень, до которого предмет скрыт в магазине (null — всегда виден)
 * @property {boolean} stackable - Можно ли складывать в стопку
 * @property {number} maxStack - Максимальный размер стопки
 * @property {boolean} persistent - Сохраняется ли между уровнями
 * @property {boolean} oneTimeUse - Одноразовый ли предмет
 * @property {string|null} useMessage - Сообщение при использовании
 * @property {string|null} useColor - Цвет сообщения при использовании
 * @property {string|null} slot - Слот для экипировки (для предметов типа 'equipment')
 * @property {boolean} isNew - Новинка (для отображения в магазине)
 * @property {boolean} requiresInteraction - Требуется ли нажатие E для подбора с пола
 * @property {boolean} showPopup - Показывать ли окно с информацией при подборе
 */

/**
 * @constant {Object<string, ItemData>} ITEMS_DATA - Все предметы в игре
 */
export const ITEMS_DATA = {
  /**
   * Карта лабиринта — открывает мини-карту на текущем уровне
   */
  map: {
    id: 'map',
    name: 'Карта лабиринта',
    icon: '🗺️',
    imageKey: 'mapLevel',
    desc: 'Открывает мини-карту на текущем уровне',
    type: 'utility',
    price: 70,
    minLevel: 1,
    hideUntilLevel: null,
    stackable: false,
    maxStack: 1,
    persistent: false,
    oneTimeUse: true,
    useMessage: '🗺️ Карта активирована!',
    useColor: '#f1c40f',
    isNew: false,
    requiresInteraction: false,
  },

  /**
   * Огненный талисман — защищает от холода
   */
  talismanFire: {
    id: 'talismanFire',
    name: 'Огненный талисман',
    icon: '🔥',
    imageKey: 'talismanFire',
    desc: 'Защищает от холода',
    type: 'equipment',
    price: 150,
    minLevel: 7,
    hideUntilLevel: 7,
    stackable: false,
    maxStack: 1,
    persistent: true,
    oneTimeUse: false,
    useMessage: null,
    useColor: null,
    slot: 'item1',
    isNew: true,
    requiresInteraction: false,
  },

  /**
   * Талисман охотника на мимиков — позволяет наносить урон мимикам
   */
  talismanMimicHunter: {
    id: 'talismanMimicHunter',
    name: 'Талисман охотника на мимиков',
    icon: '🗡️',
    imageKey: 'talismanMimicHunter',
    desc: 'Позволяет наносить урон сундукам-мимикам',
    type: 'equipment',
    price: 0,
    minLevel: 1,
    hideUntilLevel: null,
    stackable: false,
    maxStack: 1,
    persistent: true,
    oneTimeUse: false,
    useMessage: null,
    useColor: null,
    slot: 'item1',
    isNew: false,
    requiresInteraction: true,
    showPopup: true,
  },
};

// ============================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
// ============================================================

/**
 * Получение данных о предмете по ID
 * 
 * @param {string} id - ID предмета
 * @returns {ItemData|undefined} - Данные о предмете или undefined
 */
export function getItemData(id) {
  return ITEMS_DATA[id];
}

/**
 * Получение всех предметов
 * 
 * @returns {ItemData[]} - Массив данных о предметах
 */
export function getAllItems() {
  return Object.values(ITEMS_DATA);
}

/**
 * Получение предметов по типу
 * 
 * @param {string} type - Тип предмета
 * @returns {ItemData[]} - Массив данных о предметах
 */
export function getItemsByType(type) {
  return Object.values(ITEMS_DATA).filter(item => item.type === type);
}

/**
 * Проверка, должен ли предмет быть скрыт в магазине
 * 
 * @param {string} id - ID предмета
 * @param {number} currentLevel - Текущий уровень игры
 * @returns {boolean} - true, если предмет должен быть скрыт
 */
export function isItemHiddenInShop(id, currentLevel) {
  const data = ITEMS_DATA[id];
  if (!data) return true;
  if (data.hideUntilLevel === null) return false;
  return currentLevel < data.hideUntilLevel;
}

/**
 * Получение предметов, доступных для покупки на указанном уровне
 * 
 * @param {number} level - Текущий уровень игры
 * @param {string[]} ownedItems - Массив уже купленных предметов
 * @returns {ItemData[]} - Массив доступных для покупки предметов
 */
export function getBuyableItems(level, ownedItems = []) {
  return Object.values(ITEMS_DATA).filter(item => 
    item.type !== 'equipment' &&
    item.minLevel <= level && 
    !ownedItems.includes(item.id) &&
    !isItemHiddenInShop(item.id, level)
  );
}

/**
 * Получение снаряжения, доступного для покупки на указанном уровне
 * 
 * @param {number} level - Текущий уровень игры
 * @param {string[]} ownedEquipment - Массив уже купленного снаряжения
 * @returns {ItemData[]} - Массив доступного для покупки снаряжения
 */
export function getBuyableEquipment(level, ownedEquipment = []) {
  return Object.values(ITEMS_DATA).filter(item => 
    item.type === 'equipment' &&
    item.minLevel <= level && 
    !ownedEquipment.includes(item.id) &&
    !isItemHiddenInShop(item.id, level)
  );
}

/**
 * Проверка, сохраняется ли предмет между уровнями
 * 
 * @param {string} id - ID предмета
 * @returns {boolean} - true, если предмет сохраняется
 */
export function isPersistentItem(id) {
  return ITEMS_DATA[id]?.persistent || false;
}

/**
 * Проверка, является ли предмет одноразовым
 * 
 * @param {string} id - ID предмета
 * @returns {boolean} - true, если предмет одноразовый
 */
export function isOneTimeUseItem(id) {
  return ITEMS_DATA[id]?.oneTimeUse || false;
}

/**
 * Получение цены предмета
 * 
 * @param {string} id - ID предмета
 * @returns {number} - Цена предмета
 */
export function getItemPrice(id) {
  return ITEMS_DATA[id]?.price || 0;
}

/**
 * Получение минимального уровня для покупки предмета
 * 
 * @param {string} id - ID предмета
 * @returns {number} - Минимальный уровень
 */
export function getItemMinLevel(id) {
  return ITEMS_DATA[id]?.minLevel || 1;
}

/**
 * Получение ключа изображения для карты с учётом биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {string} - Ключ изображения
 */
export function getMapImageKeyByBiome(biome) {
  if (biome === 'ice') return 'mapLevelIce';
  if (biome === 'sand') return 'mapLevelSand';
  return 'mapLevel';
}