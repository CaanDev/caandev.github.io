/**
 * @fileoverview Точка входа для рендеринга блуждающих огоньков
 * (призванных willOTheWisps и диких wildWisps).
 * 
 * @module systems/rendering/willOTheWisps/index
 */

// ============================================================
// ПРИЗВАННЫЕ ОГОНЬКИ (willOTheWisps)
// ============================================================

export { drawWisps } from './willOTheWispsRenderer.js';

// ============================================================
// ДИКИЕ ОГОНЬКИ (wildWisps)
// ============================================================

export { drawWildWisps } from './wildWispsRenderer.js';

// ============================================================
// ОБЩИЙ КЭШ СПРАЙТОВ
// ============================================================

export {
  getWispSprite,
  getWildWispSprite,
  clearWispsSpriteCache,
  getWispsSpriteCacheSize,
} from './wispsSpriteCache.js';