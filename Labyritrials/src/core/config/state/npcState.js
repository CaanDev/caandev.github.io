/**
 * @fileoverview Состояние NPC
 * Хранит данные о состоянии каждого NPC в игре.
 * 
 * @module core/config/state/npcState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /**
   * @type {Object} - Состояния NPC по их ID.
   * Ключ - ID NPC.
   * Значение - объект с текущим состоянием.
   */
  npcState: {
    // Торговец
    trader: 'not_met',
    // Исследовательница
    researcher: 'not_met',
  },

  /**
   * @type {Object} - Данные исследовательницы
   * Хранит координаты и метаданные, когда NPC активна (в лабиринте или safeRoom).
   */
  researcher: {
    // @type {string} - Текущий статус (дублирует state.npcState.researcher для удобства).
    status: 'not_met',
    // @type {number|null} - Пиксельная координата X (в мире).
    x: null,
    // @type {number|null} - Пиксельная координата Y (в мире).
    y: null,
    // @type {number|null} - Координата X по сетке.
    gridX: null,
    // @type {number|null} - Координата Y по сетке.
    gridY: null,
    // @type {number|null} - Уровень, на котором заспавнилась исследовательница в лабиринте.
    spawnLevel: null,
    // @type {boolean} - Направление "вниз" (idle) - на будущее для аниматора.
    direction: 'south',
    // @type {boolean} - Готова ли исследовательница к удалению из лабиринта (для отложенного удаления).
    pendingRemoval: false,
    // @type {number} - Игровое время начала изучения огоньков
    studyStartTime: 0,
  },
});