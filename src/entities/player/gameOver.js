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
import { showCharacterSelect } from '../../systems/ui/characterSelect.js';
import { Game } from '../../core/game.js';
import { showGameOverScreen } from '../../core/config/functions.js';
import { updateProgress } from '../../systems/achievements/index.js';
import { clearBloodTrails } from './bloodTrails.js';
import { exitToMainMenu } from '../../utils/exitToMainMenu.js';

/** @type {number} - Количество золота на момент смерти */
let goldAtDeath = 0;
/** @type {boolean} - Флаг предотвращения повторных вызовов */
let isGameOverInProgress = false;

/**
 * Логика завершения игры при гибели персонажа
 * 
 * @returns {void}
 */
export function triggerGameOver() {
  // Защита от повторного вызова
  if (isGameOverInProgress) return;
  isGameOverInProgress = true;

  // Принудительная остановка сердцебиения игрока
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });

  // Сохранение золота
  goldAtDeath = player.gold;

  // Остановка звуков
  if (player._shockSound) {
    audio.stopEffectSound(player._shockSound);
    player._shockSound = null;
  }
  audio.stopAllEffects();

  // Очистка игровых массивов
  state.monsters = [];
  state.lootItems = [];
  state.traps = [];
  state.artifacts = [];
  state.damageTexts = [];
  state.safeChestOpened = false;
  player.hp = 0;

  // Достижения
  if (state.gameLevel === 1) updateProgress('death_on_level_1', 1);

  // Сброс флагов
  state.shadowActive = true;

  import('../../game/levelTransition.js').then(module => {
    module.resetLevelStreak();
  });

  if (state.achievements && state.achievements.progress) {
    state.achievements.progress.level_5_reached = 0;
    state.achievements.progress.level_10_reached = 0;
    state.achievements.progress.level_15_reached = 0;
    state.achievements.progress.weapons_bought = 0;
  }

  // Удаление сохранения
  import('../../save/saveStorage.js').then(({ deleteSave }) => {
    deleteSave();
    logger.info('🗑️ Сохранение удалено');
  });
  
  // Показ окна смерти
  showGameOverScreen(goldAtDeath);

  // Дополнительное удаление сохранения (на случай автосохранения)
  import('../../save/saveStorage.js').then(({ deleteSave }) => {
    deleteSave();
  });

  // Настройка кнопок
  initRestartHandler();
  initMenuHandler();

  // Сброс флага через небольшую задержку
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
  
  // Удаление старых обработчиков (чтобы избежать дублирования)
  const newBtn = restartBtn.cloneNode(true);
  restartBtn.parentNode.replaceChild(newBtn, restartBtn);
  
  newBtn.addEventListener('click', () => {
    // Скрытие окна смерти
    const gameOverUI = document.getElementById('game-over-ui');
    if (gameOverUI) gameOverUI.style.display = 'none';
    
    // Показ окна выбора персонажа
    showCharacterSelect(async (gender) => {
      // Установка пола персонажа
      player.gender = gender;
      
      // Применение пола к аниматору
      const { playerAnimator } = await import('../../sprites/index.js');
      playerAnimator.setGender(gender);
      
      // Запуск респавна
      state.isRespawning = true;
      state.bonusGiven = false;
      state.hadMonsters = false;
      state.gameOverShown = false;
      
      // Сброс флагов достижений
      state.ironManActive = true;
      state.shadowActive = true;
      
      // Сброс счётчиков
      import('../../game/levelTransition.js').then(module => {
        module.resetLevelStreak();
      });
      
      // Остановка звуков
      audio.stopAllEffects();
      if (player._shockSound) {
        audio.stopEffectSound(player._shockSound);
        player._shockSound = null;
      }
      
      // Сброс состояния
      resetPlayerState();
      // Перезапуск игры
      startNewGameAfterDeath();
    }, 'gameOver');
  });
}

/**
 * Инициализация обработчика кнопки возврата в главное меню
 * 
 * @returns {void}
 */
function initMenuHandler() {
  const menuBtn = document.getElementById('game-over-menu-btn');
  if (!menuBtn) return;
  
  // Удаление старых обработчиков
  const newBtn = menuBtn.cloneNode(true);
  menuBtn.parentNode.replaceChild(newBtn, menuBtn);
  
  newBtn.addEventListener('click', async () => {
    // Скрытие окна смерти
    const gameOverUI = document.getElementById('game-over-ui');
    if (gameOverUI) gameOverUI.style.display = 'none';
    
    // Выход в главное меню (без подтверждения, так как сохранение уже удалено)
    await exitToMainMenu(true);
  });
}

/**
 * Сброс состояния игрока
 * 
 * @returns {void}
 * @private
 */
function resetPlayerState() {
  // Характеристики
  player.gold = 0;
  player.hp = player.maxHp;
  player.artifactsCollected = 0;
  player.baseDamage = 20;
  player.incomingDamageMultiplier = 1.0;
  
  // Выносливость
  player.stamina = player.maxStamina;
  player.lastAttackTime = 0;
  
  // Эффекты
  player.isFrozen = false;
  player.freezeTimer = 0;
  player.shockTimer = 0;
  player.shockTick = 0;
  player.poisonTimer = 0;
  player.poisonTick = 0;
  player.slowTimer = 0;
  player.controlsInverted = false;
  player.invertTimer = 0;
  
  // Атака
  player.isCharging = false;
  player.chargeTime = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  player.attackExecuted = false;
  player.fireballCooldown = 0;
  
  // Скорость
  player.speed = player.baseSpeed;
  player.originalSpeed = undefined;
  
  // Оружие
  player.hasMap = false;
  player.meleeWeapon = 'default';
  player.ownedMeleeWeapons = ['default'];
  player.rangedWeapon = null;
  player.ownedRangedWeapons = [];
  player.hpCost = 30;
  player.dmgCost = 40;
  
  // Очистка следов крови
  clearBloodTrails();

  // Множители
  player.goldMultiplier = 1.0;
  player.vampireHealMultiplier = 1.0;
  player.eventDamageMultiplier = 1.0;
  player.eventSpeedBonus = 0;
  player.eventGoldMultiplier = 1.0;
  player.eventSlowMultiplier = 1.0;
  
  // Позиция
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
  
  // Адаптации монстров
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
  
  // События
  state.currentEvent = null;
  state.eventMessageShown = false;
  state.bloodMoonActive = false;
  state.eventIceWindActive = false;
  state.eventMonsterRageActive = false;
  
  // Состояние игры
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
  
  // Очистка массивов
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
    // Импорт модулей
    const { resetGameFull } = await import('../../core/config/functions.js');
    const { generateMaze } = await import('../../world/maze.js');
    const { generateRandomEvent } = await import('../../systems/events/index.js');
    const { resetAdaptations } = await import('../monsters/adaptations/index.js');
    const { clearPlayerTrails } = await import('../objects/playerTrails.js');
    
    // Сброс
    resetGameFull();
    resetAdaptations();
    clearPlayerTrails();

    // Определение биома после сброса
    state.currentBiome = getBiomeByLevel(state.gameLevel);
    const biomeConfig = getBiomeConfig(state.currentBiome);
    logger.game(`🌍 БИОМ: ${biomeConfig.name} (${state.currentBiome}) | Уровень ${state.gameLevel}`);
    
    // Генерация
    generateMaze(true);
    generateRandomEvent();
    
    // Обновление UI
    Game.updateUI();
    
    const controlButtons = document.getElementById('control-buttons-container');
    if (controlButtons) controlButtons.style.display = 'flex';
    
    // Позиция игрока
    player.x = 1;
    player.y = 1;
    player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
    
    // Запуск
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