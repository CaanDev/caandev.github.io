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

  // Убираем конфликтующие классы
  btn.classList.remove('no-gold');

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
  if (!btn || !status) return;

  // Убираем конфликтующие классы
  btn.classList.remove('no-gold');

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
 * Обновление статуса покупки карты
 * 
 * @returns {void}
 */
export function updateMapStatus() {
  const btn = document.getElementById('buy-map');
  const status = document.getElementById('map-status');
  const price = document.getElementById('map-price');
  if (!btn || !status || !price) return;

  // Убираем конфликтующие классы
  btn.classList.remove('active', 'no-gold');

  if (player.hasMap) {
    btn.classList.add('active');
    status.textContent = '✅ Есть';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (player.gold >= CONFIG.shop.mapCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.mapCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
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

  // Убираем все конфликтующие классы
  btn.classList.remove('active', 'locked', 'no-gold');

  if (isActive) {
    btn.classList.add('active');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${CONFIG.shop.vampireStaffMinLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.vampireStaffCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.vampireStaffCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.vampireStaffCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
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

  // Убираем все конфликтующие классы
  btn.classList.remove('active', 'locked', 'no-gold');

  if (isActive) {
    btn.classList.add('active');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. 4`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.stunStaffCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.stunStaffCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.stunStaffCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
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

  // Убираем конфликтующие классы
  btn.classList.remove('active');

  if (player.meleeWeapon === 'default') {
    btn.classList.add('active');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    btn.style.cursor = 'default';
  } else {
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

  // Убираем все конфликтующие классы
  btn.classList.remove('active', 'locked', 'no-gold');

  if (isActive) {
    btn.classList.add('active');
    status.textContent = '✅ Активно';
    status.className = 'shop-status active';
    price.style.display = 'none';
    btn.style.cursor = 'default';
  } else if (isOwned) {
    status.textContent = '🔄 Выбрать';
    status.className = 'shop-status owned';
    price.style.display = 'none';
    btn.style.cursor = 'pointer';
  } else if (!isLevelAvailable) {
    btn.classList.add('locked');
    status.textContent = `🔒 Ур. ${CONFIG.shop.fireballMinLevel}`;
    status.className = 'shop-status locked';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'not-allowed';
  } else if (player.gold >= CONFIG.shop.fireballCost) {
    status.textContent = 'Купить';
    status.className = 'shop-status buy';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'pointer';
  } else {
    btn.classList.add('no-gold');
    status.textContent = 'Не хватает золота';
    status.className = 'shop-status no-gold';
    price.style.display = 'block';
    price.textContent = `${CONFIG.shop.fireballCost} 💰`;
    btn.style.cursor = 'pointer';
  }
}