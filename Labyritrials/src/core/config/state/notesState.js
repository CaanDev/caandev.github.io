/**
 * @fileoverview Система записок.
 * 
 * @module core/config/state/notesState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  /** @type {Object} - Система записок */
  notes: {
    /** @type {number[]} - Найденные записки (ID) */
    found: [],
    /** @type {Object} - Заспавненные записки по уровням */
    spawned: {},
    /** @type {Object} - Позиции записок на карте */
    positions: {},
  },
  /** @type {boolean} - Показывать ли подсказку записки */
  showNotePrompt: false,
  /** @type {number|null} - ID записки у подсказки */
  notePromptId: null,
  /** @type {number|null} - X позиция записки */
  notePromptX: null,
  /** @type {number|null} - Y позиция записки */
  notePromptY: null,
});