/**
 * @fileoverview Конфигурация спрайтов NPC.
 * @module sprites/npcs/npcConfig
 */

import { SPRITE_SIZES } from '../../core/config/index.js';

/**
 * Размер отображения NPC на экране (в пикселях).
 * @type {number}
 */
export const NPC_DISPLAY_SIZE = SPRITE_SIZES.player.displaySize;

/**
 * Порядок направлений (индекс = номер строки в спрайт-листе).
 * @type {string[]}
 */
export const NPC_DIRECTION_ORDER = [
  'south', 'southwest', 'west', 'northwest',
  'north', 'northeast', 'east', 'southeast',
];

/**
 * Маппинг направлений на имена спрайтов в атласе.
 * @type {Object<string, string>}
 */
export const NPC_DIRECTION_SPRITE_NAMES = {
  south: 'south', southwest: 'southwest', west: 'west', northwest: 'northwest',
  north: 'north', northeast: 'northeast', east: 'east', southeast: 'southeast',
};

/**
 * Конфигурация анимаций для каждого NPC.
 * 
 * @type {Object<string, Object>}
 */
export const NPC_ANIMATION_CONFIG = {
  researcher: {
    /** Анимация письма (сидит и пишет) */
    write: {
      frameWidth: 256,
      frameHeight: 256,
      columns: 8,
      rows: 1,
      framesPerDirection: 8,
      totalDirections: 1,
      fps: 5,
      /** Шаблон имени спрайта: researcher_write_{direction}_{frame} */
      spritePattern: 'researcher_write_{direction}_{frame}',
      /** Направление по умолчанию для write */
      defaultDirection: 'south',
    },
    /** Idle (на всякий случай, не используется) */
    idle: {
      frameWidth: 256,
      frameHeight: 256,
      columns: 4,
      rows: 2,
      framesPerDirection: 1,
      totalDirections: 8,
      fps: 1,
      /** Шаблон имени спрайта: researcher_idle_{direction} */
      spritePattern: 'researcher_idle_{direction}',
      /** Направление по умолчанию для idle */
      defaultDirection: 'south',
    },
  },
};

/**
 * Получение конфигурации анимации для NPC.
 * 
 * @param {string} npcId - ID NPC
 * @param {string} animation - Название анимации
 * @returns {Object|null} - Конфигурация анимации или null
 */
export function getNpcAnimationConfig(npcId, animation) {
  const npcConfig = NPC_ANIMATION_CONFIG[npcId];
  if (!npcConfig) return null;
  return npcConfig[animation] || null;
}

/**
 * Получение имени спрайта для конкретного кадра анимации.
 * Универсальная функция - работает для любого NPC и любой анимации
 * на основе spritePattern из конфига.
 * 
 * @param {string} npcId - ID NPC
 * @param {string} animation - Название анимации
 * @param {string} [direction='south'] - Направление
 * @param {number} [frameIndex=0] - Индекс кадра
 * @returns {string|null} - Имя спрайта в атласе или null
 */
export function getNpcSpriteName(npcId, animation, direction = 'south', frameIndex = 0) {
  const config = getNpcAnimationConfig(npcId, animation);
  if (!config) return null;

  // Замена {direction} на конкретное направление
  let name = config.spritePattern.replace('{direction}', direction);
  // Замена {frame} на индекс кадра (если шаблон содержит placeholder)
  if (name.includes('{frame}')) name = name.replace('{frame}', String(frameIndex));

  return name;
}