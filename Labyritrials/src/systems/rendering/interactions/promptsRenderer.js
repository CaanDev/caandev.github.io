/**
 * @fileoverview Отрисовка подсказок взаимодействия [E].
 * @module systems/rendering/interactions/promptsRenderer
 */

import { state, player } from '../../../core/config/index.js';
import { getSettings } from '../../ui/settings/index.js';
import { INTERACTION_CONFIG } from '../../../entities/player/interactions/config.js';
import { isNearShop } from '../../../entities/player/interactions/shop.js';
import { isNearBookshelf } from '../../../entities/player/interactions/bookshelf.js';
import { isNearTaskBoard } from '../../../entities/player/interactions/taskBoard.js';
import { canCatchWisp } from '../../../entities/player/interactions/spiritCatcher.js';
import { getNpcPromptText } from '../../../entities/player/interactions/npcPrompts.js';
import { isNearResearcher } from '../../../entities/npc/index.js';

/**
 * Отрисовка всех подсказок взаимодействия.
 * Показывает только одну подсказку с наивысшим приоритетом.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawInteractionPrompts(ctx) {
  const settings = getSettings();
  if (settings.showInteractionPrompts === false) return;

  let text = null;
  let color = null;
  let targetX = player.px;
  let targetY = player.py;

    // Приоритет 1: интерактивные предметы на полу
  if (state.interactiveItems.showPrompt && state.interactiveItems.nearestItem) {
    text = `[E] ${state.interactiveItems.actionLabel || 'Взять'}`;
    color = 'rgba(155, 89, 182,';
  }
  // Приоритет 2: пленение оглушённого огонька
  else if (canCatchWisp()) {
    const config = INTERACTION_CONFIG.spiritCatcher;
    text = config.promptText;
    color = config.promptColor;
  }
  // Приоритет 3: записки
  else if (state.showNotePrompt && state.notePromptId) {
    text = '[E] Прочитать';
    color = 'rgba(200, 200, 100,';
  }
  // Приоритет 4: NPC-исследовательница
  else if (isNearResearcher()) {
    const config = INTERACTION_CONFIG.researcher;
    text = getNpcPromptText('researcher');
    color = config.promptColor;
  }
  // Приоритет 5: книжные полки
  else if (isNearBookshelf()) {
    const config = INTERACTION_CONFIG.bookshelf;
    text = config.promptText;
    color = config.promptColor;
  }
  // Приоритет 6: доска заданий
  else if (isNearTaskBoard()) {
    const config = INTERACTION_CONFIG.taskBoard;
    text = config.promptText;
    color = config.promptColor;
  }
  // Приоритет 7: лавка торговца
  else if (isNearShop()) {
    const config = INTERACTION_CONFIG.shop;
    text = getNpcPromptText('trader');
    color = config.promptColor;
  }

  if (!text) return;

  // Единая отрисовка
  drawUnifiedPrompt(ctx, text, color, targetX, targetY);
}

/**
 * Унифицированная отрисовка подсказки [E].
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {string} text - Текст подсказки
 * @param {string} colorPrefix - Префикс RGBA-цвета
 * @param {number} x - Координата X над объектом
 * @param {number} y - Координата Y над объектом
 * @returns {void}
 * @private
 */
function drawUnifiedPrompt(ctx, text, colorPrefix, x, y) {
  ctx.save();

  const textX = x;
  const textY = y - 80;

  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
  const alpha = 0.6 + 0.3 * pulse;

  ctx.font = `700 16px "Comfortaa", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(20, 8, 32, ${alpha * 0.9})`;
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeText(text, textX, textY);

  ctx.fillStyle = `${colorPrefix}${alpha})`;
  ctx.shadowBlur = 15;
  ctx.shadowColor = `${colorPrefix}0.3)`;
  ctx.fillText(text, textX, textY);

  ctx.restore();
}