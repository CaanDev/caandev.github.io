/**
 * @fileoverview Проверка и обработка взаимодействия с порталами.
 * Обрабатывает вход в секретные комнаты, выход из них и перемещение в безопасную комнату.
 * 
 * @module entities/player/portals
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { removeFirefliesForPortal, updateFirefliesColor } from '../objects/firefly.js';
import { resetTrailPosition } from '../objects/playerTrails.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Проверка входа в портал сокровищницы
 * 
 * @returns {boolean} - true, если игрок вошёл в портал
 */
export function checkSecretPortal() {
  if (state.inTreasureRoom) return false;
  if (!state.treasurePortal || !state.treasurePortal.active) return false;

  const isOnPortal = (player.x === state.treasurePortal.x && player.y === state.treasurePortal.y);

  if (isOnPortal) {
    audio.playSound('interactions.portalActivate');
    
    state.gameStats.secretRoomsVisited++;
    updateProgress('treasure_room_found', 1);
    checkAdventurerProgress();

    removeFirefliesForPortal(state.treasurePortal.x, state.treasurePortal.y);
    resetTrailPosition();
    state.screenShake = 10;

    import('../../world/rooms/treasureRoom.js').then(module => {
      module.generateTreasureMap();
    });
    return true;
  }
  return false;
}

/**
 * Проверка выхода из сокровищницы
 * 
 * @returns {boolean} - true, если игрок вышел через портал
 */
export function checkExitPortal() {
  if (!state.inTreasureRoom) return false;
  if (!state.treasureExitPortal || !state.treasureExitPortal.active) return false;

  const isOnPortal = (player.x === state.treasureExitPortal.x && player.y === state.treasureExitPortal.y);

  if (isOnPortal) {
    audio.playSound('interactions.portalActivate');
    
    resetTrailPosition();
    state.screenShake = 8;

    import('../../world/rooms/treasureRoom.js').then(module => {
      module.returnFromTreasureRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка входа в портал комнаты с алтарём
 * 
 * @returns {boolean} - true, если игрок вошёл в портал
 */
export function checkShrinePortal() {
  if (state.inShrineRoom) return false;
  if (!state.shrinePortal || !state.shrinePortal.active) return false;

  const isOnPortal = (player.x === state.shrinePortal.x && player.y === state.shrinePortal.y);

  if (isOnPortal) {
    audio.playSound('interactions.portalActivate');
    
    state.gameStats.secretRoomsVisited++;
    updateProgress('shrine_room_found', 1);
    checkAdventurerProgress();

    removeFirefliesForPortal(state.shrinePortal.x, state.shrinePortal.y);
    resetTrailPosition();
    state.screenShake = 10;

    import('../../world/rooms/shrineRoom.js').then(module => {
      module.generateShrineRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка выхода из комнаты с алтарём
 * 
 * @returns {boolean} - true, если игрок вышел через портал
 */
export function checkShrineRoomExit() {
  if (!state.inShrineRoom) return false;
  if (!state.shrineExitPortal || !state.shrineExitPortal.active) return false;

  const isOnExit = (player.x === state.shrineExitPortal.x && player.y === state.shrineExitPortal.y);

  if (isOnExit) {
    audio.playSound('interactions.portalActivate');
    
    resetTrailPosition();
    state.screenShake = 8;

    import('../../world/rooms/shrineRoom.js').then(module => {
      module.returnFromShrineRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка входа в портал комнаты-ловушки
 * 
 * @returns {boolean} - true, если игрок вошёл в портал
 */
export function checkTrapPortal() {
  if (state.inTrapRoom) return false;
  if (!state.trapPortal || !state.trapPortal.active) return false;

  const isOnPortal = (player.x === state.trapPortal.x && player.y === state.trapPortal.y);

  if (isOnPortal) {
    audio.playSound('interactions.portalActivate');
    
    state.gameStats.secretRoomsVisited++;
    updateProgress('trap_room_found', 1);
    checkAdventurerProgress();

    removeFirefliesForPortal(state.trapPortal.x, state.trapPortal.y);
    resetTrailPosition();
    state.screenShake = 10;

    import('../../world/rooms/trapRoom/index.js').then(module => {
      module.generateTrapRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка выхода из комнаты-ловушки
 * 
 * @returns {boolean} - true, если игрок вышел через портал
 */
export function checkTrapRoomExit() {
  if (!state.inTrapRoom) return false;
  if (!state.trapExitPortal || !state.trapExitPortal.active) return false;

  const isOnExit = (player.x === state.trapExitPortal.x && player.y === state.trapExitPortal.y);

  if (isOnExit) {
    audio.playSound('interactions.portalActivate');
    
    resetTrailPosition();
    state.screenShake = 8;

    import('../../world/rooms/trapRoom/index.js').then(module => {
      module.returnFromTrapRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка фальшивого портала в комнате-ловушке (активирует ловушку)
 * 
 * @returns {boolean} - true, если игрок активировал ловушку
 */
export function checkFakeTrapPortal() {
  if (!state.inTrapRoom) return false;
  if (state.trapActivated) return false;
  if (!state.trapFakePortal || !state.trapFakePortal.active) return false;

  const isOnFakePortal = (player.x === state.trapFakePortal.x && player.y === state.trapFakePortal.y);

  if (isOnFakePortal) {
    audio.playSound('interactions.portalActivate');
    
    import('../../world/rooms/trapRoom/index.js').then(module => {
      module.activateTrapRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка входа в портал безопасной комнаты
 * 
 * @returns {boolean} - true, если игрок вошёл в портал
 */
export function checkSafePortal() {
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;
  if (isBossLevel) return false;
  
  if (state.inSafeRoom) return false;
  if (!state.safePortal) return false;
  if (!state.safePortal.active) return false;

  const isOnPortal = (player.x === state.safePortal.x && player.y === state.safePortal.y);

  if (isOnPortal) {
    audio.playSound('interactions.portalActivate');
    
    state.gameStats.secretRoomsVisited++;
    
    import('../../world/rooms/safeRoom.js').then(module => {
      module.generateSafeRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка выхода из безопасной комнаты
 * 
 * @returns {boolean} - true, если игрок вышел через портал
 */
export function checkSafeRoomExit() {
  if (!state.inSafeRoom) return false;
  if (!state.safeExitPortal || !state.safeExitPortal.active) return false;

  const isOnExit = (player.x === state.safeExitPortal.x && player.y === state.safeExitPortal.y);

  if (isOnExit) {
    audio.playSound('interactions.portalActivate');
    
    import('../../world/rooms/safeRoom.js').then(module => {
      module.returnFromSafeRoom();
    });
    return true;
  }
  return false;
}

/**
 * Проверка прогресса достижения "Авантюрист"
 * 
 * @returns {void}
 * @private
 */
function checkAdventurerProgress() {
  const progress = state.achievements?.progress || {};
  let count = 0;
  if (progress.treasure_room_found) count++;
  if (progress.shrine_room_found) count++;
  if (progress.trap_room_found) count++;
}