/**
 * @fileoverview Обработка смерти игрока.
 * Управляет завершением игры, отображением окна смерти и перезапуском.
 * 
 * @module entities/player/gameOver
 */

import { state, player, CONFIG } from '../../core/config/index.js';
import { getBiomeByLevel, getBiomeConfig } from '../../core/config/biomes.js';
import { logger } from '../../utils/logger.js';
import { audio } from '../../audio/audioManager.js';
import { resetMimicStreak } from './interaction.js';
import { updateProgress } from '../../systems/achievements/index.js';
import { Game } from '../../core/game.js';
import { showGameOverScreen } from '../../core/config/functions.js';

/** @type {number} - Количество золота на момент смерти */
let goldAtDeath = 0;
/** @type {boolean} - Флаг предотвращения повторных вызовов */
let isGameOverInProgress = false;

/**
 * Логика завершения игры при гибели персонажа
 * 
 * Выполняет следующие действия:
 * 1. Сохраняет золото на момент смерти
 * 2. Останавливает звуки и эффекты
 * 3. Очищает игровые массивы
 * 4. Обновляет прогресс достижений
 * 5. Показывает окно смерти
 * 6. Настраивает кнопку перезапуска
 * 
 * @returns {void}
 */
export function triggerGameOver() {
  // Защита от повторного вызова
  if (isGameOverInProgress) return;
  isGameOverInProgress = true;

  // ===== СОХРАНЕНИЕ ЗОЛОТА =====
  goldAtDeath = player.gold;

  // ===== ОСТАНОВКА ЗВУКОВ =====
  if (player._shockSound) {
    audio.stopEffectSound(player._shockSound);
    player._shockSound = null;
  }
  audio.stopAllEffects();

  // ===== ОЧИСТКА ИГРОВЫХ МАССИВОВ =====
  state.monsters = [];
  state.lootItems = [];
  state.traps = [];
  state.artifacts = [];
  state.damageTexts = [];
  state.safeChestOpened = false;
  player.hp = 0;

  // ===== ДОСТИЖЕНИЯ =====
  if (state.gameLevel === 1) {
    updateProgress('death_on_level_1', 1);
  }

  // ===== СБРОС ФЛАГОВ =====
  state.shadowActive = true;
  resetMimicStreak();

  import('../../game/levelTransition.js').then(module => {
    module.resetLevelStreak();
  });

  if (state.achievements && state.achievements.progress) {
    state.achievements.progress.level_5_reached = 0;
    state.achievements.progress.level_10_reached = 0;
    state.achievements.progress.level_15_reached = 0;
    state.achievements.progress.weapons_bought = 0;
  }

  // ===== УДАЛЕНИЕ СОХРАНЕНИЯ =====
  import('../../save/saveStorage.js').then(({ deleteSave }) => {
    deleteSave();
    logger.info('🗑️ Сохранение удалено');
  });
  
  // ===== ПОКАЗ ОКНА СМЕРТИ =====
  showGameOverScreen(goldAtDeath);

  // Дополнительное удаление сохранения (на случай автосохранения)
  import('../../save/saveStorage.js').then(({ deleteSave }) => {
    deleteSave();
  });

  // ===== НАСТРОЙКА КНОПКИ ПЕРЕЗАПУСКА =====
  initRestartHandler();

  // Сбрасываем флаг через небольшую задержку
  setTimeout(() => {
    isGameOverInProgress = false;
  }, 500);
}

/**
 * Инициализация обработчика кнопки перезапуска
 * 
 * @returns {void}
 */
export function initRestartHandler() {
  const restartBtn = document.getElementById('restart-btn');
  if (!restartBtn) return;
  
  // Удаляем старые обработчики (чтобы избежать дублирования)
  const newBtn = restartBtn.cloneNode(true);
  restartBtn.parentNode.replaceChild(newBtn, restartBtn);
  
  newBtn.addEventListener('click', () => {
    // ===== СКРЫТИЕ ОКНА СМЕРТИ =====
    const gameOverUI = document.getElementById('game-over-ui');
    if (gameOverUI) gameOverUI.style.display = 'none';
    
    // ===== ПОКАЗ UI =====
    const gameUI = document.getElementById('ui');
    if (gameUI) gameUI.style.display = 'block';
    
    // ===== ЗАПУСК РЕСПАВНА =====
    state.isRespawning = true;
    state.bonusGiven = false;
    state.hadMonsters = false;
    state.gameOverShown = false;
    
    // ===== СБРОС ФЛАГОВ ДОСТИЖЕНИЙ =====
    state.ironManActive = true;
    state.shadowActive = true;
    
    // ===== СБРОС СЧЁТЧИКОВ =====
    import('../../game/levelTransition.js').then(module => {
      module.resetLevelStreak();
    });
    resetMimicStreak();
    
    // ===== ОСТАНОВКА ЗВУКОВ =====
    audio.stopAllEffects();
    if (player._shockSound) {
      audio.stopEffectSound(player._shockSound);
      player._shockSound = null;
    }
    
    // ===== СБРОС СОСТОЯНИЯ =====
    resetPlayerState();
    
    // ===== ПЕРЕЗАПУСК ИГРЫ =====
    startNewGameAfterDeath();
  });
}

/**
 * Сброс состояния игрока
 * 
 * @returns {void}
 * @private
 */
function resetPlayerState() {
  // ===== ХАРАКТЕРИСТИКИ =====
  player.gold = 0;
  player.hp = player.maxHp;
  player.artifactsCollected = 0;
  player.baseDamage = 20;
  player.incomingDamageMultiplier = 1.0;
  
  // ===== ЭФФЕКТЫ =====
  player.isFrozen = false;
  player.freezeTimer = 0;
  player.shockTimer = 0;
  player.shockTick = 0;
  player.poisonTimer = 0;
  player.poisonTick = 0;
  player.slowTimer = 0;
  player.controlsInverted = false;
  player.invertTimer = 0;
  
  // ===== АТАКА =====
  player.isCharging = false;
  player.chargeTime = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  player.attackExecuted = false;
  player.fireballCooldown = 0;
  
  // ===== СКОРОСТЬ =====
  player.speed = player.baseSpeed;
  player.originalSpeed = undefined;
  
  // ===== ОРУЖИЕ =====
  player.hasMap = false;
  player.meleeWeapon = 'default';
  player.ownedMeleeWeapons = ['default'];
  player.rangedWeapon = null;
  player.ownedRangedWeapons = [];
  player.hpCost = 30;
  player.dmgCost = 40;
  
  // ===== МНОЖИТЕЛИ =====
  player.goldMultiplier = 1.0;
  player.vampireHealMultiplier = 1.0;
  player.eventDamageMultiplier = 1.0;
  player.eventSpeedBonus = 0;
  player.eventGoldMultiplier = 1.0;
  player.eventSlowMultiplier = 1.0;
  
  // ===== ПОЗИЦИЯ =====
  player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.x = 1;
  player.y = 1;
  player.dirX = 0;
  player.dirY = 1;
  player.lastMoveDirX = 0;
  player.lastMoveDirY = 1;
  player.trapGlowColor = null;
  player.trapGlowTimer = 0;
  
  // ===== АДАПТАЦИИ МОНСТРОВ =====
  state.monsterAdaptation = {
    fireImmunity: false,
    stunImmunity: false,
    healingBlock: false,
    healthBoost: false,
  };
  state.totalAttacks = {
    fireball: 0,
    stun: 0,
    vampirism: 0,
    magic: 0,
  };
  
  // ===== СОБЫТИЯ =====
  state.currentEvent = null;
  state.eventMessageShown = false;
  state.bloodMoonActive = false;
  state.eventIceWindActive = false;
  state.eventMonsterRageActive = false;
  
  // ===== СОСТОЯНИЕ ИГРЫ =====
  state.isBossLevel = false;
  state.bossSpawned = false;
  state.bossSpawnTriggered = false;
  state.bossSpawnTimer = 0;
  state.bossReady = false;
  state.inTreasureRoom = false;
  state.inShrineRoom = false;
  state.inTrapRoom = false;
  state.inSafeRoom = false;
  state.safeChestOpened = false;
  state.treasurePortal = null;
  state.treasureExitPortal = null;
  state.shrinePortal = null;
  state.shrineExitPortal = null;
  state.trapPortal = null;
  state.trapFakePortal = null;
  state.trapExitPortal = null;
  state.safePortal = null;
  state.safeExitPortal = null;
  state.returnPortal = null;
  state.secretPortal = null;
  state.exitPortal = null;
  state.trapActivated = false;
  state.trapWave = 0;
  state.trapMonsters = [];
  state.trapMonstersTotal = 0;
  state.trapMonstersKilled = 0;
  state.trapWaveActive = false;
  state.trapExitRevealed = false;
  state.trapWaveLoaded = false;
  state.trapMonsterIds = new Set();
  state.roomLabel = null;
  state.roomLabelColor = null;
  state.bonusGiven = false;
  state.hadMonsters = false;
  state.justLoaded = false;
  state.screenShake = 0;
  state.isShopOpen = false;
  state.showShopPrompt = false;
  state.realityShift = { active: false, intensity: 0, timer: 0 };
  state.psionicWave = null;
  state.shockwave = null;
  
  // ===== ОЧИСТКА МАССИВОВ =====
  state.monsters = [];
  state.lootItems = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.damageTexts = [];
  state.fireballs = [];
  state.torches = [];
  state.fireParticles = [];
  state.sparks = [];
  state.flies = [];
  state.bloodPuddles = [];
  state.pillars = [];
  state.runes = [];
  state.fireflies = [];
  state.beams = [];
  state.bloodDrops = [];
  state.lightningSparks = [];
  state.shockSparks = [];
  state.poisonBubbles = [];
  state.explosionParticles = [];
  state.playerTrails = [];
  state.goldParticles = [];
  state.artifactParticles = [];
  state.potionParticles = [];
  state.bossExplosions = [];
  state.realityParticles = [];
}

/**
 * Запуск новой игры после смерти
 * 
 * @returns {Promise<void>}
 * @private
 */
async function startNewGameAfterDeath() {
  try {
    // ===== ИМПОРТ МОДУЛЕЙ =====
    const { resetGameFull } = await import('../../core/config/functions.js');
    const { generateMaze } = await import('../../world/maze.js');
    const { generateRandomEvent } = await import('../../systems/events/index.js');
    const { resetAdaptations } = await import('../monsters/adaptations/index.js');
    const { clearPlayerTrails } = await import('../objects/playerTrails.js');
    
    // ===== СБРОС =====
    resetGameFull();
    resetAdaptations();
    clearPlayerTrails();

    // ===== ОПРЕДЕЛЕНИЕ БИОМА ПОСЛЕ СБРОСА =====
    state.currentBiome = getBiomeByLevel(state.gameLevel);
    const biomeConfig = getBiomeConfig(state.currentBiome);
    logger.game(`🌍 БИОМ: ${biomeConfig.name} (${state.currentBiome}) | Уровень ${state.gameLevel}`);
    
    // ===== ГЕНЕРАЦИЯ =====
    generateMaze(true);
    generateRandomEvent();
    
    // ===== ОБНОВЛЕНИЕ UI =====
    Game.updateUI();
    
    const controlButtons = document.getElementById('control-buttons-container');
    if (controlButtons) controlButtons.style.display = 'flex';
    
    // ===== ПОЗИЦИЯ ИГРОКА =====
    player.x = 1;
    player.y = 1;
    player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
    
    // ===== ЗАПУСК =====
    Game.startLoop();
    
    const { deleteSave } = await import('../../save/saveStorage.js');
    deleteSave();
    
    const chargeVal = document.getElementById('charge-val');
    if (chargeVal) chargeVal.innerText = 'Обычный';
    
    logger.info('🔄 Игра перезапущена после смерти');
    
  } catch (err) {
    logger.error('❌ Ошибка при перезапуске игры:', err);
    alert('❌ Произошла ошибка при перезапуске! Перезагрузите страницу.');
    window.location.reload();
  }
}