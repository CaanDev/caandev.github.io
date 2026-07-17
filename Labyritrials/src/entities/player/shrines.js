/**
 * @fileoverview Взаимодействие со святилищами (алтарями).
 * Обрабатывает активацию алтарей и применение их эффектов к игроку.
 * 
 * @module entities/player/shrines
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Взаимодействие со святилищами (алтарями)
 * Проверяет, находится ли игрок рядом с неактивным алтарём
 * 
 * @returns {void}
 */
export function interactWithShrines() {
  for (let sh of state.shrines) {
    if (!sh.activated && Math.hypot(player.px - sh.x, player.py - sh.y) < 50) {
      sh.activated = true;

      // Обновляем прогресс достижения "Мистическая встреча"
      updateProgress('shrine_activated', 1);

      // ===== ПРИМЕНЕНИЕ ЭФФЕКТА АЛТАРЯ =====
      switch (sh.effect) {
        case 'berserk':
          // Берсерк: +15 урона, -25 HP
          player.baseDamage += 15;
          player.maxHp = Math.max(25, player.maxHp - 25);
          player.hp = Math.min(player.maxHp, player.hp);
          break;
          
        case 'greed':
          // Жадность: x2 золото, -1.5 скорости
          player.goldMultiplier = 2.0;
          player.baseSpeed = Math.max(3, player.baseSpeed - 1.5);
          break;
          
        case 'vampire':
          // Вампиризм: x2 лечение, -15 урона
          player.vampireHealMultiplier = 2.0;
          player.baseDamage = Math.max(5, player.baseDamage - 15);
          break;
          
        case 'guardian':
          // Страж: +50 HP, -5 урона
          player.maxHp += 50;
          player.hp += 50;
          player.baseDamage = Math.max(5, player.baseDamage - 5);
          break;
      }

      // Очистка рун в комнате с алтарём
      if (state.inShrineRoom) {
        clearShrineRunes();
      }

      // Визуальные эффекты
      state.screenShake = 15;
      state.damageTexts.push({
        x: sh.x, y: sh.y - 40,
        text: sh.effectText,
        color: COLORS.effects.magic,
        size: 20, life: 120, speedy: 0.5
      });
    }
  }
}

/**
 * Очистка рун в комнате с алтарём
 * Создаёт эффект исчезновения рун
 * 
 * @returns {void}
 * @private
 */
function clearShrineRunes() {
  if (!state.runes || state.runes.length === 0) return;

  // Создаём искры для каждой руны
  for (const rune of state.runes) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const x = rune.x * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetX * CONFIG.cellSize;
      const y = rune.y * CONFIG.cellSize + CONFIG.cellSize / 2 + rune.offsetY * CONFIG.cellSize;

      state.sparks.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: 2 + Math.random() * 3,
        color: COLORS.effects.magic,
        gravity: 0.05
      });
    }
  }

  state.runes = [];
}