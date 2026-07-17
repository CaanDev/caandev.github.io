/**
 * @fileoverview Рендерер факелов и их частиц.
 * Отрисовывает активные факелы с анимацией мерцания и создаёт частицы огня.
 * 
 * @module systems/rendering/torchRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { getDistanceVisibility } from '../fog/index.js';

/**
 * Отрисовка всех активных факелов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTorches(ctx) {
  if (!state.torches) return;

  const isMindBossArena = state.isBossLevel && (state.gameLevel === 10);
  
  for (let torch of state.torches) {
    if (!torch.active) continue;
    if (!state.grid[torch.y] || !state.grid[torch.y][torch.x]) continue;
    if (!state.grid[torch.y][torch.x].revealed && !player.hasMap) continue;
    
    const cellX = torch.x * CONFIG.cellSize;
    const cellY = torch.y * CONFIG.cellSize;
    const torchX = cellX + CONFIG.cellSize / 2;
    const torchY = cellY + CONFIG.cellSize / 2;
    
    const visibility = getDistanceVisibility(torchX, torchY);
    if (visibility <= 0.05) continue;
    
    // Анимация появления факела
    if (torch.appearTimer === undefined) torch.appearTimer = 0;
    if (torch.appearTimer < 1) {
      torch.appearTimer = Math.min(1, torch.appearTimer + 0.05);
    }
    
    const appearProgress = torch.appearTimer;
    torch.flickerPhase = (torch.flickerPhase || 0) + CONFIG.torchFlickerSpeed;
    const flicker = 0.8 + Math.sin(torch.flickerPhase * 2) * 0.25;
    
    const flameColor = torch.flameColor || COLORS.torches.flame;
    const glowColor = torch.glowColor || COLORS.torches.glow;
    const emoji = torch.emoji || '🕯️';
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, visibility * 0.8 + 0.1);
    
    // Свет от факела
    const gradient = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, 80);
    gradient.addColorStop(0, `rgba(${hexToRgb(flameColor)}, ${0.5 * flicker * visibility})`);
    gradient.addColorStop(0.3, `rgba(${hexToRgb(flameColor)}, ${0.3 * flicker * visibility})`);
    gradient.addColorStop(0.6, `rgba(${hexToRgb(glowColor)}, ${0.15 * flicker * visibility})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(glowColor)}, 0)`);
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(torchX, torchY, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Эмодзи факела с тенью
    ctx.shadowBlur = 15 * appearProgress * visibility;
    ctx.shadowColor = flameColor;
    ctx.font = `${32 * appearProgress}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7 * appearProgress * visibility;
    ctx.fillStyle = flameColor;
    ctx.fillText(emoji, torchX, torchY);
    ctx.globalAlpha = 1.0;
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
      const distance = 15 + Math.random() * 30;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      state.fireParticles.push({
        x: torchX + offsetX,
        y: torchY + offsetY,
        life: 60,
        maxLife: 60,
        size: 1 + Math.random() * 2.5,
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