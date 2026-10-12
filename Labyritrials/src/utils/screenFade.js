/**
 * @fileoverview Управление чёрным оверлеем экрана.
 * Используется для плавных переходов между уровнями, экранами
 * и моментами появления/исчезновения игрового мира.
 *
 * Оверлей - это отдельный div поверх canvas с z-index выше игрового,
 * но ниже UI-окон (чтобы диалоги поверх fade были видны).
 *
 * @module utils/screenFade
 */

/** @type {HTMLElement|null} - DOM-элемент оверлея */
let fadeElement = null;

/** @type {number} - Текущая прозрачность (0-1) */
let currentOpacity = 0;

/** @type {number|null} - ID активного RAF-цикла */
let rafId = null;

/** @type {number|null} - ID таймера для отложенного callback */
let timerId = null;

/**
 * Создание DOM-элемента оверлея.
 * Элемент создаётся один раз и переиспользуется.
 *
 * @returns {HTMLElement} - Созданный или существующий элемент
 * @private
 */
function ensureElement() {
  if (fadeElement) return fadeElement;

  fadeElement = document.createElement('div');
  fadeElement.id = 'screen-fade';
  fadeElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000000;
    pointer-events: none;
    opacity: 0;
    z-index: 900;
    will-change: opacity;
    transition: none;
  `;
  document.body.appendChild(fadeElement);

  return fadeElement;
}

/**
 * Остановка активной анимации и таймера.
 *
 * @returns {void}
 * @private
 */
function stopAnimation() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

/**
 * Плавное изменение прозрачности оверлея.
 *
 * @param {number} targetOpacity - Целевая прозрачность (0-1)
 * @param {number} [duration=500] - Длительность анимации в мс
 * @returns {Promise<void>} - Промис, резолвится по завершении анимации
 * @private
 */
function animateTo(targetOpacity, duration = 500) {
  const el = ensureElement();
  stopAnimation();

  const startOpacity = currentOpacity;
  const delta = targetOpacity - startOpacity;

  // Если уже на месте
  if (Math.abs(delta) < 0.001) {
    currentOpacity = targetOpacity;
    el.style.opacity = String(targetOpacity);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Smoothstep - мягкое появление/исчезновение
      const eased = t * t * (3 - 2 * t);
      currentOpacity = startOpacity + delta * eased;

      el.style.opacity = String(currentOpacity);

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        currentOpacity = targetOpacity;
        el.style.opacity = String(targetOpacity);
        rafId = null;
        resolve();
      }
    };

    rafId = requestAnimationFrame(step);
  });
}

/**
 * Плавное затемнение экрана (fade to black).
 *
 * @param {number} [duration=500] - Длительность в мс
 * @returns {Promise<void>}
 */
export function fadeToBlack(duration = 500) {
  return animateTo(1, duration);
}

/**
 * Плавное появление (fade from black).
 *
 * @param {number} [duration=500] - Длительность в мс
 * @returns {Promise<void>}
 */
export function fadeFromBlack(duration = 500) {
  return animateTo(0, duration);
}

/**
 * Мгновенная установка прозрачности (без анимации).
 *
 * @param {number} opacity - Прозрачность (0-1)
 * @returns {void}
 */
export function setFade(opacity) {
  const el = ensureElement();
  stopAnimation();
  currentOpacity = Math.max(0, Math.min(1, opacity));
  el.style.opacity = String(currentOpacity);
}

/**
 * Получение текущей прозрачности оверлея.
 *
 * @returns {number} - Прозрачность (0-1)
 */
export function getFadeOpacity() {
  return currentOpacity;
}

/**
 * Удобный «атомарный» переход: затемнить -> выполнить действие -> показать.
 *
 * @param {Function} action - Действие между затемнением и появлением (может быть async)
 * @param {Object} [options] - Параметры
 * @param {number} [options.fadeOutDuration=400] - Длительность затемнения
 * @param {number} [options.fadeInDuration=500] - Длительность появления
 * @param {number} [options.holdDuration=100] - Пауза в чёрном между fade-out и fade-in
 * @returns {Promise<void>}
 */
export async function fadeTransition(action, options = {}) {
  const {
    fadeOutDuration = 400,
    fadeInDuration = 500,
    holdDuration = 100,
  } = options;

  await fadeToBlack(fadeOutDuration);

  if (action) await action();

  if (holdDuration > 0) {
    await new Promise((resolve) => {
      timerId = setTimeout(resolve, holdDuration);
    });
  }

  await fadeFromBlack(fadeInDuration);
}