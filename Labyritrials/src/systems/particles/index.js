/**
 * @fileoverview Точка входа для системы частиц.
 * Экспортирует все компоненты для работы с частицами:
 * золото, артефакты, зелья, взрывы боссов и обычные взрывы.
 * 
 * @module systems/particles/index
 */

// ============================================================
// ЗОЛОТО
// ============================================================

/**
 * Экспорт функций для работы с частицами золота
 * @see module:systems/particles/goldParticles
 */
export { 
  createGoldParticles, 
  updateGoldParticlesTarget, 
  updateGoldParticles, 
  clearGoldParticles,
  clearAllLootParticles,
  goldParticlePool 
} from './goldParticles.js';

// ============================================================
// АРТЕФАКТЫ
// ============================================================

/**
 * Экспорт функций для работы с частицами артефактов
 * @see module:systems/particles/artifactParticles
 */
export { createArtifactParticles, clearArtifactParticles } from './artifactParticles.js';

// ============================================================
// ЗЕЛЬЯ
// ============================================================

/**
 * Экспорт функций для работы с частицами зелий
 * @see module:systems/particles/potionParticles
 */
export { createPotionParticles, clearPotionParticles } from './potionParticles.js';

// ============================================================
// ВЗРЫВЫ БОССОВ
// ============================================================

/**
 * Экспорт функций для работы с взрывами боссов
 * @see module:systems/particles/bossExplosion
 */
export { 
  createBossExplosion, 
  updateBossExplosions, 
  drawBossExplosions, 
  drawShockwave, 
  clearBossExplosions 
} from './bossExplosion.js';

// ============================================================
// ВЗРЫВЫ
// ============================================================

/**
 * Экспорт функций для работы с обычными взрывами
 * @see module:entities/objects/explosion
 */
export { createExplosion, updateExplosion, drawExplosion, clearExplosion } from './explosion.js';

// ============================================================
// ПУЛ ЧАСТИЦ
// ============================================================

/**
 * Экспорт класса пула частиц
 * @see module:systems/particles/particlePool
 */
export { ParticlePool } from './particlePool.js';