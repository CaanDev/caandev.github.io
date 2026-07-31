/**
 * @fileoverview Статусы товаров в магазине.
 * Обновляет отображение состояния кнопок покупки в зависимости
 * от наличия золота, владения предметами и доступности по уровню.
 * 
 * @module systems/ui/shop/shopStatus
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { getWeaponPrice, getWeaponMinLevel, getItemPrice, getItemMinLevel, getItemData } from '../../../data/index.js';

/**
 * Обновление статуса покупки улучшения здоровья
 * 
 * @returns {void}
 */
export function updateBuyHpStatus() {
  const btn = document.getElementById('buy-hp');
  const status = document.getElementById('hp-status');
  const priceEl = document.getElementById('hp-cost');
  
  if (!btn || !status || !priceEl) return;

  btn.classList.remove('no-gold', 'owned');

  priceEl.textContent = player.hpCost;

  if (player.gold >= player.hpCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
  }
}

/**
 * Обновление статуса покупки улучшения урона
 * 
 * @returns {void}
 */
export function updateBuyDamageStatus() {
  const btn = document.getElementById('buy-dmg');
  const status = document.getElementById('dmg-status');
  const priceEl = document.getElementById('dmg-cost');
  
  if (!btn || !status || !priceEl) return;

  btn.classList.remove('no-gold', 'owned');

  priceEl.textContent = player.dmgCost;

  if (player.gold >= player.dmgCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
  }
}

/**
 * Обновление статуса посоха вампира
 * 
 * @returns {void}
 */
export function updateVampireStaffStatus() {
  const btn = document.getElementById('buy-sword-vamp');
  const status = document.getElementById('vamp-status');
  const price = document.getElementById('vamp-price');
  if (!btn || !status || !price) return;

  const minLevel = getWeaponMinLevel('vampire');
  const cost = getWeaponPrice('vampire');
  const isLevelAvailable = state.gameLevel >= minLevel;
  const isOwned = player.ownedMeleeWeapons.includes('vampire');

  btn.classList.remove('active', 'locked', 'no-gold', 'owned');

  if (isOwned) {
    btn.classList.add('owned');
    status.textContent = 'Куплено';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${minLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= cost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  }
}

/**
 * Обновление статуса громового посоха
 * 
 * @returns {void}
 */
export function updateStunStaffStatus() {
  const btn = document.getElementById('buy-sword-stun');
  const status = document.getElementById('stun-status');
  const price = document.getElementById('stun-price');
  if (!btn || !status || !price) return;

  const minLevel = getWeaponMinLevel('stun');
  const cost = getWeaponPrice('stun');
  const isLevelAvailable = state.gameLevel >= minLevel;
  const isOwned = player.ownedMeleeWeapons.includes('stun');

  btn.classList.remove('active', 'locked', 'no-gold', 'owned');

  if (isOwned) {
    btn.classList.add('owned');
    status.textContent = 'Куплено';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${minLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= cost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  }
}

/**
 * Обновление статуса огненного шара
 * 
 * @returns {void}
 */
export function updateFireballStatus() {
  const btn = document.getElementById('buy-fireball');
  const status = document.getElementById('fireball-status');
  const price = document.getElementById('fireball-price');
  if (!btn || !status || !price) return;

  const minLevel = getWeaponMinLevel('fireball');
  const cost = getWeaponPrice('fireball');
  const isLevelAvailable = state.gameLevel >= minLevel;
  const isOwned = player.ownedRangedWeapons.includes('fireball');

  btn.classList.remove('active', 'locked', 'no-gold', 'owned');

  if (isOwned) {
    btn.classList.add('owned');
    status.textContent = 'Куплено';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${minLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= cost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  }
}

/**
 * Обновление статуса покупки карты
 * 
 * @returns {void}
 */
export function updateMapStatus() {
  const btn = document.getElementById('buy-map');
  const status = document.getElementById('map-status');
  const price = document.getElementById('map-price');
  if (!btn || !status || !price) return;

  btn.classList.remove('active', 'no-gold', 'owned');

  const mapPrice = getItemPrice('map');

  if (player.hasMap) {
    btn.classList.add('owned');
    status.textContent = 'Куплено';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (player.gold >= mapPrice) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${mapPrice} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${mapPrice} 💰`;
    btn.style.cursor = 'pointer';
  }
}

/**
 * Обновление статуса огненного талисмана
 * 
 * @returns {void}
 */
export function updateTalismanFireStatus() {
  const btn = document.getElementById('buy-talisman-fire');
  const status = document.getElementById('talisman-fire-status');
  const price = document.getElementById('talisman-fire-price');
  if (!btn || !status || !price) return;

  const itemData = getItemData('talismanFire');
  if (!itemData) return;

  const minLevel = itemData.minLevel;
  const cost = itemData.price;
  const isLevelAvailable = state.gameLevel >= minLevel;
  const isOwned = player.inventory?.items?.equipment?.includes('talismanFire') || false;
  const isEquipped = Object.values(player.inventory?.equipped || {}).includes('talismanFire') || false;

  // Находим элемент с названием товара
  const nameEl = btn.querySelector('.shop-name');
  
  btn.classList.remove('active', 'locked', 'no-gold', 'owned', 'new-item');

  if (isOwned || isEquipped) {
    btn.classList.add('owned');
    status.textContent = 'Куплено';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'default';
    if (nameEl) {
      const badge = nameEl.querySelector('.new-badge');
      if (badge) badge.remove();
    }
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${minLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'not-allowed';
    if (nameEl) {
      const badge = nameEl.querySelector('.new-badge');
      if (badge) badge.remove();
    }
  } else if (player.gold >= cost) {
    // Если предмет — новинка и доступен для покупки
    if (itemData.isNew) {
      // Добавляем бейдж "Новинка" к названию
      if (nameEl && !nameEl.querySelector('.new-badge')) {
        const badge = document.createElement('span');
        badge.className = 'new-badge';
        badge.textContent = 'Новинка';
        nameEl.appendChild(badge);
      }
    } else {
      if (nameEl) {
        const badge = nameEl.querySelector('.new-badge');
        if (badge) badge.remove();
      }
    }
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${cost} 💰`;
    btn.style.cursor = 'pointer';
    if (nameEl) {
      const badge = nameEl.querySelector('.new-badge');
      if (badge) badge.remove();
    }
  }
}