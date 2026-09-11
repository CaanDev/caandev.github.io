/**
 * @fileoverview Рендерер предметов на полу.
 * Отрисовывает золото, зелья, артефакты и другие предметы.
 * 
 * @module systems/rendering/lootRenderer
 */

import { CONFIG, SPRITE_SIZES, state, player, getLootSize } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getSpriteWithSize, getRandomSprite } from '../../sprites/index.js';

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
    
    // Определение биома для золота
    let goldBiome = state.currentBiome || 'cave';
    if (state.inTreasureRoom) goldBiome = 'treasure';
    
    // Получение спрайта золота
    let spriteName = item.goldSpriteName;
    if (!spriteName) {
      const seed = (item.x * 31 + item.y * 17) % 1000;
      spriteName = getRandomSprite('gold', goldBiome, seed) || 'goldCave1';
    }
    const size = getLootSize('gold');
    const sprite = spriteName ? getSpriteWithSize(spriteName, size) : null;
    
    if (sprite) {
      const offsetX = (size - sprite.drawW) / 2;
      const offsetY = (size - sprite.drawH) / 2;
      
      ctx.save();
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        item.x - size/2 + offsetX,
        item.y - size/2 + offsetY,
        sprite.drawW, sprite.drawH
      );
      ctx.restore();
      continue;
    }
    
    // Fallback: эмодзи
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
    
    // Определение биома для зелья
    let potionBiome = state.currentBiome || 'cave';
    if (state.inTreasureRoom) potionBiome = 'treasure';
    
    // Получение спрайта зелья
    let spriteName = item.potionSpriteName;
    if (!spriteName) {
      const seed = (item.x * 31 + item.y * 17) % 1000;
      spriteName = getRandomSprite('potion', potionBiome, seed) || 'potionCave1';
    }
    const size = getLootSize('potion');
    const sprite = spriteName ? getSpriteWithSize(spriteName, size) : null;
    
    if (sprite) {
      const offsetX = (size - sprite.drawW) / 2;
      const offsetY = (size - sprite.drawH) / 2;
      
      ctx.save();
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        item.x - size/2 + offsetX,
        item.y - size/2 + offsetY,
        sprite.drawW, sprite.drawH
      );
      ctx.restore();
      continue;
    }
    
    // Fallback: эмодзи
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
    
    // Определение биома для артефакта
    let artifactBiome = state.currentBiome || 'cave';
    if (state.inTreasureRoom) artifactBiome = 'treasure';
    
    // Получение спрайта артефакта
    let spriteName = art.artifactSpriteName;
    if (!spriteName) {
      const seed = (art.x * 31 + art.y * 17) % 1000;
      spriteName = getRandomSprite('artifact', artifactBiome, seed) || 'artifactCave1';
    }
    const size = getLootSize('artifact');
    const sprite = spriteName ? getSpriteWithSize(spriteName, size) : null;
    
    if (sprite) {
      const offsetX = (size - sprite.drawW) / 2;
      const offsetY = (size - sprite.drawH) / 2;
      
      ctx.save();
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        art.x - size/2 + offsetX,
        art.y - size/2 + offsetY,
        sprite.drawW, sprite.drawH
      );
      ctx.restore();
      continue;
    }
    
    // Fallback: эмодзи
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
    
    // Попытка загрузить спрайт талисмана
    const sprite = getSpriteWithSize('invTalismanMimicHunter', 40);
    
    if (sprite) {
      ctx.save();
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        item.x - 20,
        item.y - 20,
        sprite.drawW, sprite.drawH
      );
      ctx.restore();
      return;
    }
    
    // Fallback: эмодзи
    ctx.save();
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(155, 89, 182, 0.3)';
    ctx.fillText('🗡️', item.x, item.y);
    ctx.restore();
  }
}