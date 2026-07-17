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
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
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

        // Эффекты и обновление
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.damage));
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
      if (!player.hasMap && player.gold >= CONFIG.shop.mapCost) {
        // Списываем золото
        player.gold -= CONFIG.shop.mapCost;
        state.gameStats.goldSpent += CONFIG.shop.mapCost;
        player.hasMap = true;

        // Обновляем достижение
        updateProgress('map_bought', 1);

        // Эффекты и обновление
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
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
      const isLevelAvailable = state.gameLevel >= CONFIG.shop.vampireStaffMinLevel;

      // Если уже активно
      if (isOwned && player.meleeWeapon === 'vampire') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyActive));
        return;
      }

      // Если уже куплено — просто переключаем
      if (isOwned) {
        player.meleeWeapon = 'vampire';
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.vampireStaff));
        return;
      }

      // Проверка уровня
      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      // Покупка
      if (player.gold >= CONFIG.shop.vampireStaffCost) {
        player.gold -= CONFIG.shop.vampireStaffCost;
        state.gameStats.goldSpent += CONFIG.shop.vampireStaffCost;
        player.ownedMeleeWeapons.push('vampire');
        player.meleeWeapon = 'vampire';
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
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
      const isLevelAvailable = state.gameLevel >= CONFIG.shop.stunMinLevel;

      if (isOwned && player.meleeWeapon === 'stun') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyActive));
        return;
      }

      if (isOwned) {
        player.meleeWeapon = 'stun';
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.stunStaff));
        return;
      }

      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      if (player.gold >= CONFIG.shop.stunStaffCost) {
        player.gold -= CONFIG.shop.stunStaffCost;
        state.gameStats.goldSpent += CONFIG.shop.stunStaffCost;
        player.ownedMeleeWeapons.push('stun');
        player.meleeWeapon = 'stun';
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.stunStaff));
      } else {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.noGold));
      }
    });
  }
}

/**
 * Инициализация обработчика выбора обычного посоха
 * 
 * @param {Function} updateShopUICallback - Колбэк обновления UI магазина
 * @returns {void}
 */
export function initBuyDefaultStaffHandler(updateShopUICallback) {
  const btn = document.getElementById('buy-default-staff');
  if (btn) {
    btn.addEventListener('click', () => {
      if (player.meleeWeapon === 'default') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyActive));
        return;
      }
      
      player.meleeWeapon = 'default';
      updateShopUICallback();
      Game.updateUI();
      import('../../../save/saveSystem.js').then(module => module.saveGame());
      updateShopkeeperSpeech(getRandomSpeech(SPEECH.defaultStaff));
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
      const isLevelAvailable = state.gameLevel >= CONFIG.shop.fireballMinLevel;

      if (isOwned && player.rangedWeapon === 'fireball') {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.alreadyActive));
        return;
      }

      if (isOwned) {
        player.rangedWeapon = 'fireball';
        updateShopUICallback();
        Game.updateUI();
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.fireball));
        return;
      }

      if (!isLevelAvailable) {
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.levelLocked));
        return;
      }

      if (player.gold >= CONFIG.shop.fireballCost) {
        player.gold -= CONFIG.shop.fireballCost;
        state.gameStats.goldSpent += CONFIG.shop.fireballCost;
        player.ownedRangedWeapons.push('fireball');
        player.rangedWeapon = 'fireball';
        
        updateWeaponsBoughtProgress();
        
        audio.playSound('shopBuyItem', 0.6);
        updateShopUICallback();
        Game.updateUI();
        import('../../../save/saveSystem.js').then(module => module.saveGame());
        updateShopkeeperSpeech(getRandomSpeech(SPEECH.fireball));
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