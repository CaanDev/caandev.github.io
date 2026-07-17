/**
 * @fileoverview Основной игровой цикл.
 * Выполняет обновление всех игровых систем в каждом кадре.
 */

import { CONFIG, state, player } from './config/index.js';
import { audio } from '../audio/audioManager.js';
import { Renderer } from './renderer.js';
import { updateBloodDrops, updateLightningSparks } from '../systems/rendering/player/particleSpawner.js';
import { updatePlayer } from '../entities/player/index.js';
import { updateMonsters } from '../entities/monsters/index.js';
import { updateFlies } from '../entities/objects/fly.js';
import { updateGoldParticles } from '../systems/particles/goldParticles.js';
import { handleClearBonus, canAdvanceToNextLevel, advanceToNextLevel } from '../game/levelTransition.js';
import { clearEventEffects, generateRandomEvent, showEventMessage } from '../systems/events/index.js';
import { resetGameFull } from './config/index.js';
import { clearBloodPuddles } from '../entities/objects/utils/bloodSystem.js';
import { generateMaze } from '../world/maze.js';
import { Game } from './game.js';
import { updateFireflies, clearFireflies } from '../entities/objects/firefly.js';
import { updateBossExplosions, clearBossExplosions } from '../systems/particles/bossExplosion.js';
import { updateBossLightFade } from '../systems/rendering/maze/bossLightFade.js';
import { checkBossActivation, updateBossSpawnAnimation } from '../world/arena/bossArena.js';
import { updateRealityShift } from '../systems/rendering/realityShiftRenderer.js';
import { spawnPlayerTrail, updatePlayerTrails, drawPlayerTrails } from '../entities/objects/playerTrails.js';
import { drawAllParticles } from '../systems/rendering/particleRenderer.js';
import { updateExplosion } from '../entities/objects/explosion.js';
import { updateBossSummonCircle } from '../systems/rendering/maze/bossSummonCircle.js';

/** @type {number} - Счётчик кадров для периодических обновлений */
let frameCounter = 0;

/**
 * Создание функции игрового цикла
 * 
 * @param {Function} updateUICallback - Колбэк для обновления UI
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {Function} - Функция обновления игры
 */
export function createGameLoop(updateUICallback, ctx, canvas) {
  return function gameUpdate() {
    // Если открыто окно перехода уровня — только рисуем
    const levelUpUI = document.getElementById('level-up-ui');
    if (levelUpUI && levelUpUI.style.display === 'block') {
      Renderer.draw(ctx, canvas);
      return;
    }
    
    // Если идёт респавн — обрабатываем его
    if (state.isRespawning) {
      handleRespawn();
      return;
    }
    
    // Если игрок мёртв — просто рисуем и выходим
    if (player.hp <= 0) {
      Renderer.draw(ctx, canvas);
      return;
    }
    
    state.gameOverShown = false;

    // Обновление игровых систем
    updatePlayer();
    updateMonsters();
    updateBossSummonCircle();
    updateBossLightFade();

    spawnPlayerTrail();
    updatePlayerTrails();

    // Активация босса на босс-уровне
    if (state.isBossLevel && !state.bossSpawned) {
      checkBossActivation();
      updateBossSpawnAnimation();
    }

    // Обновление эффектов и частиц
    updateFlies();
    updateSparks();
    updateFireflies();
    updateBloodDrops();
    updateLightningSparks();
    updateBossExplosions();
    updateRealityShift();
    updateExplosion();

    // Бонус за зачистку уровня
    handleClearBonus();

    // Обновление звуков шагов
    audio.updateSteps();

    frameCounter++;

    // Обновление частиц золота (каждый 2-й кадр)
    if (frameCounter % 2 === 0) updateGoldParticles();

    // Проверка перехода на следующий уровень
    if (!state.inTreasureRoom && 
        player.x === CONFIG.goal.x && 
        player.y === CONFIG.goal.y && 
        canAdvanceToNextLevel()) {
      advanceToNextLevel(updateUICallback);
      return;
    }

    // Обновление UI и рендеринг
    if (updateUICallback) updateUICallback();
    Renderer.draw(ctx, canvas);
  };
}

/**
 * Обработка респавна игрока
 * 
 * @returns {void}
 */
function handleRespawn() {
  state.isRespawning = false;
  clearEventEffects();
  resetGameFull();
  state.bonusGiven = false;
  generateMaze();
  generateRandomEvent();
  clearBloodPuddles();
  clearFireflies();
  state.fireParticles = [];
  state.goldParticles = [];
  clearBossExplosions();
  
  setTimeout(() => {
    showEventMessage();
    if (Game && Game.startLoop) {
      Game.startLoop();
    }
  }, 100);
}

/**
 * Обновление состояния искр (частиц)
 * 
 * @returns {void}
 */
function updateSparks() {
  if (!state.sparks) return;
  
  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    
    if (s.gravity !== undefined && s.gravity !== 0) {
      s.vy += s.gravity;
    } else if (s.gravity === undefined) {
      s.vy += 0.15;
    }
    
    s.life--;
    
    if (s.life <= 0) {
      state.sparks.splice(i, 1);
    }
  }
}