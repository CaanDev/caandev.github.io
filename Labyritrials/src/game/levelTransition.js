/**
 * @fileoverview Управление переходами между уровнями.
 * Обрабатывает завершение уровня, начисление бонусов, переход на следующий уровень.
 * 
 * @module game/levelTransition
 */

import { CONFIG, state, player, updateMapSize } from '../core/config/index.js';
import { getBiomeByLevel, getBiomeConfig } from '../core/config/biomes.js';
import { COLORS } from '../core/config/colors.js';
import { logger } from '../utils/logger.js';
import { generateMaze } from '../world/maze.js';
import { removeMapFromInventory } from '../systems/ui/inventory/inventoryUtils.js';
import { resetLevelTimer, forceStopSnowfall } from '../systems/weather/snowManager.js';
import { clearEventEffects, generateRandomEvent, showEventMessage } from '../systems/events/index.js';
import { resetAdaptations } from '../entities/monsters/adaptations/index.js';
import { clearBloodPuddles } from '../entities/objects/utils/bloodSystem.js';
import { clearAllParticles } from '../systems/rendering/particleRenderer.js';
import { Game } from '../core/game.js';
import { showLoader, updateLoader, hideLoader } from '../utils/gameLoader.js';
import { clearPlayerTrails } from '../entities/objects/playerTrails.js';
import { updateProgress, setProgress } from '../systems/achievements/index.js';
import { loadTemplateIfNeeded, isTemplateLoaded, isTemplateInitialized, initTemplateHandlers } from '../utils/htmlLoader.js';

/** @type {number} - Количество пройденных уровней без смерти */
let levelsCompletedWithoutDeath = 0;

/** @type {Object} - Статистика перехода между уровнями */
let levelTransitionStats = {
  bonusGold: 0,
  artifacts: 0,
  damageBonus: 0,
  monstersKilled: 0,
  nextLevel: 2
};

/** @type {Function|null} - Колбэк для обновления UI во время перехода */
let pendingUICallback = null;
/** @type {number} - Общее количество убитых монстров на уровне */
let totalMonstersKilledOnLevel = 0;
/** @type {boolean} - Идёт ли анимация обрушения ступенек */
let isStairsCollapseAnimating = false;
/** @type {Function|null} - Колбэк для продолжения после анимации */
let collapseCallback = null;

/**
 * Запуск анимации обрушения ступенек
 * 
 * @param {Function} onComplete - Колбэк по завершении анимации
 * @returns {void}
 */
export function triggerStairsCollapse(onComplete) {
  if (isStairsCollapseAnimating) return;
  
  const goalX = CONFIG.goal.x;
  const goalY = CONFIG.goal.y;
  const cell = state.grid[goalY]?.[goalX];
  
  if (!cell) {
    if (onComplete) onComplete();
    return;
  }
  
  isStairsCollapseAnimating = true;
  collapseCallback = onComplete;
  
  // Отключение игрока
  state.isPlayerDisabled = true;
  
  // Перевод всех монстров в режим патрулирования
  for (const m of state.monsters) {
    // Сброс состояния преследования
    m.state = 'patrol';
    m.isSearching = false;
    m.lastKnownX = null;
    m.lastKnownY = null;
    m.memoryTimer = 0;
    m._isReactingToSound = false;
    m._reactionTargetX = null;
    m._reactionTargetY = null;
    m._reactionTimer = 0;
    m._reactionPhase = null;
    m._soundTarget = null;
    // Сброс счётчиков застревания
    m._stuckCounter = 0;
    m._stuckMoveCounter = 0;
    // Сброс движения
    m._moveDx = 0;
    m._moveDy = 0;
    // Установка стартовой позиции патруля
    m.startX = m.x;
    m.startY = m.y;
    // Генерация нового патруля
    m.patrolPath = [];
    m.patrolIndex = 0;
    m.patrolTimer = 0;
    m.patrolPhase = 'moving';
    m.idleTimer = 0;
    m.checkedInterests = [];
    // Если у монстра есть оригинальная скорость — восстановление
    if (m.originalSpeed !== undefined) {
      m.speed = m.originalSpeed;
      m.originalSpeed = undefined;
    }
  }
  
  // 1. Исчезновение игрока
  state.playerVisible = false;
  
  // 2. Через 1 секунду — смена спрайта ступенек
  setTimeout(() => {
    // Отметка, что ступеньки обрушены (смена спрайта)
    cell.stairsCollapsed = true;
    state.screenShake = 20;
    // 3. Ещё через 1 секунду — вызов колбэка (окно перехода)
    setTimeout(() => {
      isStairsCollapseAnimating = false;
      if (collapseCallback) {
        const callback = collapseCallback;
        collapseCallback = null;
        callback();
      }
    }, 1000);
  }, 1000);
}

/**
 * Увеличение счётчика убитых монстров на уровне
 * 
 * @returns {void}
 */
export function addMonsterKilled() {
  totalMonstersKilledOnLevel++;
}

/**
 * Сброс счётчика убитых монстров
 * 
 * @returns {void}
 */
export function resetMonsterKillCounter() {
  totalMonstersKilledOnLevel = 0;
}

/**
 * Получение количества убитых монстров на уровне
 * 
 * @returns {number} - Количество убитых монстров
 */
export function getTotalMonstersKilled() {
  return totalMonstersKilledOnLevel;
}

/**
 * Получение статистики перехода между уровнями
 * 
 * @returns {Object} - Статистика перехода
 */
export function getTransitionStats() {
  return levelTransitionStats;
}

/**
 * Установка бонусного золота для перехода
 * 
 * @param {number} value - Количество бонусного золота
 * @returns {void}
 */
export function setTransitionStatsBonusGold(value) {
  levelTransitionStats.bonusGold = value;
}

/**
 * Внутренняя функция показа окна перехода (после загрузки и инициализации шаблона)
 * 
 * @returns {void}
 * @private
 */
function doShowLevelUpWindow() {
  const levelUpUI = document.getElementById('level-up-ui');
  const gameUI = document.getElementById('ui');
  
  const bonusGoldSpan = document.getElementById('level-bonus-gold');
  const artifactsSpan = document.getElementById('level-artifacts');
  const damageBonusSpan = document.getElementById('level-damage-bonus');
  const monstersKilledSpan = document.getElementById('level-monsters-killed');
  const nextLevelSpan = document.getElementById('next-level-num');
  
  if (bonusGoldSpan) bonusGoldSpan.innerText = levelTransitionStats.bonusGold;
  if (artifactsSpan) artifactsSpan.innerText = levelTransitionStats.artifacts;
  if (damageBonusSpan) damageBonusSpan.innerText = levelTransitionStats.damageBonus;
  if (monstersKilledSpan) monstersKilledSpan.innerText = levelTransitionStats.monstersKilled;
  if (nextLevelSpan) nextLevelSpan.innerText = levelTransitionStats.nextLevel;
  
  if (gameUI) gameUI.style.display = 'none';
  if (levelUpUI) levelUpUI.style.display = 'block';
}

/**
 * Настройка кнопки продолжения в окне перехода
 * 
 * @returns {void}
 * @private
 */
function setupContinueButton() {
  const continueBtn = document.getElementById('continue-btn');
  if (!continueBtn) return;
  
  // Удаление старых обработчиков, чтобы избежать дублирования
  const newContinueBtn = continueBtn.cloneNode(true);
  continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
  
  newContinueBtn.addEventListener('click', () => {
    const levelUpUI = document.getElementById('level-up-ui');
    const gameUI = document.getElementById('ui');
    
    if (levelUpUI) levelUpUI.style.display = 'none';
    if (gameUI) gameUI.style.display = 'block';
    
    executeLevelTransition();
  });
}

/**
 * Показ окна перехода на следующий уровень
 * 
 * @returns {void}
 * @private
 */
function showLevelUpWindow() {
  // Принудительная остановка сердцебиения игрока
  import('../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });
  
  // Загрузка шаблона (если нужно)
  if (!isTemplateLoaded('levelUp')) {
    loadTemplateIfNeeded('levelUp').then(() => {
      // Инициализация обработчиков после вставки HTML в DOM
      initTemplateHandlers('levelUp').then(() => {
        // Настройка кнопки продолжения
        setupContinueButton();
        doShowLevelUpWindow();
      });
    });
    return;
  }
  
  // Если шаблон загружен, но не инициализирован
  if (!isTemplateInitialized('levelUp')) {
    initTemplateHandlers('levelUp').then(() => {
      setupContinueButton();
      doShowLevelUpWindow();
    });
    return;
  }
  
  // Шаблон загружен и инициализирован — просто настройка кнопки и отображение
  setupContinueButton();
  doShowLevelUpWindow();
}

/**
 * Выполнение перехода на следующий уровень
 * 
 * @returns {Promise<void>}
 * @private
 */
async function executeLevelTransition() {
  // Проверка финала
  if (state.gameLevel + 1 > 15) {
    setTimeout(() => {
      import('./finalScreen.js').then(module => {
        module.showFinalScreen();
      });
    }, 500);
    return;
  }

  // Принудительная остановка снегопада при переходе
  forceStopSnowfall();
  
  showLoader(`Генерация уровня ${state.gameLevel + 1}...`, '🗺️', 'Создание подземелий...', 0);
  
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 8;
    if (progress > 75) progress = 75;
    updateLoader(null, null, null, Math.min(75, progress));
  }, 120);
  
  // Очистка состояния
  clearEventEffects();
  state.bossMinionDropCounter = 0;
  if (state.isBossLevel) resetAdaptations();

  // Повышение уровня
  state.gameLevel++;

  // Сброс таймера уровня для системы погоды
  resetLevelTimer();

  // Определение биома
  const biomeId = getBiomeByLevel(state.gameLevel);
  const biomeConfig = getBiomeConfig(biomeId);
  state.currentBiome = biomeId;
  logger.game(`🌍 БИОМ: ${biomeConfig.name} (${biomeId}) | Уровень ${state.gameLevel}`);

  player.hasMap = false;
  removeMapFromInventory();
  
  // Проверка достижений
  if (state.gameLevel === 5) setProgress('level_5_reached', 1);
  if (state.gameLevel === 10) setProgress('level_10_reached', 1);
  if (state.gameLevel === 15) setProgress('level_15_reached', 1);
  if (state.gameLevel === 5 && state.ironManActive !== false) updateProgress('iron_man_complete', 1);

  if (state.shadowActive) {
    const initialCount = state.initialMonstersCount || 0;
    const currentCount = state.monsters.length || 0;
    if (state.hadMonsters && initialCount > 0 && currentCount === initialCount) setProgress('shadow_complete', 1);
  }

  state.shadowActive = true;
  levelsCompletedWithoutDeath++;
  updateProgress('streak_without_death', levelsCompletedWithoutDeath);
  
  // Преобразование артефактов в урон
  player.baseDamage += player.artifactsCollected * 5;
  player.artifactsCollected = 0;
  state.isBossLevel = false;

  // Подготовка к боссу
  const nextIsBoss = state.gameLevel % 5 === 0;
  if (nextIsBoss) updateLoader(`Подготовка к битве с боссом на уровне ${state.gameLevel}!`, '👹', 'Арена создаётся...', 40);

  state.bossReady = false;

  // Восстановление размера карты
  if (!nextIsBoss) {
    if (CONFIG.cols < 30 || CONFIG.rows < 30) {
      CONFIG.cols = CONFIG.baseCols || 35;
      CONFIG.rows = CONFIG.baseRows || 35;
    }
    updateMapSize(state.gameLevel);
  }

  // Очистка порталов
  state.treasurePortal = null;
  state.treasureExitPortal = null;
  state.shrinePortal = null;
  state.shrineExitPortal = null;
  state.trapPortal = null;
  state.trapFakePortal = null;
  state.trapExitPortal = null;
  state.inTreasureRoom = false;
  state.inShrineRoom = false;
  state.inTrapRoom = false;
  state.trapActivated = false;
  state.trapWave = 0;
  state.trapMonsters = [];
  state.trapMonstersTotal = 0;
  state.trapMonstersKilled = 0;
  state.trapWaveActive = false;
  state.trapExitRevealed = false;
  state.trapWaveLoaded = false;
  state.trapMonsterIds = new Set();
  state.returnPortal = null;
  state.safeChestOpened = false;

  resetMonsterKillCounter();
  
  // Генерация нового лабиринта
  updateLoader('Генерация лабиринта...', '🗺️', 'Создание комнат и коридоров...', 60);
  
  generateMaze(true);
  clearPlayerTrails();
  clearBloodPuddles();
  state.fireParticles = [];

  // Создание портала в безопасную комнату
  if (state.gameLevel >= CONFIG.safeRoom?.minLevel ?? 6) {
    const wallX = 0;
    const wallY = 1;
    
    if (state.grid[wallY] && state.grid[wallY][wallX]) {
      state.safePortal = {
        x: wallX,
        y: wallY,
        active: true,
        hidden: false,
        targetMap: 'safe'
      };
      
      const cell = state.grid[wallY][wallX];
      cell.isPortal = true;
      cell.revealed = true;
      cell.isWall = false;
      cell.hasSafePortal = true;
    }
  }

  // Генерация события
  generateRandomEvent();
  
  // Установка позиции игрока
  // На уровнях 2-4 игрок появляется на (2, 1), чтобы не стоять на лавке
  // На остальных уровнях — на (1, 1)
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom;
  const isBossLevel = state.gameLevel > 0 && state.gameLevel % 5 === 0;

  if (state.gameLevel >= 2 && state.gameLevel <= 4 && !isInSecretRoom && !isBossLevel) {
    player.x = 2;
    player.y = 1;
    player.px = 2 * CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = 1 * CONFIG.cellSize + CONFIG.cellSize / 2;
  } else {
    player.x = 1;
    player.y = 1;
    player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
    player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  }

  // Восстановление выносливости
  player.stamina = player.maxStamina;
  player.lastAttackTime = 0;

  if (pendingUICallback) {
    pendingUICallback();
    pendingUICallback = null;
  }

  // Завершение загрузки
  clearInterval(progressInterval);
  updateLoader('Готово!', '✅', 'Вход в лабиринт...', 100);
  await new Promise(resolve => setTimeout(resolve, 300));
  await new Promise(resolve => {
    hideLoader(300);
    setTimeout(resolve, 300);
  });

  // Показ сообщения о событии
  setTimeout(() => {
    showEventMessage();
  }, 100);

  // Сохранение
  import('../save/saveSystem.js').then(({ saveGame }) => {
    saveGame();
  });

  Game.startLoop();
}

/**
 * Обработка бонуса за зачистку уровня
 * 
 * @returns {boolean} - true, если бонус был выдан
 */
export function handleClearBonus() {
  if (!state.isBossLevel && !state.inTreasureRoom && 
      state.monsters.length === 0 && !state.bonusGiven && 
      state.hadMonsters && !state.justLoaded) {
    
    state.bonusGiven = true;
    
    let bonusGold = 50 + Math.floor(state.gameLevel * 10);
    player.gold += bonusGold;
    
    updateProgress('clears', 1);
    updateProgress('gold_collected', bonusGold);
    state.gameStats.goldCollected += bonusGold;
    
    levelTransitionStats.bonusGold = bonusGold;
    
    state.damageTexts.push({
      x: player.px,
      y: player.py - 50,
      text: `✨ ЗАЧИСТКА! +${bonusGold}💰 ✨`,
      color: COLORS.ui.textGold,
      size: 28,
      life: 80,
      speedy: 0.8
    });
    
    state.screenShake = 10;
    
    import('../save/saveSystem.js').then(({ saveGame }) => {
      saveGame();
    });
    
    return true;
  }
  return false;
}

/**
 * Проверка возможности перехода на следующий уровень
 * 
 * @returns {boolean} - true, если можно перейти на следующий уровень
 */
export function canAdvanceToNextLevel() {
  // Если анимация обрушения уже идёт — переход невозможен
  if (isStairsCollapseAnimating) return false;
  
  const cell = state.grid[CONFIG.goal.y]?.[CONFIG.goal.x];
  if (cell?.stairsCollapsed === true) return false;

  if (state.isBossLevel && !state.bossSpawned) return false;
  if (!state.isBossLevel) return true;
  
  const bossLevel = Math.floor(state.gameLevel / 5) * 5;
  
  if (bossLevel === 15) {
    const chaserAlive = state.monsters.some(m => m.duoRole === 'chaser' && m.hp > 0);
    const shooterAlive = state.monsters.some(m => m.duoRole === 'shooter' && m.hp > 0);
    const hasMinions = state.monsters.some(m => m.isMinion === true);
    return !chaserAlive && !shooterAlive && !hasMinions;
  } else {
    const hasAliveBoss = state.monsters.some(m => m.isBoss === true && m.hp > 0);
    const hasMinions = state.monsters.some(m => m.isMinion === true);
    return !hasAliveBoss && !hasMinions;
  }
}

/**
 * Начало перехода на следующий уровень
 * 
 * @param {Function} updateUICallback - Колбэк для обновления UI
 * @returns {void}
 */
export function advanceToNextLevel(updateUICallback) {
  // Если анимация обрушения уже идёт — выход
  if (isStairsCollapseAnimating) return;
  // Если анимация ещё не запущена — запуск
  triggerStairsCollapse(() => {
    // После завершения анимации и паузы — выполняется переход
    doAdvanceToNextLevel(updateUICallback);
  });
}

/**
 * Внутренняя функция выполнения перехода на следующий уровень
 * (бывший advanceToNextLevel)
 * 
 * @param {Function} updateUICallback - Колбэк для обновления UI
 * @returns {void}
 * @private
 */
function doAdvanceToNextLevel(updateUICallback) {
  Game.stopLoop();
  pendingUICallback = updateUICallback;
  const monstersKilled = totalMonstersKilledOnLevel;
  
  levelTransitionStats = {
    bonusGold: levelTransitionStats.bonusGold || 0,
    artifacts: player.artifactsCollected,
    damageBonus: player.artifactsCollected * 5,
    monstersKilled: monstersKilled,
    nextLevel: state.gameLevel + 1
  };
  
  // Восстановление игрока
  state.playerVisible = true;
  state.isPlayerDisabled = false;
  
  showLevelUpWindow();
  clearAllParticles();
}

/**
 * Сброс счётчика уровней без смерти
 * 
 * @returns {void}
 */
export function resetLevelStreak() {
  levelsCompletedWithoutDeath = 0;
}

/**
 * Сброс статистики уровня
 * 
 * @returns {void}
 */
export function resetLevelStats() {
  totalMonstersKilledOnLevel = 0;
  levelTransitionStats.bonusGold = 0;
  levelTransitionStats.artifacts = 0;
  levelTransitionStats.damageBonus = 0;
  levelTransitionStats.monstersKilled = 0;
}