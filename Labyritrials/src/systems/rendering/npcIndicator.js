/**
 * @fileoverview Индикатор доступного задания над NPC.
 * Рисует светящийся ромбик над NPC, у которого есть непринятое задание,
 * а также над исследовательницей в безопасной комнате.
 * 
 * @module systems/rendering/npcIndicator
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { getQuestsByGiver, isQuestActive, isQuestCompleted } from '../quests/index.js';
import { getDistanceVisibility } from '../fog/index.js';
import { RESEARCHER_STATES } from '../dialogs/npcStates.js';

/**
 * Проверка, есть ли у NPC непринятое задание
 * 
 * @param {string} npcId - ID NPC
 * @returns {boolean} - true, если есть непринятое задание
 */
export function hasUnacceptedQuest(npcId) {
  const quests = getQuestsByGiver(npcId);
  if (!quests || quests.length === 0) return false;
  
  for (const quest of quests) {
    // Пропускаются задания, которые уже активны или завершены
    if (isQuestActive(quest.id)) continue;
    if (isQuestCompleted(quest.id)) continue;
    // Найдено непринятое задание
    return true;
  }
  return false;
}

/**
 * Проверка, есть ли у торговца новая непрослушанная реплика о доске заданий
 * 
 * @returns {boolean} - true, если нужно показать индикатор
 */
export function hasNewTraderSpeech() {
  return !state.taskBoardIntroShown && state.gameLevel >= 8 && state.npcState?.trader === 'shop_open';
}

/**
 * Проверка, нужно ли показывать индикатор над исследовательницей.
 * 
 * @returns {boolean} - true, если нужно показать индикатор
 */
export function shouldShowResearcherIndicator() {
  const researcherState = state.npcState?.researcher;
  
  if (researcherState === RESEARCHER_STATES.IN_SAFE_ROOM) return true;
  if (researcherState === RESEARCHER_STATES.QUEST_READY_TO_TURN_IN) return true;
  if (researcherState === RESEARCHER_STATES.WISPS_QUEST_COMPLETE) return true;
  return false;
}

/**
 * Отрисовка индикатора задания над NPC
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} worldX - Глобальная координата X центра NPC (пиксели)
 * @param {number} worldY - Глобальная координата Y центра NPC (пиксели)
 * @param {number} offsetY - Смещение индикатора над NPC (пиксели)
 * @param {string} npcId - ID NPC
 * @param {boolean} [forceShow=false] - Принудительно показывать индикатор, даже если нет непринятого задания/новой реплики
 * @returns {void}
 */
export function drawNpcQuestIndicator(ctx, worldX, worldY, offsetY, npcId, forceShow = false) {
  // Индикатор показывается если есть непринятое задание, есть новая реплика или включён принудительный показ
  const hasQuest = hasUnacceptedQuest(npcId);
  const hasNewSpeech = npcId === 'trader' && hasNewTraderSpeech();
  if (!hasQuest && !hasNewSpeech && !forceShow) return;
  
  // Проверка видимости в тумане войны
  const visibility = getDistanceVisibility(worldX, worldY);
  if (visibility <= 0.05) return;
  
  // Анимация покачивания вверх-вниз
  const time = Date.now() * 0.001;
  const bob = Math.sin(time) * 5;
  // Анимация пульсации яркости
  const pulse = 0.7 + Math.sin(time * 0.75) * 0.3;
  
  const x = worldX;
  const y = worldY - offsetY + bob;
  const size = 10;
  
  ctx.save();
  ctx.globalAlpha = visibility * pulse;
  
  // Свечение
  ctx.shadowBlur = 20 * pulse;
  ctx.shadowColor = COLORS.ui.textGold;
  
  // Ромб
  ctx.fillStyle = COLORS.ui.textGold;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.7, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.7, y);
  ctx.closePath();
  ctx.fill();
  
  // Внутренний блик
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.4);
  ctx.lineTo(x + size * 0.28, y);
  ctx.lineTo(x, y + size * 0.4);
  ctx.lineTo(x - size * 0.28, y);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Отрисовка индикатора для торговца
 * Учитывает позицию магазина и видимость
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawTraderQuestIndicator(ctx) {
  // Проверка, что торговец есть на уровне
  if (!CONFIG.shopPos || CONFIG.shopPos.x < 0 || CONFIG.shopPos.y < 0) return;
  if (state.isBossLevel) return;
  
  const cell = state.grid[CONFIG.shopPos.y]?.[CONFIG.shopPos.x];
  if (!cell) return;
  // Скрывается, если клетка не открыта
  if (!cell.revealed && !player.hasMap) return;
  
  // Учёт смещения спрайта лавки
  const shopOffsets = SPRITE_SIZES.cells.offsets?.shop || { x: 0, y: 0 };
  const worldX = CONFIG.shopPos.x * CONFIG.cellSize + CONFIG.cellSize / 2 + shopOffsets.x;
  const worldY = CONFIG.shopPos.y * CONFIG.cellSize + CONFIG.cellSize / 2 + shopOffsets.y;
  
  // Смещение над лавкой
  const offsetY = CONFIG.cellSize * 0.55;
  drawNpcQuestIndicator(ctx, worldX, worldY, offsetY, 'trader');
}

/**
 * Отрисовка индикатора над исследовательницей.
 * Показывается в безопасной комнате (ждёт разговора) и при готовности сдать задание.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawResearcherQuestIndicator(ctx) {
  const r = state.researcher;
  
  // NPC должна быть активна
  if (!r || r.x === null || r.y === null) return;
  if (r.gridX === null || r.gridY === null) return;
  
  // Не показывается на босс-уровне и в тайных комнатах
  if (state.isBossLevel) return;
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom) return;
  
  // Проверка видимости клетки
  const cell = state.grid[r.gridY]?.[r.gridX];
  if (!cell) return;
  if (!cell.revealed && !player.hasMap) return;
  
  // Проверка условия отображения
  if (!shouldShowResearcherIndicator()) return;
  
  // Смещение над NPC
  const offsets = SPRITE_SIZES.cells.offsets?.researcher || { x: 0, y: 0 };
  const worldX = r.x + offsets.x;
  const worldY = r.y + offsets.y;
  // Смещение индикатора над спрайтом NPC
  const offsetY = CONFIG.cellSize * 0.4;
  
  drawNpcQuestIndicator(ctx, worldX, worldY, offsetY, 'researcher', true);
}