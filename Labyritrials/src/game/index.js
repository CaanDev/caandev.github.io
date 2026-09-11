/**
 * @fileoverview Точка входа для игровых систем.
 * Экспортирует все модули, связанные с игровым процессом:
 * - Финальный экран
 * - Переходы между уровнями
 * - Меню паузы
 * - Отслеживание времени игры
 * 
 * @module game
 */

// ============================================================
// ФИНАЛЬНЫЙ ЭКРАН
// ============================================================

/**
 * Экспорт функций финального экрана
 * @see module:game/finalScreen
 */
export { showFinalScreen, setupFinalScreenButtons } from './finalScreen.js';

// ============================================================
// ПЕРЕХОД МЕЖДУ УРОВНЯМИ
// ============================================================

/**
 * Экспорт функций управления переходами между уровнями
 * @see module:game/levelTransition
 */
export { 
  addMonsterKilled, 
  resetMonsterKillCounter, 
  getTotalMonstersKilled,
  getTransitionStats,
  setTransitionStatsBonusGold,
  handleClearBonus,
  canAdvanceToNextLevel,
  advanceToNextLevel,
  resetLevelStats
} from './levelTransition.js';

// ============================================================
// МЕНЮ ПАУЗЫ
// ============================================================

/**
 * Экспорт функций управления меню паузы
 * @see module:game/pauseMenu
 */
export { 
  openPauseMenu, 
  closePauseMenu, 
  initPauseMenu, 
  isPauseMenuOpen 
} from './pauseMenu.js';

// ============================================================
// ОТСЛЕЖИВАНИЕ ВРЕМЕНИ ИГРЫ
// ============================================================

/**
 * Экспорт функций отслеживания времени игры
 * @see module:game/playTimeTracker
 */
export {
  startPlayTimeTracking,
  stopPlayTimeTracking,
  pausePlayTimeTracking,
  resumePlayTimeTracking,
  resetPlayTime,
  formatPlayTime,
  updatePlayTimeDisplay
} from './playTimeTracker.js';