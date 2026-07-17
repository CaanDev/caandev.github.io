/**
 * @fileoverview Взаимодействие игрока с объектами.
 * Обрабатывает открытие сундуков, взаимодействие с записками и другие объекты.
 * 
 * @module entities/player/interaction
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { Game } from '../../core/game.js';
import { triggerGameOver } from './gameOver.js';
import { removeFlies } from '../objects/fly.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Проверка взаимодействия с запиской
 * Сканирует соседние клетки на наличие записок
 * 
 * @returns {void}
 */
export function checkNoteInteraction() {
  if (state.isShopOpen) return;
  if (player.hp <= 0) return;
  
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  
  const neighbors = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  
  let foundNote = false;
  
  for (const [dx, dy] of neighbors) {
    const x = playerGridX + dx;
    const y = playerGridY + dy;
    
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) continue;
    
    const cell = state.grid[y]?.[x];
    if (!cell) continue;
    
    if (cell.hasNote && cell.noteId) {
      state.showNotePrompt = true;
      state.notePromptId = cell.noteId;
      state.notePromptX = x;
      state.notePromptY = y;
      foundNote = true;
      break;
    }
  }
  
  if (!foundNote) {
    state.showNotePrompt = false;
    state.notePromptId = null;
    state.notePromptX = null;
    state.notePromptY = null;
  }
}

/**
 * Взаимодействие со всеми сундуками
 * Проверяет, находится ли игрок рядом с сундуком
 * 
 * @returns {void}
 */
export function interactWithChests() {
  for (let i = state.chests.length - 1; i >= 0; i--) {
    let ch = state.chests[i];

    if (!ch.opened && Math.hypot(player.px - ch.x, player.py - ch.y) < 45) {
      ch.opened = true;

      switch (ch.type) {
        case 'gold':
          handleGoldChest(ch);
          break;
        case 'artifact':
          handleArtifactChest(ch);
          break;
        case 'potion_chest':
          handlePotionChest(ch);
          break;
        case 'mimic':
          if (!ch.countedForAchievement) {
            ch.countedForAchievement = true;
            updateProgress('mimic_total', 1);
          }
          handleMimicChest(ch);
          break;
        case 'empty':
          handleEmptyChest(ch);
          break;
      }
    }
  }
}

/**
 * Обработка сундука с золотом
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleGoldChest(ch) {
  let reward = Math.floor(Math.random() * 20) + 15 + state.gameLevel * 2;
  player.gold += reward;
  
  updateProgress('gold_collected', reward);
  state.gameStats.goldCollected += reward;
  
  Game.updateUI();
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `+${reward} 💰`,
    color: COLORS.ui.textGold,
    size: 22, life: 50, speedy: 1.2
  });

  import('../../systems/particles/goldParticles.js').then(module => {
    module.createGoldParticles(ch.x, ch.y, reward);
  });

  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 1000);
}

/**
 * Обработка сундука с артефактом
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleArtifactChest(ch) {
  player.artifactsCollected++;
  state.gameStats.artifactsCollected++;
  
  updateProgress('artifacts_collected', 1);
  
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `Артефакт! 👑`,
    color: COLORS.effects.magic,
    size: 24, life: 60, speedy: 1.0
  });

  import('../../systems/particles/artifactParticles.js').then(module => {
    module.createArtifactParticles(ch.x, ch.y);
  });

  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 1000);
}

/**
 * Обработка сундука с зельем в безопасной комнате
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handlePotionChest(ch) {
  const healAmount = 50;
  const oldHp = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
  const actualHeal = player.hp - oldHp;
  state.safeChestOpened = true;

  import('../../systems/particles/potionParticles.js').then(module => {
    module.createPotionParticles(ch.x, ch.y, actualHeal);
  });

  if (actualHeal > 0) {
    state.damageTexts.push({
      x: ch.x, y: ch.y - 20,
      text: `+${actualHeal} ❤️`,
      color: COLORS.effects.potion.mid,
      size: 24, life: 50, speedy: 1.2
    });
  } else {
    state.damageTexts.push({
      x: ch.x, y: ch.y - 20,
      text: `❤️ Здоровье максимально!`,
      color: COLORS.ui.textGold,
      size: 18, life: 40, speedy: 1.0
    });
  }

  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 500);
}

/**
 * Обработка сундука-мимика
 * 
 * @param {Object} ch - Объект сундука
 * @returns {boolean} - true, если игрок умер
 * @private
 */
function handleMimicChest(ch) {
  removeFlies(ch.x, ch.y);

  let maxDamage = Math.floor(player.hp * 0.33);
  let mimicDamage = Math.max(Math.floor(Math.random() * (maxDamage - 5)) + 5, 5);

  player.hp -= mimicDamage;

  state.gameStats.mimicBites++;

  state.screenShake = 25;
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `МИМИК! -${mimicDamage} ❤️`,
    color: COLORS.ui.textRed,
    size: 26, life: 60, speedy: 1.5
  });

  if (player.hp <= 0) {
    triggerGameOver();
    return true;
  }

  setTimeout(() => {
    ch.opened = false;
  }, 1500);

  return false;
}

/**
 * Обработка пустого сундука
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleEmptyChest(ch) {
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `📦 Пусто...`,
    color: COLORS.ui.textDark,
    size: 20, life: 50, speedy: 1.0
  });

  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 1000);
}

/**
 * Сброс серии мимиков (устаревшая функция)
 * @deprecated Оставлена для обратной совместимости
 * 
 * @returns {void}
 */
export function resetMimicStreak() {
  // Серия мимиков больше не нужна, оставляем для обратной совместимости
}