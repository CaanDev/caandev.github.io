/**
 * @fileoverview Бой блуждающих огоньков с монстрами.
 * @module entities/objects/willOTheWisps/wispsCombat
 */

import { state, player } from '../../../core/config/index.js';
import { hasLineOfSight } from '../../../world/physics.js';
import { handleMonsterDeath } from '../../monsters/death.js';
import { hasMimicHunterEquipped } from './wispsSummon.js';
import { WISPS_CONFIG, WISPS_MOTION, WISPS_BLOOD, getAggroRadius } from './wispsData.js';
import { createBloodPuddle } from '../utils/bloodSystem.js';
import { removeFlies } from '../fly.js';

/** @type {Array} - Кэш монстров в радиусе агрессии */
let nearbyMonstersCache = [];
/** @type {number} - Таймер обновления кэша (кадры) */
let nearbyMonstersTimer = 0;

/**
 * Создание списка монстров в радиусе агрессии
 * LOS проверяется один раз для каждого монстра.
 * @returns {Array}
 */
export function buildNearbyMonstersList() {
  const aggro = getAggroRadius();
  const result = [];

  // Монстры
  for (const m of state.monsters) {
    if (m.hp <= 0 || m.isDead) continue;

    const dist = Math.hypot(player.px - m.x, player.py - m.y);
    if (dist > aggro) continue;
    if (!hasLineOfSight(player.px, player.py, m.x, m.y)) continue;
    result.push(m);
  }

  // Дикие блуждающие огоньки
  for (const w of state.wildWisps) {
    if (w.hp <= 0) continue;

    const dist = Math.hypot(player.px - w.x, player.py - w.y);
    if (dist > aggro) continue;
    if (!hasLineOfSight(player.px, player.py, w.x, w.y)) continue;
    result.push(w);
  }

  // Мимики (только с экипированным талисманом)
  if (hasMimicHunterEquipped()) {
    for (const mimic of state.mimics) {
      if (mimic.isDead) continue;

      const dist = Math.hypot(player.px - mimic.x, player.py - mimic.y);
      if (dist > aggro) continue;
      if (!hasLineOfSight(player.px, player.py, mimic.x, mimic.y)) continue;
      result.push(mimic);
    }
  }

  return result;
}

/**
 * Получение кэша монстров (обновляется раз в 10 кадров)
 * @returns {Array}
 */
export function getNearbyMonsters() {
  nearbyMonstersTimer--;
  if (nearbyMonstersTimer <= 0) {
    nearbyMonstersTimer = 10;
    nearbyMonstersCache = buildNearbyMonstersList();
  }
  return nearbyMonstersCache;
}

/**
 * Сброс кэша монстров
 * @returns {void}
 */
export function resetNearbyMonstersCache() {
  nearbyMonstersCache = [];
  nearbyMonstersTimer = 0;
}

/**
 * Поиск цели для огонька (использует кэш)
 * @param {Object} w - Объект огонька
 * @returns {Object|null}
 */
export function findWispTarget(w) {
  const nearby = getNearbyMonsters();
  let best = null;
  let bestDist = Infinity;

  for (const m of nearby) {
    if (isTargetedByOtherWisp(m, w)) continue;

    const dist = Math.hypot(player.px - m.x, player.py - m.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }

  return best;
}

/**
 * Проверка, атакует ли эту цель уже другой огонёк
 * @param {Object} target
 * @param {Object} self
 * @returns {boolean}
 * @private
 */
function isTargetedByOtherWisp(target, self) {
  const list = state.wisps?.list || [];
  for (const other of list) {
    if (other === self) continue;
    if (other.dying) continue;
    if (other.target === target) return true;
  }
  return false;
}

/**
 * Выполнение атаки огонька
 * @param {Object} w - Объект огонька
 * @param {number} deltaTime - Время в секундах
 * @returns {boolean} - true, если заход завершён (3 удара, таймаут или нехватка стамины)
 */
export function performWispAttack(w, deltaTime) {
  const enemy = w.target;
  if (!enemy) return true;

  // Таймаут атаки (если огонёк не нанёс удар за 3 секунды - отмена)
  w.attackTimeout = (w.attackTimeout || 0) + deltaTime * 60;
  if (w.attackTimeout > 180) {
    w.attackTimeout = 0;
    w.target = null;
    w.returning = true;
    return true;
  }

  // Позиция атаки (вращение вокруг цели)
  w.attackAngleOffset += 0.08 + Math.random() * 0.03;
  const ax = enemy.x + Math.cos(w.attackAngleOffset) * w.attackRadius;
  const ay = enemy.y + Math.sin(w.attackAngleOffset) * w.attackRadius * 0.7;

  // Плавное движение к цели
  const k = WISPS_MOTION.TRANSIT_LERP_ATTACK * WISPS_CONFIG.ATTACK_SPEED_MULT;
  w.currentX += (ax - w.currentX) * k;
  w.currentY += (ay - w.currentY) * k;
  w.depthFactor = 0.5;

  // Кулдаун между ударами
  if (w.hitCooldown > 0) {
    w.hitCooldown -= deltaTime * 60;
    return false;
  }

  // Проверка дистанции: от огонька до цели
  const dist = Math.hypot(w.currentX - enemy.x, w.currentY - enemy.y);
  if (dist > w.attackRadius + WISPS_CONFIG.HIT_RADIUS) return false;

  // Проверка выносливости игрока
  if (player.stamina < WISPS_CONFIG.WISP_STAMINA_COST) {
    w.target = null;
    w.returning = true;
    w.attackTimeout = 0;
    w.staminaSearchCooldown = 60; // 1 сек - не искать цель
    return true;
  }

  // Списание выносливости
  player.stamina -= WISPS_CONFIG.WISP_STAMINA_COST;

  // Удар
  const isWildWisp = state.wildWisps.includes(enemy);

  if (isWildWisp) {
    // По дикому огоньку - 1 "очко"
    enemy.hp -= 1;

    state.damageTexts.push({
      x: enemy.x + (Math.random() - 0.5) * 20,
      y: enemy.y - 20,
      text: `-33%`,
      color: w.brightColor,
      size: 18,
      life: 35,
      speedy: 1.2,
    });
  } else {
    // Обычный урон по монстрам/мимикам
    const damage = player.baseDamage;
    enemy.hp -= damage;

    state.damageTexts.push({
      x: enemy.x + (Math.random() - 0.5) * 20,
      y: enemy.y - 20,
      text: `-${damage}`,
      color: w.brightColor,
      size: 18,
      life: 35,
      speedy: 1.2,
    });
  }

  w.hitCooldown = WISPS_CONFIG.HIT_COOLDOWN;
  w.hitsLeft--;

  // Накопление крови (только с экипированным вампирским посохом)
  if (player.meleeWeapon === 'vampire') {
    w.bloodIntensity = Math.min(1.0, (w.bloodIntensity || 0) + WISPS_BLOOD.GAIN_PER_HIT);
    w.bloodCooldownTimer = WISPS_BLOOD.COOLDOWN_AFTER_HIT;
  }

  // Если цель - мимик: отображается спрайт мимика и показывается полоска HP
  if (state.mimics.includes(enemy)) {
    enemy.opened = true;
    enemy.closeTimer = Date.now() + 500;

    if (enemy.hp < enemy.maxHp) {
      enemy.hpBarVisible = true;
      enemy.lastHitTime = Date.now();
    }
  }

  // Отскок от врага
  const bounceAngle = Math.atan2(w.currentY - enemy.y, w.currentX - enemy.x);
  w.currentX += Math.cos(bounceAngle) * WISPS_CONFIG.HIT_BOUNCE;
  w.currentY += Math.sin(bounceAngle) * WISPS_CONFIG.HIT_BOUNCE;

  // Проверка смерти цели
  if (enemy.hp <= 0) {
    if (state.monsters.includes(enemy)) {
      const idx = state.monsters.indexOf(enemy);
      if (idx !== -1) handleMonsterDeath(enemy, idx, state.monsters);
    } else if (state.wildWisps.includes(enemy)) {
      // Смерть дикого огонька
      const idx = state.wildWisps.indexOf(enemy);
      if (idx !== -1) state.wildWisps.splice(idx, 1);
    } else if (state.mimics.includes(enemy)) {
      // Смерть мимика
      enemy.isDead = true;
      createBloodPuddle(enemy.x, enemy.y, false);
      removeFlies(enemy.x, enemy.y);
      const mimicIdx = state.mimics.indexOf(enemy);
      if (mimicIdx !== -1) state.mimics.splice(mimicIdx, 1);
    }
    w.target = null;
    w.returning = true;
  }

  return w.hitsLeft <= 0;
}