/**
 * @fileoverview Конфигурация изображений для объектов в мире
 * @module images/objectImages
 */

// ============================================================
// ФАКЕЛЫ
// ============================================================

export const TORCH_IMAGES = {
  normal: [
    'assets/images/objects/torches/torchNormal-1.png',
    'assets/images/objects/torches/torchNormal-2.png',
  ],
  shrine: [
    'assets/images/objects/torches/rooms/torchShrineRoom-1.png',
    'assets/images/objects/torches/rooms/torchShrineRoom-2.png',
    'assets/images/objects/torches/rooms/torchShrineRoom-3.png',
  ],
  trap: [
    'assets/images/objects/torches/rooms/torchTrapRoom-1.png',
  ],
  boss5: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl5-1.png',
  ],
  boss10: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl10-1.png',
    'assets/images/objects/torches/bossArena/torchBossArenaLvl10-2.png',
  ],
  boss15: [
    'assets/images/objects/torches/bossArena/torchBossArenaLvl15-1.png',
  ],
};

export function getRandomTorchImage(type = 'normal') {
  const images = TORCH_IMAGES[type] || TORCH_IMAGES.normal;
  return images[Math.floor(Math.random() * images.length)];
}

// ============================================================
// ЛОВУШКИ
// ============================================================

export const TRAP_IMAGES = {
  explosion: 'assets/images/objects/traps/trapExplosion.png',
  ice: 'assets/images/objects/traps/trapIce.png',
  acid: 'assets/images/objects/traps/trapAcid.png',
  lightning: 'assets/images/objects/traps/trapLightning.png',
  psionic: 'assets/images/objects/traps/trapPsionic.png',
};

/**
 * Получение изображения ловушки по типу
 * 
 * @param {string} type - Тип ловушки ('explosion', 'ice', 'acid', 'lightning', 'psionic')
 * @returns {string} - Путь к изображению ловушки
 */
export function getTrapImage(type) {
  return TRAP_IMAGES[type] || TRAP_IMAGES.explosion;
}

// ============================================================
// ЛАВКА ТОРГОВЦА
// ============================================================

export const SHOP_STAND_IMAGE = 'assets/images/objects/shopStand.png';

// ============================================================
// РЕГИСТРАЦИЯ ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ
// ============================================================

export const OBJECT_IMAGES = {
  // Факелы
  torchNormal1: 'assets/images/objects/torches/torchNormal-1.png',
  torchNormal2: 'assets/images/objects/torches/torchNormal-2.png',
  torchShrine1: 'assets/images/objects/torches/rooms/torchShrineRoom-1.png',
  torchShrine2: 'assets/images/objects/torches/rooms/torchShrineRoom-2.png',
  torchShrine3: 'assets/images/objects/torches/rooms/torchShrineRoom-3.png',
  torchTrap: 'assets/images/objects/torches/rooms/torchTrapRoom-1.png',
  torchBoss5: 'assets/images/objects/torches/bossArena/torchBossArenaLvl5-1.png',
  torchBoss10_1: 'assets/images/objects/torches/bossArena/torchBossArenaLvl10-1.png',
  torchBoss10_2: 'assets/images/objects/torches/bossArena/torchBossArenaLvl10-2.png',
  torchBoss15: 'assets/images/objects/torches/bossArena/torchBossArenaLvl15-1.png',

  // Ловушки
  trapExplosion: 'assets/images/objects/traps/trapExplosion.png',
  trapIce: 'assets/images/objects/traps/trapIce.png',
  trapAcid: 'assets/images/objects/traps/trapAcid.png',
  trapLightning: 'assets/images/objects/traps/trapLightning.png',
  trapPsionic: 'assets/images/objects/traps/trapPsionic.png',

  // Лавка торговца
  shopStand: 'assets/images/objects/shopStand.png',
};