/**
 * @fileoverview Основные игровые функции: управление картой, показ экрана смерти,
 * полный сброс игры.
 * 
 * @module core/functions
 */

import { CONFIG } from './constants.js';
import { player } from './player.js';
import { state } from './state.js';
import { EMOJIS } from '../../emojis.js';
import { audio } from '../../audio/audioManager.js';
import { deleteSave } from '../../save/saveStorage.js';
import { resetAdaptations } from '../../entities/monsters/adaptations/index.js';
import { clearPlayerTrails } from '../../entities/objects/playerTrails.js';

/**
 * Обновление размера карты в зависимости от уровня игры
 * 
 * @param {number} gameLevel - Текущий уровень игры
 * @returns {void}
 */
export function updateMapSize(gameLevel) {
  const nextIsBoss = (gameLevel + 1) % 5 === 0;

  if (nextIsBoss) return;

  const bossDefeated = Math.floor(gameLevel / 5);
  const sizeIncrease = bossDefeated * 4;
  const newSize = Math.min(65, 35 + sizeIncrease);

  CONFIG.cols = newSize;
  CONFIG.rows = newSize;
  CONFIG.goal = { x: newSize - 13, y: newSize - 13 };
}

/**
 * Показ экрана смерти с переданным количеством золота
 * 
 * @param {number} [goldAtDeath=0] - Количество золота на момент смерти
 * @returns {void}
 */
export function showGameOverScreen(goldAtDeath = 0) {
  audio.reset();
  
  const gameOverUI = document.getElementById('game-over-ui');
  const gameUI = document.getElementById('ui');
  
  const statLevel = document.getElementById('stat-level');
  const statGold = document.getElementById('stat-gold');
  const statDmg = document.getElementById('stat-dmg');
  
  if (statLevel) statLevel.innerText = state.gameLevel;
  if (statGold) statGold.innerText = goldAtDeath;
  if (statDmg) statDmg.innerText = player.baseDamage;
  
  if (gameOverUI) gameOverUI.style.display = 'block';
  if (gameUI) gameUI.style.display = 'none';

  deleteSave();

  resetAdaptations();
  
  state.monsters = [];
  state.lootItems = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.damageTexts = [];
  state.bloodPuddles = [];
  state.pillars = [];
  state.sparks = [];

  state.isShopOpen = false;
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'none';
}

/**
 * Полный сброс игры в начальное состояние
 * 
 * @returns {void}
 */
export function resetGameFull() {
  // ===== СКРЫТИЕ ВСЕХ UI ЭЛЕМЕНТОВ =====
  const gameUI = document.getElementById('ui');
  const gameOverUI = document.getElementById('game-over-ui');
  const shopUI = document.getElementById('shop-ui');

  if (gameOverUI) gameOverUI.style.display = 'none';
  if (shopUI) shopUI.style.display = 'none';
  if (gameUI) gameUI.style.display = 'block';

  const levelUpUI = document.getElementById('level-up-ui');
  if (levelUpUI) levelUpUI.style.display = 'none';

  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) settingsModal.style.display = 'none';

  // ===== СОХРАНЕНИЕ ЗАПИСОК =====
  const savedNotes = {
    found: state.notes?.found || [],
    spawned: state.notes?.spawned || {},
    positions: state.notes?.positions || {}
  };

   // ===== СБРОС БИОМА =====
  state.currentBiome = 'cave';
  
  // ===== СБРОС СОСТОЯНИЯ ИГРЫ =====
  state.gameLevel = 1;
  state.isBossLevel = false;
  state.screenShake = 0;
  state.isShopOpen = false;
  state.keys = {};
  state.isRespawning = false;
  state.gameOverShown = false;
  state.inTreasureRoom = false;
  state.secretPortal = null;
  state.exitPortal = null;
  state.returnPortal = null;
  state.currentEvent = null;
  state.eventMessageShown = false;
  state.bloodMoonActive = false;
  state.eventIceWindActive = false;
  state.eventMonsterRageActive = false;
  state.totalMonstersKilledOnLevel = 0;
  state.safeChestOpened = false;
  state.bonusGiven = false;
  state.hadMonsters = false;
  state.justLoaded = false;
  state.ironManActive = true;
  state.shadowActive = true;

  state.inSafeRoom = false;
  state.inShrineRoom = false;
  state.inTrapRoom = false;
  state.inTreasureRoom = false;

  state.safePortal = null;
  state.safeExitPortal = null;
  state.treasurePortal = null;
  state.treasureExitPortal = null;
  state.shrinePortal = null;
  state.shrineExitPortal = null;
  state.trapPortal = null;
  state.trapFakePortal = null;
  state.trapExitPortal = null;

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

  state.bloodPuddles = [];
  state.pillars = [];
  state.sparks = [];

  // ===== ОЧИСТКА ИГРОВЫХ МАССИВОВ =====
  state.grid = [];
  state.monsters = [];
  state.lootItems = [];
  state.traps = [];
  state.artifacts = [];
  state.chests = [];
  state.shrines = [];
  state.damageTexts = [];
  state.torches = [];
  state.fireParticles = [];
  state.sparks = [];
  state.flies = [];
  state.bloodPuddles = [];
  state.pillars = [];
  state.runes = [];
  state.fireflies = [];
  state.bookshelves = [];
  state.lightZones = [];

  resetAdaptations();

  // ===== СБРОС КОНФИГУРАЦИИ =====
  CONFIG.cols = CONFIG.baseCols;
  CONFIG.rows = CONFIG.baseRows;
  CONFIG.goal = { x: 22, y: 22 };
  CONFIG.bossArenaSize = 25;

  // ===== СБРОС ПАРАМЕТРОВ ИГРОКА =====
  player.x = 1;
  player.y = 1;
  player.px = 180;
  player.py = 180;
  player.maxHp = 100;
  player.hp = 100;
  player.baseDamage = 20;
  player.incomingDamageMultiplier = 1.0;
  player.gold = 0;
  player.artifactsCollected = 0;
  player.hpCost = 30;
  player.dmgCost = 40;
  player.hasMap = false;
  player.meleeWeapon = 'default';
  player.ownedMeleeWeapons = ['default'];
  player.fireballCooldown = 0;
  player.rangedWeapon = null;
  player.ownedRangedWeapons = [];
  player.emoji = EMOJIS.player.default;

  player.baseSpeed = 7;
  player.speed = 7;
  player.originalSpeed = undefined;
  player.slowTimer = 0;
  player.poisonTimer = 0;
  player.poisonTick = 0;
  player.isFrozen = false;
  player.freezeTimer = 0;
  player.shockTimer = 0;
  player.shockTick = 0;
  player.shockSlowAmount = 0.6;
  clearPlayerTrails();

  player.eventDamageMultiplier = 1.0;
  player.eventSpeedBonus = 0;
  player.eventGoldMultiplier = 1.0;
  player.eventSlowMultiplier = 1.0;

  player.goldMultiplier = 1.0;
  player.vampireHealMultiplier = 1.0;
  player.vampireBasePercent = 1;
  player.vampireStrongPercent = 3;
  player.vampireArtifactBonus = 0.5;

  player.isCharging = false;
  player.chargeTime = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  player.dirX = 0;
  player.dirY = 1;

  if (state.keys) {
    state.keys['mouse0'] = false;
  }

  const chargeVal = document.getElementById('charge-val');
  if (chargeVal) {
    chargeVal.innerText = "Обычный";
  }

  player.px = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.py = CONFIG.cellSize + CONFIG.cellSize / 2;
  player.x = 1;
  player.y = 1;

  // ===== СБРОС ФЛАГОВ ДОСТИЖЕНИЙ =====
  state.mapClearedAchievementUnlocked = false;

  // ===== ВОССТАНОВЛЕНИЕ ЗАПИСОК =====
  state.notes = savedNotes;

  // ===== СБРОС ПРОГРЕССА ДОСТИЖЕНИЙ =====
  if (state.achievements && state.achievements.progress) {
    state.achievements.progress.level_5_reached = 0;
    state.achievements.progress.level_10_reached = 0;
    state.achievements.progress.level_15_reached = 0;
    state.achievements.progress.weapons_bought = 0;
    state.achievements.progress.iron_man_complete = 0;
    state.achievements.progress.shadow_complete = 0;
    state.achievements.progress.clears = 0;
    state.achievements.progress.map_cleared = 0;
    state.achievements.progress.treasure_room_found = 0;
    state.achievements.progress.shrine_room_found = 0;
    state.achievements.progress.trap_room_found = 0;
    state.achievements.progress.shrine_activated = 0;
    state.achievements.progress.boss_5_killed = 0;
    state.achievements.progress.boss_10_killed = 0;
    state.achievements.progress.boss_15_killed = 0;
    state.achievements.progress.bosses_killed = 0;
    state.achievements.progress.monsters_killed = 0;
    state.achievements.progress.fireball_kills = 0;
    state.achievements.progress.vampire_heal = 0;
    state.achievements.progress.stun_kills = 0;
    state.achievements.progress.gold_collected = 0;
    state.achievements.progress.artifacts_collected = 0;
    state.achievements.progress.potions_collected = 0;
    state.achievements.progress.traps_dodged = 0;
    state.achievements.progress.trap_spike = 0;
    state.achievements.progress.trap_ice = 0;
    state.achievements.progress.trap_acid = 0;
    state.achievements.progress.trap_lightning = 0;
    state.achievements.progress.trap_psionic = 0;
    state.achievements.progress.mimic_total = 0;
    state.achievements.progress.death_on_level_1 = 0;
    state.achievements.progress.map_bought = 0;
    state.achievements.progress.notes_found = savedNotes.found.length;
  }

  // ===== СБРОС СЕРИИ УРОВНЕЙ БЕЗ СМЕРТИ =====
  import('../../game/levelTransition.js').then(module => {
    module.resetLevelStreak();
  });

  // ===== УДАЛЕНИЕ ЛЕДЯНОЙ МАСКИ =====
  const iceOverlay = document.getElementById('hp-ice-overlay');
  if (iceOverlay && iceOverlay.parentNode) {
    iceOverlay.parentNode.removeChild(iceOverlay);
  }

  // Сброс стилей HP бара
  const hpBarBg = document.getElementById('hp-bar-bg');
  if (hpBarBg) {
    hpBarBg.style.position = 'relative';
    hpBarBg.style.overflow = 'hidden';
    hpBarBg.style.height = '';
    hpBarBg.style.display = '';
    hpBarBg.style.alignItems = '';
    hpBarBg.style.padding = '';
    hpBarBg.style.margin = '';
    hpBarBg.style.border = '';
  }

  // Сброс состояния заморозки
  import('../../systems/weather/frostSystem.js').then(module => {
    module.resetFrost();
  });
}