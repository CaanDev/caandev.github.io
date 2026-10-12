/**
 * @fileoverview Рендерер доски заданий.
 * @module systems/rendering/interactions/taskBoardRenderer
 */

import { CONFIG, state, player, getCellBasedSize } from '../../../core/config/index.js';
import { getAllQuests } from '../../../data/quests.js';
import { isQuestActive, isQuestCompleted } from '../../../systems/quests/questManager.js';
import { RESEARCHER_STATES } from '../../dialogs/npcStates.js';
import { getObjectSpritePosition } from './helpers.js';

/**
 * Проверка, есть ли на доске хотя бы одно новое (непринятое) задание.
 * 
 * Учитывает специальные условия для задания Астрид (researcherWisps),
 * которые совпадают с условиями в getAvailableBoardQuests() (taskBoardUI.js).
 * 
 * @returns {boolean} - true, если есть хотя бы одно доступное задание
 */
function hasNewQuests() {
  const allQuests = getAllQuests();
  for (const questData of allQuests) {
    if (!questData.fromBoard) continue;
    if (isQuestActive(questData.id)) continue;
    if (isQuestCompleted(questData.id)) continue;

    // Специальные условия для задания Астрид (должны совпадать с taskBoardUI.js)
    if (questData.id === 'researcherWisps') {
      // Задание появляется только если игрок поговорил с Астрид в безопасной комнате
      if (state.npcState?.researcher !== RESEARCHER_STATES.WAITING_FOR_QUEST_BOARD) continue;
      // И если у игрока нет "Блуждающих огней"
      const hasWispsItem = player.inventory?.items?.equipment?.includes('willOTheWisps') || false;
      if (hasWispsItem) continue;
    }

    return true;
  }
  return false;
}

/**
 * Отрисовка доски заданий
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X левого верхнего угла клетки
 * @param {number} dy - Координата Y левого верхнего угла клетки
 * @param {number} gridX - Координата X в сетке
 * @param {number} gridY - Координата Y в сетке
 * @returns {void}
 */
export function drawTaskBoard(ctx, dx, dy, gridX, gridY) {
  const spriteName = 'objTaskBoard';
  const spriteSize = getCellBasedSize('taskBoard', CONFIG.cellSize);
  const { sprite, dx: drawX, dy: drawY } = getObjectSpritePosition(
    spriteName, 'taskBoard', spriteSize, dx, dy
  );
  
  // Если спрайт не загрузился - рисуется fallback
  if (!sprite) {
    drawFallbackTaskBoard(ctx, dx, dy);
    return;
  }
  
  // Спрайт
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    drawX, drawY,
    sprite.drawW, sprite.drawH
  );
  ctx.restore();
  
  // Блик поверх спрайта (идентификатор наличия нового задания)
  if (hasNewQuests()) {
    const spriteCenterX = drawX + sprite.drawW / 2;
    const spriteCenterY = drawY + sprite.drawH / 2;
    const spriteRadius = Math.max(sprite.drawW, sprite.drawH) / 2;
    drawQuestGlowOverlay(ctx, spriteCenterX, spriteCenterY, spriteRadius);
  }
}

/**
 * Отрисовка блика поверх спрайта доски
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} centerX - Центр спрайта по X
 * @param {number} centerY - Центр спрайта по Y
 * @param {number} spriteRadius - Радиус спрайта (половина макс. стороны)
 * @returns {void}
 * @private
 */
function drawQuestGlowOverlay(ctx, centerX, centerY, spriteRadius) {
  const time = Date.now() * 0.001;
  
  // Пульсация
  const pulse = 0.85 + 0.15 * Math.sin(time * 1.5);
  const dotPulse = 0.88 + 0.12 * Math.sin(time * 1.8);
  // Радиус
  const glowRadius = spriteRadius * 0.7 * pulse;
  const dotRadius = spriteRadius * 0.07 * dotPulse;
  
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Ореол
  ctx.globalAlpha = 0.55 * pulse;
  
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  glowGradient.addColorStop(0, 'rgba(255, 240, 180, 0.55)');
  glowGradient.addColorStop(0.4, 'rgba(255, 220, 120, 0.3)');
  glowGradient.addColorStop(0.75, 'rgba(255, 200, 80, 0.1)');
  glowGradient.addColorStop(1, 'rgba(255, 180, 50, 0)');
  
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Точка
  ctx.globalAlpha = 0.9 * dotPulse;
  
  // Ореол вокруг точки
  const dotGlowGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, dotRadius * 2.5
  );
  dotGlowGradient.addColorStop(0, 'rgba(255, 255, 220, 0.9)');
  dotGlowGradient.addColorStop(0.3, 'rgba(255, 240, 150, 0.4)');
  dotGlowGradient.addColorStop(0.7, 'rgba(255, 220, 100, 0.1)');
  dotGlowGradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
  
  ctx.fillStyle = dotGlowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, dotRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Точка
  ctx.fillStyle = 'rgba(255, 255, 245, 0.95)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, dotRadius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Fallback-отрисовка доски заданий (если спрайт не загружен)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} dx - Координата X клетки
 * @param {number} dy - Координата Y клетки
 * @returns {void}
 * @private
 */
function drawFallbackTaskBoard(ctx, dx, dy) {
  const cellSize = CONFIG.cellSize;
  const centerX = dx + cellSize / 2;
  const centerY = dy + cellSize / 2;
  
  ctx.save();
  ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(dx + 10, dy + 10, cellSize - 20, cellSize - 20, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '36px Arial';
  ctx.fillStyle = '#d4c8a0';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText('📋', centerX, centerY);
  ctx.restore();
}