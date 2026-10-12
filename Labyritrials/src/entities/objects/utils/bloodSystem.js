/**
 * @fileoverview Система кровавых луж.
 * Управляет созданием, очисткой и подсчётом кровавых пятен на полу.
 * Каждая лужа состоит из основного пятна и нескольких дополнительных капель/брызг.
 * 
 * @module entities/objects/utils/bloodSystem
 */

import { state, CONFIG } from '../../../core/config/index.js';

/**
 * Создание кровавой лужи в указанной позиции
 * 
 * Создаёт основное пятно и несколько дополнительных капель и брызг
 * для реалистичного эффекта крови. Каждая частица имеет свой размер,
 * прозрачность и время жизни.
 * 
 * @param {number} x - Координата X центра лужи (в пикселях)
 * @param {number} y - Координата Y центра лужи (в пикселях)
 * @param {boolean} [isGhost=false] - Если true, лужа не создаётся (призраки не оставляют крови)
 * @returns {void}
 */
export function createBloodPuddle(x, y, isGhost = false) {
  // Призраки не оставляют кровавых следов
  if (isGhost) return;

  // Инициализируем массив, если его нет
  if (!state.bloodPuddles) {
    state.bloodPuddles = [];
  }

  // Защита от некорректных координат
  if (isNaN(x) || isNaN(y)) return;

  // Основные параметры лужи
  const size = 20 + Math.random() * 25;
  const opacity = 0.25 + Math.random() * 0.25;

  // ===== ОСНОВНОЕ ПЯТНО =====
  state.bloodPuddles.push({
    x: x,
    y: y,
    size: size,
    life: 600,
    maxLife: 600,
    opacity: opacity,
    rotation: Math.random() * Math.PI * 2,
    isMain: true
  });

  // ===== ДОПОЛНИТЕЛЬНЫЕ КАПЛИ (3-6 шт.) =====
  const dropCount = Math.floor(Math.random() * 4) + 3;

  for (let i = 0; i < dropCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = size * (0.8 + Math.random() * 0.6);
    const dropSize = size * (0.25 + Math.random() * 0.25);
    const dropOpacity = opacity * (0.7 + Math.random() * 0.3);

    state.bloodPuddles.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: dropSize,
      life: 550,
      maxLife: 600,
      opacity: dropOpacity,
      rotation: Math.random() * Math.PI * 2,
      isMain: false
    });
  }

  // ===== БРЫЗГИ (4-9 шт.) =====
  const splashCount = Math.floor(Math.random() * 6) + 4;

  for (let i = 0; i < splashCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = size * (1.1 + Math.random() * 0.9);
    const splashSize = size * (0.12 + Math.random() * 0.2);
    const splashOpacity = opacity * (0.5 + Math.random() * 0.4);

    state.bloodPuddles.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: splashSize,
      life: 520,
      maxLife: 600,
      opacity: splashOpacity,
      rotation: Math.random() * Math.PI * 2,
      isMain: false,
      isSplash: true
    });
  }

  // ===== ДОПОЛНИТЕЛЬНЫЕ МЕЛКИЕ КАПЛИ (3-7 шт.) =====
  const extraDropCount = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < extraDropCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = size * (0.5 + Math.random() * 0.7);
    const extraSize = size * (0.15 + Math.random() * 0.2);
    const extraOpacity = opacity * (0.4 + Math.random() * 0.3);

    state.bloodPuddles.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: extraSize,
      life: 580,
      maxLife: 600,
      opacity: extraOpacity,
      rotation: Math.random() * Math.PI * 2,
      isMain: false,
      isExtra: true
    });
  }

  // Ограничиваем общее количество луж (оптимизация производительности)
  while (state.bloodPuddles.length > 400) {
    state.bloodPuddles.shift();
  }
}

/**
 * Очистка всех кровавых луж
 * 
 * Полностью удаляет все кровавые пятна из игрового состояния.
 * Используется при перезагрузке уровня, переходе между комнатами или смерти игрока.
 * 
 * @returns {void}
 */
export function clearBloodPuddles() {
  if (state.bloodPuddles) {
    state.bloodPuddles = [];
  }
}

/**
 * Получение количества кровавых луж
 * 
 * @returns {number} - Количество активных кровавых луж в игровом мире
 */
export function getBloodPuddleCount() {
  return state.bloodPuddles ? state.bloodPuddles.length : 0;
}