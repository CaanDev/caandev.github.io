/**
 * @fileoverview Обработчики покупок в магазине.
 * Управляет логикой покупки улучшений, оружия и предметов,
 * обновляет состояние игрока и вызывает сохранение.
 * 
 * @module systems/ui/shop/shopHandlers
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { audio } from '../../../audio/audioManager.js';
import { Game } from '../../../core/game.js';
import { addMapToInventory } from '../inventory/inventoryUtils.js';
import { getWeaponPrice, getWeaponMinLevel, getItemPrice, getItemMinLevel, getItemData } from '../../../data/index.js';
import { updateProgress, setProgress } from '../../../systems/achievements/index.js';
import { isUnlocked } from '../../../systems/achievements/manager.js';
import { getRandomSpeech, updateShopkeeperSpeech } from './shopSpeech.js';
import { SPEECH } from './shopSpeech.js';

/**
 * Инициализация обработчика покупки улучшения здоровья
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyHpHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-hp');
  if (btn) {
    btn.addEventListener('click', () => {
      if (player.gold >= player.hpCost) {
        // Списываем золото
        player.gold -= player.hpCost;
        state.gameStats.goldSpent += player.hpCost;
        
        // Увеличиваем HP
        player.maxHp += 25;
        player.hp += 25;
        
        // Обновляем стоимость
        const newCost = Math.floor(player.hpCost * CONFIG.shop.hpCostMultiplier);
        player.hpCost = Math.min(newCost, CONFIG.shop.hpMaxCost);
        
        // Эффекты и обновление
        audio.playSound('shopBuyItem', 0.6);
        
        // ===== ОБНОВЛЕНИЕ UI =====
        // Сначала вызываем колбэк
        updateShopUICallback();
        
        // Затем обновляем элементы напрямую (с задержкой, чтобы DOM успел обновиться)
        setTimeout(() => {
          const hpCostEl = document.getElementById('hp-cost');
          if (hpCostEl) hpCostEl.textContent = player.hpCost;
          
          const statusEl = document.getElementById('hp-status');
          if (statusEl) {
            if (player.gold >= player.hpCost) {
              statusEl.textContent = 'Купить';
              statusEl.className = 'shop-status buy';
            } else {
              statusEl.textContent = 'Не хватает золота';
              statusEl.className = 'shop-status no-gold';
            }
          }
          
          const goldEl = document.getElementById('shop-gold');
          if (goldEl) goldEl.textContent = player.gold;
        }, 50);
        
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.hp));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки улучшения урона
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyDamageHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-dmg');
  if (btn) {
    btn.addEventListener('click', () => {
      if (player.gold >= player.dmgCost) {
        // Списываем золото
        player.gold -= player.dmgCost;
        state.gameStats.goldSpent += player.dmgCost;
        
        // Увеличиваем урон
        player.baseDamage += 10;
        
        // Обновляем стоимость
        const newCost = Math.floor(player.dmgCost * CONFIG.shop.dmgCostMultiplier);
        player.dmgCost = Math.min(newCost, CONFIG.shop.dmgMaxCost);
        
        audio.playSound('shopBuyItem', 0.6);
        
        updateShopUICallback();
        
        setTimeout(() => {
          const dmgCostEl = document.getElementById('dmg-cost');
          if (dmgCostEl) dmgCostEl.textContent = player.dmgCost;
          
          const statusEl = document.getElementById('dmg-status');
          if (statusEl) {
            if (player.gold >= player.dmgCost) {
              statusEl.textContent = 'Купить';
              statusEl.className = 'shop-status buy';
            } else {
              statusEl.textContent = 'Не хватает золота';
              statusEl.className = 'shop-status no-gold';
            }
          }
          
          const goldEl = document.getElementById('shop-gold');
          if (goldEl) goldEl.textContent = player.gold;
        }, 50);
        
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.damage));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки улучшения выносливости
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyStaminaHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-stamina');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const maxUpgrades = 7;
    const currentUpgrades = player.staminaUpgradeCount || 0;
    const cost = player.staminaUpgradeCost || 150;

    if (currentUpgrades >= maxUpgrades) {
      updateShopkeeperSpeech(getRandomSpeech(SPEECH.maxStamina));
      return;
    }

    if (player.gold >= cost) {
      player.gold -= cost;
      state.gameStats.goldSpent += cost;

      player.maxStamina += 10;
      player.stamina = player.maxStamina;
      player.staminaUpgradeCount++;
      player.staminaUpgradeCost = Math.floor(cost * 1.25);

      audio.playSound('shopBuyItem', 0.6);
      
      // Обновляем UI через колбэк
      updateShopUICallback();
      Game.updateUI();
      updateShopkeeperSpeech(getRandomSpeech(SPEECH.stamina));

      // Обновляем статус кнопки
      setTimeout(() => {
        const statusEl = document.getElementById('stamina-status');
        const goldEl = document.getElementById('shop-gold');
        
        if (goldEl) goldEl.textContent = player.gold;
        
        if (statusEl) {
          if (currentUpgrades + 1 >= maxUpgrades) {
            statusEl.textContent = 'Максимум';
            statusEl.className = 'shop-status owned';
          } else if (player.gold >= player.staminaUpgradeCost) {
            statusEl.textContent = 'Купить';
            statusEl.className = 'shop-status buy';
          } else {
            statusEl.textContent = 'Не хватает золота';
            statusEl.className = 'shop-status no-gold';
          }
        }
      }, 50);
    } else {
      updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
    }
  });
}

/**
 * Инициализация обработчика покупки посоха вампира
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyVampireStaffHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-sword-vamp');
  if (btn) {
    btn.addEventListener('click', () => {
      const isOwned = player.ownedMeleeWeapons.includes('vampire');
      const minLevel = getWeaponMinLevel('vampire');
      const cost = getWeaponPrice('vampire');
      const isLevelAvailable = state.gameLevel >= minLevel;

      // Если уже куплено — просто показываем сообщение
      if (isOwned) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyOwned));
        return;
      }

      // Проверка уровня
      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      // Покупка
      if (player.gold >= cost) {
        player.gold -= cost;
        state.gameStats.goldSpent += cost;
        player.ownedMeleeWeapons.push('vampire');
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.vampireStaff));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки громового посоха
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyStunStaffHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-sword-stun');
  if (btn) {
    btn.addEventListener('click', () => {
      const isOwned = player.ownedMeleeWeapons.includes('stun');
      const minLevel = getWeaponMinLevel('stun');
      const cost = getWeaponPrice('stun');
      const isLevelAvailable = state.gameLevel >= minLevel;

      if (isOwned) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyOwned));
        return;
      }

      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      if (player.gold >= cost) {
        player.gold -= cost;
        state.gameStats.goldSpent += cost;
        player.ownedMeleeWeapons.push('stun');
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.stunStaff));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки огненного шара
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyFireballHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-fireball');
  if (btn) {
    btn.addEventListener('click', () => {
      const isOwned = player.ownedRangedWeapons.includes('fireball');
      const minLevel = getWeaponMinLevel('fireball');
      const cost = getWeaponPrice('fireball');
      const isLevelAvailable = state.gameLevel >= minLevel;

      if (isOwned) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyOwned));
        return;
      }

      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      if (player.gold >= cost) {
        player.gold -= cost;
        state.gameStats.goldSpent += cost;
        player.ownedRangedWeapons.push('fireball');
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.fireball));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки карты
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyMapHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-map');
  if (btn) {
    btn.addEventListener('click', () => {
      const mapPrice = getItemPrice('map');
      
      if (!player.hasMap && player.gold >= mapPrice) {
        // Списываем золото
        player.gold -= mapPrice;
        state.gameStats.goldSpent += mapPrice;
        player.hasMap = true;
        addMapToInventory();

        // Обновляем достижение
        updateProgress('map_bought', 1);

        // Эффекты и обновление
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.map));
      } else if (player.hasMap) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyOwned));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика покупки огненного талисмана
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyTalismanFireHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-talisman-fire');
  if (btn) {
    btn.addEventListener('click', () => {
      const itemData = getItemData('talismanFire');
      if (!itemData) return;

      const cost = itemData.price;
      const isOwned = player.inventory?.items?.equipment?.includes('talismanFire') || false;

      if (!isOwned && player.gold >= cost) {
        // Списываем золото
        player.gold -= cost;
        state.gameStats.goldSpent += cost;

        // Инициализируем инвентарь, если его нет
        if (!player.inventory) {
          player.inventory = { equipped: {}, items: { equipment: [] } };
        }
        if (!player.inventory.items) {
          player.inventory.items = { equipment: [] };
        }
        if (!player.inventory.items.equipment) {
          player.inventory.items.equipment = [];
        }

        // Добавляем талисман в снаряжение
        player.inventory.items.equipment.push('talismanFire');

        // Эффекты
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.talismanFire));
      } else if (isOwned) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyOwned));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Обновление прогресса достижения "Экипированный"
 * 
 * @returns {void}
 * @private
 */
function updateWeaponsBoughtProgress() {
  if (isUnlocked('fully_equipped')) return;
  
  let count = 0;
  if (player.ownedMeleeWeapons.includes('vampire')) count++;
  if (player.ownedMeleeWeapons.includes('stun')) count++;
  if (player.ownedRangedWeapons.includes('fireball')) count++;
  
  setProgress('weapons_bought', count);
}