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
  getRandomGoldImage,
  getChestImage,
  getChestBiome
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

  // ===== ЗЕЛЬЯ =====
  for (let item of state.lootItems) {
    if (item.type !== 'potion') continue;
    
    let ix = Math.floor(item.x / CONFIG.cellSize);
    let iy = Math.floor(item.y / CONFIG.cellSize);
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
  
  // ===== АРТЕФАКТЫ =====
  for (let art of state.artifacts) {
    let ax = Math.floor(art.x / CONFIG.cellSize);
    let ay = Math.floor(art.y / CONFIG.cellSize);
    
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
 * Отрисовка всех сундуков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawChests(ctx) {
  if (!state.chests) return;

  // Определяем биом для сундуков
  let chestBiome = state.currentBiome || 'cave';
  if (state.inSafeRoom) chestBiome = 'safe';
  else if (state.inTreasureRoom) chestBiome = 'treasure';
  
  for (let ch of state.chests) {
    let cx = Math.floor(ch.x / CONFIG.cellSize);
    let cy = Math.floor(ch.y / CONFIG.cellSize);
    
    if (!state.grid[cy] || !state.grid[cy][cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
    const size = 64;
    const yOffset = -5;
    const itemSize = 38;
    const mimicSize = 70;
    
    // ===== АНИМАЦИЯ ИСЧЕЗНОВЕНИЯ =====
    // Инициализируем таймер анимации, если его нет
    if (ch.fadeTimer === undefined || ch.fadeComplete === undefined || ch.fadeDelay === undefined) {
      ch.fadeTimer = 0;
      ch.fadeComplete = false;
      ch.fadeDelay = 0;
    }

    // Если сундук открыт и не мимик — запускаем анимацию исчезновения
    if (ch.opened && ch.type !== 'mimic' && !ch.fadeComplete) {
      // Сначала задержка (сундук остаётся видимым)
      if (ch.fadeDelay < 30) {
        ch.fadeDelay++;
      } else {
        ch.fadeTimer += 0.012;
        
        if (ch.fadeTimer >= 1) {
          ch.fadeComplete = true;
          setTimeout(() => {
            const index = state.chests.indexOf(ch);
            if (index !== -1) {
              state.chests.splice(index, 1);
            }
          }, 150);
        }
      }
    }

    // Если сундук должен быть скрыт — пропускаем отрисовку
    if (ch.opened && ch.type !== 'mimic' && ch.fadeComplete) {
      continue;
    }

    // Расчёт прозрачности для анимации исчезновения
    let alpha = 1;
    if (ch.opened && ch.type !== 'mimic' && ch.fadeTimer !== undefined && ch.fadeTimer < 1) {
      // Плавное затухание с лёгкой задержкой в начале
      const progress = ch.fadeTimer;
      alpha = 1 - Math.pow(progress, 1.8);
      alpha = Math.max(0, alpha);
    }
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (!ch.opened) {
      // Закрытый сундук
      const imagePath = getChestImage('closed', chestBiome);
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      
      if (cacheKey && isImageLoaded(cacheKey)) {
        const img = getImage(cacheKey);
        if (img) {
          ctx.drawImage(img, ch.x - size/2, ch.y - size/2 + yOffset, size, size);
          ctx.restore();
          continue;
        }
      }
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = '42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(EMOJIS.items.chestClosed, ch.x, ch.y);
      
    } else {
      // Открытый сундук — выбираем тип (open, empty, mimic)
      let imageType = 'open';
      if (ch.type === 'empty') imageType = 'empty';
      else if (ch.type === 'mimic') imageType = 'mimic';
      
      const imagePath = getChestImage(imageType, chestBiome);
      const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
      
      if (cacheKey && isImageLoaded(cacheKey)) {
        const img = getImage(cacheKey);
        if (img) {
          const imgSize = ch.type === 'mimic' ? mimicSize : size;
          ctx.drawImage(img, ch.x - imgSize/2, ch.y - imgSize/2 + yOffset, imgSize, imgSize);
        }
      }
      
      // Предметы внутри сундука (тоже с учётом прозрачности)
      if (ch.type === 'gold') {
        if (ch.goldImageKey && isImageLoaded(ch.goldImageKey)) {
          const img = getImage(ch.goldImageKey);
          if (img) {
            ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.chestGold, ch.x, ch.y - 10);
        }
        
      } else if (ch.type === 'artifact') {
        if (ch.artifactImageKey && isImageLoaded(ch.artifactImageKey)) {
          const img = getImage(ch.artifactImageKey);
          if (img) {
            ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.chestArtifact, ch.x, ch.y - 10);
        }
        
      } else if (ch.type === 'potion_chest') {
        if (ch.potionImageKey && isImageLoaded(ch.potionImageKey)) {
          const img = getImage(ch.potionImageKey);
          if (img) {
            ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
          }
        } else {
          ctx.fillStyle = COLORS.player.shadow;
          ctx.font = '28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOJIS.items.potion, ch.x, ch.y - 10);
        }
      }
    }
    
    ctx.restore();
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