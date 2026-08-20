/**
 * @fileoverview Главный модуль обновления монстров.
 * Координирует все системы монстров: ИИ, эффекты, бой, боссы, адаптации, слух.
 * 
 * @module entities/monsters/index
 */

import { state, player } from '../../core/config/index.js';
import { updateFireballs } from './fireballUpdater.js';
import { 
  updateFreezeEffect, updateShockEffect, restoreMonsterSpeed, 
  updatePoisonEffect, updateGhostGlow, updateTrapGlowTimer
} from './effects.js';
import { 
  updateMonsterState,
  updateChaseMovement,
  updatePatrolMovement,
  updateFleeMovement,
  usePotionIfNearby,
  updateMonsterMemory,
  updateLostGhostBehavior,
  updateMonsterHearing,
  isReactingToSound
} from './ai/index.js';
import { updateBossLogic, updateBossAttack, updateBossState, updateBossMovement } from './bosses/index.js';
import { handleMonsterTrapInteraction, updateMonsterDodgeAnimations } from './trapInteraction.js';
import { handleMonsterDamageToPlayer } from './combat.js';
import { checkAdaptations } from './adaptations/index.js';
import { snowState } from '../../systems/weather/snowManager.js';
import { hasLineOfSight } from '../../world/physics.js';
import { handleMonsterDeath } from './death.js';

/** @type {number} - Счётчик кадров для восстановления HP монстров во время снега */
let snowHealCounter = 0;
/** @type {number} - Интервал восстановления HP (60 кадров = 1 секунда при 60 FPS) */
const SNOW_HEAL_INTERVAL = 60;
/** @type {number} - Процент восстановления HP от максимального */
const SNOW_HEAL_PERCENT = 0.03; // 3%

// ============================================================
// ЗОНЫ ОБНОВЛЕНИЯ МОНСТРОВ
// ============================================================

/**
 * @namespace UPDATE_ZONES
 * @description Зоны обновления монстров в зависимости от расстояния до игрока
 */
const UPDATE_ZONES = {
  /** @type {number} - Близкая зона: обновляем каждый кадр */
  CLOSE: { maxDist: 600, interval: 1 },
  /** @type {number} - Средняя зона: обновляем каждый 2-й кадр */
  MID: { maxDist: 1000, interval: 2 },
  /** @type {number} - Дальняя зона: обновляем каждый 4-й кадр */
  FAR: { maxDist: 1600, interval: 4 },
  /** @type {number} - Очень дальняя зона: обновляем каждый 8-й кадр */
  VERY_FAR: { maxDist: Infinity, interval: 8 }
};

/** @type {number} - Счётчик кадров для обновления монстров */
let updateCounter = 0;

/**
 * Получение интервала обновления для монстра на основе расстояния до игрока
 * 
 * @param {number} distToPlayer - Расстояние до игрока в пикселях
 * @param {Object} m - Объект монстра (для проверки состояния)
 * @returns {number} - Интервал обновления (в кадрах)
 */
function getUpdateInterval(distToPlayer, m) {  
  // Если монстр в режиме поиска — обновляем каждый кадр (независимо от памяти!)
  if (m.isSearching) return 1;
  
  // Если монстр в режиме преследования И видит игрока (или уверен, где он) — обновляем каждый кадр
  const isInActiveChase = m.state === 'chase' && (m.lastKnownX !== null && m.memoryTimer > 0);
  
  // Боссы всегда обновляются
  if (m.isBoss || m.isDuoBoss) return 1;
  
  // Если монстр активно преследует — обновляем каждый кадр
  if (isInActiveChase) return 1;
  
  // Иначе — стандартная логика по зонам
  // Используем интервалы в секундах (при 60 FPS)
  const DISTANCE_THRESHOLDS = {
    CLOSE: 600,    // 10 клеток
    MID: 1000,     // ~16 клеток
    FAR: 1600      // ~26 клеток
  };
  
  if (distToPlayer <= DISTANCE_THRESHOLDS.CLOSE) return 1;
  if (distToPlayer <= DISTANCE_THRESHOLDS.MID) return 2;
  if (distToPlayer <= DISTANCE_THRESHOLDS.FAR) return 4;
  return 8;
}

/**
 * Проверка, нужно ли обновлять монстра в текущем кадре
 * 
 * @param {number} distToPlayer - Расстояние до игрока в пикселях
 * @param {Object} m - Объект монстра
 * @param {number} frameCount - Текущий номер кадра
 * @returns {boolean} - true, если монстра нужно обновить
 */
function shouldUpdateMonster(distToPlayer, m, frameCount) {
  const interval = getUpdateInterval(distToPlayer, m);
  
  // Если интервал = 1 — обновляем всегда
  if (interval === 1) return true;
  
  // Используем ID монстра для равномерного распределения по кадрам
  const monsterId = m.id || Math.floor(m.x + m.y * 100);
  const hash = (monsterId * 31 + 17) % interval;
  return (frameCount % interval) === hash;
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ
// ============================================================

/**
 * Основная функция обновления всех монстров
 * 
 * @param {number} deltaTime - Время с последнего обновления (сек)
 * @returns {void}
 */
export function updateMonsters(deltaTime = 1/60) {
  // Если мы в комнате-ловушке и волна приостановлена (сохранение) — пропускаем обновление
  if (state.inTrapRoom && state.trapActivated && !state.trapWaveActive) {
    // Возобновляем волну при первом обновлении после загрузки
    if (state.trapMonsters.length > 0) {
      state.trapWaveActive = true;
      // Восстанавливаем движение монстров
      for (const m of state.trapMonsters) {
        m.state = 'chase';
      }
    }
    return;
  }
  
  const now = Date.now();
  updateCounter++;

  // Обновление анимаций уворота монстров (всегда)
  updateMonsterDodgeAnimations();
  
  // Обновление огненных шаров (всегда)
  updateFireballs();

  // ===== ВОССТАНОВЛЕНИЕ HP МОНСТРОВ ВО ВРЕМЯ СНЕГОПАДА =====
  const isIceBiome = state.currentBiome === 'ice' && state.gameLevel >= 6 && state.gameLevel <= 9;
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  const isSnowActive = snowState.active;
  
  if (isIceBiome && isSnowActive && !isInSecretRoom && !state.isBossLevel) {
    // Используем deltaTime для накопления времени
    snowHealCounter += deltaTime;
    
    // Восстанавливаем каждую секунду
    if (snowHealCounter >= 1.0) {
      snowHealCounter = 0;
      
      for (const m of state.monsters) {
        // Боссы не восстанавливают HP во время снега
        if (m.isBoss || m.isDuoBoss) continue;
        // Мёртвые монстры не восстанавливают
        if (m.hp <= 0) continue;
        
        // Восстанавливаем 3% от максимального HP (минимум 1)
        if (m.hp < m.maxHp) {
          const healAmount = Math.max(1, Math.floor(m.maxHp * SNOW_HEAL_PERCENT));
          m.hp = Math.min(m.maxHp, m.hp + healAmount);
        }
      }
    }
  } else {
    // Сбрасываем счётчик, если снегопад не активен
    snowHealCounter = 0;
  }

  // ===== ОПТИМИЗИРОВАННОЕ ОБНОВЛЕНИЕ МОНСТРОВ =====
  // Проходим по всем монстрам, но обновляем только те, которые должны обновляться в текущем кадре
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    
    // ===== ПРОВЕРКА: НУЖНО ЛИ ОБНОВЛЯТЬ МОНСТРА =====
    // Боссы всегда обновляются (они критичны для игрового процесса)
    const isBoss = m.isBoss || m.isDuoBoss;
    
    // Расстояние до игрока и видимость (вычисляем один раз для всех проверок)
    const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);
    const hasLineOfSightToPlayer = hasLineOfSight(m.x, m.y, player.px, player.py);
    
    if (!isBoss) {
      // Используем функцию с учётом состояния монстра
      if (!shouldUpdateMonster(distToPlayer, m, updateCounter)) {
        // Пропускаем обновление этого монстра в текущем кадре
        continue;
      }
    }

    // ===== ОБНОВЛЕНИЕ МОНСТРА =====
    let monsterDied = false;

    // Босс ещё не готов к бою (анимация появления)
    if ((m.isBoss || m.isDuoBoss) && !state.bossReady) continue;
    // Монстр в анимации уворота — движение пропускаем
    if (m.dodgeAnimation && m.dodgeAnimation.active) continue;

    // Обновляем таймер свечения от ловушек
    updateTrapGlowTimer(m);

    // ===== ПРИМЕНЕНИЕ ЭФФЕКТОВ =====
    // Шок (электрическая ловушка) — может убить монстра
    if (updateShockEffect(m, i)) { 
      monsterDied = true; 
      continue; 
    }
    
    // Отравление (кислотная ловушка) — может убить монстра
    if (updatePoisonEffect(m, i)) { 
      monsterDied = true; 
      continue; 
    }
    
    // Заморозка (ледяная ловушка)
    updateFreezeEffect(m);
    // Восстановление скорости (после шока)
    restoreMonsterSpeed(m);
    // Обновление свечения призрака
    updateGhostGlow(m);

    // Уменьшение таймера оглушения (используем deltaTime)
    if (m.stunTimer > 0) {
      m.stunTimer = Math.max(0, m.stunTimer - deltaTime);
    }

    // ===== ОБНОВЛЕНИЕ РЕАКЦИИ НА ЗВУКИ (ДО ПАМЯТИ!) =====
    const hearingResult = updateMonsterHearing(m, distToPlayer, hasLineOfSightToPlayer);
    
    // Если монстр реагирует на звук — пропускаем остальную логику
    if (hearingResult && hearingResult.isReacting) {
      // Если монстр в фазе паузы или осмотра — просто стоим
      if (hearingResult.phase === 'pause' || hearingResult.phase === 'arrived') {
        // Проверяем столкновение с игроком (если вдруг наткнулся)
        if (handleMonsterDamageToPlayer(m, now)) return;
        continue; // Не двигаемся, не атакуем
      }
      // Если движется к звуку — обновляем позицию (smoothMoveToPosition уже вызван)
      if (hearingResult.phase === 'move') {
        // Проверяем столкновение с игроком (если вдруг наткнулся)
        if (handleMonsterDamageToPlayer(m, now)) return;
        continue;
      }
      continue;
    }

    // ===== ОБНОВЛЕНИЕ ПАМЯТИ О ПОСЛЕДНЕЙ ПОЗИЦИИ ИГРОКА =====
    // Выполняется только если монстр НЕ реагирует на звук
    const memoryResult = updateMonsterMemory(m, distToPlayer, hasLineOfSightToPlayer);
    
    // Если монстр в режиме поиска — пропускаем остальную логику (кроме проверки столкновения)
    if (memoryResult.isSearching) {
      // Всё равно проверяем, не умер ли монстр
      if (m.hp <= 0) {
        handleMonsterDeath(m, i, state.monsters);
        continue;
      }
      
      // Проверяем, не наткнулся ли монстр на игрока во время поиска
      if (distToPlayer < m.radius + 24 && hasLineOfSightToPlayer) {
        // Нашёл игрока! Сбрасываем память и переключаемся в режим преследования
        m.isSearching = false;
        m.memoryTimer = m.memoryDuration;
        m.state = 'chase';
        // Продолжаем обычную логику
      } else {
        // Продолжаем поиск — переходим к следующему монстру
        // Но всё равно проверяем столкновение с игроком (с видимостью)
        if (distToPlayer < m.radius + 24 && hasLineOfSightToPlayer) {
          // Игрок рядом и виден — атакуем
          if (handleMonsterDamageToPlayer(m, now)) return;
        }
        continue;
      }
    }

    // ===== ОБНОВЛЕНИЕ ДВИЖЕНИЯ =====
    if (m.isBoss || m.isDuoBoss) {
      // Боссы: логика, атаки, состояние, движение (передаем deltaTime)
      updateBossLogic(m, i, deltaTime);
      updateBossAttack(m, deltaTime);
      updateBossState(m, distToPlayer, deltaTime);
      updateBossMovement(m, deltaTime);
    } else {
      // Обычные монстры: ИИ и движение (передаем deltaTime)
      updateMonsterState(m, distToPlayer, deltaTime);

      if (m.state === 'chase') {
        // Использование зелья
        const usedPotion = usePotionIfNearby(m);

        // Преследование
        if (m.stunTimer <= 0 && !m.isFrozen) updateChaseMovement(m, deltaTime);
        if (handleMonsterTrapInteraction(m, i)) continue;
        updateLostGhostBehavior(m, deltaTime);
      } else if (m.state === 'flee') {
        // Бегство от игрока
        if (m.stunTimer <= 0 && !m.isFrozen) updateFleeMovement(m, deltaTime);
      } else {
        // Патруль
        updatePatrolMovement(m, deltaTime);
      }
    }

    // ===== НАНЕСЕНИЕ УРОНА ИГРОКУ =====
    // Если игрок умер — выходим
    if (handleMonsterDamageToPlayer(m, now)) return;
  }

  // ===== ПРОВЕРКА АДАПТАЦИЙ МОНСТРОВ =====
  checkAdaptations();
}