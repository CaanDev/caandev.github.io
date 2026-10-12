/**
 * @fileoverview Движение игрока и связанные с ним системы.
 * Обрабатывает перемещение, активацию факелов и подсказки магазина.
 * 
 * @module entities/player/movement
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { logger } from '../../utils/logger.js';
import { audio } from '../../audio/audioManager.js';
import { checkWallCollision } from '../../world/physics.js';

/**
 * Проверка коллизии с колонной
 * 
 * @param {number} px - Позиция X в пикселях
 * @param {number} py - Позиция Y в пикселях
 * @param {number} [radius=24] - Радиус проверки
 * @returns {boolean} - true, если есть коллизия с колонной
 * @private
 */
function isPillarCollision(px, py, radius = 24) {
  const gridX = Math.floor(px / CONFIG.cellSize);
  const gridY = Math.floor(py / CONFIG.cellSize);

  // Защита от NULL/UNDEFINED
  if (!state.grid || !state.grid[gridY] || !state.grid[gridY][gridX]) return false;

  if (gridY >= 0 && gridY < CONFIG.rows && gridX >= 0 && gridX < CONFIG.cols) {
    if (state.grid[gridY]?.[gridX]?.isPillar) return true;
  }

  const checkRadius = Math.ceil(radius / CONFIG.cellSize);
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = gridX + dx;
      const ny = gridY + dy;
      if (ny >= 0 && ny < CONFIG.rows && nx >= 0 && nx < CONFIG.cols) {
        // Защита от NULL/UNDEFINED
        if (!state.grid[ny] || !state.grid[ny][nx]) continue;
        if (state.grid[ny][nx].isPillar) {
          const pillarX = nx * CONFIG.cellSize + CONFIG.cellSize / 2;
          const pillarY = ny * CONFIG.cellSize + CONFIG.cellSize / 2;
          const dist = Math.hypot(px - pillarX, py - pillarY);
          if (dist < radius + CONFIG.cellSize * 0.35) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Обновление движения игрока
 * Обрабатывает ввод, коллизии со стенами и колоннами
 * 
 * @param {number} deltaTime - Время с последнего обновления (мс)
 * @returns {void}
 */
export function updateMovement(deltaTime = 16) {
  // Если игрок отключен - нет движения
  if (state.isPlayerDisabled) return;
  // Блокировка движения во время появления босса
  if (state.isBossLevel && state.bossSpawnTriggered && !state.bossReady) return;
  
  // Коррекция некорректной скорости
  if (player.speed > 10 || player.speed < 1 || isNaN(player.speed)) {
    logger.warn('⚠️ Исправлена некорректная скорость:', player.speed);
    player.baseSpeed = player.baseSpeed || 5;
    player.speed = player.baseSpeed;
  }

  if (state.isShopOpen) return;

  // Определение направления
  let moveX = 0, moveY = 0;
  if (!player.isFrozen) {
    let rawX = 0, rawY = 0;
    if (state.keys['w'] || state.keys['arrowup']) rawY = -1;
    if (state.keys['s'] || state.keys['arrowdown']) rawY = 1;
    if (state.keys['a'] || state.keys['arrowleft']) rawX = -1;
    if (state.keys['d'] || state.keys['arrowright']) rawX = 1;

    // Инвертированное управление
    if (player.controlsInverted) {
      moveX = -rawX;
      moveY = -rawY;
    } else {
      moveX = rawX;
      moveY = rawY;
    }
  }

  // Сохранение направления
  let moveDir = null;
  if (moveX > 0) moveDir = 'right';
  else if (moveX < 0) moveDir = 'left';
  else if (moveY > 0) moveDir = 'down';
  else if (moveY < 0) moveDir = 'up';

  // Сохранение последнего направления движения
  if (moveX !== 0 || moveY !== 0) {
    player.lastMoveDirX = moveX;
    player.lastMoveDirY = moveY;
  }

  // Коллизии
  const oldPx = player.px;
  const oldPy = player.py;

  let nextPx = player.px + moveX * player.speed;
  let nextPy = player.py + moveY * player.speed;

  const pillarX = isPillarCollision(nextPx, player.py, 24);
  const pillarY = isPillarCollision(player.px, nextPy, 24);
  const wallX = checkWallCollision(nextPx, player.py, 24, false);
  const wallY = checkWallCollision(player.px, nextPy, 24, false);

  // Применение движения
  if (!pillarX && !wallX) player.px = nextPx;
  if (!pillarY && !wallY) player.py = nextPy;

  // Обновление позиции по сетке
  player.x = Math.floor(player.px / CONFIG.cellSize);
  player.y = Math.floor(player.py / CONFIG.cellSize);

  // Звук шагов
  const didMove = (player.px !== oldPx || player.py !== oldPy);

  // Установка флага движения
  player.isMoving = didMove;

  if (didMove && moveDir !== null) audio.playStep(moveDir);
}

/**
 * Активация факелов при приближении игрока
 * 
 * @returns {void}
 */
export function updateTorchActivation() {
  const ACTIVATION_RADIUS = CONFIG.torchActivationRadius;

  for (let torch of state.torches) {
    if (!torch.active) {
      const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
      const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
      const distToTorch = Math.hypot(player.px - torchWorldX, player.py - torchWorldY);

      if (distToTorch < ACTIVATION_RADIUS) {
        torch.active = true;
        audio.playSound('interactions.torchActivate');

        // Установка цветов факела
        if (torch.flameColor === undefined) torch.flameColor = COLORS.torches.flame;
        if (torch.glowColor === undefined) torch.glowColor = COLORS.torches.glow;
        if (torch.particleColor === undefined) torch.particleColor = COLORS.torches.particle;
        if (torch.emoji === undefined) torch.emoji = '🕯️';

        // Особые цвета для арены Разума
        const isMindBossArena = state.isBossLevel && state.gameLevel === 10;
        if (isMindBossArena) {
          torch.flameColor = COLORS.torches.flameMind;
          torch.glowColor = COLORS.torches.glowMind;
          torch.particleColor = COLORS.torches.particleMind;
          torch.emoji = '🔮';
        }

        // Открытие клетки с факелом
        if (state.grid[torch.y] && state.grid[torch.y][torch.x]) state.grid[torch.y][torch.x].revealed = true;
        state.screenShake = 3;
      }
    }
  }
}