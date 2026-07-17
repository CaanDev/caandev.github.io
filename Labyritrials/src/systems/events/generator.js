/**
 * @fileoverview Генератор игровых событий.
 * Управляет случайной генерацией событий и очисткой их эффектов.
 * 
 * @module systems/events/generator
 */

import { state, player } from '../../core/config/index.js';
import { EVENTS } from './config.js';

/**
 * Генерация случайного события на уровне
 * 
 * Событие генерируется с шансом 25% на уровнях 3+.
 * Не генерируется в тайных комнатах, безопасной комнате и на босс-уровнях.
 * 
 * @returns {void}
 */
export function generateRandomEvent() {
  // События не генерируются в тайных комнатах
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  
  // События не генерируются на босс-уровнях
  if (state.isBossLevel) return;
  
  // События доступны с 3 уровня
  if (state.gameLevel < 3) return;
  
  // Если событие уже активно — не генерируем новое
  if (state.currentEvent) return;
  
  // Шанс появления события — 25%
  const eventChance = 0.25;
  if (Math.random() > eventChance) return;
  
  // Выбор случайного события
  const eventKeys = Object.keys(EVENTS);
  const randomEventKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
  const event = EVENTS[randomEventKey];
  
  // Устанавливаем событие
  state.currentEvent = randomEventKey;
  state.eventMessageShown = false;
  
  // Применяем эффект события
  event.applyEffect();
}

/**
 * Очистка всех активных эффектов событий
 * 
 * Полностью сбрасывает текущее событие и все связанные с ним эффекты.
 * 
 * @returns {void}
 */
export function clearEventEffects() {
  // Если события нет — ничего не делаем
  if (!state.currentEvent) return;
  
  // Снимаем эффект события
  const event = EVENTS[state.currentEvent];
  if (event) {
    event.removeEffect();
  }
  
  // Сбрасываем состояние события
  state.currentEvent = null;
  state.eventMessageShown = false;
  state.bloodMoonActive = false;
  
  // Сбрасываем модификаторы игрока
  player.eventGoldMultiplier = 1.0;
  player.eventDamageMultiplier = 1.0;
  player.incomingDamageMultiplier = 1.0;
}