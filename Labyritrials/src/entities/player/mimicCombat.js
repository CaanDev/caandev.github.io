/**
 * @fileoverview Боевая система против мимиков.
 * Обрабатывает нанесение урона мимикам при наличии экипированного
 * талисмана охотника на мимиков.
 * 
 * @module entities/player/mimicCombat
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { createBloodPuddle } from '../objects/utils/bloodSystem.js';
import { removeFlies } from '../objects/fly.js';

/**
 * Проверка, экипирован ли талисман охотника на мимиков
 * 
 * @returns {boolean} - true, если талисман экипирован в любой слот
 */
export function hasMimicHunterTalismanEquipped() {
  if (!player.inventory?.equipped) return false;
  return Object.values(player.inventory.equipped).includes('talismanMimicHunter');
}

/**
 * Проверка, есть ли мимики в радиусе атаки
 * 
 * @param {number} attackX - Координата X атаки в пикселях
 * @param {number} attackY - Координата Y атаки в пикселях
 * @param {number} radius - Радиус атаки
 * @returns {Array} - Массив мимиков в радиусе
 */
function getMimicsInRange(attackX, attackY, radius) {
  const mimicsInRange = [];
  
  for (const mimic of state.mimics) {
    if (mimic.isDead) continue;
    if (mimic.opened) continue;
    
    const dist = Math.hypot(mimic.x - attackX, mimic.y - attackY);
    if (dist < radius) {
      mimicsInRange.push(mimic);
    }
  }
  
  return mimicsInRange;
}

/**
 * Нанесение урона мимику (одиночная цель)
 * 
 * @param {Object} mimic - Объект мимика
 * @param {number} damagePercent - Процент урона от maxHp (0-1)
 * @returns {boolean} - true, если мимик умер
 */
function dealDamageToMimic(mimic, damagePercent) {
  if (mimic.isDead) return false;
  if (mimic.hp <= 0) {
    mimic.isDead = true;
    return true;
  }

  // Открываем мимика при получении урона
  mimic.opened = true;
  // Сбрасываем таймер закрытия (будет закрыт через 500мс)
  mimic.closeTimer = Date.now() + 500;
  
  const damage = Math.floor(mimic.maxHp * damagePercent);
  mimic.hp -= damage;
  
  // Показываем полоску HP после первого попадания
  if (mimic.hp < mimic.maxHp) {
    mimic.hpBarVisible = true;
    mimic.lastHitTime = Date.now();
  }
  
  // Текст урона над мимиком
  state.damageTexts.push({
    x: mimic.x,
    y: mimic.y - 15,
    text: `-${damage}`,
    color: COLORS.ui.textRed,
    size: 20,
    life: 40,
    speedy: 1.2
  });
  
  // Проверка смерти
  if (mimic.hp <= 0) {
    mimic.isDead = true;
    return true;
  }
  
  return false;
}

/**
 * Обновление состояния мимиков (закрытие после урона)
 * Вызывается каждый кадр
 * 
 * @returns {void}
 */
export function updateMimicsState() {
  const now = Date.now();
  
  for (const mimic of state.mimics) {
    if (mimic.isDead) continue;
    
    // Закрываем мимика через 500мс после открытия
    if (mimic.opened && mimic.closeTimer && now > mimic.closeTimer) {
      mimic.opened = false;
      mimic.closeTimer = 0;
    }
  }
}

/**
 * Нанесение урона мимикам от обычного удара (20%)
 * 
 * @param {number} attackX - Координата X атаки в пикселях
 * @param {number} attackY - Координата Y атаки в пикселях
 * @param {number} attackRadius - Радиус атаки
 * @returns {boolean} - true, если был нанесён урон
 */
export function dealDamageToMimicsMelee(attackX, attackY, attackRadius) {
  if (!hasMimicHunterTalismanEquipped()) return false;
  
  const mimics = getMimicsInRange(attackX, attackY, attackRadius);
  if (mimics.length === 0) return false;
  
  // Ближний бой — бьём только одного мимика (ближайшего)
  let closestMimic = null;
  let closestDist = Infinity;
  
  for (const mimic of mimics) {
    const dist = Math.hypot(player.px - mimic.x, player.py - mimic.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestMimic = mimic;
    }
  }
  
  if (!closestMimic) return false;
  
  // Определяем тип удара
  const isStrong = player.chargeTime > 30;
  const damagePercent = isStrong ? 0.50 : 0.20;
  
  const died = dealDamageToMimic(closestMimic, damagePercent);
  
  if (died) {
    handleMimicDeath(closestMimic);
  }
  
  return true;
}

/**
 * Нанесение урона мимикам от огненного шара (50%)
 * 
 * @param {number} attackX - Координата X атаки в пикселях
 * @param {number} attackY - Координата Y атаки в пикселях
 * @param {number} attackRadius - Радиус атаки
 * @returns {boolean} - true, если был нанесён урон
 */
export function dealDamageToMimicsFireball(attackX, attackY, attackRadius) {
  if (!hasMimicHunterTalismanEquipped()) return false;
  
  const mimics = getMimicsInRange(attackX, attackY, attackRadius);
  if (mimics.length === 0) return false;
  
  let anyDied = false;
  
  // Огненный шар — бьёт по всем мимикам в радиусе
  for (const mimic of mimics) {
    const died = dealDamageToMimic(mimic, 0.50);
    if (died) {
      anyDied = true;
      handleMimicDeath(mimic);
    }
  }
  
  return true;
}

/**
 * Обработка смерти мимика
 * 
 * @param {Object} mimic - Объект мимика
 * @returns {void}
 */
function handleMimicDeath(mimic) {
  // Создаём кровавую лужу
  createBloodPuddle(mimic.x, mimic.y, false);
  
  // Звук смерти
  audio.playSound('monsters.monsterDeath');
  
  // Удаляем мух
  removeFlies(mimic.x, mimic.y);
  
  // Удаляем мимика из массива
  const index = state.mimics.indexOf(mimic);
  if (index !== -1) {
    state.mimics.splice(index, 1);
  }
}

/**
 * Обновление состояния полосок HP мимиков
 * Вызывается каждый кадр
 * 
 * @returns {void}
 */
export function updateMimicHealthBars() {
  const now = Date.now();
  const HIDE_DELAY = 3000; // 3 секунды без атак
  
  for (const mimic of state.mimics) {
    if (mimic.isDead) continue;
    
    // Если HP полное или больше максимального — скрываем полоску
    if (mimic.hp >= mimic.maxHp) {
      mimic.hpBarVisible = false;
      continue;
    }
    
    // Если полоска уже видима — проверяем таймер
    if (mimic.hpBarVisible) {
      // Если прошло больше HIDE_DELAY с последнего попадания — скрываем
      if (now - mimic.lastHitTime > HIDE_DELAY) mimic.hpBarVisible = false;
    }
  }
}