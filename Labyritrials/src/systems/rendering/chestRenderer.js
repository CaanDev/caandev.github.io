/**
 * @fileoverview Рендерер сундуков и мух.
 * Отрисовывает сундуки разных типов и мух над мимиками.
 * 
 * @module systems/rendering/chestRenderer
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getSpriteWithSize, getRandomSprite } from '../../sprites/index.js';
import { roundedRect } from './ui/utils.js';

/**
 * Получение имени спрайта сундука
 * 
 * @param {string} biome - Биом ('cave', 'ice', 'sand', 'treasure', 'safe', 'trap')
 * @param {string} state - Состояние сундука ('closed', 'open', 'empty', 'mimic')
 * @param {number} variant - Вариант (для Ice — 1 или 2)
 * @returns {string} - Имя спрайта
 */
function getChestSpriteName(biome, state, variant = 1) {
  const biomeMap = {
    cave: {
      closed: 'chestCaveClosed1',
      open: 'chestCaveOpen1',
      empty: 'chestCaveEmpty1',
      mimic: 'chestCaveMimic1',
    },
    ice: {
      closed: variant === 1 ? 'chestIceClosed1' : 'chestIceClosed2',
      open: variant === 1 ? 'chestIceOpen1' : 'chestIceOpen2',
      empty: variant === 1 ? 'chestIceEmpty1' : 'chestIceEmpty2',
      mimic: variant === 1 ? 'chestIceMimic1' : 'chestIceMimic2',
    },
    sand: {
      closed: 'chestSandClosed1',
      open: 'chestSandOpen1',
      empty: 'chestSandEmpty1',
      mimic: 'chestSandMimic1',
    },
    treasure: {
      closed: 'treasureChestClosed',
      open: 'treasureChestOpen',
      empty: 'treasureChestEmpty',
      mimic: 'treasureChestMimic',
    },
    safe: {
      closed: 'safeChestClosed',
      open: 'safeChestOpen',
      empty: null,
      mimic: null,
    },
    trap: {
      closed: 'trapChestClosed',
      open: 'trapChestOpen',
      empty: null,
      mimic: null,
    },
  };
  
  const biomeData = biomeMap[biome] || biomeMap.cave;
  return biomeData[state] || null;
}

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

  const cellSize = CONFIG.cellSize;
  const spriteSize = cellSize * SPRITE_SIZES.cells.chest;
  
  for (let ch of state.chests) {
    let cx = Math.floor(ch.x / cellSize);
    let cy = Math.floor(ch.y / cellSize);
    
    if (!state.grid[cy] || !state.grid[cy][cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;
    
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

    // Определение состояния сундука
    let chestState;
    if (!ch.opened) chestState = 'closed';
    else chestState = ch.type === 'empty' ? 'empty' : 'open';
    
    // Получение спрайта
    const variant = ch.variant || 1;
    const spriteName = getChestSpriteName(chestBiome, chestState, variant);
    const sprite = spriteName ? getSpriteWithSize(spriteName, spriteSize) : null;

    if (sprite) {
      const offsetX = (cellSize - sprite.drawW) / 2;
      const offsetY = (cellSize - sprite.drawH) / 2 + 4;
      const dx = ch.x - cellSize/2 + offsetX;
      const dy = ch.y - cellSize/2 + offsetY;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        dx, dy,
        sprite.drawW, sprite.drawH
      );
      
      // Дополнительная отрисовка содержимого для открытых сундуков
      if (ch.opened && ch.type !== 'empty' && ch.type !== 'mimic') drawChestContent(ctx, ch);
    } else {
      // Fallback: эмодзи
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (ch.opened && ch.type !== 'empty') {
        if (ch.type === 'gold') ctx.fillText(EMOJIS.items.chestGold, ch.x, ch.y);
        else if (ch.type === 'artifact') ctx.fillText(EMOJIS.items.chestArtifact, ch.x, ch.y);
        else if (ch.type === 'potion_chest') ctx.fillText(EMOJIS.items.potion, ch.x, ch.y);
      } else {
        ctx.fillText(EMOJIS.items.chestClosed, ch.x, ch.y);
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
  
  const cellSize = CONFIG.cellSize;
  const closedSize = cellSize * SPRITE_SIZES.cells.chest;
  const openSize = cellSize * SPRITE_SIZES.cells.mimic;
  
  for (let mimic of state.mimics) {
    // Пропуск мёртвых мимиков
    if (mimic.isDead) continue;
    
    const cx = Math.floor(mimic.x / cellSize);
    const cy = Math.floor(mimic.y / cellSize);
    
    if (!state.grid[cy]?.[cx]) continue;
    if (!state.grid[cy][cx].revealed && !player.hasMap) continue;

    const isOpen = mimic.opened || mimic.hpBarVisible;
    const spriteSize = isOpen ? openSize : closedSize;
    const mimicState = isOpen ? 'mimic' : 'closed';
    const variant = mimic.variant || 1;
    const spriteName = getChestSpriteName(chestBiome, mimicState, variant);
    const sprite = spriteName ? getSpriteWithSize(spriteName, spriteSize) : null;
    
    ctx.save();
    
    if (sprite) {
      const offsetX = (cellSize - sprite.drawW) / 2;
      const offsetY = (cellSize - sprite.drawH) / 2 + 4;
      const dx = mimic.x - cellSize/2 + offsetX;
      const dy = mimic.y - cellSize/2 + offsetY;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        dx, dy,
        sprite.drawW, sprite.drawH
      );
      
      // Полоска HP
      if (isOpen && mimic.hp < mimic.maxHp) drawMimicHealthBar(ctx, mimic);
    } else {
      // Fallback: эмодзи
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = isOpen ? '36px Arial' : '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (isOpen) ctx.fillText('😈', mimic.x, mimic.y);
      else ctx.fillText(EMOJIS.items.chestClosed, mimic.x, mimic.y);
      
      // Полоска HP
      if (isOpen && mimic.hp < mimic.maxHp) drawMimicHealthBar(ctx, mimic);
    }
    
    ctx.restore();
  }
}

/**
 * Отрисовка содержимого открытого сундука
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function drawChestContent(ctx, ch) {
  const size = SPRITE_SIZES.loot.chestContent || 25;
  const yOffset = -6;
  
  // Определение биома для содержимого
  let biome = state.currentBiome || 'cave';
  if (state.inSafeRoom) biome = 'safe';
  else if (state.inTreasureRoom) biome = 'treasure';
  else if (state.inTrapRoom) biome = 'trap';
  
  ctx.save();
  
  if (ch.type === 'gold') {
    let spriteName = ch.goldSpriteName;
    if (!spriteName) {
      const seed = (ch.x * 31 + ch.y * 17) % 1000;
      const goldBiome = ch.goldBiome || biome || 'cave';
      spriteName = getRandomSprite('gold', goldBiome, seed) || 'goldCave1';
    }
    const goldSprite = spriteName ? getSpriteWithSize(spriteName, size) : null;

    if (goldSprite) {
      const offsetX = (size - goldSprite.drawW) / 2;
      const offsetY = (size - goldSprite.drawH) / 2;
      
      ctx.drawImage(
        goldSprite.texture,
        goldSprite.sx, goldSprite.sy,
        goldSprite.sw, goldSprite.sh,
        ch.x - size/2 + offsetX,
        ch.y - size/2 + offsetY + yOffset,
        goldSprite.drawW, goldSprite.drawH
      );
      ctx.restore();
      return;
    }

    // Fallback: эмодзи
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.chestGold, ch.x, ch.y - 10);
    ctx.restore();
    return;
  }

  if (ch.type === 'artifact') {
    let spriteName = ch.artifactSpriteName;
    if (!spriteName) {
      const seed = (ch.x * 31 + ch.y * 17) % 1000;
      const artifactBiome = ch.artifactBiome || biome || 'cave';
      spriteName = getRandomSprite('artifact', artifactBiome, seed) || 'artifactCave1';
    }
    const artifactSprite = spriteName ? getSpriteWithSize(spriteName, size) : null;
    
    if (artifactSprite) {
      const offsetX = (size - artifactSprite.drawW) / 2;
      const offsetY = (size - artifactSprite.drawH) / 2;
      
      ctx.drawImage(
        artifactSprite.texture,
        artifactSprite.sx, artifactSprite.sy,
        artifactSprite.sw, artifactSprite.sh,
        ch.x - size/2 + offsetX,
        ch.y - size/2 + offsetY + yOffset,
        artifactSprite.drawW, artifactSprite.drawH
      );
      ctx.restore();
      return;
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.chestArtifact, ch.x, ch.y - 10);
    ctx.restore();
    return;
  }

  if (ch.type === 'potion_chest') {
    let spriteName = ch.potionSpriteName;
    if (!spriteName) {
      const seed = (ch.x * 31 + ch.y * 17) % 1000;
      const potionBiome = ch.potionBiome || biome || 'cave';
      spriteName = getRandomSprite('potion', potionBiome, seed) || 'potionCave1';
    }
    const potionSprite = spriteName ? getSpriteWithSize(spriteName, size) : null;
    
    if (potionSprite) {
      const offsetX = (size - potionSprite.drawW) / 2;
      const offsetY = (size - potionSprite.drawH) / 2;
      
      ctx.drawImage(
        potionSprite.texture,
        potionSprite.sx, potionSprite.sy,
        potionSprite.sw, potionSprite.sh,
        ch.x - size/2 + offsetX,
        ch.y - size/2 + offsetY + yOffset,
        potionSprite.drawW, potionSprite.drawH
      );
      ctx.restore();
      return;
    }
    
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJIS.items.potion, ch.x, ch.y - 10);
    ctx.restore();
    return;
  }
  
  ctx.restore();
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
  const radius = barHeight / 2;
  
  // Фон полоски
  ctx.fillStyle = COLORS.monsters.healthBar.bg;
  roundedRect(ctx, barX, barY, barWidth, barHeight, radius);
  ctx.fill();
  
  // Заполнение
  if (hpPercent > 0) {
    ctx.fillStyle = COLORS.monsters.healthBar.fill;
    roundedRect(ctx, barX, barY, barWidth * hpPercent, barHeight, radius);
    ctx.fill();
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
    
    // Использование цветов из объекта мухи
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