/**
 * @fileoverview Статусы товаров в магазине.
 * Обновляет отображение состояния кнопок покупки в зависимости
 * от наличия золота, владения предметами и доступности по уровню.
 * 
 * @module systems/ui/shop/shopStatus
 */

import { CONFIG, state, player } from '../../../core/config/index.js';

/**
 * Обновление статуса покупки улучшения здоровья
 * 
 * @returns {void}
 */
export function updateBuyHpStatus() {
  const btn = document.getElementById('buy-hp');
  const status = document.getElementById('hp-status');
  if (!btn || !status) return;

  if (player.gold >= player.hpCost) {
    btn.classList.remove('no-gold');
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
  if (!btn || !status) return;

  if (player.gold >= player.dmgCost) {
    btn.classList.remove('no-gold');
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
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

  if (player.hasMap) {
    btn.classList.add('active');
    btn.classList.remove('no-gold');
    status.textContent = '✅ Есть';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (player.gold >= CONFIG.shop.mapCost) {
    btn.classList.remove('active', 'no-gold');
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.mapCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    btn.classList.remove('active');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.mapCost} 💰`;
    btn.style.cursor = 'pointer';
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

  const isLevelAvailable = state.gameLevel >= CONFIG.shop.vampireStaffMinLevel;
  const isOwned = player.ownedMeleeWeapons.includes('vampire');
  const isActive = player.meleeWeapon === 'vampire';

  if (isActive) {
    btn.classList.add('active');
    btn.classList.remove('locked', 'no-gold');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    btn.classList.remove('active', 'locked', 'no-gold');
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    btn.classList.remove('active', 'no-gold');
    status.textContent = `🔒 Ур. ${CONFIG.shop.vampireStaffMinLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.vampireStaffCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.vampireStaffCost) {
    btn.classList.remove('locked', 'active', 'no-gold');
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.vampireStaffCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    btn.classList.remove('locked', 'active');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.vampireStaffCost} 💰`;
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

  const isLevelAvailable = state.gameLevel >= 4;
  const isOwned = player.ownedMeleeWeapons.includes('stun');
  const isActive = player.meleeWeapon === 'stun';

  if (isActive) {
    btn.classList.add('active');
    btn.classList.remove('no-gold');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    btn.classList.remove('active', 'no-gold');
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    btn.classList.remove('active', 'no-gold');
    status.textContent = '🔒 Ур. 4';
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.stunStaffCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.stunStaffCost) {
    btn.classList.remove('active', 'no-gold');
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.stunStaffCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    btn.classList.remove('active');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.stunStaffCost} 💰`;
    btn.style.cursor = 'pointer';
  }
}

/**
 * Обновление статуса обычного посоха
 * 
 * @returns {void}
 */
export function updateDefaultStaffStatus() {
  const btn = document.getElementById('buy-default-staff');
  const status = document.getElementById('default-staff-status');
  if (!btn || !status) return;

  const priceEl = btn.querySelector('.shop-price');
  if (priceEl) {
    priceEl.style.display = 'none';
  }

  if (player.meleeWeapon === 'default') {
    btn.classList.add('active');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    btn.style.cursor = 'default';
  } else {
    btn.classList.remove('active');
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
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

  const isLevelAvailable = state.gameLevel >= CONFIG.shop.fireballMinLevel;
  const isOwned = player.ownedRangedWeapons.includes('fireball');
  const isActive = player.rangedWeapon === 'fireball';

  if (isActive) {
    btn.classList.add('active');
    btn.classList.remove('locked', 'no-gold');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    btn.classList.remove('active', 'locked', 'no-gold');
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    btn.classList.remove('active', 'no-gold');
    status.textContent = `🔒 Ур. ${CONFIG.shop.fireballMinLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.fireballCost) {
    btn.classList.remove('locked', 'active', 'no-gold');
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    btn.classList.remove('locked', 'active');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'pointer';
  }
}