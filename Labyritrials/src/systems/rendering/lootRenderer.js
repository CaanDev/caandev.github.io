/**
 * @fileoverview Рендерер предметов на полу.
 * Отрисовывает золото, зелья, артефакты и другие предметы.
 * 
 * @module systems/rendering/lootRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { 
  ITEM_IMAGES, 
  getRandomArtifactImage, 
  getRandomPotionImage,
  getRandomGoldImage,
} from '../../images/itemImages.js';
import { INVENTORY_IMAGES } from '../../images/inventoryImages.js';

/**
 * Отрисовка всех предметов на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawLoot(ctx) {
  drawGold(ctx);
  drawPotions(ctx);
  drawArtifacts(ctx);
  drawTalismanMimicHunter(ctx);
}

/**
 * Отрисовка золота на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawGold(ctx) {
  for (let item of state.lootItems) {
    if (item.type !== 'gold') continue;
    
    const ix = Math.floor(item.x / CONFIG.cellSize);
    const iy = Math.floor(item.y / CONFIG.cellSize);
    if (!state.grid[iy] || !state.grid[iy][ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    if (!item.imageKey) {
      let goldBiome = state.currentBiome || 'cave';
      if (state.inTreasureRoom) goldBiome = 'treasure';
      
      const imagePath = getRandomGoldImage(goldBiome);
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      item.imageKey = cacheKey;
      item.imagePath = imagePath;
      item.goldBiome = goldBiome;
    }
    
    if (item.imageKey && isImageLoaded(item.imageKey)) {
      const img = getImage(item.imageKey);
      if (img) {
        const size = 36;
        ctx.save();
        ctx.drawImage(img, item.x - size/2, item.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.gold, item.x, item.y);
  }
}

/**
 * Отрисовка зелий на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawPotions(ctx) {
  for (let item of state.lootItems) {
    if (item.type !== 'potion') continue;
    
    const ix = Math.floor(item.x / CONFIG.cellSize);
    const iy = Math.floor(item.y / CONFIG.cellSize);
    if (!state.grid[iy] || !state.grid[iy][ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    if (!item.imageKey) {
      let potionBiome = state.currentBiome || 'cave';
      if (state.inTreasureRoom) potionBiome = 'treasure';
      const imagePath = getRandomPotionImage(potionBiome);
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      item.imageKey = cacheKey;
      item.imagePath = imagePath;
    }
    
    if (item.imageKey && isImageLoaded(item.imageKey)) {
      const img = getImage(item.imageKey);
      if (img) {
        const size = 36;
        ctx.save();
        ctx.drawImage(img, item.x - size/2, item.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.potion, item.x, item.y);
  }
}

/**
 * Отрисовка артефактов на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawArtifacts(ctx) {
  for (let art of state.artifacts) {
    const ax = Math.floor(art.x / CONFIG.cellSize);
    const ay = Math.floor(art.y / CONFIG.cellSize);
    
    if (!state.grid[ay] || !state.grid[ay][ax]) continue;
    if (!state.grid[ay][ax].revealed && !player.hasMap) continue;
    
    if (!art.imageKey) {
      let artifactBiome = state.currentBiome || 'cave';
      if (state.inTreasureRoom) artifactBiome = 'treasure';
      
      const imagePath = getRandomArtifactImage(artifactBiome);
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      art.imageKey = cacheKey;
      art.imagePath = imagePath;
      art.biome = artifactBiome;
    }
    
    if (art.imageKey && isImageLoaded(art.imageKey)) {
      const img = getImage(art.imageKey);
      if (img) {
        const size = 40;
        ctx.save();
        ctx.drawImage(img, art.x - size/2, art.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.artifact, art.x, art.y);
  }
}

/**
 * Отрисовка талисмана охотника на мимиков на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawTalismanMimicHunter(ctx) {
  for (let item of state.lootItems) {
    if (item.type !== 'talismanMimicHunter') continue;
    
    const ix = Math.floor(item.x / CONFIG.cellSize);
    const iy = Math.floor(item.y / CONFIG.cellSize);
    
    if (!state.grid[iy]?.[ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    const imageKey = item.imageKey || 'talismanMimicHunter';
    
    if (isImageLoaded(imageKey)) {
      const img = getImage(imageKey);
      if (img) {
        const size = 40;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(155, 89, 182, 0.3)';
        ctx.drawImage(img, item.x - size/2, item.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    // Fallback: эмодзи
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗡️', item.x, item.y);
  }
}