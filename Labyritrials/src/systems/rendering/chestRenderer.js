/**
 * @fileoverview Рендерер предметов, сундуков и мух.
 * Отрисовывает лут на полу, сундуки разных типов и мух над мимиками.
 * 
 * @module systems/rendering/chestRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { 
  ITEM_IMAGES, 
  CHEST_IMAGES, 
  getRandomArtifactImage, 
  getRandomPotionImage,
  getRandomGoldImage 
} from '../../images/itemImages.js';

/**
 * Отрисовка предметов на полу
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawLoot(ctx) {
  // ===== ЗОЛОТО =====
  for (let item of state.lootItems) {
    if (item.type !== 'gold') continue;
    
    let ix = Math.floor(item.x / CONFIG.cellSize);
    let iy = Math.floor(item.y / CONFIG.cellSize);
    if (!state.grid[iy] || !state.grid[iy][ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    if (!item.imageKey) {
      const imagePath = getRandomGoldImage();
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      item.imageKey = cacheKey;
      item.imagePath = imagePath;
    }
    
    if (item.imageKey && isImageLoaded(item.imageKey)) {
      const img = getImage(item.imageKey);
      if (img) {
        const size = 28;
        ctx.save();
        ctx.drawImage(img, item.x - size/2, item.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.gold, item.x, item.y);
  }

  // ===== ЗЕЛЬЯ =====
  for (let item of state.lootItems) {
    if (item.type !== 'potion') continue;
    
    let ix = Math.floor(item.x / CONFIG.cellSize);
    let iy = Math.floor(item.y / CONFIG.cellSize);
    if (!state.grid[iy] || !state.grid[iy][ix]) continue;
    if (!state.grid[iy][ix].revealed && !player.hasMap) continue;
    
    if (!item.imageKey) {
      const imagePath = getRandomPotionImage();
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      item.imageKey = cacheKey;
      item.imagePath = imagePath;
    }
    
    if (item.imageKey && isImageLoaded(item.imageKey)) {
      const img = getImage(item.imageKey);
      if (img) {
        const size = 28;
        ctx.save();
        ctx.drawImage(img, item.x - size/2, item.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.potion, item.x, item.y);
  }
  
  // ===== АРТЕФАКТЫ =====
  for (let art of state.artifacts) {
    let ax = Math.floor(art.x / CONFIG.cellSize);
    let ay = Math.floor(art.y / CONFIG.cellSize);
    
    if (!state.grid[ay] || !state.grid[ay][ax]) continue;
    if (!state.grid[ay][ax].revealed && !player.hasMap) continue;
    
    if (!art.imageKey) {
      const imagePath = getRandomArtifactImage();
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      art.imageKey = cacheKey;
      art.imagePath = imagePath;
    }
    
    if (art.imageKey && isImageLoaded(art.imageKey)) {
      const img = getImage(art.imageKey);
      if (img) {
        const size = 32;
        ctx.save();
        ctx.drawImage(img, art.x - size/2, art.y - size/2, size, size);
        ctx.restore();
        continue;
      }
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.artifact, art.x, art.y);
  }
}

/**
 * Отрисовка всех сундуков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawChests(ctx) {
  if (!state.chests) return;
  
  for (let ch of state.chests) {
    let cx = Math.floor(ch.x / CONFIG.cellSize);
    let cy = Math.floor(ch.y / CONFIG.cellSize);
    
    if (!state.grid[cy] || !state.grid[cy][cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
    const size = 48;
    const yOffset = -5;
    const goldSize = 30;
    const artSize = 34;
    const potionSize = 30;
    const mimicSize = 54;
    
    if (!ch.opened) {
      const imageKey = CHEST_IMAGES.closed;
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imageKey);
      
      if (cacheKey && isImageLoaded(cacheKey)) {
        const img = getImage(cacheKey);
        if (img) {
          ctx.save();
          ctx.drawImage(img, ch.x - size/2, ch.y - size/2 + yOffset, size, size);
          ctx.restore();
          continue;
        }
      }
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(EMOJIS.items.chestClosed, ch.x, ch.y);
      
    } else {
      const openImageKey = CHEST_IMAGES.open;
      const openCacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === openImageKey);
      
      if (openCacheKey && isImageLoaded(openCacheKey)) {
        const img = getImage(openCacheKey);
        if (img) {
          ctx.save();
          ctx.drawImage(img, ch.x - size/2, ch.y - size/2 + yOffset, size, size);
          ctx.restore();
        }
      }
      
      if (ch.type === 'gold') {
        if (ch.goldImageKey && isImageLoaded(ch.goldImageKey)) {
          const img = getImage(ch.goldImageKey);
          if (img) {
            ctx.save();
            ctx.drawImage(img, ch.x - goldSize/2, ch.y - goldSize/2 - 8, goldSize, goldSize);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.chestGold, ch.x, ch.y - 10);
        }
        
      } else if (ch.type === 'artifact') {
        if (ch.artifactImageKey && isImageLoaded(ch.artifactImageKey)) {
          const img = getImage(ch.artifactImageKey);
          if (img) {
            ctx.save();
            ctx.drawImage(img, ch.x - artSize/2, ch.y - artSize/2 - 8, artSize, artSize);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.chestArtifact, ch.x, ch.y - 10);
        }
        
      } else if (ch.type === 'potion_chest') {
        if (ch.potionImageKey && isImageLoaded(ch.potionImageKey)) {
          const img = getImage(ch.potionImageKey);
          if (img) {
            ctx.save();
            ctx.drawImage(img, ch.x - potionSize/2, ch.y - potionSize/2 - 8, potionSize, potionSize);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.potion, ch.x, ch.y - 10);
        }
        
      } else if (ch.type === 'mimic') {
        const mimicImageKey = CHEST_IMAGES.mimic;
        const mimicCacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === mimicImageKey);
        
        if (mimicCacheKey && isImageLoaded(mimicCacheKey)) {
          const img = getImage(mimicCacheKey);
          if (img) {
            ctx.save();
            ctx.drawImage(img, ch.x - mimicSize/2, ch.y - mimicSize/2 + yOffset, mimicSize, mimicSize);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '42px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.chestMimic, ch.x, ch.y);
        }
        
      } else if (ch.type === 'empty') {
        const emptyImageKey = CHEST_IMAGES.empty;
        const emptyCacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === emptyImageKey);
        
        if (emptyCacheKey && isImageLoaded(emptyCacheKey)) {
          const img = getImage(emptyCacheKey);
          if (img) {
            const size = 48;
            ctx.save();
            ctx.drawImage(img, ch.x - size/2, ch.y - size/2 + yOffset, size, size);
            ctx.restore();
          }
        }
      }
    }
  }
}

/**
 * Отрисовка мух над сундуками-мимиками
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawFlies(ctx) {
  if (!state.flies || state.flies.length === 0) return;
  
  for (let fly of state.flies) {
    fly.flickerPhase = (fly.flickerPhase || 0) + 0.1;
    const flicker = 0.7 + Math.sin(fly.flickerPhase) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = 0.7 * flicker;
    ctx.shadowBlur = 2;
    ctx.shadowColor = COLORS.shadows.strong;
    
    ctx.font = `${12 + fly.size * 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#222222';
    ctx.fillText('•', fly.x, fly.y);
    
    ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * flicker})`;
    ctx.font = `${8 + fly.size * 3}px Arial`;
    ctx.fillText('⚬', fly.x - 5, fly.y - 3);
    ctx.fillText('⚬', fly.x + 5, fly.y - 3);
    
    ctx.restore();
  }
}