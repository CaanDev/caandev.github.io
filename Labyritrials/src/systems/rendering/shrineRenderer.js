/**
 * @fileoverview Рендерер алтарей (святилищ).
 * Отрисовывает алтари в зависимости от их состояния (активирован/не активирован).
 * 
 * @module systems/rendering/shrineRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { SPRITE_SIZES, getCellBasedSize } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getSpriteWithSize } from '../../sprites/index.js';

/**
 * Получение имени спрайта алтаря для биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @param {boolean} activated - Активирован ли алтарь
 * @returns {string} - Имя спрайта
 */
function getAltarSpriteName(biome, activated) {
  const biomeMap = {
    cave: activated ? 'altarCaveActivated' : 'altarCaveActive',
    ice: activated ? 'altarIceActivated' : 'altarIceActive',
    sand: activated ? 'altarSandActivated' : 'altarSandActive',
  };
  return biomeMap[biome] || biomeMap.cave;
}

/**
 * Получение цвета свечения алтаря в зависимости от биома
 * 
 * @param {string} biome - ID биома ('cave', 'ice', 'sand')
 * @returns {string} - RGBA-цвет свечения
 */
function getAltarGlowColor(biome) {  
  const glowMap = {
    cave: 'rgba(52, 152, 219, 0.6)',
    ice: 'rgba(255, 255, 255, 0.5)',
    sand: 'rgba(155, 89, 182, 0.6)',
  };
  return glowMap[biome] || glowMap.cave;
}

/**
 * Получение интенсивности свечения для биома
 * 
 * @param {string} biome - ID биома
 * @returns {number} - Интенсивность свечения (shadowBlur)
 */
function getAltarGlowIntensity(biome) {
  const intensityMap = {
    cave: 50,
    ice: 60,
    sand: 50,
  };
  return intensityMap[biome] || 50;
}

/**
 * Отрисовка всех алтарей
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawShrines(ctx) {
  if (!state.shrines) return;
  
  // Определение биома для алтарей
  let biome = state.currentBiome || 'cave';
  if (state.inShrineRoom) biome = state.currentBiome || 'cave';
  
  const cellSize = CONFIG.cellSize;
  const spriteSize = getCellBasedSize('altar', cellSize);
  
  for (let sh of state.shrines) {
    let sx = Math.floor(sh.x / cellSize);
    let sy = Math.floor(sh.y / cellSize);
    
    // Проверка видимости клетки
    if (!state.grid[sy] || !state.grid[sy][sx]) continue;
    if (!state.grid[sy][sx].revealed && !player.hasMap) continue;
    
    // Получение спрайта алтаря
    const spriteName = getAltarSpriteName(biome, sh.activated);
    const sprite = getSpriteWithSize(spriteName, spriteSize);
    
    ctx.save();
    
    if (sprite) {
      // Свечение для неактивированного алтаря
      if (!sh.activated) {
        const glowColor = getAltarGlowColor(biome);
        const glowIntensity = getAltarGlowIntensity(biome);
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = glowColor;
      }
      
      const offsetX = (cellSize - sprite.drawW) / 2;
      const offsetY = (cellSize - sprite.drawH) / 2 + 4;
      const dx = sh.x - cellSize/2 + offsetX;
      const dy = sh.y - cellSize/2 + offsetY;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        dx, dy,
        sprite.drawW, sprite.drawH
      );
    } else {
      // Fallback: Эмодзи
      // Свечение для неактивированного алтаря
      if (!sh.activated) {
        const glowColor = getAltarGlowColor(biome);
        const glowIntensity = getAltarGlowIntensity(biome);
        ctx.shadowBlur = glowIntensity - 5;
        ctx.shadowColor = glowColor;
      }
      
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = '46px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sh.activated ? EMOJIS.shrines.active : EMOJIS.shrines.inactive, sh.x, sh.y);
    }
    
    ctx.restore();
  }
}