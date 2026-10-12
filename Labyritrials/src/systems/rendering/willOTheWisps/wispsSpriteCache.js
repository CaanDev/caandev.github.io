/**
 * @fileoverview Универсальный кэш предрендеренных спрайтов огоньков
 * (для призванных willOTheWisps и диких wildWisps).
 * 
 * @module systems/rendering/willOTheWisps/wispsSpriteCache
 */

import { WISPS_VISUAL } from '../../../entities/objects/willOTheWisps/wispsData.js';

const CANVAS_SIZE = 128;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;

/** @type {number} - Максимальное количество спрайтов в кэше */
const MAX_CACHE_SIZE = 200;

/**
 * @typedef {Object} WispSpriteParams
 * @property {string|number} hue - Оттенок (0-360)
 * @property {number} sat - Насыщенность (%) для основного цвета
 * @property {number} light - Светлота (%) для основного цвета
 * @property {number} glowLight - Светлота (%) для свечения
 * @property {number} brightLight - Светлота (%) для ярких слоёв
 * @property {number} coreSat - Насыщенность ядра (%)
 * @property {number} [coreScale=1] - Множитель размера ядра
 * @property {number} [brightnessMult=1] - Множитель яркости слоёв
 */

/**
 * Отрисовка огонька в offscreen-canvas.
 * 
 * @param {WispSpriteParams} params - Параметры отрисовки
 * @returns {HTMLCanvasElement}
 */
function renderWispSprite({
  hue, sat, light, glowLight, brightLight,
  coreSat, coreScale = 1, brightnessMult = 1,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  const V = WISPS_VISUAL;
  const halo1 = V.GLOW_RADIUS * V.HALO_SCALE_1;
  const halo2 = V.GLOW_RADIUS * V.HALO_SCALE_2;
  const halo3 = V.GLOW_RADIUS * V.HALO_SCALE_3;
  const inner = V.INNER_GLOW;
  const core = V.CORE_RADIUS * coreScale;

  // Для обрезки alpha (0..1)
  const clampAlpha = (a) => Math.min(1, a);

  // 1. Внешний ореол
  let grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, halo1);
  grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${clampAlpha(V.SOFT_ALPHA_1 * brightnessMult)})`);
  grad.addColorStop(0.4, `hsla(${hue}, ${sat}%, ${light}%, ${clampAlpha(V.SOFT_ALPHA_1 * 0.5 * brightnessMult)})`);
  grad.addColorStop(0.75, `hsla(${hue}, ${sat}%, ${light}%, ${clampAlpha(V.SOFT_ALPHA_1 * 0.15 * brightnessMult)})`);
  grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CX, CY, halo1, 0, Math.PI * 2);
  ctx.fill();

  // 2. Средний ореол
  grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, halo2);
  grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${brightLight}%, ${clampAlpha(V.SOFT_ALPHA_2 * brightnessMult)})`);
  grad.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${glowLight}%, ${clampAlpha(V.SOFT_ALPHA_2 * 0.4 * brightnessMult)})`);
  grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CX, CY, halo2, 0, Math.PI * 2);
  ctx.fill();

  // 3. Плотный ореол
  grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, halo3);
  grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${Math.min(100, brightLight + 5)}%, ${clampAlpha((V.SOFT_ALPHA_3 + 0.3) * brightnessMult)})`);
  grad.addColorStop(0.6, `hsla(${hue}, ${sat}%, ${brightLight}%, ${clampAlpha(V.SOFT_ALPHA_3 * 0.5 * brightnessMult)})`);
  grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${glowLight}%, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CX, CY, halo3, 0, Math.PI * 2);
  ctx.fill();

  // 4. Внутреннее свечение
  ctx.fillStyle = `hsl(${hue}, ${sat}%, ${glowLight}%)`;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(CX, CY, inner, 0, Math.PI * 2);
  ctx.fill();

  // 5. Ядро
  ctx.fillStyle = `hsl(${hue}, ${coreSat}%, ${Math.min(98, brightLight + 8)}%)`;
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(CX, CY, core, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/** @type {Map<string, HTMLCanvasElement>} - Кэш спрайтов */
const spriteCache = new Map();

/**
 * Получение предрендеренного спрайта огонька.
 * 
 * @param {string|number} hue - Оттенок (0-360)
 * @param {number} [sat=100] - Насыщенность (%)
 * @param {number} [light=70] - Светлота (%)
 * @param {number} [glowLight=78] - Светлота для свечения (%)
 * @param {number} [brightLight=90] - Светлота для ярких слоёв (%)
 * @param {number} [coreSat=60] - Насыщенность ядра (%)
 * @param {number} [coreScale=1] - Множитель размера ядра
 * @param {number} [brightnessMult=1] - Множитель яркости слоёв
 * @returns {HTMLCanvasElement}
 */
export function getWispSprite(
  hue, sat = 100, light = 70, glowLight = 78, brightLight = 90,
  coreSat = 60, coreScale = 1, brightnessMult = 1
) {
  const key = `${hue}_${sat}_${light}_${glowLight}_${brightLight}_${coreSat}_${coreScale}_${brightnessMult}`;

  if (spriteCache.has(key)) return spriteCache.get(key);

  // Вытеснение при переполнении
  if (spriteCache.size >= MAX_CACHE_SIZE) {
    const firstKey = spriteCache.keys().next().value;
    if (firstKey !== undefined) spriteCache.delete(firstKey);
  }

  const sprite = renderWispSprite({ hue, sat, light, glowLight, brightLight, coreSat, coreScale, brightnessMult });
  spriteCache.set(key, sprite);
  return sprite;
}

/**
 * Очистка кэша спрайтов.
 * @returns {void}
 */
export function clearWispsSpriteCache() {
  spriteCache.clear();
}

/**
 * Получение размера кэша (для отладки).
 * @returns {number}
 */
export function getWispsSpriteCacheSize() {
  return spriteCache.size;
}

// ============================================================
// СПЕЦИАЛИЗАЦИЯ ДЛЯ ДИКИХ ОГОНЬКОВ
// ============================================================

/**
 * Палитра диких огоньков - ярко-красный/бордовый.
 */
const WILD_WISP_PALETTE = {
  hue: 0, sat: 100, coreSat: 100,
  light: 55, glowLight: 65, brightLight: 80
};

/** @type {number} - Множитель размера ядра дикого огонька (вдвое меньше) */
let WILD_CORE_SCALE = 0.5;
/** @type {number} - Множитель яркости дикого огонька (в 1.5 раза ярче) */
let WILD_BRIGHTNESS_MULT = 1.5;

/**
 * Получение предрендеренного спрайта дикого огонька.
 * 
 * @returns {HTMLCanvasElement}
 */
export function getWildWispSprite() {
  const p = WILD_WISP_PALETTE;
  return getWispSprite(
    p.hue, p.sat, p.light, p.glowLight, p.brightLight, p.coreSat,
    WILD_CORE_SCALE, WILD_BRIGHTNESS_MULT
  );
}

// ============================================================
// ОТЛАДКА (только для разработки)
// ============================================================

/**
 * @description Глобальный объект для отладки внешнего вида диких огоньков.
 * Позволяет менять палитру и параметры рендеринга через консоль браузера.
 * Изменения применяются мгновенно (кэш спрайта сбрасывается).
 * 
 * @example
 * // Синий огонёк
 * __wildWispDebug.setPalette({ hue: 220, sat: 100, light: 60, glowLight: 70, brightLight: 85 });
 * 
 * @example
 * // Сброс к значениям по умолчанию
 * __wildWispDebug.reset();
 */
window.__wildWispDebug = {
  /**
   * Получить текущую палитру.
   * @returns {Object}
   */
  getPalette: () => ({ ...WILD_WISP_PALETTE }),

  /**
   * Установить значения палитры (частично).
   * @param {Object} partial - Объект с полями hue, sat, light, glowLight, brightLight, coreSat
   * @returns {void}
   */
  setPalette: (partial) => {
    Object.assign(WILD_WISP_PALETTE, partial);
    clearWispsSpriteCache();
  },

  /**
   * Установить масштабы ядра и яркости.
   * @param {number} [coreScale] - Множитель ядра (по умолчанию 0.5)
   * @param {number} [brightnessMult] - Множитель яркости (по умолчанию 1.5)
   * @returns {void}
   */
  setScale: (coreScale, brightnessMult) => {
    if (coreScale !== undefined) WILD_CORE_SCALE = coreScale;
    if (brightnessMult !== undefined) WILD_BRIGHTNESS_MULT = brightnessMult;
    clearWispsSpriteCache();
  },

  /**
   * Сбросить всё к значениям по умолчанию.
   * @returns {void}
   */
  reset: () => {
    Object.assign(WILD_WISP_PALETTE, {
      hue: 0, sat: 100, light: 55, glowLight: 65, brightLight: 80, coreSat: 100,
    });
    WILD_CORE_SCALE = 0.5;
    WILD_BRIGHTNESS_MULT = 1.5;
    clearWispsSpriteCache();
  },
};