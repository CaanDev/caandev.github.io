/**
 * @fileoverview Эффекты монстров.
 * Управляет состояниями монстров: заморозка, шок, отравление,
 * свечение призраков и таймеры свечения от ловушек.
 * 
 * @module entities/monsters/effects
 */

import { state } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { handleMonsterDeath } from './death.js';

/**
 * Обновление эффекта заморозки монстра
 * 
 * Уменьшает таймер заморозки. При истечении таймера снимает
 * состояние заморозки и воспроизводит звук освобождения.
 * 
 * @param {Object} m - Объект монстра
 * @returns {boolean} - Всегда false (для совместимости с другими эффектами)
 */
export function updateFreezeEffect(m) {
  if (m.freezeTimer > 0) {
    m.freezeTimer--;
    if (m.freezeTimer <= 0) {
      m.isFrozen = false;
      audio.playSound('trapIceFinish', 0.6);
    }
  }
  return false;
}

/**
 * Обновление таймера свечения от ловушек
 * 
 * Если монстр оглушён громовым посохом — синхронизирует таймер свечения
 * с таймером оглушения. Иначе уменьшает таймер и сбрасывает цвет.
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function updateTrapGlowTimer(m) {
  // Если монстр оглушён громовым посохом — свечение продолжается
  if (m.stunTimer > 0 && m.trapGlowColor === COLORS.monsters.trapGlow.stun) {
    m.trapGlowTimer = m.stunTimer; // Синхронизируем таймеры
    return;
  }
  
  // Обычное обновление таймера
  if (m.trapGlowTimer > 0) {
    m.trapGlowTimer--;
    if (m.trapGlowTimer <= 0) {
      m.trapGlowColor = null;
    }
  }
}

/**
 * Обновление эффекта шока у монстра
 * 
 * Применяет замедление и периодический урон (DOT) каждые 60 кадров.
 * При смерти монстра обрабатывает его удаление.
 * 
 * @param {Object} m - Объект монстра
 * @param {number} i - Индекс монстра в массиве
 * @returns {boolean} - true, если монстр умер
 */
export function updateShockEffect(m, i) {
  // Проверяем смерть в начале каждого кадра
  if (m.hp <= 0) {
    if (m._shockSound) {
      audio.stopEffectSound(m._shockSound);
      m._shockSound = null;
    }
    return false;
  }
  
  // Если шок закончился — останавливаем звук
  if (m.shockTimer <= 0) {
    if (m._shockSound) {
      audio.stopEffectSound(m._shockSound);
      m._shockSound = null;
    }
    return false;
  }

  // Защита от некорректных значений
  if (isNaN(m.shockTimer) || m.shockTimer <= 0) return false;

  // Уменьшаем таймер и увеличиваем тик
  m.shockTimer--;
  m.shockTick = (m.shockTick || 0) + 1;

  // Замедление
  if (m.shockSlowAmount) {
    if (m.originalSpeed === undefined) {
      m.originalSpeed = m.speed;
    }
    m.speed = m.originalSpeed * (1 - m.shockSlowAmount);
  }

  // DOT-урон каждые 60 кадров (≈1 секунда)
  if (m.shockTick >= 60) {
    m.hp -= 10;
    m.shockTick = 0;
    
    state.damageTexts.push({
      x: m.x, y: m.y - 15,
      text: `⚡ -10`,
      color: COLORS.effects.lightning,
      size: 18, life: 35, speedy: 1.2
    });

    // Проверка смерти после урона
    if (m.hp <= 0) {
      if (m._shockSound) {
        audio.stopEffectSound(m._shockSound);
        m._shockSound = null;
      }
      handleMonsterDeath(m, i, state.monsters);
      return true;
    }
  }

  return false;
}

/**
 * Восстановление скорости монстра (сброс замедления)
 * 
 * @param {Object} m - Объект монстра
 * @returns {void}
 */
export function restoreMonsterSpeed(m) {
  if (m.originalSpeed !== undefined && m.speed !== m.originalSpeed) {
    m.speed = m.originalSpeed;
    m.originalSpeed = undefined;
  }
}

/**
 * Обновление эффекта отравления у монстра
 * 
 * Наносит периодический урон (DOT) каждые 60 кадров.
 * При смерти монстра обрабатывает его удаление.
 * 
 * @param {Object} m - Объект монстра
 * @param {number} i - Индекс монстра в массиве
 * @returns {boolean} - true, если монстр умер
 */
export function updatePoisonEffect(m, i) {
  // Если отравление не активно
  if (!m.poisonTimer || m.poisonTimer <= 0) return false;

  // Уменьшаем таймер и увеличиваем тик
  m.poisonTimer--;
  m.poisonTick++;

  // DOT-урон каждые 60 кадров
  if (m.poisonTick >= 60) {
    m.hp -= 5;
    m.poisonTick = 0;
    state.damageTexts.push({
      x: m.x, y: m.y - 15,
      text: `-5`,
      color: COLORS.effects.poison,
      size: 18, life: 35, speedy: 1.2
    });

    // Проверка смерти после урона
    if (m.hp <= 0) {
      handleMonsterDeath(m, i, state.monsters);
      return true;
    }
  }

  return false;
}

/**
 * Обновление интенсивности свечения призрака
 * 
 * Увеличивает свечение при преследовании и уменьшает в других состояниях.
 * 
 * @param {Object} m - Объект монстра (должен иметь флаг isGhost)
 * @returns {void}
 */
export function updateGhostGlow(m) {
  if (!m.isGhost) return;

  if (m.state === 'chase') {
    m.glowIntensity = Math.min(1, (m.glowIntensity || 0) + 0.05);
  } else {
    m.glowIntensity = Math.max(0, (m.glowIntensity || 0) - 0.05);
  }
}