/**
 * @fileoverview Очистка частиц при переходе между комнатами.
 * Удаляет все частицы предметов при входе/выходе из тайных комнат и безопасной комнаты.
 * 
 * @module entities/objects/clearRoomEffects
 */

import { clearGoldParticles, clearArtifactParticles, clearPotionParticles } from '../../systems/particles/index.js';

/**
 * Очистка всех частиц предметов (золото, артефакты, зелья)
 * 
 * Вызывается при:
 * - Входе в тайные комнаты (сокровищница, комната с алтарём, комната-ловушка)
 * - Выходе из тайных комнат
 * - Входе в безопасную комнату
 * - Выходе из безопасной комнаты
 * 
 * @returns {void}
 */
export function clearAllRoomParticles() {
  clearGoldParticles();
  clearArtifactParticles();
  clearPotionParticles();
}