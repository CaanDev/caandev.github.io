/**
 * @fileoverview Конфигурация изображений для предметов в мире
 * @module images/itemImages
 */

// ============================================================
// АРТЕФАКТЫ
// ============================================================

export const ARTIFACT_IMAGES = {
  // Биом Cave (уровни 1-4)
  cave: [
    'assets/images/items/artifacts/artifactCave-1.png',
    'assets/images/items/artifacts/artifactCave-2.png',
    'assets/images/items/artifacts/artifactCave-3.png',
  ],
  // Биом Ice (уровни 6-9)
  ice: [
    'assets/images/items/artifacts/artifactIce-1.png',
    'assets/images/items/artifacts/artifactIce-2.png',
    'assets/images/items/artifacts/artifactIce-3.png',
  ],
  // Биом Sand (уровни 11-14)
  sand: [
    'assets/images/items/artifacts/artifactSand-1.png',
    'assets/images/items/artifacts/artifactSand-2.png',
    'assets/images/items/artifacts/artifactSand-3.png',
  ],
  // Сокровищница
  treasure: [
    'assets/images/items/artifacts/artifactTreasureRoom-1.png',
    'assets/images/items/artifacts/artifactTreasureRoom-2.png',
    'assets/images/items/artifacts/artifactTreasureRoom-3.png',
  ],
};

/**
 * Получение случайного изображения артефакта
 * 
 * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand', 'treasure')
 * @returns {string} - Путь к случайному изображению артефакта
 */
export function getRandomArtifactImage(biome = 'cave') {
  if (ARTIFACT_IMAGES[biome]) {
    const images = ARTIFACT_IMAGES[biome];
    return images[Math.floor(Math.random() * images.length)];
  }
  return ARTIFACT_IMAGES.cave[0];
}

/**
 * Получение биома для артефакта на основе состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand', 'treasure')
 */
export function getArtifactBiome(state) {
  if (state.inTreasureRoom) return 'treasure';
  
  const level = state.gameLevel;
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

// ============================================================
// ЗОЛОТО
// ============================================================

export const GOLD_IMAGES = {
  // Биом Cave (уровни 1-4)
  cave: [
    'assets/images/items/gold/bagOfGoldCave-1.png',
    'assets/images/items/gold/bagOfGoldCave-2.png',
    'assets/images/items/gold/bagOfGoldCave-3.png',
    'assets/images/items/gold/bagOfGoldCave-4.png',
  ],
  // Биом Ice (уровни 6-9)
  ice: [
    'assets/images/items/gold/bagOfGoldIce-1.png',
    'assets/images/items/gold/bagOfGoldIce-2.png',
    'assets/images/items/gold/bagOfGoldIce-3.png',
    'assets/images/items/gold/bagOfGoldIce-4.png',
  ],
  // Биом Sand (уровни 11-14)
  sand: [
    'assets/images/items/gold/bagOfGoldSand-1.png',
    'assets/images/items/gold/bagOfGoldSand-2.png',
    'assets/images/items/gold/bagOfGoldSand-3.png',
    'assets/images/items/gold/bagOfGoldSand-4.png',
  ],
  // Сокровищница
  treasure: [
    'assets/images/items/gold/bagOfGoldTreasureRoom-1.png',
    'assets/images/items/gold/bagOfGoldTreasureRoom-2.png',
    'assets/images/items/gold/bagOfGoldTreasureRoom-3.png',
    'assets/images/items/gold/bagOfGoldTreasureRoom-4.png',
  ],
};

/**
 * Получение случайного изображения золота
 * 
 * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand', 'treasure')
 * @returns {string} - Путь к случайному изображению золота
 */
export function getRandomGoldImage(biome = 'cave') {
  if (GOLD_IMAGES[biome]) {
    const images = GOLD_IMAGES[biome];
    return images[Math.floor(Math.random() * images.length)];
  }
  return GOLD_IMAGES.cave[0];
}

/**
 * Получение биома для золота на основе состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand', 'treasure')
 */
export function getGoldBiome(state) {
  if (state.inTreasureRoom) return 'treasure';
  
  const level = state.gameLevel;
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

// ============================================================
// ЗЕЛЬЯ
// ============================================================

export const POTION_IMAGES = {
  // Биом Cave (уровни 1-4)
  cave: [
    'assets/images/items/potions/healthPotionCave-1.png',
    'assets/images/items/potions/healthPotionCave-2.png',
    'assets/images/items/potions/healthPotionCave-3.png',
    'assets/images/items/potions/healthPotionCave-4.png',
  ],
  // Биом Ice (уровни 6-9)
  ice: [
    'assets/images/items/potions/healthPotionIce-1.png',
    'assets/images/items/potions/healthPotionIce-2.png',
    'assets/images/items/potions/healthPotionIce-3.png',
    'assets/images/items/potions/healthPotionIce-4.png',
  ],
  // Биом Sand (уровни 11-14)
  sand: [
    'assets/images/items/potions/healthPotionSand-1.png',
    'assets/images/items/potions/healthPotionSand-2.png',
    'assets/images/items/potions/healthPotionSand-3.png',
    'assets/images/items/potions/healthPotionSand-4.png',
  ],
  // Сокровищница
  treasure: [
    'assets/images/items/potions/healthPotionTreasureRoom-1.png',
    'assets/images/items/potions/healthPotionTreasureRoom-2.png',
    'assets/images/items/potions/healthPotionTreasureRoom-3.png',
    'assets/images/items/potions/healthPotionTreasureRoom-4.png',
  ],
};

/**
 * Получение случайного изображения зелья
 * 
 * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand', 'treasure')
 * @returns {string} - Путь к случайному изображению зелья
 */
export function getRandomPotionImage(biome = 'cave') {
  if (POTION_IMAGES[biome]) {
    const images = POTION_IMAGES[biome];
    return images[Math.floor(Math.random() * images.length)];
  }
  return POTION_IMAGES.cave[0];
}

/**
 * Получение биома для зелья на основе состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand', 'treasure')
 */
export function getPotionBiome(state) {
  if (state.inTreasureRoom) return 'treasure';
  
  const level = state.gameLevel;
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

// ============================================================
// СУНДУКИ
// ============================================================

export const CHEST_IMAGES = {
  // Биом Cave (уровни 1-4)
  cave: {
    closed: 'assets/images/items/chests/biomes/chestCaveClosed-1.png',
    open: 'assets/images/items/chests/biomes/chestCaveOpen-1.png',
    empty: 'assets/images/items/chests/biomes/chestCaveEmpty-1.png',
    mimic: 'assets/images/items/chests/biomes/chestCaveMimicAttack-1.png',
  },
  // Биом Ice (уровни 6-9)
  ice: {
    closed: 'assets/images/items/chests/biomes/chestIceClosed-1.png',
    open: 'assets/images/items/chests/biomes/chestIceOpen-1.png',
    empty: 'assets/images/items/chests/biomes/chestIceEmpty-1.png',
    mimic: 'assets/images/items/chests/biomes/chestIceMimicAttack-1.png',
  },
  // Биом Sand (уровни 11-14)
  sand: {
    closed: 'assets/images/items/chests/biomes/chestSandClosed-1.png',
    open: 'assets/images/items/chests/biomes/chestSandOpen-1.png',
    empty: 'assets/images/items/chests/biomes/chestSandEmpty-1.png',
    mimic: 'assets/images/items/chests/biomes/chestSandMimicAttack-1.png',
  },
  // Сокровищница
  treasure: {
    closed: 'assets/images/items/chests/rooms/chestTreasureRoomClosed-1.png',
    open: 'assets/images/items/chests/rooms/chestTreasureRoomOpen-1.png',
    empty: 'assets/images/items/chests/rooms/chestTreasureRoomEmpty-1.png',
    mimic: 'assets/images/items/chests/rooms/chestTreasureRoomMimicAttack-1.png',
  },
  // Комната-ловушка
  trap: {
    closed: 'assets/images/items/chests/rooms/chestTrapRoomClosed-1.png',
    open: 'assets/images/items/chests/rooms/chestTrapRoomOpen-1.png',
    empty: null, // В комнате-ловушке нет пустых сундуков
    mimic: null, // В комнате-ловушке нет мимиков
  },
  // Безопасная комната
  safe: {
    closed: 'assets/images/items/chests/rooms/chestSafeRoomClosed-1.png',
    open: 'assets/images/items/chests/rooms/chestSafeRoomOpen-1.png',
    empty: null, // В безопасной комнате нет пустых сундуков
    mimic: null, // В безопасной комнате нет мимиков
  },
};

/**
 * Получение изображения сундука
 * 
 * @param {string} type - Тип сундука ('closed', 'open', 'empty', 'mimic')
 * @param {string} [biome='cave'] - Биом ('cave', 'ice', 'sand', 'treasure', 'safe')
 * @returns {string|null} - Путь к изображению или null
 */
export function getChestImage(type, biome = 'cave') {
  const biomeData = CHEST_IMAGES[biome];
  if (!biomeData) return null;
  
  const imagePath = biomeData[type];
  return imagePath || null;
}

/**
 * Получение биома для сундука на основе состояния игры
 * 
 * @param {Object} state - Объект состояния игры
 * @returns {string} - ID биома ('cave', 'ice', 'sand', 'treasure', 'safe')
 */
export function getChestBiome(state) {
  if (state.inSafeRoom) return 'safe';
  if (state.inTreasureRoom) return 'treasure';
  
  const level = state.gameLevel;
  if (level >= 11) return 'sand';
  if (level >= 6) return 'ice';
  return 'cave';
}

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

export const ITEM_IMAGES = {
  // Артефакты — Cave
  artifactCave1: 'assets/images/items/artifacts/artifactCave-1.png',
  artifactCave2: 'assets/images/items/artifacts/artifactCave-2.png',
  artifactCave3: 'assets/images/items/artifacts/artifactCave-3.png',
  
  // Артефакты — Ice
  artifactIce1: 'assets/images/items/artifacts/artifactIce-1.png',
  artifactIce2: 'assets/images/items/artifacts/artifactIce-2.png',
  artifactIce3: 'assets/images/items/artifacts/artifactIce-3.png',
  
  // Артефакты — Sand
  artifactSand1: 'assets/images/items/artifacts/artifactSand-1.png',
  artifactSand2: 'assets/images/items/artifacts/artifactSand-2.png',
  artifactSand3: 'assets/images/items/artifacts/artifactSand-3.png',
  
  // Артефакты — Сокровищница
  artifactTreasure1: 'assets/images/items/artifacts/artifactTreasureRoom-1.png',
  artifactTreasure2: 'assets/images/items/artifacts/artifactTreasureRoom-2.png',
  artifactTreasure3: 'assets/images/items/artifacts/artifactTreasureRoom-3.png',
  
  // Золото — Cave
  goldCave1: 'assets/images/items/gold/bagOfGoldCave-1.png',
  goldCave2: 'assets/images/items/gold/bagOfGoldCave-2.png',
  goldCave3: 'assets/images/items/gold/bagOfGoldCave-3.png',
  goldCave4: 'assets/images/items/gold/bagOfGoldCave-4.png',
  
  // Золото — Ice
  goldIce1: 'assets/images/items/gold/bagOfGoldIce-1.png',
  goldIce2: 'assets/images/items/gold/bagOfGoldIce-2.png',
  goldIce3: 'assets/images/items/gold/bagOfGoldIce-3.png',
  goldIce4: 'assets/images/items/gold/bagOfGoldIce-4.png',
  
  // Золото — Sand
  goldSand1: 'assets/images/items/gold/bagOfGoldSand-1.png',
  goldSand2: 'assets/images/items/gold/bagOfGoldSand-2.png',
  goldSand3: 'assets/images/items/gold/bagOfGoldSand-3.png',
  goldSand4: 'assets/images/items/gold/bagOfGoldSand-4.png',
  
  // Золото — Сокровищница
  goldTreasure1: 'assets/images/items/gold/bagOfGoldTreasureRoom-1.png',
  goldTreasure2: 'assets/images/items/gold/bagOfGoldTreasureRoom-2.png',
  goldTreasure3: 'assets/images/items/gold/bagOfGoldTreasureRoom-3.png',
  goldTreasure4: 'assets/images/items/gold/bagOfGoldTreasureRoom-4.png',
  
  // Зелья — Cave
  potionCave1: 'assets/images/items/potions/healthPotionCave-1.png',
  potionCave2: 'assets/images/items/potions/healthPotionCave-2.png',
  potionCave3: 'assets/images/items/potions/healthPotionCave-3.png',
  potionCave4: 'assets/images/items/potions/healthPotionCave-4.png',
  
  // Зелья — Ice
  potionIce1: 'assets/images/items/potions/healthPotionIce-1.png',
  potionIce2: 'assets/images/items/potions/healthPotionIce-2.png',
  potionIce3: 'assets/images/items/potions/healthPotionIce-3.png',
  potionIce4: 'assets/images/items/potions/healthPotionIce-4.png',
  
  // Зелья — Sand
  potionSand1: 'assets/images/items/potions/healthPotionSand-1.png',
  potionSand2: 'assets/images/items/potions/healthPotionSand-2.png',
  potionSand3: 'assets/images/items/potions/healthPotionSand-3.png',
  potionSand4: 'assets/images/items/potions/healthPotionSand-4.png',
  
  // Зелья — Сокровищница
  potionTreasure1: 'assets/images/items/potions/healthPotionTreasureRoom-1.png',
  potionTreasure2: 'assets/images/items/potions/healthPotionTreasureRoom-2.png',
  potionTreasure3: 'assets/images/items/potions/healthPotionTreasureRoom-3.png',
  potionTreasure4: 'assets/images/items/potions/healthPotionTreasureRoom-4.png',

  // Сундуки — Cave
  chestCaveClosed: 'assets/images/items/chests/biomes/chestCaveClosed-1.png',
  chestCaveOpen: 'assets/images/items/chests/biomes/chestCaveOpen-1.png',
  chestCaveEmpty: 'assets/images/items/chests/biomes/chestCaveEmpty-1.png',
  chestCaveMimic: 'assets/images/items/chests/biomes/chestCaveMimicAttack-1.png',
  
  // Сундуки — Ice
  chestIceClosed: 'assets/images/items/chests/biomes/chestIceClosed-1.png',
  chestIceOpen: 'assets/images/items/chests/biomes/chestIceOpen-1.png',
  chestIceEmpty: 'assets/images/items/chests/biomes/chestIceEmpty-1.png',
  chestIceMimic: 'assets/images/items/chests/biomes/chestIceMimicAttack-1.png',
  
  // Сундуки — Sand
  chestSandClosed: 'assets/images/items/chests/biomes/chestSandClosed-1.png',
  chestSandOpen: 'assets/images/items/chests/biomes/chestSandOpen-1.png',
  chestSandEmpty: 'assets/images/items/chests/biomes/chestSandEmpty-1.png',
  chestSandMimic: 'assets/images/items/chests/biomes/chestSandMimicAttack-1.png',
  
  // Сундуки — Сокровищница
  chestTreasureClosed: 'assets/images/items/chests/rooms/chestTreasureRoomClosed-1.png',
  chestTreasureOpen: 'assets/images/items/chests/rooms/chestTreasureRoomOpen-1.png',
  chestTreasureEmpty: 'assets/images/items/chests/rooms/chestTreasureRoomEmpty-1.png',
  chestTreasureMimic: 'assets/images/items/chests/rooms/chestTreasureRoomMimicAttack-1.png',

  // Сундуки — Комната-ловушка
  chestTrapRoomClosed: 'assets/images/items/chests/rooms/chestTrapRoomClosed-1.png',
  chestTrapRoomOpen: 'assets/images/items/chests/rooms/chestTrapRoomOpen-1.png',
  
  // Сундуки — Безопасная комната
  chestSafeClosed: 'assets/images/items/chests/rooms/chestSafeRoomClosed-1.png',
  chestSafeOpen: 'assets/images/items/chests/rooms/chestSafeRoomOpen-1.png',
};