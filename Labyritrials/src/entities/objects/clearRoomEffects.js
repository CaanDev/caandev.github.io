/**
 * @fileoverview Очистка частиц при переходе между комнатами.
 * Удаляет все частицы предметов при входе/выходе из тайных комнат и безопасной комнаты.
 * 
 * @module entities/objects/clearRoomEffects
 */

import { clearGoldParticles, clearArtifactParticles, clearPotionParticles } from '../../systems/particles/index.js';
import { clearBloodPuddles } from './utils/bloodSystem.js';
import { clearBloodTrails } from '../player/bloodTrails.js';

/**
 * Очистка всех частиц и следов крови
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
  clearBloodPuddles();
  clearBloodTrails();
}