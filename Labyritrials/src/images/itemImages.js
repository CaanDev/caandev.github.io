/**
 * @fileoverview Конфигурация изображений для предметов в мире
 * @module images/itemImages
 */

// ============================================================
// АРТЕФАКТЫ
// ============================================================

export const ARTIFACT_IMAGES = [
  'assets/images/items/artifacts/artifact-1.png',
  'assets/images/items/artifacts/artifact-2.png',
  'assets/images/items/artifacts/artifact-3.png',
];

/**
 * Получение случайного изображения артефакта
 * 
 * @returns {string} - Путь к случайному изображению артефакта
 */
export function getRandomArtifactImage() {
  return ARTIFACT_IMAGES[Math.floor(Math.random() * ARTIFACT_IMAGES.length)];
}

// ============================================================
// ЗЕЛЬЯ
// ============================================================

export const POTION_IMAGES = [
  'assets/images/items/potions/healthPotion-1.png',
  'assets/images/items/potions/healthPotion-2.png',
  'assets/images/items/potions/healthPotion-3.png',
];

/**
 * Получение случайного изображения зелья
 * 
 * @returns {string} - Путь к случайному изображению зелья
 */
export function getRandomPotionImage() {
  return POTION_IMAGES[Math.floor(Math.random() * POTION_IMAGES.length)];
}

// ============================================================
// ЗОЛОТО
// ============================================================

export const GOLD_IMAGES = [
  'assets/images/items/gold/bagOfGold-1.png',
  'assets/images/items/gold/bagOfGold-2.png',
  'assets/images/items/gold/bagOfGold-3.png',
  'assets/images/items/gold/bagOfGold-4.png'
];

/**
 * Получение случайного изображения золота
 * 
 * @returns {string} - Путь к случайному изображению золота
 */
export function getRandomGoldImage() {
  return GOLD_IMAGES[Math.floor(Math.random() * GOLD_IMAGES.length)];
}

// ============================================================
// СУНДУКИ
// ============================================================

export const CHEST_IMAGES = {
  closed: 'assets/images/items/chests/chestClosed-1.png',
  open: 'assets/images/items/chests/chestOpen-1.png',
  empty: 'assets/images/items/chests/chestEmpty-1.png',
  mimic: 'assets/images/items/chests/chestMimicAttack-1.png',
};

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

export const ITEM_IMAGES = {
  // Артефакты
  artifact1: 'assets/images/items/artifacts/artifact-1.png',
  artifact2: 'assets/images/items/artifacts/artifact-2.png',
  artifact3: 'assets/images/items/artifacts/artifact-3.png',
  
  // Зелья
  potion1: 'assets/images/items/potions/healthPotion-1.png',
  potion2: 'assets/images/items/potions/healthPotion-2.png',
  potion3: 'assets/images/items/potions/healthPotion-3.png',
  
  // Золото
  gold1: 'assets/images/items/gold/bagOfGold-1.png',
  gold2: 'assets/images/items/gold/bagOfGold-2.png',
  gold3: 'assets/images/items/gold/bagOfGold-3.png',
  gold4: 'assets/images/items/gold/bagOfGold-4.png',

  // Сундуки
  chestClosed: 'assets/images/items/chests/chestClosed-1.png',
  chestOpen: 'assets/images/items/chests/chestOpen-1.png',
  chestEmpty: 'assets/images/items/chests/chestEmpty-1.png',
  chestMimic: 'assets/images/items/chests/chestMimicAttack-1.png',
};