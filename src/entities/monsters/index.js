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

// ЗОНЫ ОБНОВЛЕНИЯ МОНСТРОВ

/**
 * @namespace UPDATE_ZONES
 * @description Зоны обновления монстров в зависимости от расстояния до игрока
 */
const UPDATE_ZONES = {
  /** @type {number} - Близкая зона: обновляется каждый кадр */
  CLOSE: { maxDist: 600, interval: 1 },
  /** @type {number} - Средняя зона: обновляется каждый 2-й кадр */
  MID: { maxDist: 1000, interval: 2 },
  /** @type {number} - Дальняя зона: обновляется каждый 4-й кадр */
  FAR: { maxDist: 1600, interval: 4 },
  /** @type {number} - Очень дальняя зона: обновляется каждый 8-й кадр */
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
  // Если монстр в режиме поиска — обновляется каждый кадр (независимо от памяти!)
  if (m.isSearching) return 1;
  // Если монстр в режиме преследования и видит игрока (или уверен, где он) — обновляется каждый кадр
  const isInActiveChase = m.state === 'chase' && (m.lastKnownX !== null && m.memoryTimer > 0);
  
  // Боссы всегда обновляются
  if (m.isBoss || m.isDuoBoss) return 1;
  // Если монстр активно преследует — обновляется каждый кадр
  if (isInActiveChase) return 1;
  
  // Иначе — стандартная логика по зонам
  // Используются интервалы в секундах (при 60 FPS)
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
  // Если интервал = 1 — обновляется всегда
  if (interval === 1) return true;
  
  // Использование ID монстра для равномерного распределения по кадрам
  const monsterId = m.id || Math.floor(m.x + m.y * 100);
  const hash = (monsterId * 31 + 17) % interval;
  return (frameCount % interval) === hash;
}

// ОСНОВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ

/**
 * Основная функция обновления всех монстров
 * 
 * @param {number} deltaTime - Время с последнего обновления (сек)
 * @returns {void}
 */
export function updateMonsters(deltaTime = 1/60) {
  // Если игрок отключен
  if (state.isPlayerDisabled) {
    // Обновляются только огненные шары (они должны лететь до конца)
    updateFireballs();
    
    // Дополнительная страховка: если какой-то монстр всё ещё в chase — перевод в patrol
    for (const m of state.monsters) {
      if (m.state === 'chase') {
        m.state = 'patrol';
        m.isSearching = false;
        m.lastKnownX = null;
        m.lastKnownY = null;
        m.memoryTimer = 0;
      }
    }
    
    return;
  }

  // Если игрок в комнате-ловушке и волна приостановлена (сохранение) — пропуск обновления
  if (state.inTrapRoom && state.trapActivated && !state.trapWaveActive) {
    // Возобновление волны при первом обновлении после загрузки
    if (state.trapMonsters.length > 0) {
      state.trapWaveActive = true;
      // Восстановление движения монстров
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

  // Восстановление HP монстров во время снегопада
  const isIceBiome = state.currentBiome === 'ice' && state.gameLevel >= 6 && state.gameLevel <= 9;
  const isInSecretRoom = state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
  const isSnowActive = snowState.active;
  
  if (isIceBiome && isSnowActive && !isInSecretRoom && !state.isBossLevel) {
    // Использование deltaTime для накопления времени
    snowHealCounter += deltaTime;
    
    // Восстанавливается каждую секунду
    if (snowHealCounter >= 1.0) {
      snowHealCounter = 0;
      
      for (const m of state.monsters) {
        // Боссы не восстанавливают HP во время снега
        if (m.isBoss || m.isDuoBoss) continue;
        // Мёртвые монстры не восстанавливают HP
        if (m.hp <= 0) continue;
        
        // Восстановление 3% от максимального HP (минимум 1)
        if (m.hp < m.maxHp) {
          const healAmount = Math.max(1, Math.floor(m.maxHp * SNOW_HEAL_PERCENT));
          m.hp = Math.min(m.maxHp, m.hp + healAmount);
        }
      }
    }
  } else {
    // Сброс счётчика, если снегопад не активен
    snowHealCounter = 0;
  }

  // Оптимизированное обновление монстров
  // Проход по всем монстрам, но обновляются только те, которые должны обновляться в текущем кадре
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    
    // Проверка: нужно ли обновлять монстра
    // Боссы всегда обновляются (они критичны для игрового процесса)
    const isBoss = m.isBoss || m.isDuoBoss;
    
    // Расстояние до игрока и видимость (вычисляется один раз для всех проверок)
    const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);
    const hasLineOfSightToPlayer = hasLineOfSight(m.x, m.y, player.px, player.py);
    
    if (!isBoss) {
      // Используется функция с учётом состояния монстра
      if (!shouldUpdateMonster(distToPlayer, m, updateCounter)) {
        // Пропуск обновления этого монстра в текущем кадре
        continue;
      }
    }

    // Обновление монстра
    let monsterDied = false;

    // Босс ещё не готов к бою (анимация появления)
    if ((m.isBoss || m.isDuoBoss) && !state.bossReady) continue;
    // Монстр в анимации уворота — движение пропускается
    if (m.dodgeAnimation && m.dodgeAnimation.active) continue;

    // Обновление таймера свечения от ловушек
    updateTrapGlowTimer(m);

    // Применение эффектов
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

    // Уменьшение таймера оглушения (используется deltaTime)
    if (m.stunTimer > 0) m.stunTimer = Math.max(0, m.stunTimer - deltaTime);

    // Обновление реакции на звуки (до памяти!)
    const hearingResult = updateMonsterHearing(m, distToPlayer, hasLineOfSightToPlayer);
    
    // Если монстр реагирует на звук — пропуск остальной логики
    if (hearingResult && hearingResult.isReacting) {
      // Если монстр в фазе паузы или осмотра — просто стоит
      if (hearingResult.phase === 'pause' || hearingResult.phase === 'arrived') {
        // Проверка столкновения с игроком (если вдруг наткнулся)
        if (handleMonsterDamageToPlayer(m, now)) return;
        continue; // Не двигается, не атакует
      }
      // Если движется к звуку — обновление позиции (smoothMoveToPosition уже вызван)
      if (hearingResult.phase === 'move') {
        // Проверка столкновения с игроком (если вдруг наткнулся)
        if (handleMonsterDamageToPlayer(m, now)) return;
        continue;
      }
      continue;
    }

    // Обновление памяти о последней позиции игрока
    // Выполняется только если монстр не реагирует на звук
    const memoryResult = updateMonsterMemory(m, distToPlayer, hasLineOfSightToPlayer);
    
    // Если монстр в режиме поиска — пропуск остальной логики (кроме проверки столкновения)
    if (memoryResult.isSearching) {
      // Проверка, не умер ли монстр
      if (m.hp <= 0) {
        handleMonsterDeath(m, i, state.monsters);
        continue;
      }
      
      // Проверка, не наткнулся ли монстр на игрока во время поиска
      if (distToPlayer < m.radius + 24 && hasLineOfSightToPlayer) {
        // Нашёл игрока - сброс памяти и переключение в режим преследования
        m.isSearching = false;
        m.memoryTimer = m.memoryDuration;
        m.state = 'chase';
      } else {
        // Продолжение поиска — переход к следующему монстру
        // Проверка столкновения с игроком (с видимостью)
        if (distToPlayer < m.radius + 24 && hasLineOfSightToPlayer) {
          // Игрок рядом и виден — атака
          if (handleMonsterDamageToPlayer(m, now)) return;
        }
        continue;
      }
    }

    // Обновление движения
    if (m.isBoss || m.isDuoBoss) {
      // Боссы: логика, атаки, состояние, движение (передаётся deltaTime)
      updateBossLogic(m, i, deltaTime);
      updateBossAttack(m, deltaTime);
      updateBossState(m, distToPlayer, deltaTime);
      updateBossMovement(m, deltaTime);
    } else {
      // Обычные монстры: ИИ и движение (передаётся deltaTime)
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

    // Нанесение урона игроку
    // Если игрок умер — выход
    if (handleMonsterDamageToPlayer(m, now)) return;
  }

  // Проверка адаптации монстров
  checkAdaptations();
}