/**
 * @fileoverview Управление эффектами игрока.
 * @module entities/player/effects
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { triggerGameOver } from './gameOver.js';

/**
 * Обновление эффектов низкого здоровья (сердцебиение)
 * @returns {void}
 */
function updateLowHPEffect() {
  // Защита от NaN и деления на ноль
  if (typeof player.hp !== 'number' || typeof player.maxHp !== 'number' || player.maxHp <= 0) {
    return;
  }
  
  const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
  
  // Обновляем звук сердцебиения
  audio.sound.updateLowHPSound(hpPercent);
}
/**
 * Обновление эффекта заморозки
 * Уменьшает таймер, создаёт эффекты при освобождении
 * 
 * @returns {void}
 */
export function updateFreezeEffect() {
  if (player.freezeTimer > 0) {
    player.freezeTimer--;

    // Если игрок только что замёрз — замораживаем анимацию
    if (player.isFrozen && !player._animationFrozen) {
      player._animationFrozen = true;
      import('../../sprites/index.js').then(({ playerAnimator }) => {
        const currentSprite = playerAnimator.getCurrentFrame();
        playerAnimator.setFrozen(true, currentSprite);
      });
    }

    if (player.freezeTimer <= 0) {
      player.isFrozen = false;
      player._animationFrozen = false;

      // Размораживаем анимацию
      import('../../sprites/index.js').then(({ playerAnimator }) => {
        playerAnimator.setFrozen(false);
      });

      audio.playSound('traps.trapIceFinish');
      
      // Эффект освобождения от льда
      if (state.damageTexts) {
        state.damageTexts.push({
          x: player.px,
          y: player.py - 30,
          text: '❄️ ЛЁД РАСТАЯЛ! ❄️',
          color: '#3498db',
          size: 18,
          life: 40,
          speedy: 0.8
        });
      }
      
      // Небольшая тряска экрана при освобождении
      state.screenShake = 5;
      
      // Искры льда
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        if (!state.sparks) state.sparks = [];
        state.sparks.push({
          x: player.px,
          y: player.py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 15 + Math.random() * 15,
          maxLife: 30,
          size: 2 + Math.random() * 3,
          color: '#88ddff',
          gravity: 0.05,
          isDust: false
        });
      }
    }
  }
}

/**
 * Обновление второстепенных эффектов игрока
 * Обрабатывает свечение от ловушек и инверсию управления
 * 
 * @returns {void}
 */
export function updatePlayerEffects() {
  // Свечение от ловушек
  if (player.trapGlowTimer > 0) {
    player.trapGlowTimer--;
    if (player.trapGlowTimer <= 0) {
      player.trapGlowColor = null;
    }
  }
  
  // Инверсия управления
  if (player.invertTimer > 0) {
    player.invertTimer--;
    if (player.invertTimer <= 0) {
      player.controlsInverted = false;
      state.damageTexts.push({
        x: player.px, y: player.py - 40,
        text: `✅ УПРАВЛЕНИЕ ВОССТАНОВЛЕНО!`,
        color: COLORS.ui.textGreen,
        size: 16,
        life: 60,
        speedy: 0.5
      });
    }
  }

  // Проверяем смерть (останавливаем звук шока)
  if (player.hp <= 0) {
    if (player._shockSoundActive) {
      audio.sound.stopSound('traps.trapLightningEffect');
      player._shockSoundActive = false;
    }
  }

  // Обновляем эффект низкого здоровья
  updateLowHPEffect();
}

/**
 * Обновление эффекта молнии (замедление + DOT)
 * 
 * @returns {boolean} - true, если игрок умер
 */
export function updateShockEffect() {
  // Проверяем смерть в начале каждого кадра
  if (player.hp <= 0) {
    if (player._shockSound) {
      audio.stopEffectSound(player._shockSound);
      player._shockSound = null;
    }
    return false;
  }
  
  if (player.shockTimer <= 0) {
    // Останавливаем звук эффекта
    if (player._shockSound) {
      audio.stopEffectSound(player._shockSound);
      player._shockSound = null;
    }
    
    // Восстанавливаем скорость
    if (player.originalSpeed !== undefined && player.speed !== player.baseSpeed) {
      player.speed = player.baseSpeed;
      player.originalSpeed = undefined;
    }
    if (state.shockSparks && state.shockSparks.length > 0) {
      state.shockSparks = [];
    }
    return false;
  }
  
  player.shockTimer--;
  player.shockTick = (player.shockTick || 0) + 1;
  
  // Замедление
  if (player.originalSpeed === undefined) {
    player.originalSpeed = player.baseSpeed;
  }
  player.speed = player.originalSpeed * (1 - player.shockSlowAmount);
  
  // DOT (урон с течением времени)
  if (player.shockTick >= 60) {
    player.hp -= 10;
    player.shockTick = 0;
    
    state.damageTexts.push({ 
      x: player.px, y: player.py - 20, 
      text: `⚡ -10`, 
      color: COLORS.effects.lightning,
      size: 18, life: 40, speedy: 1.1 
    });
    
    // Проверяем смерть после урона
    if (player.hp <= 0) {
      if (player._shockSound) {
        audio.stopEffectSound(player._shockSound);
        player._shockSound = null;
      }
      triggerGameOver();
      return true;
    }
  }
  
  return false;
}

/**
 * Обновление отравления игрока
 * 
 * @returns {boolean} - true, если игрок умер
 */
export function updatePoisonEffect() {
  if (player.poisonTimer <= 0) {
    // Очищаем пузырьки, если отравление закончилось
    if (state.poisonBubbles && state.poisonBubbles.length > 0) {
      state.poisonBubbles = [];
    }
    return false;
  }
  
  player.poisonTimer--;
  player.poisonTick++;
  
  // DOT (урон с течением времени)
  if (player.poisonTick >= 60) {
    player.hp -= 5;
    player.poisonTick = 0;
    state.damageTexts.push({ 
      x: player.px, y: player.py - 20, 
      text: `-5 ❤️`, 
      color: COLORS.effects.poison,
      size: 18, life: 40, speedy: 1.1 
    });
    
    if (player.hp <= 0) {
      triggerGameOver();
      return true;
    }
  }
  
  // Эффект окончания отравления
  if (player.poisonTimer <= 0 && player._wasPoisoned) {
    player._wasPoisoned = false;
    state.damageTexts.push({
      x: player.px,
      y: player.py - 30,
      text: '🧪 ОТРАВЛЕНИЕ ПРОШЛО! 🧪',
      color: '#2ecc71',
      size: 18,
      life: 40,
      speedy: 0.8
    });
    
    // Небольшая тряска экрана
    state.screenShake = 5;
  }
  
  if (player.poisonTimer > 0) {
    player._wasPoisoned = true;
  }
  
  return false;
}