/**
 * @fileoverview Вспомогательные утилиты для тумана войны.
 * Предоставляет функции для расчёта видимости объектов,
 * получения цветов с учётом тумана и управления зонами света.
 * 
 * @module systems/fog/fogUtils
 */

import { state, player } from '../../core/config/index.js';
import { CONFIG } from '../../core/config/index.js';

/**
 * Расчёт видимости объекта в зависимости от расстояния до игрока
 * 
 * Возвращает коэффициент видимости от 0 (невидим) до 1 (полностью видим).
 * Использует плавное затухание за пределами радиуса видимости.
 * 
 * @param {number} objX - Координата X объекта в пикселях
 * @param {number} objY - Координата Y объекта в пикселях
 * @returns {number} - Коэффициент видимости (0-1)
 */
export function getDistanceVisibility(objX, objY) {
  const distToPlayer = Math.hypot(objX - player.px, objY - player.py);
  const maxDist = (state.fogState.currentRadius || 550) * 1.3;

  // Полная видимость в ближней зоне
  if (distToPlayer < maxDist * 0.35) return 1.0;
  
  // Полная невидимость за пределами maxDist
  if (distToPlayer > maxDist) return 0.0;

  // Плавное затухание между зонами
  const t = (distToPlayer - maxDist * 0.35) / (maxDist * 0.65);
  return 1 - Math.pow(t, 1.8);
}

/**
 * Получение цвета объекта с учётом затухания в тумане
 * 
 * @param {number} baseR - Красный компонент базового цвета (0-255)
 * @param {number} baseG - Зелёный компонент базового цвета (0-255)
 * @param {number} baseB - Синий компонент базового цвета (0-255)
 * @param {number} objX - Координата X объекта в пикселях
 * @param {number} objY - Координата Y объекта в пикселях
 * @returns {string} - RGBA-строка с учётом видимости
 */
export function getFadedColor(baseR, baseG, baseB, objX, objY) {
  const visibility = getDistanceVisibility(objX, objY);
  const alpha = visibility * 0.8;
  return `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha})`;
}

/**
 * Получение текущего радиуса видимости
 * 
 * @returns {number} - Текущий радиус видимости в пикселях
 */
export function getCurrentFogRadius() {
  return state.fogState.currentRadius || CONFIG.fog.baseRadius;
}

/**
 * Получение цвета тумана для активного события
 * 
 * @returns {string|null} - RGBA-строка цвета события или null, если событие не активно
 */
export function getEventFogColor() {
  if (state.currentEvent === 'bloodMoon') {
    return 'rgba(180, 30, 30, 0.15)';
  } else if (state.currentEvent === 'iceWind') {
    return 'rgba(30, 120, 200, 0.12)';
  } else if (state.currentEvent === 'blessing') {
    return 'rgba(255, 215, 0, 0.08)';
  }
  return null;
}

/**
 * Обновление зон освещения на карте
 * 
 * Собирает информацию о всех источниках света:
 * - Активные факелы (яркий свет)
 * - Неактивные алтари (магический свет)
 * 
 * @returns {void}
 */
export function updateLightZones() {
  if (!state.lightZones) state.lightZones = [];
  state.lightZones = [];
  
  // Свет от активных факелов
  for (let torch of state.torches) {
    if (torch.active) {
      state.lightZones.push({
        x: torch.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        y: torch.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        radius: 200,
        type: 'bright'
      });
    }
  }
  
  // Свет от неактивных алтарей
  for (let shrine of state.shrines) {
    if (!shrine.activated) {
      state.lightZones.push({
        x: shrine.x,
        y: shrine.y,
        radius: 280,
        type: 'magic'
      });
    }
  }
}