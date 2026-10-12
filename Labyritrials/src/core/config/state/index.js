/**
 * @fileoverview Точка входа для модульной системы состояния игры.
 * Импортирует все модули-расширения и экспортирует единый объект state.
 * 
 * @module core/config/state
 */

// База
import { state } from './stateBase.js';

// Модули-расширения (side-effect imports заполняют state)
import './worldState.js';
import './playerState.js';
import './npcState.js';
import './roomState.js';
import './bossState.js';
import './effectsState.js';
import './notesState.js';
import './fogState.js';
import './progressState.js';
import './uiState.js';
import './flagsState.js';

export { state };