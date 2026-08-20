/**
 * @fileoverview Рендеринг снежинок — привязаны к позиции игрока, с плавным появлением
 * @module systems/weather/snowRenderer
 */

import { snowState } from './snowManager.js';
import { state, player } from '../../core/config/index.js';

/** @type {Array} - Массив снежинок */
let snowflakes = [];
/** @type {number} - Максимальное количество снежинок */
const MAX_SNOWFLAKES = 60;
/** @type {number} - Радиус зоны снегопада вокруг игрока (в пикселях) */
const SNOW_AREA_RADIUS = 700;

/**
 * Класс снежинки
 */
class Snowflake {
  constructor() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * SNOW_AREA_RADIUS;
    
    this.offsetX = Math.cos(angle) * distance;
    this.offsetY = Math.sin(angle) * distance - SNOW_AREA_RADIUS / 2;
    
    this.x = player.px + this.offsetX;
    this.y = player.py + this.offsetY;
    
    this.size = 0.5 + Math.random() * 2.0;
    this.speed = 0.15 + Math.random() * 0.65;
    this.drift = (Math.random() - 0.5) * 0.2;
    this.opacity = 0.5 + Math.random() * 0.5;
    this.driftChange = (Math.random() - 0.5) * 0.002;
  }

  update() {
    this.y += this.speed;
    this.drift += this.driftChange;
    this.drift = Math.max(-0.2, Math.min(0.2, this.drift));
    this.x += this.drift;
    
    if (this.y > player.py + SNOW_AREA_RADIUS / 2) {
      this.reset();
    }
    
    const dx = this.x - player.px;
    const dy = this.y - player.py;
    const dist = Math.hypot(dx, dy);
    
    if (dist > SNOW_AREA_RADIUS) {
      this.reset();
    }
  }

  reset() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * SNOW_AREA_RADIUS * 0.9;
    
    this.offsetX = Math.cos(angle) * distance;
    this.offsetY = Math.sin(angle) * distance - SNOW_AREA_RADIUS / 2;
    
    this.x = player.px + this.offsetX;
    this.y = player.py + this.offsetY;
    
    this.size = 0.5 + Math.random() * 2.0;
    this.speed = 0.15 + Math.random() * 0.65;
    this.drift = (Math.random() - 0.5) * 0.2;
    this.opacity = 0.5 + Math.random() * 0.5;
    this.driftChange = (Math.random() - 0.5) * 0.002;
  }

  draw(ctx, camX, camY) {
    const screenX = this.x + camX;
    const screenY = this.y + camY;
    
    if (screenX < -10 || screenX > window.innerWidth + 10 ||
        screenY < -10 || screenY > window.innerHeight + 10) {
      return;
    }
    
    // Умножаем прозрачность снежинки на общую прозрачность снегопада
    const snowOpacity = snowState.opacity || 0;
    const alpha = Math.min(1, this.opacity * 1.2 * snowOpacity);
    
    if (alpha < 0.01) return;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Обновление позиций снежинок при движении игрока
 */
export function updateSnowPositions() {
  if (snowflakes.length === 0) return;
  
  for (const snow of snowflakes) {
    snow.x = player.px + snow.offsetX;
    snow.y = player.py + snow.offsetY;
  }
}

/**
 * Создание снежинок (для восстановления после загрузки)
 */
export function createSnowflakes() {
  if (!snowState.active) return;
  
  // Очищаем старые снежинки
  snowflakes = [];
  
  // Создаём новые
  while (snowflakes.length < MAX_SNOWFLAKES) {
    snowflakes.push(new Snowflake());
  }
}

/**
 * Отрисовка всех снежинок
 */
export function drawSnow(ctx, canvas, camX, camY) {
  // Если снег не активен или полностью прозрачен — не рисуем
  if (!snowState.active || snowState.opacity < 0.005) return;
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  if (isInSecretRoom) return;
  if (state.isBossLevel) return;
  
  // Если снежинок нет — создаём их
  if (snowflakes.length === 0) {
    createSnowflakes();
  }
  
  // Создаём недостающие снежинки
  while (snowflakes.length < MAX_SNOWFLAKES) {
    snowflakes.push(new Snowflake());
  }
  
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.save();
  ctx.shadowBlur = 0;
  
  const snowOpacity = snowState.opacity || 0;
  
  for (const snow of snowflakes) {
    snow.update();
    
    const screenX = snow.x + camX;
    const screenY = snow.y + camY;
    
    if (screenX < -10 || screenX > width + 10 ||
        screenY < -10 || screenY > height + 10) {
      continue;
    }
    
    const alpha = Math.min(1, snow.opacity * 1.2 * snowOpacity);
    
    if (alpha < 0.01) continue;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, snow.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Очистка снежинок
 */
export function clearSnow() {
  snowflakes = [];
}

/**
 * Получение количества активных снежинок
 */
export function getSnowflakeCount() {
  return snowflakes.length;
}