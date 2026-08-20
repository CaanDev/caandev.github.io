/**
 * @fileoverview Рендерер сундуков и мух.
 * Отрисовывает сундуки разных типов и мух над мимиками.
 * 
 * @module systems/rendering/chestRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { 
  ITEM_IMAGES, 
  getChestImage,
  getChestBiome
} from '../../images/itemImages.js';

/**
 * Отрисовка всех сундуков и мимиков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawChests(ctx) {
  // Обычные сундуки
  if (state.chests) drawNormalChests(ctx);
  // Мимики
  if (state.mimics) drawMimics(ctx);
}

/**
 * Отрисовка обычных сундуков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawNormalChests(ctx) {
  let chestBiome = state.currentBiome || 'cave';
  if (state.inSafeRoom) chestBiome = 'safe';
  else if (state.inTreasureRoom) chestBiome = 'treasure';
  else if (state.inTrapRoom) chestBiome = 'trap';
  
  for (let ch of state.chests) {
    let cx = Math.floor(ch.x / CONFIG.cellSize);
    let cy = Math.floor(ch.y / CONFIG.cellSize);
    
    if (!state.grid[cy] || !state.grid[cy][cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
    const size = 64;
    const yOffset = -5;
    const itemSize = 38;
    const mimicSize = 70;
    
    // Анимация исчезновения
    if (ch.fadeTimer === undefined || ch.fadeComplete === undefined || ch.fadeDelay === undefined) {
      ch.fadeTimer = 0;
      ch.fadeComplete = false;
      ch.fadeDelay = 0;
    }

    if (ch.opened && ch.type !== 'mimic' && !ch.fadeComplete) {
      if (ch.fadeDelay < 30) {
        ch.fadeDelay++;
      } else {
        ch.fadeTimer += 0.012;
        
        if (ch.fadeTimer >= 1) {
          ch.fadeComplete = true;
          setTimeout(() => {
            const index = state.chests.indexOf(ch);
            if (index !== -1) state.chests.splice(index, 1);
          }, 150);
        }
      }
    }

    if (ch.opened && ch.type !== 'mimic' && ch.fadeComplete) continue;

    let alpha = 1;
    if (ch.opened && ch.type !== 'mimic' && ch.fadeTimer !== undefined && ch.fadeTimer < 1) {
      const progress = ch.fadeTimer;
      alpha = 1 - Math.pow(progress, 1.8);
      alpha = Math.max(0, alpha);
    }
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (!ch.opened) {
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
      
      if (ch.type === 'gold') {
        if (ch.goldImageKey && isImageLoaded(ch.goldImageKey)) {
          const img = getImage(ch.goldImageKey);
          if (img) ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
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
          if (img) ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
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
          if (img) ctx.drawImage(img, ch.x - itemSize/2, ch.y - itemSize/2 - 8, itemSize, itemSize);
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
 * Отрисовка мимиков
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawMimics(ctx) {
  let chestBiome = state.currentBiome || 'cave';
  if (state.inSafeRoom) chestBiome = 'safe';
  else if (state.inTreasureRoom) chestBiome = 'treasure';
  else if (state.inTrapRoom) chestBiome = 'trap';
  
  for (let mimic of state.mimics) {
    // Пропускаем мёртвых мимиков
    if (mimic.isDead) continue;
    
    const cx = Math.floor(mimic.x / CONFIG.cellSize);
    const cy = Math.floor(mimic.y / CONFIG.cellSize);
    
    if (!state.grid[cy]?.[cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
    const size = 64;
    const yOffset = -5;
    
    ctx.save();
    
    // Выбираем изображение в зависимости от состояния
    let imageType = mimic.opened ? 'mimic' : 'closed';
    
    const imagePath = getChestImage(imageType, chestBiome);
    const cacheKey = Object.keys(ITEM_IMAGES).find(key => ITEM_IMAGES[key] === imagePath);
    
    if (cacheKey && isImageLoaded(cacheKey)) {
      const img = getImage(cacheKey);
      if (img) {
        ctx.drawImage(img, mimic.x - size/2, mimic.y - size/2 + yOffset, size, size);
        
        // Полоска HP
        if (mimic.hpBarVisible && mimic.hp < mimic.maxHp) drawMimicHealthBar(ctx, mimic);

        ctx.restore();
        continue;
      }
    }

    // FALLBACK: эмодзи
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Если открыт — показываем злую пасть, иначе закрытый сундук
    if (mimic.opened) {
      ctx.fillText('😈', mimic.x, mimic.y);
    } else {
      ctx.fillText(EMOJIS.items.chestClosed, mimic.x, mimic.y);
    }
    
    // Полоска HP (если видима)
    if (mimic.hpBarVisible && mimic.hp < mimic.maxHp) drawMimicHealthBar(ctx, mimic);
    ctx.restore();
  }
}

/**
 * Отрисовка полоски HP над мимиком
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} mimic - Объект мимика
 * @returns {void}
 * @private
 */
function drawMimicHealthBar(ctx, mimic) {
  const barWidth = 50;
  const barHeight = 6;
  const barX = mimic.x - barWidth / 2;
  const barY = mimic.y - 48;
  const hpPercent = Math.max(0, Math.min(1, mimic.hp / mimic.maxHp));
  
  // Фон полоски
  ctx.fillStyle = COLORS.monsters.healthBar.bg;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Заполнение
  ctx.fillStyle = COLORS.monsters.healthBar.fill;
  ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
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
    
    // Используем цвета из объекта мухи
    const bodyColor = fly.bodyColor || 'rgba(200, 200, 200, 0.8)';
    const glowColor = fly.glowColor || 'rgba(180, 180, 180, 0.6)';
    const wingColor = fly.wingColor || 'rgba(220, 220, 220, 0.4)';
    
    ctx.save();
    
    // Свечение
    ctx.shadowBlur = 8;
    ctx.shadowColor = glowColor;
    
    // Тело мухи (основная точка)
    ctx.globalAlpha = 0.7 * flicker;
    ctx.fillStyle = bodyColor;
    ctx.font = `${12 + fly.size * 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('•', fly.x, fly.y);
    
    // Крылья мухи (две маленькие точки)
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.4 * flicker;
    ctx.fillStyle = wingColor;
    ctx.font = `${8 + fly.size * 3}px Arial`;
    ctx.fillText('⚬', fly.x - 5, fly.y - 3);
    ctx.fillText('⚬', fly.x + 5, fly.y - 3);
    
    ctx.restore();
  }
}