/**
 * @fileoverview Данные обо всём оружии в игре.
 * Содержит характеристики, описания, цены и условия покупки.
 * 
 * @module data/weapons
 */

/**
 * @typedef {Object} WeaponData
 * @property {string} id - Уникальный идентификатор
 * @property {string} name - Название оружия
 * @property {string} icon - Эмодзи для отображения
 * @property {string} imageKey - Ключ для загрузки изображения (из INVENTORY_IMAGES)
 * @property {number} damage - Базовый урон
 * @property {string[]} effects - Список эффектов
 * @property {string} desc - Описание для магазина и инвентаря
 * @property {boolean} isRanged - Дальнобойное ли оружие
 * @property {boolean} isDefault - Является ли базовым (всегда доступно)
 * @property {number} price - Цена в магазине
 * @property {number} minLevel - Минимальный уровень для покупки
 * @property {string} category - Категория ('melee', 'ranged')
 */

/**
 * @constant {Object<string, WeaponData>} WEAPONS_DATA - Все виды оружия
 */
export const WEAPONS_DATA = {
  /**
   * Обычный посох — базовое оружие, всегда доступно
   */
  default: {
    id: 'default',
    name: 'Обычный посох',
    icon: '🧙',
    imageKey: 'staffDefault',
    damage: 20,
    effects: [],
    desc: 'Базовое оружие, всегда с вами',
    isRanged: false,
    isDefault: true,
    price: 0,
    minLevel: 1,
    category: 'melee',
  },

  /**
   * Громовой посох — оглушает врага
   */
  stun: {
    id: 'stun',
    name: 'Громовой посох',
    icon: '⚡',
    imageKey: 'staffThunder',
    damage: 20,
    effects: ['Оглушение'],
    desc: 'Оглушает врага на 2 секунды',
    isRanged: false,
    isDefault: false,
    price: 200,
    minLevel: 4,
    category: 'melee',
  },

  /**
   * Посох вампира — восстанавливает HP при атаке
   */
  vampire: {
    id: 'vampire',
    name: 'Посох вампира',
    icon: '🦇',
    imageKey: 'staffVampire',
    damage: 20,
    effects: ['Вампиризм'],
    desc: 'Восстанавливает HP при атаке',
    isRanged: false,
    isDefault: false,
    price: 400,
    minLevel: 12,
    category: 'melee',
  },

  /**
   * Огненный шар — дальнобойное оружие
   */
  fireball: {
    id: 'fireball',
    name: 'Огненный шар',
    icon: '🔥',
    imageKey: 'fireball',
    damage: 40,
    effects: ['Огонь'],
    desc: 'Запускает шар, прожигающий врагов',
    isRanged: true,
    isDefault: false,
    price: 200,
    minLevel: 10,
    category: 'ranged',
  },
};

/**
 * Получение данных об оружии по ID
 * 
 * @param {string} id - ID оружия
 * @returns {WeaponData|undefined} - Данные об оружии или undefined
 */
export function getWeaponData(id) {
  return WEAPONS_DATA[id];
}

/**
 * Получение всех видов оружия
 * 
 * @returns {WeaponData[]} - Массив данных об оружии
 */
export function getAllWeapons() {
  return Object.values(WEAPONS_DATA);
}

/**
 * Получение оружия по категории
 * 
 * @param {string} category - Категория ('melee' или 'ranged')
 * @returns {WeaponData[]} - Массив данных об оружии
 */
export function getWeaponsByCategory(category) {
  return Object.values(WEAPONS_DATA).filter(w => w.category === category);
}

/**
 * Получение ближнего оружия
 * 
 * @returns {WeaponData[]} - Массив данных о ближнем оружии
 */
export function getMeleeWeapons() {
  return getWeaponsByCategory('melee');
}

/**
 * Получение дальнобойного оружия
 * 
 * @returns {WeaponData[]} - Массив данных о дальнобойном оружии
 */
export function getRangedWeapons() {
  return getWeaponsByCategory('ranged');
}

/**
 * Получение оружия, доступного для покупки на указанном уровне
 * 
 * @param {number} level - Текущий уровень игры
 * @param {string[]} ownedWeapons - Массив уже купленного оружия
 * @returns {WeaponData[]} - Массив доступного для покупки оружия
 */
export function getBuyableWeapons(level, ownedWeapons = []) {
  return Object.values(WEAPONS_DATA).filter(w => 
    !w.isDefault && 
    w.minLevel <= level && 
    !ownedWeapons.includes(w.id)
  );
}

/**
 * Проверка, является ли ID базовым оружием
 * 
 * @param {string} id - ID оружия
 * @returns {boolean} - true, если это базовое оружие
 */
export function isDefaultWeapon(id) {
  return WEAPONS_DATA[id]?.isDefault || false;
}

/**
 * Проверка, является ли ID дальнобойным оружием
 * 
 * @param {string} id - ID оружия
 * @returns {boolean} - true, если это дальнобойное оружие
 */
export function isRangedWeapon(id) {
  return WEAPONS_DATA[id]?.isRanged || false;
}

/**
 * Получение цены оружия
 * 
 * @param {string} id - ID оружия
 * @returns {number} - Цена оружия
 */
export function getWeaponPrice(id) {
  return WEAPONS_DATA[id]?.price || 0;
}

/**
 * Получение минимального уровня для покупки оружия
 * 
 * @param {string} id - ID оружия
 * @returns {number} - Минимальный уровень
 */
export function getWeaponMinLevel(id) {
  return WEAPONS_DATA[id]?.minLevel || 1;
}