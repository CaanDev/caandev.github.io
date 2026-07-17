/**
 * @fileoverview Точка входа для комнаты-ловушки.
 * Экспортирует все функции для работы с комнатой-ловушкой.
 * 
 * @module world/rooms/trapRoom/index
 */

export {
  generateTrapPortal,
  generateTrapRoom,
  returnFromTrapRoom
} from './trapRoomCore.js';

export {
  startNextWave,
  checkTrapWaveComplete,
  spawnTrapMonsters
} from './trapRoomWaves.js';

export {
  generateEmptyArena,
  setupTrapTorches,
  createFakeExitPortal,
  showRealExitPortal,
  activateTrapRoom
} from './trapRoomSetup.js';

export {
  spawnTrapRoomBloodstains,
  setTorchesColor,
  showTrapRoomActivationNotification,
  showTrapWaveNotification,
  showTrapExitNotification
} from './trapRoomUtils.js';