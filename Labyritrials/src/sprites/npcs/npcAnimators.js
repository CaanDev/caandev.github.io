/**
 * @fileoverview Словарь аниматоров NPC.
 * Хранит по одному экземпляру NpcAnimator на каждого NPC,
 * чтобы анимации обновлялись независимо и переиспользовались между кадрами.
 * 
 * @module sprites/npcs/npcAnimators
 */

import { createNpcAnimator } from './npcAnimator.js';

/** @type {Map<string, import('./npcAnimator.js').NpcAnimator>} - Аниматоры по ID NPC */
const _animators = new Map();

/**
 * Получение аниматора для NPC.
 * Если аниматора ещё нет - создаётся с дефолтной анимацией 'write' и направлением 'south'.
 * 
 * @param {string} npcId - ID NPC ('researcher')
 * @returns {import('./npcAnimator.js').NpcAnimator} - Аниматор
 */
export function getNpcAnimator(npcId) {
  if (!_animators.has(npcId)) _animators.set(npcId, createNpcAnimator(npcId, 'write', 'south'));
  return _animators.get(npcId);
}

/**
 * Сброс аниматора NPC в начальное состояние.
 * 
 * @param {string} npcId - ID NPC
 * @returns {void}
 */
export function resetNpcAnimator(npcId) {
  const animator = _animators.get(npcId);
  if (animator) animator.reset();
}

/**
 * Полная очистка словаря аниматоров.
 * Используется при выходе в главное меню или полном сбросе игры.
 * 
 * @returns {void}
 */
export function clearNpcAnimators() {
  _animators.clear();
}