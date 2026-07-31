/**
 * @fileoverview Рендерер факелов и их частиц.
 * Отрисовывает активные факелы с анимацией мерцания и создаёт частицы огня.
 * 
 * @module systems/rendering/torchRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { getRandomTorchImage, TORCH_IMAGES, OBJECT_IMAGES } from '../../images/objectImages.js';
import { getDistanceVisibility } from '../fog/index.js';

/**
 * Определение типа факела на основе текущего состояния игры
 * 
 * @returns {string} - Тип факела
 * @private
 */
function getTorchType() {
  // ===== КОМНАТЫ =====
  if (state.inSafeRoom) return 'safe';
  if (state.inShrineRoom) return 'shrine';
  if (state.inTrapRoom) return 'trap';
  if (state.inTreasureRoom) return 'treasure';
  
  // ===== БОСС-АРЕНЫ =====
  if (state.isBossLevel) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    if (bossLevel === 5) return 'boss5';
    if (bossLevel === 10) return 'boss10';
    if (bossLevel === 15) return 'boss15';
  }
  
  // ===== БИОМЫ (по уровням) =====
  const level = state.gameLevel;
  const biome = state.currentBiome || 'cave';
  
  // Босс-уровни уже обработаны выше
  if (level % 5 === 0) return 'boss' + level;
  
  // Возвращаем ID биома для уровней 1-4, 6-9, 11-14
  if (level >= 1 && level <= 4) return 'cave';
  if (level >= 6 && level <= 9) return 'ice';
  if (level >= 11 && level <= 14) return 'sand';
  
  return 'normal';
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
  
  // ===== ОПРЕДЕЛЯЕМ, НУЖНО ЛИ ИСПОЛЬЗОВАТЬ ЦВЕТ БИОМА =====
  const isSpecialRoom = state.inSafeRoom || state.inShrineRoom || state.inTreasureRoom;
  const isTrapRoom = state.inTrapRoom;
  const isBossLevel = state.isBossLevel;
  
  // Ледяной цвет ТОЛЬКО для обычных уровней 6-9 (не в комнатах и не на боссах)
  const useIceColor = !isSpecialRoom && !isTrapRoom && !isBossLevel && state.gameLevel >= 6 && state.gameLevel <= 9;
  
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
    
    // Анимация появления факела
    if (torch.appearTimer === undefined) torch.appearTimer = 0;
    if (torch.appearTimer < 1) {
      torch.appearTimer = Math.min(1, torch.appearTimer + 0.05);
    }
    
    const appearProgress = torch.appearTimer;
    torch.flickerPhase = (torch.flickerPhase || 0) + CONFIG.torchFlickerSpeed;
    const flicker = 0.8 + Math.sin(torch.flickerPhase * 2) * 0.25;
    
    // ===== ВЫБИРАЕМ ИЗОБРАЖЕНИЕ СЛУЧАЙНО =====
    if (!torch.imageKey) {
      const imagePath = getRandomTorchImage(torchType);
      const cacheKey = Object.keys(OBJECT_IMAGES).find(key => OBJECT_IMAGES[key] === imagePath);
      torch.imageKey = cacheKey;
      torch.imagePath = imagePath;
    }
    
    const cacheKey = torch.imageKey;
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, visibility * 0.8 + 0.1);
    
    // ===== ОПРЕДЕЛЯЕМ ЦВЕТА ДЛЯ ФАКЕЛА =====
    let flameColor, glowColor, particleColor;
    
    if (isSpecialRoom && state.inSafeRoom) {
      // 🏠 Безопасная комната — тёплый уютный свет
      flameColor = '#ffaa66';
      glowColor = '#ff8844';
      particleColor = '#ffaa66';
    } else if (isSpecialRoom && state.inShrineRoom) {
      // 🔮 Комната с алтарём — магический фиолетовый
      flameColor = '#bb88ff';
      glowColor = '#9966dd';
      particleColor = '#bb88ff';
    } else if (isSpecialRoom && state.inTreasureRoom) {
      // 💰 Сокровищница — золотистый
      flameColor = '#ffdd44';
      glowColor = '#ffaa00';
      particleColor = '#ffdd44';
    } else if (isTrapRoom) {
      // ===== КОМНАТА-ЛОВУШКА =====
      if (state.trapActivated && !state.trapExitRevealed) {
        // ⚠️ Активна — зловещий красный
        flameColor = '#ff4444';
        glowColor = '#cc2222';
        particleColor = '#ff4444';
      } else {
        // ✅ Не активна или пройдена — обычный тёплый свет
        flameColor = torch.flameColor || COLORS.torches.flame;
        glowColor = torch.glowColor || COLORS.torches.glow;
        particleColor = torch.particleColor || COLORS.torches.particle;
      }
    } else if (isBossLevel) {
      // 👹 Босс-арены — в зависимости от уровня
      const bossLevel = Math.floor(state.gameLevel / 5) * 5;
      if (bossLevel === 5) {
        // Демон — красный/оранжевый
        flameColor = '#ff6633';
        glowColor = '#ff4400';
        particleColor = '#ff6633';
      } else if (bossLevel === 10) {
        // Разум — магический синий
        flameColor = '#66ccff';
        glowColor = '#4488ff';
        particleColor = '#66ccff';
      } else if (bossLevel === 15) {
        // Стражи — золотистый
        flameColor = '#ffdd44';
        glowColor = '#ffaa00';
        particleColor = '#ffdd44';
      } else {
        // Fallback
        flameColor = torch.flameColor || COLORS.torches.flame;
        glowColor = torch.glowColor || COLORS.torches.glow;
        particleColor = torch.particleColor || COLORS.torches.particle;
      }
    } else if (useIceColor) {
      // ❄️ Ледяной цвет для уровней 6-9
      flameColor = '#66ccff';
      glowColor = '#4488ff';
      particleColor = '#66ccff';
    } else {
      // 🔥 Тёплый цвет для остальных уровней
      flameColor = torch.flameColor || COLORS.torches.flame;
      glowColor = torch.glowColor || COLORS.torches.glow;
      particleColor = torch.particleColor || COLORS.torches.particle;
    }
    
    // ===== СВЕТ ОТ ФАКЕЛА =====
    const glowRadius = 140;

    // Основной градиент
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

    // ===== ВНЕШНЕЕ МЯГКОЕ СВЕЧЕНИЕ =====
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
    
    // ===== ИЗОБРАЖЕНИЕ ФАКЕЛА =====
    if (cacheKey && isImageLoaded(cacheKey)) {
      const img = getImage(cacheKey);
      if (img) {
        const size = 56;
        ctx.save();
        ctx.shadowBlur = 15 * appearProgress * visibility;
        ctx.shadowColor = flameColor;
        ctx.globalAlpha = 0.85 * appearProgress * visibility;
        ctx.drawImage(img, torchX - size/2, torchY - size/2, size, size);
        ctx.restore();
      }
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
      if (isSpecialRoom && state.inSafeRoom) {
        emoji = '🏠';
      } else if (isSpecialRoom && state.inShrineRoom) {
        emoji = '🔮';
      } else if (isSpecialRoom && state.inTreasureRoom) {
        emoji = '💰';
      } else if (isTrapRoom) {
        if (state.trapActivated && !state.trapExitRevealed) {
          emoji = '⚠️';
        } else {
          emoji = '🕯️';
        }
      } else if (isBossLevel) {
        const bossLevel = Math.floor(state.gameLevel / 5) * 5;
        if (bossLevel === 5) emoji = '👹';
        else if (bossLevel === 10) emoji = '🧠';
        else if (bossLevel === 15) emoji = '🗿';
      } else if (useIceColor) {
        emoji = '❄️';
      }
      ctx.fillText(emoji, torchX, torchY);
      ctx.restore();
    }
    
    ctx.restore();
  }
}

/**
 * Преобразование HEX-цвета в строку RGB
 * 
 * @param {string} hex - Цвет в HEX-формате (#RRGGBB)
 * @returns {string} - Строка RGB (r, g, b)
 * @private
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 136, 0';
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
    if (isMindBossArena) {
      particleColor = COLORS.torches.particleMind;
      torch.particleColor = particleColor;
    }
    
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