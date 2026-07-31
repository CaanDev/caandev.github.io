/**
 * @fileoverview Обновление игрового UI.
 * Обновляет все элементы пользовательского интерфейса: здоровье, золото, урон,
 * количество монстров, уровень, оружие и состояние магазина с оптимизацией через кэширование.
 * 
 * @module systems/ui/statsUpdater
 */

import { updateControlButtonsVisibility } from './controlButtons.js';
import { state, player } from '../../core/config/index.js';
import { getFrostProgress, frostState, isPlayerProtectedFromFrost } from '../weather/frostSystem.js';
import { snowState } from '../weather/snowManager.js';
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
  // Если магазин закрыт — сбрасываем кэш и выходим
  if (!state.isShopOpen) {
    lastGoldAmount = -1;
    lastHpCost = -1;
    lastDmgCost = -1;
    lastShopState = false;
    return false;
  }
  
  if (state.isShopOpen && !lastShopState) {
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
      hpPercent: -1,
      frostProtected: false,
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
  const hpBarBg = document.getElementById('hp-bar-bg');
  
  if (hpVal && maxHpVal && hpBarFill) {
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

      hpBarFill.style.display = 'block';
      hpBarFill.style.opacity = '1';
    }
  }

  // ===== ИНДИКАТОРЫ ПОГОДЫ (СНЕГОПАД) =====
  const frostActive = snowState?.active || false;
  const isProtected = isPlayerProtectedFromFrost();
  
  // Проверяем, находится ли игрок в зоне без снегопада
  const isInProtectedZone = state.inSafeRoom || state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.isBossLevel;
  
  // Если игрок в защищённой зоне или снегопад не активен — убираем все иконки
  const shouldShowWeatherIndicators = frostActive && !isInProtectedZone;
  
  // Находим или создаём индикаторы
  let frostIndicator = document.getElementById('frost-protection-indicator');
  let snowIndicator = document.getElementById('snow-indicator');
  const uiHp = document.getElementById('ui-hp');
  
  // ===== ИКОНКА СНЕГОПАДА ❄️ =====
  if (shouldShowWeatherIndicators && !isProtected) {
    // Идёт снегопад, нет талисмана — показываем ❄️
    if (!snowIndicator && uiHp) {
      snowIndicator = document.createElement('div');
      snowIndicator.id = 'snow-indicator';
      snowIndicator.style.cssText = `
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        margin-left: 8px;
        animation: snowIndicatorPulse 3s ease-in-out infinite;
      `;
      snowIndicator.innerHTML = '❄️';
      uiHp.appendChild(snowIndicator);
    }
    if (snowIndicator) {
      snowIndicator.style.display = 'inline-flex';
    }
    // Убираем огненный индикатор, если он есть
    if (frostIndicator) {
      frostIndicator.style.display = 'none';
    }
  } else if (shouldShowWeatherIndicators && isProtected) {
    // Идёт снегопад и есть талисман — показываем 🔥 ❄️
    if (!frostIndicator && uiHp) {
      frostIndicator = document.createElement('div');
      frostIndicator.id = 'frost-protection-indicator';
      frostIndicator.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-size: 12px;
        color: #ff8844;
        margin-left: 8px;
        text-shadow: 0 0 10px rgba(255, 136, 68, 0.3);
        animation: frostProtectionPulse 3s ease-in-out infinite;
      `;
      frostIndicator.innerHTML = '🔥❄️';
      uiHp.appendChild(frostIndicator);
    }
    if (frostIndicator) {
      frostIndicator.style.display = 'inline-flex';
    }
    // Убираем обычный снежный индикатор
    if (snowIndicator) {
      snowIndicator.style.display = 'none';
    }
  } else {
    // Снегопада нет или игрок в защищённой зоне — убираем все иконки
    if (snowIndicator) {
      snowIndicator.style.display = 'none';
    }
    if (frostIndicator) {
      frostIndicator.style.display = 'none';
    }
  }

  // ===== ЭФФЕКТ ЗАМОРОЗКИ (ЛЕДЯНОЙ БИОМ) =====
  const frostProgress = getFrostProgress();

  // Если заморозки нет — удаляем маску
  if (frostProgress <= 0) {
    const iceOverlay = document.getElementById('hp-ice-overlay');
    if (iceOverlay && iceOverlay.parentNode) {
      iceOverlay.parentNode.removeChild(iceOverlay);
    }
  } else {
    // Если маска ещё не создана — создаём
    let iceOverlay = document.getElementById('hp-ice-overlay');
    const hpBarBg = document.getElementById('hp-bar-bg');
    
    if (!iceOverlay && hpBarBg) {
      iceOverlay = document.createElement('div');
      iceOverlay.id = 'hp-ice-overlay';
      iceOverlay.style.cssText = `
        position: absolute;
        top: -1px;
        left: 0;
        width: 0%;
        height: calc(100% + 2px);
        border-radius: 5px;
        pointer-events: none;
        transition: width 0.3s ease, opacity 0.3s ease;
        z-index: 2;
        mix-blend-mode: overlay;
        box-sizing: border-box;
        opacity: 0.85;
        background: linear-gradient(90deg, 
          rgba(60, 180, 255, 0.85) 0%,
          rgba(120, 220, 255, 0.9) 25%,
          rgba(60, 180, 255, 0.85) 55%,
          rgba(160, 240, 255, 0.75) 80%,
          rgba(220, 248, 255, 0.7) 100%
        );
        box-shadow: 
          inset 0 0 35px rgba(60, 180, 255, 0.5),
          inset 0 2px 12px rgba(255, 255, 255, 0.6),
          inset 0 -2px 12px rgba(255, 255, 255, 0.4),
          0 0 20px rgba(60, 180, 255, 0.25);
        border-top: 2px solid rgba(255, 255, 255, 0.5);
        border-bottom: 2px solid rgba(255, 255, 255, 0.4);
      `;
      
      hpBarBg.style.position = 'relative';
      hpBarBg.style.overflow = 'hidden';
      hpBarBg.style.display = 'flex';
      hpBarBg.style.alignItems = 'center';
      hpBarBg.style.padding = '0';
      hpBarBg.style.margin = '0';
      hpBarBg.style.border = 'none';
      
      hpBarBg.appendChild(iceOverlay);
    }
    
    if (iceOverlay) {
      // Обновляем ширину маски на основе прогресса заморозки
      const hpBarFill = document.getElementById('hp-bar-fill');
      const currentWidth = hpBarFill ? parseFloat(hpBarFill.style.width) / 100 : 1;
      const iceWidth = currentWidth * (frostProgress / 100);
      const clampedPercent = Math.min(100, Math.max(0, iceWidth * 100));
      iceOverlay.style.width = `${clampedPercent}%`;
      iceOverlay.style.opacity = '1';
    }
  }

  // ===== ЗОЛОТО (с принудительным приведением к числу) =====
  const goldVal = document.getElementById('gold-val');
  if (goldVal) {
    const value = Number(player.gold) || 0;
    if (value !== cache.gold) {
      goldVal.innerText = value;
      cache.gold = value;
    }
  }

  // ===== УРОН (с принудительным приведением к числу) =====
  const dmgVal = document.getElementById('dmg-val');
  if (dmgVal) {
    const value = Number(player.baseDamage) || 0;
    if (value !== cache.damage) {
      dmgVal.innerText = value;
      cache.damage = value;
    }
  }

  // ===== СТОИМОСТЬ УЛУЧШЕНИЙ (ТОЛЬКО КОГДА МАГАЗИН ОТКРЫТ) =====
  if (state.isShopOpen) {
    const hpCost = document.getElementById('hp-cost');
    if (hpCost) hpCost.innerText = player.hpCost || 0;

    const dmgCost = document.getElementById('dmg-cost');
    if (dmgCost) dmgCost.innerText = player.dmgCost || 0;
  }
}