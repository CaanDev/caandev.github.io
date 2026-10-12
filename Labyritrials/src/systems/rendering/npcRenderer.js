/**
 * @fileoverview Рендерер NPC.
 * 
 * @module systems/rendering/npcRenderer
 */

import { CONFIG, state, player, SPRITE_SIZES } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { getNpcAnimator, NPC_DISPLAY_SIZE } from '../../sprites/index.js';
import { getDistanceVisibility } from '../fog/index.js';
import { drawPixelPerfect } from '../../sprites/spriteUtils.js';
import { drawResearcherQuestIndicator } from './npcIndicator.js';

/**
 * Отрисовка NPC-исследовательницы.
 * 
 * Проверки:
 *  - NPC должна быть активна (x/y !== null)
 *  - Клетка NPC должна быть открыта (revealed) или у игрока есть карта
 *  - NPC должна быть видна в тумане (visibility > 0.05), кроме safeRoom
 * 
 * Если спрайт не загрузился - рисуется эмодзи-заглушка.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawResearcher(ctx) {
  const r = state.researcher;

  // Проверка активности NPC
  if (!r || r.x === null || r.y === null) return;
  if (r.gridX === null || r.gridY === null) return;

  // Не рисовать NPC на босс-уровне и в тайных комнатах
  if (state.isBossLevel) return;
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) return;

  const gridX = r.gridX;
  const gridY = r.gridY;

  // Проверка, что клетка существует
  const cell = state.grid[gridY]?.[gridX];
  if (!cell) return;

  // Проверка открытости клетки
  if (!cell.revealed && !player.hasMap) return;

  // Проверка видимости в тумане (кроме safeRoom)
  if (!state.inSafeRoom) {
    const visibility = getDistanceVisibility(r.x, r.y);
    if (visibility <= 0.05) return;
  }

  // Получение аниматора, текущего кадра и смещение
  const animator = getNpcAnimator('researcher');
  const sprite = animator.getCurrentFrame();
  const offsets = SPRITE_SIZES.cells.offsets?.researcher || { x: 0, y: 0 };

  // Отрисовка
  if (sprite && sprite.texture) {
    const displaySize = NPC_DISPLAY_SIZE;
    const dx = r.x - displaySize / 2 + offsets.x;
    const dy = r.y - displaySize / 2 + offsets.y;

    drawPixelPerfect(ctx, sprite, dx, dy, displaySize, displaySize);
  } else {
    // Fallback: эмодзи-заглушка
    ctx.save();
    ctx.fillStyle = COLORS.player.shadow;
    ctx.font = '52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔍', r.x + offsets.x, r.y + offsets.y);
    ctx.restore();
  }

  // Индикатор над NPC (если нужно)
  drawResearcherQuestIndicator(ctx);
}