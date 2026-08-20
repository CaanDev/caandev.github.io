/**
 * @fileoverview Сбор предметов игроком.
 * Обрабатывает подбор золота, зелий и артефактов с пола.
 * 
 * @module entities/player/loot
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Сбор предметов с пола (золото и зелья)
 * Проверяет расстояние до каждого предмета и подбирает его
 * 
 * @returns {void}
 */
export function collectLoot() {
  for (let i = state.lootItems.length - 1; i >= 0; i--) {
    let item = state.lootItems[i];

    // Пропускаем интерактивные предметы (их подбирают по E)
    if (item.requiresInteraction === true) continue;

    if (Math.hypot(player.px - item.x, player.py - item.y) < 35) {
      if (item.type === 'gold') {
        handleGoldPickup(item);
      } else if (item.type === 'potion') {
        handlePotionPickup(item);
      }
      state.lootItems.splice(i, 1);
    }
  }
}

/**
 * Обработка подбора золота
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 * @private
 */
function handleGoldPickup(item) {
  const goldAmount = Math.floor(item.value * player.goldMultiplier);
  player.gold += goldAmount;
  state.gameStats.goldCollected += goldAmount;
  
  updateProgress('gold_collected', goldAmount);
  
  Game.updateUI();

  // Определяем биом для частиц золота
  let goldBiome = state.currentBiome || 'cave';
  if (state.inTreasureRoom) goldBiome = 'treasure';
  
  import('../../systems/particles/goldParticles.js').then(module => {
    module.createGoldParticles(item.x, item.y, goldAmount, goldBiome);
  });
}

/**
 * Обработка подбора зелья
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 * @private
 */
function handlePotionPickup(item) {
  const healAmount = item.value;
  const oldHp = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
  const actualHeal = player.hp - oldHp;

  // Обновляем прогресс достижений (только если зелье реально вылечило)
  if (actualHeal > 0) {
    updateProgress('potions_collected', 1);
  }

  import('../../systems/particles/potionParticles.js').then(module => {
    module.createPotionParticles(item.x, item.y, actualHeal);
  });

  if (actualHeal > 0) {
    state.damageTexts.push({
      x: item.x, y: item.y - 20,
      text: `+${actualHeal} ❤️`,
      color: COLORS.effects.poison,
      size: 20, life: 40, speedy: 1.2
    });
  } else {
    state.damageTexts.push({
      x: item.x, y: item.y - 20,
      text: `❤️ Здоровье максимально!`,
      color: COLORS.ui.textGold,
      size: 16, life: 40, speedy: 1.0
    });
  }
}

/**
 * Сбор артефактов с пола
 * Проверяет расстояние до каждого артефакта и подбирает его
 * 
 * @returns {void}
 */
export function collectArtifacts() {
  for (let i = state.artifacts.length - 1; i >= 0; i--) {
    let art = state.artifacts[i];
    if (Math.hypot(player.px - art.x, player.py - art.y) < 35) {
      handleArtifactPickup(art);
      state.artifacts.splice(i, 1);
    }
  }
}

/**
 * Обработка подбора артефакта
 * 
 * @param {Object} art - Объект артефакта
 * @returns {void}
 * @private
 */
function handleArtifactPickup(art) {
  player.artifactsCollected++;
  state.gameStats.artifactsCollected++;
  
  updateProgress('artifacts_collected', 1);

  import('../../systems/particles/artifactParticles.js').then(module => {
    module.createArtifactParticles(art.x, art.y);
  });

  state.damageTexts.push({
    x: art.x, y: art.y - 25,
    text: `+1 👑`,
    color: COLORS.effects.magic,
    size: 22, life: 50, speedy: 1.2
  });
}