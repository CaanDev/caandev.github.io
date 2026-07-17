/**
 * @fileoverview Обновление игрового UI.
 * Обновляет все элементы пользовательского интерфейса: здоровье, золото, урон,
 * количество монстров, уровень и состояние магазина с оптимизацией через кэширование.
 * 
 * @module systems/ui/statsUpdater
 */

import { updateControlButtonsVisibility } from './controlButtons.js';
import { state, player } from '../../core/config/index.js';

/** @type {number} - Кэш последнего количества золота для оптимизации */
let lastGoldAmount = -1;
/** @type {number} - Кэш последней стоимости улучшения HP */
let lastHpCost = -1;
/** @type {number} - Кэш последней стоимости улучшения урона */
let lastDmgCost = -1;
/** @type {boolean} - Кэш последнего состояния магазина */
let lastShopState = false;

/**
 * Проверка необходимости обновления магазина
 * 
 * @returns {boolean} - true, если магазин нужно обновить
 * @private
 */
function shouldUpdateShop() {
  const shopUI = document.getElementById('shop-ui');
  const isShopOpen = shopUI && shopUI.style.display === 'block';
  
  // Если магазин закрыт — сбрасываем кэш и выходим
  if (!isShopOpen) {
    lastGoldAmount = -1;
    lastHpCost = -1;
    lastDmgCost = -1;
    lastShopState = false;
    return false;
  }
  
  // Если магазин только что открылся — обновляем обязательно
  if (isShopOpen && !lastShopState) {
    lastShopState = true;
    lastGoldAmount = player.gold;
    lastHpCost = player.hpCost;
    lastDmgCost = player.dmgCost;
    return true;
  }
  
  // Проверяем изменения
  const goldChanged = player.gold !== lastGoldAmount;
  const hpCostChanged = player.hpCost !== lastHpCost;
  const dmgCostChanged = player.dmgCost !== lastDmgCost;
  
  if (goldChanged || hpCostChanged || dmgCostChanged) {
    lastGoldAmount = player.gold;
    lastHpCost = player.hpCost;
    lastDmgCost = player.dmgCost;
    return true;
  }
  
  return false;
}

/**
 * Основная функция обновления UI
 * 
 * @returns {void}
 */
export function updateUI() {
  updateBasicStats();
  updateControlButtonsVisibility();
  
  // Обновляем магазин только при необходимости (оптимизация)
  if (shouldUpdateShop()) {
    import('./shop/index.js').then(module => {
      if (module.updateShopUIForExternal) {
        module.updateShopUIForExternal();
      }
    });
  }
}

/**
 * Обновление базовой статистики в UI
 * 
 * @returns {void}
 * @private
 */
function updateBasicStats() {
  // ===== КОЛИЧЕСТВО МОНСТРОВ =====
  const monstersVal = document.getElementById('monsters-val');
  if (monstersVal) {
    if (state.inTrapRoom && state.trapActivated) {
      const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);
      monstersVal.innerText = aliveMonsters.length;
    } else {
      monstersVal.innerText = state.monsters.length;
    }
  }
  
  // ===== УРОВЕНЬ =====
  const lvlVal = document.getElementById('lvl-val');
  if (lvlVal) lvlVal.innerText = state.gameLevel;

  // ===== ЗДОРОВЬЕ =====
  const hpVal = document.getElementById('hp-val');
  if (hpVal) {
    const hp = (typeof player.hp === 'number' && !isNaN(player.hp)) ? Math.floor(player.hp) : 0;
    hpVal.innerText = hp;
  }

  const maxHpVal = document.getElementById('max-hp-val');
  if (maxHpVal) maxHpVal.innerText = player.maxHp;

  // ===== ЗОЛОТО =====
  const goldVal = document.getElementById('gold-val');
  if (goldVal) goldVal.innerText = player.gold;

  // ===== УРОН С АРТЕФАКТАМИ =====
  const dmgVal = document.getElementById('dmg-val');
  if (dmgVal) {
    dmgVal.innerText = `${player.baseDamage} (👑 x${player.artifactsCollected})`;
  }

  // ===== СТОИМОСТЬ УЛУЧШЕНИЙ =====
  const hpCost = document.getElementById('hp-cost');
  if (hpCost) hpCost.innerText = player.hpCost;

  const dmgCost = document.getElementById('dmg-cost');
  if (dmgCost) dmgCost.innerText = player.dmgCost;
}