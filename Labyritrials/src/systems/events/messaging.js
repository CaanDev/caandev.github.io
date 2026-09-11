/**
 * @fileoverview Отображение сообщений о событиях.
 * Показывает уведомление о начале события в виде текстов на экране.
 * 
 * @module systems/events/messaging
 */

import { state, player } from '../../core/config/index.js';
import { EVENTS } from './config.js';

/**
 * Показ сообщения о текущем активном событии
 * 
 * Отображает сообщение события в виде последовательности текстовых строк
 * с иконками и цветом, соответствующим событию. Сообщение показывается
 * один раз за уровень.
 * 
 * @returns {void}
 */
export function showEventMessage() {
  // Сообщение не показывается в тайных комнатах
  if (state.inTreasureRoom || state.inShrineRoom || state.inTrapRoom || state.inSafeRoom) return;
  // Если нет события или сообщение уже показано
  if (!state.currentEvent || state.eventMessageShown) return;
  
  const event = EVENTS[state.currentEvent];
  if (!event) return;
  
  // Отметка, что сообщение показано
  state.eventMessageShown = true;
  
  // Формирование полного сообщения
  const fullMessage = `${event.icon} ${event.message} ${event.icon}`;
  // Разбитие на строки
  const lines = fullMessage.split('<br>');
  
  // Позиция отображения над игроком
  const startY = player.py - 120;
  const lineHeight = 28;
  
  // Создание текстов урона (они отображаются как обычный текст)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    state.damageTexts.push({
      x: player.px,
      y: startY + (i * lineHeight),
      text: line,
      color: event.color,
      size: 20 - (i * 2),
      life: 200,
      speedy: 0.3
    });
  }
  
  // Эффект тряски экрана
  state.screenShake = 10;
}