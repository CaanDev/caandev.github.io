/**
 * @fileoverview Обработка ловушек.
 * Проверяет столкновение игрока с ловушками, применяет эффекты и обрабатывает уклонение.
 * 
 * @module entities/player/traps
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { checkWallCollision } from '../../world/physics.js';
import { triggerGameOver } from './gameOver.js';
import { createExplosion } from '../objects/explosion.js';
import { updateProgress } from '../../systems/achievements/index.js';

/**
 * Проверка всех ловушек на столкновение с игроком
 * 
 * @returns {void}
 */
export function checkTraps() {
  for (let t of state.traps) {
    // Обновление таймера перезарядки
    if (t.resetTimer > 0) {
      t.resetTimer--;
      if (t.resetTimer <= 0) {
        t.triggered = false;
        t.hasDealtDamage = false;
      }
    }
    
    // Проверка активации (только если ловушка не активна и не на перезарядке)
    if (!t.triggered && t.resetTimer <= 0) {
      if (Math.hypot(player.px - t.x, player.py - t.y) < 38) {
        activateTrap(t);
      }
    }
  }
}

/**
 * Активация ловушки
 * 
 * @param {Object} t - Объект ловушки
 * @returns {void}
 * @private
 */
function activateTrap(t) {
  t.triggered = true;
  t.resetTimer = 90;

  // ===== ОБНОВЛЕНИЕ СТАТИСТИКИ =====
  switch (t.type) {
    case 'spike':
      state.gameStats.trapsTriggered.spike++;
      break;
    case 'ice':
      state.gameStats.trapsTriggered.ice++;
      break;
    case 'acid':
      state.gameStats.trapsTriggered.acid++;
      break;
    case 'lightning':
      state.gameStats.trapsTriggered.lightning++;
      break;
    case 'psionic':
      state.gameStats.trapsTriggered.psionic++;
      break;
  }

  // ===== РАСЧЁТ ШАНСА УКЛОНЕНИЯ =====
  const bossDefeated = Math.floor(state.gameLevel / 5);
  const evasionChance = Math.max(
    CONFIG.minEvasionChance,
    CONFIG.baseEvasionChance - (bossDefeated * CONFIG.evasionDecayPerBoss)
  );

  const didEvade = Math.random() < evasionChance;

  if (didEvade) {
    handleEvasion(evasionChance, t);
  } else {
    applyTrapEffectToPlayer(t, evasionChance);
  }
}

/**
 * Обработка уклонения от ловушки
 * 
 * @param {number} evasionChance - Шанс уклонения (0-1)
 * @param {Object} t - Объект ловушки
 * @returns {void}
 * @private
 */
function handleEvasion(evasionChance, t) {
  // При увороте ловушка НЕ считается сработавшей
  t.hasDealtDamage = false;

  let evadeX = 0, evadeY = 0;
  const evadeDistance = 70;
  const isMoving = (player.dirX !== 0 || player.dirY !== 0);

  // Определяем направление уворота
  if (isMoving) {
    evadeX = player.dirX;
    evadeY = player.dirY;
  } else {
    const randomDir = Math.floor(Math.random() * 3);
    switch (randomDir) {
      case 0: evadeX = 0; evadeY = -1; break;
      case 1: evadeX = 0; evadeY = 1; break;
      case 2: evadeX = 1; evadeY = 0; break;
      default: evadeX = -1; evadeY = 0; break;
    }
  }

  let newX = player.px + evadeX * evadeDistance;
  let newY = player.py + evadeY * evadeDistance;

  // Проверка коллизий и поиск альтернативного направления
  if (checkWallCollision(newX, player.py, 24)) {
    const altDirections = [
      { x: evadeX, y: 0 }, { x: 0, y: evadeY },
      { x: evadeY, y: evadeX }, { x: -evadeX, y: 0 }, { x: 0, y: -evadeY }
    ];

    for (let alt of altDirections) {
      const testX = player.px + alt.x * evadeDistance;
      const testY = player.py + alt.y * evadeDistance;
      if (!checkWallCollision(testX, player.py, 24) &&
          !checkWallCollision(player.px, testY, 24)) {
        newX = testX;
        newY = testY;
        evadeX = alt.x;
        evadeY = alt.y;
        break;
      }
    }
  }

  if (checkWallCollision(player.px, newY, 24)) {
    newY = player.py;
  }

  // Применяем движение
  if (!checkWallCollision(newX, player.py, 24)) player.px = newX;
  if (!checkWallCollision(player.px, newY, 24)) player.py = newY;

  // Определяем направление для отображения
  let directionText = '';
  if (evadeX > 0) directionText = '→';
  else if (evadeX < 0) directionText = '←';
  else if (evadeY > 0) directionText = '↓';
  else if (evadeY < 0) directionText = '↑';

  // Визуальные и звуковые эффекты
  audio.playSound('dodge', 0.5);
  
  state.damageTexts.push({
    x: player.px, y: player.py - 30,
    text: `✨ УВЕРНУЛСЯ! ${directionText} (${Math.round(evasionChance * 100)}%) ✨`,
    color: COLORS.ui.textGold,
    size: 20, life: 50, speedy: 1.2
  });
  state.screenShake = 5;

  updateProgress('traps_dodged', 1);
}

/**
 * Применение эффекта ловушки к игроку
 * 
 * @param {Object} t - Объект ловушки
 * @param {number} evasionChance - Шанс уклонения (для отображения)
 * @returns {void}
 * @private
 */
function applyTrapEffectToPlayer(t, evasionChance) {
  // Ловушка сработала (нанесла урон/эффект)
  t.hasDealtDamage = true;

  // ===== ОБНОВЛЕНИЕ ПРОГРЕССА ДОСТИЖЕНИЙ =====
  switch (t.type) {
    case 'spike':
      updateProgress('trap_spike', 1);
      break;
    case 'ice':
      updateProgress('trap_ice', 1);
      break;
    case 'acid':
      updateProgress('trap_acid', 1);
      break;
    case 'lightning':
      updateProgress('trap_lightning', 1);
      break;
    case 'psionic':
      updateProgress('trap_psionic', 1);
      break;
  }

  // ===== ПРИМЕНЕНИЕ ЭФФЕКТА =====
  switch (t.type) {
    case 'ice': {
      // Ледяная ловушка: заморозка + отталкивание
      audio.playSound('trapIceActivate', 0.7);
      const angle = Math.atan2(player.py - t.y, player.px - t.x);
      const pushDistance = 60;
      
      let newX = player.px + Math.cos(angle) * pushDistance;
      let newY = player.py + Math.sin(angle) * pushDistance;
      
      if (checkWallCollision(newX, player.py, 24)) newX = player.px;
      if (checkWallCollision(player.px, newY, 24)) newY = player.py;
      
      if (!checkWallCollision(newX, player.py, 24)) player.px = newX;
      if (!checkWallCollision(player.px, newY, 24)) player.py = newY;
      
      player.isFrozen = true;
      player.freezeTimer = 180;
      state.screenShake = 12;
      state.damageTexts.push({
        x: player.px, y: player.py - 20,
        text: `❄️ ЗАМОРОЗКА!`,
        color: COLORS.effects.ice,
        size: 20, life: 50, speedy: 1.0
      });
      return;
    }

    case 'acid': {
      // Кислотная ловушка: отравление
      player.poisonTimer = 300;
      player.poisonTick = 0;
      state.screenShake = 8;
      state.damageTexts.push({
        x: player.px, y: player.py - 20,
        text: `🧪 ОТРАВЛЕН! (${Math.round((1 - evasionChance) * 100)}%)`,
        color: COLORS.effects.poison,
        size: 18, life: 50, speedy: 1.0
      });
      return;
    }

    case 'lightning': {
      // Электрическая ловушка: шок + замедление
      audio.playSound('trapLightningActivate', 0.6);
      
      // Останавливаем предыдущий звук эффекта
      if (player._shockSound) {
        audio.stopEffectSound(player._shockSound);
        player._shockSound = null;
      }
      
      player._shockSound = audio.playEffect('trapLightningEffect', 0.3);
      
      player.shockTimer = 300;
      player.shockTick = 0;
      player.shockSlowAmount = 0.6;
      state.screenShake = 15;
      state.damageTexts.push({
        x: player.px, y: player.py - 20,
        text: `⚡ ШОК!`,
        color: COLORS.effects.lightning,
        size: 20, life: 50, speedy: 1.0
      });
      return;
    }

    case 'psionic': {
      // Псионическая ловушка: инверсия управления + сдвиг реальности
      player.controlsInverted = !player.controlsInverted;
      player.invertTimer = 180;
      
      state.realityShift.active = true;
      state.realityShift.intensity = 1.0;
      state.realityShift.timer = 90;
      
      player.trapGlowColor = '#9b59b6';
      player.trapGlowTimer = 180;
      
      state.screenShake = 15;
      
      const invertStatus = player.controlsInverted ? "ИНВЕРТИРОВАНО" : "ВОССТАНОВЛЕНО";
      const textColor = player.controlsInverted ? COLORS.effects.magic : COLORS.ui.textGreen;
      
      state.damageTexts.push({
        x: player.px, y: player.py - 40,
        text: `🌀 УПРАВЛЕНИЕ ${invertStatus}! 🌀`,
        color: textColor,
        size: 22, life: 80, speedy: 0.5
      });
      return;
    }

    case 'spike':
    default: {
      // Взрывная ловушка: урон + взрыв
      audio.playSound('trapSpikeActivate', 0.7);
      createExplosion(player.px, player.py, true);

      state.ironManActive = false;

      let damageTaken = t.damage;
      if (player.incomingDamageMultiplier) {
        damageTaken = Math.floor(damageTaken * player.incomingDamageMultiplier);
      }
      player.hp -= damageTaken;
      state.screenShake = 20;
      state.damageTexts.push({
        x: player.px, y: player.py - 20,
        text: `-${damageTaken} ❤️`,
        color: COLORS.ui.textRed,
        size: 24, life: 45, speedy: 1.2
      });
      
      if (player.hp <= 0) {
        triggerGameOver();
      }
      return;
    }
  }
}