/**
 * @fileoverview Рендерер факелов и их частиц.
 * Отрисовывает активные факелы с анимацией мерцания и создаёт частицы огня.
 * 
 * @module systems/rendering/torchRenderer
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getSpriteWithSize } from '../../sprites/index.js';
import { getDistanceVisibility } from '../fog/index.js';

const torchWidth = SPRITE_SIZES.objects.torch;

/**
 * Определение типа факела на основе текущего состояния игры
 * 
 * @returns {string} - Тип факела
 */
function getTorchType() {
  // Комнаты
  if (state.inSafeRoom) return 'safe';
  if (state.inShrineRoom) return 'shrine';
  if (state.inTrapRoom) return 'trap';
  if (state.inTreasureRoom) return 'treasure';
  
  // Босс-арены
  if (state.isBossLevel) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    if (bossLevel === 5) return 'boss5';
    if (bossLevel === 10) return 'boss10';
    if (bossLevel === 15) return 'boss15';
  }
  
  // Биомы (по уровням)
  const level = state.gameLevel;
  if (level >= 1 && level <= 4) return 'cave';
  if (level >= 6 && level <= 9) return 'ice';
  if (level >= 11 && level <= 14) return 'sand';
  
  return 'cave';
}

/**
 * Получение имени спрайта факела по типу и уровню
 * 
 * @param {string} torchType - Тип факела
 * @param {number} level - Уровень игры (для биомов)
 * @returns {string|null} - Имя спрайта или null
 */
function getTorchSpriteName(torchType, level) {
  // Биомы
  if (torchType === 'cave') {
    const lvl = Math.min(Math.max(level, 1), 4);
    return `torchCaveLvl${lvl}`;
  }
  
  if (torchType === 'ice') {
    const lvl = Math.min(Math.max(level, 6), 9);
    return `torchIceLvl${lvl}`;
  }
  
  if (torchType === 'sand') {
    const lvl = Math.min(Math.max(level, 11), 14);
    return `torchSandLvl${lvl}`;
  }
  
  // Комнаты
  if (torchType === 'safe') return 'safeTorch';
  if (torchType === 'shrine') return 'shrineTorch';
  if (torchType === 'trap') return 'trapTorch';
  if (torchType === 'treasure') return 'treasureTorch';
  
  // Босс-арены
  if (torchType === 'boss5') return 'bossTorch5';
  if (torchType === 'boss10') return 'bossTorch10';
  if (torchType === 'boss15') return 'bossTorch15';
  
  // Fallback
  return 'safeTorch';
}

/**
 * Преобразование HEX-цвета в строку RGB
 * 
 * @param {string} hex - Цвет в HEX-формате (#RRGGBB)
 * @returns {string} - Строка RGB (r, g, b)
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 136, 0';
}

/**
 * Отрисовка всех активных факелов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTorches(ctx) {
  if (!state.torches) return;

  const torchType = getTorchType();
  const level = state.gameLevel;
  
  const isSpecialRoom = state.inSafeRoom || state.inShrineRoom || state.inTreasureRoom;
  const isTrapRoom = state.inTrapRoom;
  const isBossLevel = state.isBossLevel;
  const useIceGlow = !isSpecialRoom && !isTrapRoom && !isBossLevel && state.gameLevel >= 6 && state.gameLevel <= 9;
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    if (!state.grid[torch.y] || !state.grid[torch.y][torch.x]) continue;
    if (!state.grid[torch.y][torch.x].revealed && !player.hasMap) continue;
    
    const torchX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    
    let visibility = 1.0;
    if (!state.inSafeRoom) {
      visibility = getDistanceVisibility(torchX, torchY);
      if (visibility <= 0.05) continue;
    }
    
    if (torch.appearTimer === undefined) torch.appearTimer = 0;
    if (torch.appearTimer < 1) torch.appearTimer = Math.min(1, torch.appearTimer + 0.05);
    
    const appearProgress = torch.appearTimer;
    torch.flickerPhase = (torch.flickerPhase || 0) + CONFIG.torchFlickerSpeed;
    const flicker = 0.8 + Math.sin(torch.flickerPhase * 2) * 0.25;
    
    // Выбор цветов
    let flameColor, glowColor, particleColor;
    
    if (useIceGlow) {
      flameColor = '#66ccff';
      glowColor = '#4488ff';
      particleColor = '#66ccff';
    } else if (isSpecialRoom && state.inSafeRoom) {
      flameColor = '#ffaa66';
      glowColor = '#ff8844';
      particleColor = '#ffaa66';
    } else if (isSpecialRoom && state.inShrineRoom) {
      flameColor = '#bb88ff';
      glowColor = '#9966dd';
      particleColor = '#bb88ff';
    } else if (isSpecialRoom && state.inTreasureRoom) {
      flameColor = '#ffdd44';
      glowColor = '#ffaa00';
      particleColor = '#ffdd44';
    } else if (isTrapRoom) {
      if (state.trapActivated && !state.trapExitRevealed) {
        flameColor = '#ff4444';
        glowColor = '#cc2222';
        particleColor = '#ff4444';
      } else {
        flameColor = torch.flameColor || COLORS.torches.flame;
        glowColor = torch.glowColor || COLORS.torches.glow;
        particleColor = torch.particleColor || COLORS.torches.particle;
      }
    } else if (isBossLevel) {
      const bossLevel = Math.floor(state.gameLevel / 5) * 5;
      if (bossLevel === 5) {
        flameColor = '#ff6633';
        glowColor = '#ff4400';
        particleColor = '#ff6633';
      } else if (bossLevel === 10) {
        flameColor = '#66ccff';
        glowColor = '#4488ff';
        particleColor = '#66ccff';
      } else if (bossLevel === 15) {
        flameColor = '#ffdd44';
        glowColor = '#ffaa00';
        particleColor = '#ffdd44';
      } else {
        flameColor = torch.flameColor || COLORS.torches.flame;
        glowColor = torch.glowColor || COLORS.torches.glow;
        particleColor = torch.particleColor || COLORS.torches.particle;
      }
    } else {
      flameColor = torch.flameColor || COLORS.torches.flame;
      glowColor = torch.glowColor || COLORS.torches.glow;
      particleColor = torch.particleColor || COLORS.torches.particle;
    }
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, visibility * 0.8 + 0.1);
    
    // Свет от факела
    const glowRadius = 140;
    const gradient = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, glowRadius);
    gradient.addColorStop(0, `rgba(${hexToRgb(flameColor)}, ${0.35 * flicker * visibility})`);
    gradient.addColorStop(0.15, `rgba(${hexToRgb(flameColor)}, ${0.25 * flicker * visibility})`);
    gradient.addColorStop(0.35, `rgba(${hexToRgb(flameColor)}, ${0.15 * flicker * visibility})`);
    gradient.addColorStop(0.6, `rgba(${hexToRgb(glowColor)}, ${0.08 * flicker * visibility})`);
    gradient.addColorStop(0.8, `rgba(${hexToRgb(glowColor)}, ${0.03 * flicker * visibility})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(glowColor)}, 0)`);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(torchX, torchY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Внешнее свечение
    const outerGlowRadius = glowRadius * 1.8;
    const outerGradient = ctx.createRadialGradient(torchX, torchY, glowRadius * 0.3, torchX, torchY, outerGlowRadius);
    outerGradient.addColorStop(0, `rgba(${hexToRgb(glowColor)}, ${0.04 * flicker * visibility})`);
    outerGradient.addColorStop(0.4, `rgba(${hexToRgb(glowColor)}, ${0.02 * flicker * visibility})`);
    outerGradient.addColorStop(0.7, `rgba(${hexToRgb(glowColor)}, ${0.01 * flicker * visibility})`);
    outerGradient.addColorStop(1, `rgba(${hexToRgb(glowColor)}, 0)`);

    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(torchX, torchY, outerGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    
    // Отрисовка спрайта факела
    const spriteName = getTorchSpriteName(torchType, level);
    const sprite = spriteName ? getSpriteWithSize(spriteName, torchWidth) : null;
    
    if (sprite) {
      ctx.save();
      ctx.shadowBlur = 15 * appearProgress * visibility;
      ctx.shadowColor = flameColor;
      ctx.globalAlpha = 0.85 * appearProgress * visibility;
      
      ctx.drawImage(
        sprite.texture,
        sprite.sx, sprite.sy,
        sprite.sw, sprite.sh,
        torchX - torchWidth/2 + sprite.offsetX,
        torchY - torchWidth/2 + sprite.offsetY,
        sprite.drawW, sprite.drawH
      );
      ctx.restore();
    } else {
      // Fallback: эмодзи
      ctx.save();
      ctx.shadowBlur = 15 * appearProgress * visibility;
      ctx.shadowColor = flameColor;
      ctx.globalAlpha = 0.7 * appearProgress * visibility;
      ctx.fillStyle = flameColor;
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let emoji = torch.emoji || EMOJIS.torches.normal;
      if (isSpecialRoom && state.inSafeRoom) emoji = '🏠';
      else if (isSpecialRoom && state.inShrineRoom) emoji = '🔮';
      else if (isSpecialRoom && state.inTreasureRoom) emoji = '💰';
      else if (isTrapRoom) {
        if (state.trapActivated && !state.trapExitRevealed) emoji = '⚠️';
        else emoji = '🕯️';
      } else if (isBossLevel) {
        const bossLevel = Math.floor(state.gameLevel / 5) * 5;
        if (bossLevel === 5) emoji = '👹';
        else if (bossLevel === 10) emoji = '🧠';
        else if (bossLevel === 15) emoji = '🗿';
      }
      ctx.fillText(emoji, torchX, torchY);
      ctx.restore();
    }
    
    ctx.restore();
  }
}

/**
 * Обновление и отрисовка частиц огня от факелов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @returns {void}
 */
export function updateTorchParticles(ctx, camX, camY) {
  if (!state.torches) return;
  if (!state.fireParticles) state.fireParticles = [];
  
  const maxFireParticles = CONFIG.maxParticles.fire || 50;
  
  // Ограничение количества частиц
  if (state.fireParticles.length >= maxFireParticles) {
    const removeCount = Math.floor(state.fireParticles.length * 0.2);
    state.fireParticles.splice(0, removeCount);
  }
  
  const isMindBossArena = state.isBossLevel && (state.gameLevel === 10);
  
  // Создание новых частиц
  for (let torch of state.torches) {
    if (!torch.active) continue;
    if (!state.grid[torch.y] || !state.grid[torch.y][torch.x]) continue;
    if (!state.grid[torch.y][torch.x].revealed && !player.hasMap) continue;
    
    const torchX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    
    const visibility = getDistanceVisibility(torchX, torchY);
    if (visibility <= 0.1) continue;
    
    // Особый цвет для арены Разума
    let particleColor = torch.particleColor || COLORS.torches.particle;
    if (isMindBossArena) particleColor = COLORS.torches.particleMind;
    
    if (state.fireParticles.length < maxFireParticles && Math.random() < 0.08 * visibility) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      state.fireParticles.push({
        x: torchX + offsetX,
        y: torchY + offsetY,
        life: 60,
        maxLife: 60,
        size: 1.5 + Math.random() * 3,
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.05 + Math.random() * 0.07,
        visibility: visibility,
        color: particleColor
      });
    }
  }
  
  // Обновление и отрисовка частиц
  for (let i = state.fireParticles.length - 1; i >= 0; i--) {
    const p = state.fireParticles[i];
    
    p.life--;
    
    if (p.life <= 0) {
      state.fireParticles.splice(i, 1);
      continue;
    }
    
    const lifeProgress = p.life / p.maxLife;
    const baseOpacity = lifeProgress * 0.35 * (p.visibility || 1);
    
    p.flickerPhase = (p.flickerPhase || 0) + (p.flickerSpeed || 0.06);
    const flicker = 0.5 + Math.sin(p.flickerPhase) * 0.5;
    const opacity = baseOpacity * (0.5 + flicker * 0.5);
    
    if (opacity <= 0.02) continue;
    
    const color = p.color || COLORS.torches.particle;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 3 * lifeProgress;
    ctx.shadowColor = color;
    
    const brightness = 0.6 + lifeProgress * 0.4;
    ctx.fillStyle = `rgba(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)}, 0.8)`;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.6 + lifeProgress * 0.4), 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}