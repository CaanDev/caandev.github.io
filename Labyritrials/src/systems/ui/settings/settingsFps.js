/**
 * @fileoverview Управление FPS и отображением счётчика кадров.
 * Обеспечивает ограничение FPS, отображение счётчика кадров
 * и синхронизацию с настройками VSync.
 * 
 * @module systems/ui/settings/settingsFps
 */

import { getSettings, updateSetting } from './settingsManager.js';

/** @type {HTMLElement|null} - Элемент счётчика FPS */
let fpsElement = null;
/** @type {number} - Интервал между кадрами в миллисекундах (0 — без ограничения) */
let frameInterval = 0;
/** @type {number} - Время последнего кадра */
let lastFrameTime = 0;

/**
 * Получение текущего интервала между кадрами
 * 
 * @returns {number} - Интервал в миллисекундах (0 — без ограничения)
 */
export function getFrameInterval() {
  return frameInterval;
}

/**
 * Обновление ограничения FPS из настроек
 * 
 * @returns {void}
 */
export function updateFpsLimit() {
  const settings = getSettings();
  const limit = settings.fpsLimit || 0;

  if (limit === 0) {
    frameInterval = 0;
  } else {
    frameInterval = 1000 / limit;
  }

  lastFrameTime = performance.now();
}

/**
 * Проверка, нужно ли пропустить текущий кадр
 * 
 * @returns {boolean} - true, если кадр нужно пропустить
 */
export function shouldSkipFrame() {
  if (frameInterval === 0) return false;

  const now = performance.now();
  const delta = now - lastFrameTime;

  if (delta >= frameInterval) {
    lastFrameTime = now;
    return false;
  }

  return true;
}

/**
 * Проверка, активна ли игра
 * 
 * @returns {boolean} - true, если игра активна
 * @private
 */
function isGameActive() {
  const introScreen = document.getElementById('intro-screen');
  const startScreen = document.getElementById('start-screen-ui');
  const gameUI = document.getElementById('ui');

  if (introScreen && introScreen.style.display !== 'none') return false;
  if (startScreen && startScreen.style.display === 'flex') return false;
  if (gameUI && gameUI.style.display === 'block') return true;

  return false;
}

/**
 * Создание элемента счётчика FPS
 * 
 * @returns {void}
 * @private
 */
function createFpsElement() {
  if (fpsElement) return;

  fpsElement = document.createElement('div');
  fpsElement.id = 'fps-counter';
  fpsElement.style.cssText = `
    position: fixed;
    bottom: 75px;
    right: 20px;
    color: #88dd88;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    z-index: 999;
    pointer-events: none;
    user-select: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid rgba(136, 221, 136, 0.3);
  `;
  fpsElement.textContent = 'FPS: 0';
  document.body.appendChild(fpsElement);
}

/**
 * Показ счётчика FPS
 * 
 * @returns {void}
 * @private
 */
function showFpsCounter() {
  createFpsElement();
  if (fpsElement) {
    fpsElement.style.opacity = '1';
    fpsElement.style.pointerEvents = 'none';
  }
}

/**
 * Скрытие счётчика FPS
 * 
 * @returns {void}
 * @private
 */
function hideFpsCounter() {
  if (fpsElement) {
    fpsElement.style.opacity = '0';
  }
}

/**
 * Обновление видимости счётчика FPS в зависимости от настроек
 * 
 * @returns {void}
 */
export function updateFpsVisibility() {
  const settings = getSettings();
  
  if (!settings.showFps) {
    hideFpsCounter();
    return;
  }

  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu && pauseMenu.style.display === 'flex') {
    hideFpsCounter();
    return;
  }

  if (isGameActive()) {
    showFpsCounter();
  } else {
    hideFpsCounter();
  }
}

/**
 * Обновление отображаемого значения FPS
 * 
 * @param {number} fps - Текущее количество кадров в секунду
 * @returns {void}
 */
export function updateFpsDisplay(fps) {
  const settings = getSettings();
  if (!settings.showFps) return;
  if (!isGameActive()) return;

  if (!fpsElement) {
    createFpsElement();
    showFpsCounter();
  }
  if (fpsElement) {
    // Цвет в зависимости от производительности
    let color = '#88dd88';
    if (fps < 30) color = '#dd8888';
    else if (fps < 50) color = '#dddd88';

    fpsElement.style.color = color;
    const mode = settings.vsyncEnabled ? '🔄' : '⚡';
    fpsElement.textContent = `FPS: ${Math.round(fps)} ${mode}`;
  }
}