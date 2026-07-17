/**
 * @fileoverview Вспомогательные функции для способностей боссов.
 * Предоставляет утилиты для призыва миньонов и создания визуальных эффектов.
 * 
 * @module entities/monsters/bosses/abilities/helpers
 */

import { CONFIG, state } from '../../../../core/config/index.js';
import { EMOJIS } from '../../../../emojis.js';
import { COLORS } from '../../../../core/config/colors.js';

/**
 * Призыв миньонов вокруг босса
 * 
 * Создаёт указанное количество миньонов в случайных позициях вокруг босса.
 * Миньоны масштабируются в зависимости от уровня игры.
 * Только первые 7 миньонов могут дропать предметы.
 * 
 * @param {Object} boss - Объект босса, вокруг которого призываются миньоны
 * @param {number} count - Количество миньонов для призыва
 * @returns {void}
 */
export function summonMinionsAroundBoss(boss, count) {
  // Масштабирование характеристик в зависимости от уровня
  const scaling = 1 + (state.gameLevel - 1) * 0.15;

  // Доступные типы миньонов
  const minionTypes = [
    { emoji: EMOJIS.minions.ghost, hp: 20, damage: 8, radius: 22, name: "Призрак-миньон", speed: 1.8, vision: 300 },
    { emoji: EMOJIS.minions.pumpkin, hp: 40, damage: 14, radius: 24, name: "Тыква-миньон", speed: 2.2, vision: 350 },
    { emoji: EMOJIS.minions.skull, hp: 60, damage: 20, radius: 22, name: "Череп-миньон", speed: 2.5, vision: 380 }
  ];

  // Инициализация счётчика дропа, если его нет
  if (state.bossMinionDropCounter === undefined) {
    state.bossMinionDropCounter = 0;
  }

  for (let i = 0; i < count; i++) {
    state.bossMinionDropCounter++;
    const minionNumber = state.bossMinionDropCounter;
    // Только первые 7 миньонов могут дропать предметы
    const shouldDropItems = minionNumber <= 7;

    // Выбор случайного типа миньона
    const template = minionTypes[Math.floor(Math.random() * minionTypes.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 70;

    const minionX = boss.x + Math.cos(angle) * distance;
    const minionY = boss.y + Math.sin(angle) * distance;

    const gridX = Math.floor(minionX / CONFIG.cellSize);
    const gridY = Math.floor(minionY / CONFIG.cellSize);

    let minion;

    // Проверка, находится ли позиция в пределах карты
    if (gridX > 0 && gridX < CONFIG.cols - 1 && gridY > 0 && gridY < CONFIG.rows - 1) {
      minion = {
        x: minionX, y: minionY, startX: minionX, startY: minionY,
        hp: Math.floor(template.hp * scaling), maxHp: Math.floor(template.hp * scaling),
        damage: Math.floor(template.damage * scaling), emoji: template.emoji,
        radius: template.radius, name: template.name, speed: template.speed, vision: template.vision,
        dir: 1, isHorizontal: Math.random() < 0.5,
        patrolRange: CONFIG.cellSize * (Math.floor(Math.random() * 2) + 1),
        state: 'chase', lastHit: 0, stunTimer: 0, poisonTimer: 0, poisonTick: 0,
        isMinion: true,
        canDropItems: shouldDropItems
      };
    } else {
      // Fallback-позиция, если расчётная вышла за границы
      minion = {
        x: boss.x + (Math.random() - 0.5) * 100,
        y: boss.y + (Math.random() - 0.5) * 100,
        startX: boss.x,
        startY: boss.y,
        hp: Math.floor(template.hp * scaling),
        maxHp: Math.floor(template.hp * scaling),
        damage: Math.floor(template.damage * scaling),
        emoji: template.emoji,
        radius: template.radius,
        name: template.name,
        speed: template.speed,
        vision: template.vision,
        dir: 1,
        isHorizontal: Math.random() < 0.5,
        patrolRange: CONFIG.cellSize,
        state: 'chase',
        lastHit: 0,
        stunTimer: 0,
        poisonTimer: 0,
        poisonTick: 0,
        isMinion: true,
        canDropItems: shouldDropItems
      };
    }

    // Добавляем миньона в игровой мир
    state.monsters.push(minion);
  }
}

/**
 * Создание визуального эффекта вспышки телепортации
 * 
 * Генерирует множество искр магического цвета в указанной позиции.
 * 
 * @param {number} x - Координата X центра вспышки
 * @param {number} y - Координата Y центра вспышки
 * @returns {void}
 */
export function createTeleportFlash(x, y) {
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    state.sparks.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 15 + Math.random() * 15,
      maxLife: 30,
      size: 2 + Math.random() * 4,
      color: COLORS.effects.magic,
      gravity: 0.1
    });
  }
}