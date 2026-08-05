// systems/weather/snowManager.js

/**
 * @fileoverview Управление снегопадом в ледяном биоме
 * @module systems/weather/snowManager
 */

import { state, player, CONFIG } from '../../core/config/index.js';

/** @type {Object} - Состояние системы снегопада */
export const snowState = {
  /** @type {boolean} - Идёт ли снегопад */
  active: false,
  /** @type {number} - Время начала снегопада (в мс) */
  startTime: 0,
  /** @type {number|null} - ID таймера остановки */
  stopTimer: null,
  /** @type {number} - Минимальная продолжительность (мс) */
  minDuration: 60000, // 1 минута
  /** @type {number} - Максимальная продолжительность (мс) */
  maxDuration: 180000, // 3 минуты
  /** @type {number} - Интервал проверки на старт снегопада (мс) */
  checkInterval: 60000, // 60 секунд
  /** @type {number|null} - ID интервала проверки */
  checkTimer: null,
  /** @type {number} - Время окончания последнего снегопада (мс) */
  lastSnowfallEnd: 0,
  /** @type {number} - Минимальная пауза между снегопадами (мс) */
  minPauseBetween: 180000, // 3 минуты
  /** @type {number} - Время начала уровня (мс) */
  levelStartTime: 0,
  /** @type {number} - Минимальное время от начала уровня до первого снегопада (мс) */
  minLevelStartDelay: 60000, // 1 минута
  /** @type {number} - Прозрачность снега (0-1) для плавного появления/исчезновения */
  opacity: 0,
  /** @type {number} - Целевая прозрачность (0 или 1) */
  targetOpacity: 0,
  /** @type {number} - Скорость изменения прозрачности (за кадр) */
  opacitySpeed: 0.02, // ~2 секунды до полной видимости
};

/**
 * Проверка, активен ли ледяной биом
 * @returns {boolean} - true, если игрок в ледяном биоме (уровни 6-9)
 */
function isIceBiome() {
  return state.currentBiome === 'ice' && state.gameLevel >= 6 && state.gameLevel <= 9;
}

/**
 * Проверка, находится ли игрок в тайной комнате
 * @returns {boolean} - true, если игрок в тайной комнате
 */
function isInSecretRoom() {
  return state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom;
}

/**
 * Проверка, прошло ли достаточно времени от начала уровня
 * @returns {boolean} - true, если прошло больше 1 минуты
 */
function isLevelReadyForSnow() {
  const now = Date.now();
  const timeSinceLevelStart = now - snowState.levelStartTime;
  return timeSinceLevelStart >= snowState.minLevelStartDelay;
}

/**
 * Запуск снегопада
 */
export function startSnowfall() {
  // Проверяем биом Ice
  if (!isIceBiome()) return;
  // Проверяем, не в тайной комнате ли игрок
  if (isInSecretRoom()) return;
  if (snowState.active) return;
  if (state.isBossLevel) return;

  snowState.active = true;
  snowState.startTime = Date.now();
  snowState.targetOpacity = 1;

  import('./snowRenderer.js').then(module => {
    module.createSnowflakes();
  });

  // ===== ПРИНУДИТЕЛЬНО СОЗДАЁМ ЛЕДЯНУЮ МАСКУ =====
  createIceOverlayIfNeeded();

  // Сбрасываем прогресс заморозки при начале снегопада
  import('./frostSystem.js').then(module => {
    module.frostState.progress = 0;
    module.frostState.frozen = false;
    module.frostState.damageTimer = 0;
  });

  const duration = snowState.minDuration + Math.random() * (snowState.maxDuration - snowState.minDuration);
  
  if (snowState.stopTimer) {
    clearTimeout(snowState.stopTimer);
  }
  snowState.stopTimer = setTimeout(stopSnowfall, duration);

  import('./frostSystem.js').then(module => {
    module.resetFrost();
  });
}

/**
 * Принудительное создание ледяной маски на HP баре
 */
function createIceOverlayIfNeeded() {
  const hpBarBg = document.getElementById('hp-bar-bg');
  if (!hpBarBg) return;
  
  let iceOverlay = document.getElementById('hp-ice-overlay');
  if (!iceOverlay) {
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
    
    // Убеждаемся, что родитель имеет относительное позиционирование
    hpBarBg.style.position = 'relative';
    hpBarBg.style.overflow = 'hidden';
    hpBarBg.style.display = 'flex';
    hpBarBg.style.alignItems = 'center';
    hpBarBg.style.padding = '0';
    hpBarBg.style.margin = '0';
    hpBarBg.style.border = 'none';
    
    hpBarBg.appendChild(iceOverlay);
  }
  
  // Показываем маску с 0% ширины
  iceOverlay.style.width = '0%';
  iceOverlay.style.opacity = '1';
}

/**
 * Остановка снегопада
 */
export function stopSnowfall() {
  snowState.active = false;
  snowState.startTime = 0;
  snowState.lastSnowfallEnd = Date.now();
  snowState.targetOpacity = 0;
  
  if (snowState.stopTimer) {
    clearTimeout(snowState.stopTimer);
    snowState.stopTimer = null;
  }
}

/**
 * Принудительная остановка снегопада (без плавного затухания)
 * Используется при переходе между уровнями
 */
export function forceStopSnowfall() {
  snowState.active = false;
  snowState.startTime = 0;
  snowState.targetOpacity = 0;
  snowState.opacity = 0;
  
  if (snowState.stopTimer) {
    clearTimeout(snowState.stopTimer);
    snowState.stopTimer = null;
  }
  
  // Удаляем ледяную маску
  const iceOverlay = document.getElementById('hp-ice-overlay');
  if (iceOverlay && iceOverlay.parentNode) {
    iceOverlay.parentNode.removeChild(iceOverlay);
  }
  
  // Сбрасываем состояние заморозки
  import('./frostSystem.js').then(module => {
    module.frostState.progress = 0;
    module.frostState.frozen = false;
    module.frostState.damageTimer = 0;
    // Дополнительно удаляем маску
    module.resetFrost();
  });
}

/**
 * Обновление прозрачности снега (вызывается каждый кадр)
 */
export function updateSnowOpacity() {
  const diff = snowState.targetOpacity - snowState.opacity;
  
  if (Math.abs(diff) < 0.001) {
    snowState.opacity = snowState.targetOpacity;
    return;
  }
  
  snowState.opacity += Math.sign(diff) * Math.min(snowState.opacitySpeed, Math.abs(diff));
  snowState.opacity = Math.max(0, Math.min(1, snowState.opacity));
}

/**
 * Обновление состояния снегопада (вызывается из игрового цикла)
 */
export function updateSnowfall() {
  // Проверяем, активен ли ледяной биом
  const iceBiome = isIceBiome();
  
  if (!iceBiome || isInSecretRoom()) {
    if (snowState.active) {
      stopSnowfall();
    }
    return;
  }

  // Если снегопад активен — обновляем прозрачность и выходим
  if (snowState.active) {
    updateSnowOpacity();
    return;
  }

  // Проверяем, прошло ли минимум 1 минута от начала уровня
  if (!isLevelReadyForSnow()) {
    return;
  }

  // Проверяем, прошло ли минимум 3 минуты с последнего снегопада
  const now = Date.now();
  const timeSinceLastEnd = now - snowState.lastSnowfallEnd;
  
  if (timeSinceLastEnd < snowState.minPauseBetween) {
    return;
  }

  // Запускаем снегопад с шансом 15% каждую минуту
  if (Math.random() < 0.15) {
    startSnowfall();
  }
}

/**
 * Сброс таймера уровня (вызывается при генерации нового уровня)
 */
export function resetLevelTimer() {
  snowState.levelStartTime = Date.now();
  snowState.lastSnowfallEnd = 0;
  snowState.opacity = 0;
  snowState.targetOpacity = 0;
}

/**
 * Инициализация системы
 */
export function initSnowManager() {
  snowState.levelStartTime = Date.now();
  snowState.lastSnowfallEnd = 0;
  snowState.opacity = 0;
  snowState.targetOpacity = 0;
  snowState.active = false;
  
  // Удаляем ледяную маску при инициализации
  const iceOverlay = document.getElementById('hp-ice-overlay');
  if (iceOverlay && iceOverlay.parentNode) {
    iceOverlay.parentNode.removeChild(iceOverlay);
  }
  
  // Сбрасываем состояние заморозки
  import('./frostSystem.js').then(module => {
    module.resetFrost();
  });
  
  if (snowState.checkTimer) {
    clearInterval(snowState.checkTimer);
  }
  
  snowState.checkTimer = setInterval(updateSnowfall, snowState.checkInterval);
}

/**
 * Очистка ресурсов
 */
export function cleanupSnowManager() {
  if (snowState.checkTimer) {
    clearInterval(snowState.checkTimer);
    snowState.checkTimer = null;
  }
  if (snowState.stopTimer) {
    clearTimeout(snowState.stopTimer);
    snowState.stopTimer = null;
  }
  snowState.active = false;
  snowState.opacity = 0;
  snowState.targetOpacity = 0;
}