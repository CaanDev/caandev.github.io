/**
 * @fileoverview Система заморозки игрока в ледяном биоме
 * @module systems/weather/frostSystem
 */

import { state, player, CONFIG } from '../../core/config/index.js';
import { snowState } from './snowManager.js';
import { triggerGameOver } from '../../entities/player/gameOver.js';

/** @type {Object} - Состояние заморозки */
export const frostState = {
  /** @type {number} - Прогресс заморозки (0-100) */
  progress: 0,
  /** @type {boolean} - Полностью ли замёрз игрок (progress === 100) */
  frozen: false,
  /** @type {number} - Таймер потери HP (кадры) */
  damageTimer: 0,
  /** @type {number} - Интервал потери HP (кадры) */
  damageInterval: 60,
};

/**
 * Проверка, экипирован ли у игрока огненный талисман
 * @returns {boolean} - true, если талисман экипирован
 */
function hasFireTalismanEquipped() {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes('talismanFire');
}

/**
 * Проверка, находится ли игрок рядом с активным факелом
 * @returns {boolean} - true, если игрок рядом с факелом
 */
export function isNearActiveTorch() {
  const torchRadius = 150;
  
  for (const torch of state.torches) {
    if (!torch.active) continue;
    
    const torchWorldX = torch.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const torchWorldY = torch.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const dist = Math.hypot(player.px - torchWorldX, player.py - torchWorldY);
    
    if (dist < torchRadius) {
      return true;
    }
  }
  return false;
}

/**
 * Обновление состояния заморозки (вызывается каждый кадр)
 */
export function updateFrost() {
  // Если снегопад не активен или игрок в защищённой зоне — оттаивание
  const isProtected = state.inSafeRoom || state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.isBossLevel;
  
  // Если у игрока экипирован огненный талисман — он не замерзает
  const hasTalisman = hasFireTalismanEquipped();
  
  if (!snowState.active || isProtected || hasTalisman) {
    if (frostState.progress > 0) {
      frostState.progress = Math.max(0, frostState.progress - 0.33);
      if (frostState.progress === 0) {
        frostState.frozen = false;
        frostState.damageTimer = 0;
        // Удаляем ледяную маску
        const iceOverlay = document.getElementById('hp-ice-overlay');
        if (iceOverlay && iceOverlay.parentNode) {
          iceOverlay.parentNode.removeChild(iceOverlay);
        }
      }
    }
    return;
  }

  // Снегопад активен — применяем эффект заморозки
  const nearTorch = isNearActiveTorch();

  if (nearTorch) {
    // У факела — оттаивание
    if (frostState.progress > 0) {
      frostState.progress = Math.max(0, frostState.progress - 0.33);
      if (frostState.progress === 0) {
        frostState.frozen = false;
        frostState.damageTimer = 0;
        // Удаляем ледяную маску
        const iceOverlay = document.getElementById('hp-ice-overlay');
        if (iceOverlay && iceOverlay.parentNode) {
          iceOverlay.parentNode.removeChild(iceOverlay);
        }
      }
    }
    frostState.damageTimer = 0;
  } else {
    // Без факела — замерзание
    frostState.progress = Math.min(100, frostState.progress + 0.167);
    
    if (frostState.progress >= 100) {
      frostState.progress = 100;
      if (!frostState.frozen) {
        frostState.frozen = true;
        frostState.damageTimer = 0;
        
        state.damageTexts.push({
          x: player.px,
          y: player.py - 45,
          text: '❄️ ВЫ ЗАМЕРЗЛИ! ❄️',
          color: '#88ddff',
          size: 18,
          life: 60,
          speedy: 0.5
        });
      }
    } else {
      if (frostState.frozen) {
        frostState.frozen = false;
        frostState.damageTimer = 0;
      }
    }
  }

  // Урон только при 100% заморозке
  if (frostState.frozen) {
    frostState.damageTimer++;
    
    if (frostState.damageTimer >= frostState.damageInterval) {
      frostState.damageTimer = 0;
      
      player.hp -= 1;
      
      state.damageTexts.push({
        x: player.px,
        y: player.py - 20,
        text: '❄️ -1 HP',
        color: '#88ddff',
        size: 18,
        life: 30,
        speedy: 0.8
      });
      
      state.screenShake = 3;
      
      if (player.hp <= 0) {
        triggerGameOver();
        return;
      }
    }
  }
}

/**
 * Полный сброс состояния заморозки и удаление UI элементов
 */
export function resetFrost() {
  frostState.progress = 0;
  frostState.frozen = false;
  frostState.damageTimer = 0;
  
  const iceOverlay = document.getElementById('hp-ice-overlay');
  if (iceOverlay && iceOverlay.parentNode) {
    iceOverlay.parentNode.removeChild(iceOverlay);
  }
}

/**
 * Получение прогресса заморозки (для отображения на UI)
 * @returns {number} - Прогресс заморозки (0-100)
 */
export function getFrostProgress() {
  return frostState.progress;
}

/**
 * Проверка, замёрз ли игрок (100% заморозка)
 * @returns {boolean} - true, если игрок замёрз
 */
export function isPlayerFrozen() {
  return frostState.frozen;
}

/**
 * Проверка, защищён ли игрок от заморозки
 * @returns {boolean} - true, если игрок защищён (есть талисман или в защищённой зоне)
 */
export function isPlayerProtectedFromFrost() {
  const isProtected = state.inSafeRoom || state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.isBossLevel;
  const hasTalisman = hasFireTalismanEquipped();
  return isProtected || hasTalisman;
}