/**
 * @fileoverview Рендерер всех частиц.
 * Собирает частицы из пула и отрисовывает их пакетно для оптимизации.
 * 
 * @module systems/rendering/particleRenderer
 */

import { state } from '../../core/config/index.js';
import { BatchManager, ParticleStyles } from './batchRenderer.js';
import { goldParticlePool } from '../particles/goldParticles.js';

/** @type {BatchManager} - Менеджер пакетов для групповой отрисовки */
const particleBatch = new BatchManager();

/**
 * Отрисовка всех частиц (золото, артефакты, зелья)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawAllParticles(ctx) {
  // Очистка пакетов перед сбором
  particleBatch.clearAll();

  // Сбор частиц разных типов
  collectGoldParticles();
  collectArtifactParticles();
  collectPotionParticles();
  
  // Пакетная отрисовка
  if (!particleBatch.isEmpty) {
    particleBatch.drawAll(ctx);
  }
}

/**
 * Сбор частиц золота из пула
 * 
 * @returns {void}
 * @private
 */
function collectGoldParticles() {
  for (const p of goldParticlePool.active) {
    if (!p.active || p.type !== 'gold') continue;
    
    const lifeProgress = p.life / p.maxLife;
    const size = p.size * (0.6 + lifeProgress * 0.4);
    
    // Выбор стиля в зависимости от типа частицы
    let style;
    if (p.isLootSpark) {
      style = ParticleStyles.goldSpark;
      const glowIntensity = p.glowIntensity || 0.8;
      style.shadowBlur = 10 + glowIntensity * 12;
      style.shadowColor = `rgba(241, 196, 15, ${0.4 + glowIntensity * 0.4})`;
    } else {
      style = ParticleStyles.gold;
    }
    
    // Масштабирование при притяжении к цели
    if (p.attracted) {
      const attractProgress = 1 - p.life / p.maxLife;
      const scale = 1 - attractProgress * 0.5;
      particleBatch.addCircle(p.x, p.y, size * scale, style);
    } else {
      particleBatch.addCircle(p.x, p.y, size, style);
    }
  }
}

/**
 * Сбор частиц артефактов из пула
 * 
 * @returns {void}
 * @private
 */
function collectArtifactParticles() {
  for (const p of goldParticlePool.active) {
    if (!p.active || p.type !== 'artifact') continue;
    
    const lifeProgress = p.life / p.maxLife;
    const size = p.size * (0.6 + lifeProgress * 0.4);
    
    // Выбор стиля
    let style;
    if (p.isLootSpark) {
      style = ParticleStyles.artifactSpark;
      const glowIntensity = p.glowIntensity || 0.8;
      style.shadowBlur = 10 + glowIntensity * 20;
      style.shadowColor = `rgba(155, 89, 182, ${0.4 + glowIntensity * 0.4})`;
    } else {
      style = ParticleStyles.artifact;
    }
    
    const attractProgress = p.attracted ? 1 - p.life / p.maxLife : 0;
    const scale = 1 - attractProgress * 0.4;
    
    // Артефакты могут иметь форму драгоценных камней (эллипс)
    if (p.isGem && !p.simple) {
      particleBatch.addEllipse(
        p.x, p.y, 
        size * scale, 
        size * 0.8 * scale, 
        p.rotation || 0, 
        style
      );
    } else {
      particleBatch.addCircle(p.x, p.y, size * scale, style);
    }
  }
}

/**
 * Сбор частиц зелий из пула
 * 
 * @returns {void}
 * @private
 */
function collectPotionParticles() {
  for (const p of goldParticlePool.active) {
    if (!p.active || p.type !== 'potion') continue;
    
    const lifeProgress = p.life / p.maxLife;
    const size = p.size * (0.6 + lifeProgress * 0.4);
    
    // Выбор стиля
    let style;
    if (p.isLootSpark) {
      style = ParticleStyles.potionSpark;
      const glowIntensity = p.glowIntensity || 0.6;
      style.shadowBlur = 8 + glowIntensity * 15;
      style.shadowColor = `rgba(46, 204, 113, ${0.4 + glowIntensity * 0.4})`;
    } else {
      style = ParticleStyles.potion;
    }
    
    const attractProgress = p.attracted ? 1 - p.life / p.maxLife : 0;
    const scale = 1 - attractProgress * 0.4;
    
    // Зелья могут иметь форму капель (эллипс)
    if (p.isDrop && !p.simple) {
      particleBatch.addEllipse(
        p.x, p.y, 
        size * scale, 
        size * 1.2 * scale, 
        p.rotation || 0, 
        style
      );
    } else {
      particleBatch.addCircle(p.x, p.y, size * scale, style);
    }
  }
}

/**
 * Экспорт менеджера пакетов для внешнего использования
 */
export { particleBatch };

/**
 * Алиасы для обратной совместимости
 * @deprecated Используйте drawAllParticles
 */
export { drawAllParticles as drawGoldParticles };
export { drawAllParticles as drawArtifactParticles };
export { drawAllParticles as drawPotionParticles };

/**
 * Очистка всех частиц
 * 
 * @returns {void}
 */
export function clearAllParticles() {
  goldParticlePool.releaseAll();
  particleBatch.clearAll();
}