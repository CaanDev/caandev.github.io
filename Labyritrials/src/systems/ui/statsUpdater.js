/**
 * @fileoverview Обновление игрового UI.
 * Обновляет все элементы пользовательского интерфейса: здоровье, золото, урон,
 * количество монстров, уровень, оружие и состояние магазина с оптимизацией через кэширование.
 * 
 * @module systems/ui/statsUpdater
 */

import { updateControlButtonsVisibility } from './controlButtons.js';
import { state, player } from '../../core/config/index.js';
import { getImage, isImageLoaded } from '../../utils/imageLoader.js';
import { SHOP_IMAGES } from '../../images/shopImages.js';

/** @type {number} - Кэш последнего количества золота для оптимизации */
let lastGoldAmount = -1;
/** @type {number} - Кэш последней стоимости улучшения HP */
let lastHpCost = -1;
/** @type {number} - Кэш последней стоимости улучшения урона */
let lastDmgCost = -1;
/** @type {boolean} - Кэш последнего состояния магазина */
let lastShopState = false;

/**
 * Обновление отображения оружия в HUD
 * 
 * @returns {void}
 * @private
 */
function updateWeaponDisplay() {
  const meleeImg = document.getElementById('weapon-melee-img');
  const meleeLabel = document.getElementById('weapon-melee-label');
  const rangedImg = document.getElementById('weapon-ranged-img');
  const rangedLabel = document.getElementById('weapon-ranged-label');
  const rangedContainer = document.getElementById('weapon-ranged');
  
  // ===== КЭШ ДЛЯ ПРЕДОТВРАЩЕНИЯ МЕРЦАНИЯ =====
  if (!window._weaponCache) {
    window._weaponCache = {
      meleeLabel: '',
      rangedLabel: '',
      meleeImg: '',
      rangedImg: '',
      rangedVisible: false
    };
  }
  const cache = window._weaponCache;
  
  // ===== БЛИЖНЕЕ ОРУЖИЕ =====
  const weaponMap = {
    'default': { imgKey: 'staffDefault', label: 'Обычный посох' },
    'stun': { imgKey: 'staffThunder', label: 'Громовой посох' },
    'vampire': { imgKey: 'staffVampire', label: 'Посох вампира' },
  };
  
  const melee = weaponMap[player.meleeWeapon] || weaponMap['default'];
  const meleePath = SHOP_IMAGES[melee.imgKey];
  const meleeCacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === meleePath);
  
  if (meleeLabel && melee.label !== cache.meleeLabel) {
    meleeLabel.textContent = melee.label;
    cache.meleeLabel = melee.label;
  }
  
  if (meleeImg && meleeCacheKey && isImageLoaded(meleeCacheKey)) {
    const img = getImage(meleeCacheKey);
    if (img && img.src !== cache.meleeImg) {
      meleeImg.src = img.src;
      cache.meleeImg = img.src;
    }
  }
  
  // ===== ДАЛЬНЕЕ ОРУЖИЕ =====
  const hasRanged = player.rangedWeapon === 'fireball';
  
  if (rangedContainer) {
    const shouldShow = hasRanged ? 'flex' : 'none';
    if (rangedContainer.style.display !== shouldShow) {
      rangedContainer.style.display = shouldShow;
    }
    if (hasRanged) {
      rangedContainer.classList.add('active');
    } else {
      rangedContainer.classList.remove('active');
    }
  }
  
  if (hasRanged) {
    if (rangedLabel && 'Огненный шар' !== cache.rangedLabel) {
      rangedLabel.textContent = 'Огненный шар';
      cache.rangedLabel = 'Огненный шар';
    }
    
    const fireballPath = SHOP_IMAGES.fireball;
    const fireballCacheKey = Object.keys(SHOP_IMAGES).find(key => SHOP_IMAGES[key] === fireballPath);
    if (rangedImg && fireballCacheKey && isImageLoaded(fireballCacheKey)) {
      const img = getImage(fireballCacheKey);
      if (img && img.src !== cache.rangedImg) {
        rangedImg.src = img.src;
        cache.rangedImg = img.src;
      }
    }
  }
}

/**
 * Проверка необходимости обновления магазина
 * 
 * @returns {boolean} - true, если магазин нужно обновить
 * @private
 */
function shouldUpdateShop() {
  const shopUI = document.getElementById('shop-ui');
  const isShopOpen = shopUI && shopUI.style.display === 'block';
  
  if (!isShopOpen) {
    lastGoldAmount = -1;
    lastHpCost = -1;
    lastDmgCost = -1;
    lastShopState = false;
    return false;
  }
  
  if (isShopOpen && !lastShopState) {
    lastShopState = true;
    lastGoldAmount = player.gold;
    lastHpCost = player.hpCost;
    lastDmgCost = player.dmgCost;
    return true;
  }
  
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
  // Проверка на NaN в HP
  if (isNaN(player.hp)) {
    player.hp = player.maxHp || 100;
  }
  if (isNaN(player.maxHp) || player.maxHp <= 0) {
    player.maxHp = 100;
  }
  
  updateBasicStats();
  updateWeaponDisplay();
  updateControlButtonsVisibility();
  
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
  // ===== ИНИЦИАЛИЗАЦИЯ КЭША =====
  if (!window._statsCache) {
    window._statsCache = {
      monsters: -1,
      level: -1,
      gold: -1,
      damage: -1,
      hp: -1,
      maxHp: -1,
      hpPercent: -1
    };
  }
  const cache = window._statsCache;
  
  // ===== КОЛИЧЕСТВО МОНСТРОВ =====
  const monstersVal = document.getElementById('monsters-val');
  if (monstersVal) {
    let value;
    if (state.inTrapRoom && state.trapActivated) {
      const aliveMonsters = state.trapMonsters.filter(m => m.hp > 0);
      value = aliveMonsters.length;
    } else {
      value = state.monsters.length;
    }
    if (value !== cache.monsters) {
      monstersVal.innerText = value;
      cache.monsters = value;
    }
  }
  
  // ===== УРОВЕНЬ =====
  const lvlVal = document.getElementById('lvl-val');
  if (lvlVal) {
    const value = state.gameLevel;
    if (value !== cache.level) {
      lvlVal.innerText = value;
      cache.level = value;
    }
  }

  // ===== ЗДОРОВЬЕ =====
  const hpVal = document.getElementById('hp-val');
  const maxHpVal = document.getElementById('max-hp-val');
  const hpBarFill = document.getElementById('hp-bar-fill');
  
  if (hpVal && maxHpVal && hpBarFill) {
    // Защита от NaN и некорректных значений
    const currentHp = (typeof player.hp === 'number' && !isNaN(player.hp)) 
      ? Math.floor(player.hp) 
      : 0;
    const maxHp = (typeof player.maxHp === 'number' && !isNaN(player.maxHp) && player.maxHp > 0) 
      ? player.maxHp 
      : 100;
    const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    
    if (currentHp !== cache.hp) {
      hpVal.innerText = currentHp;
      cache.hp = currentHp;
    }
    
    if (maxHp !== cache.maxHp) {
      maxHpVal.innerText = maxHp;
      cache.maxHp = maxHp;
    }
    
    if (Math.abs(hpPercent - cache.hpPercent) > 0.5) {
      hpBarFill.style.width = hpPercent + '%';
      cache.hpPercent = hpPercent;
      
      if (hpPercent < 25) {
        hpBarFill.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
      } else if (hpPercent < 50) {
        hpBarFill.style.background = 'linear-gradient(90deg, #e67e22, #f1c40f)';
      } else {
        hpBarFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
      }
    }
  }

  // ===== ЗОЛОТО =====
  const goldVal = document.getElementById('gold-val');
  if (goldVal) {
    const value = player.gold;
    if (value !== cache.gold) {
      goldVal.innerText = value;
      cache.gold = value;
    }
  }

  // ===== УРОН =====
  const dmgVal = document.getElementById('dmg-val');
  if (dmgVal) {
    const value = player.baseDamage;
    if (value !== cache.damage) {
      dmgVal.innerText = value;
      cache.damage = value;
    }
  }

  // ===== СТОИМОСТЬ УЛУЧШЕНИЙ =====
  const hpCost = document.getElementById('hp-cost');
  if (hpCost) hpCost.innerText = player.hpCost;

  const dmgCost = document.getElementById('dmg-cost');
  if (dmgCost) dmgCost.innerText = player.dmgCost;
}