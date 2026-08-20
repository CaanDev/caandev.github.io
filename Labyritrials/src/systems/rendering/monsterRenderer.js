/**
 * @fileoverview Рендерер монстров.
 * Отрисовывает монстров с учётом видимости, состояния, эффектов и фаз боссов.
 * 
 * @module systems/rendering/monsterRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { EMOJIS } from '../../emojis.js';
import { hasLineOfSight } from '../../world/physics.js';
import { getDistanceVisibility } from '../fog/index.js';
import { isVisibleWithRadius } from './visibilityUtils.js';

/**
 * Отрисовка всех монстров
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
/**
 * Отрисовка всех монстров
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {number} camX - Смещение камеры по X
 * @param {number} camY - Смещение камеры по Y
 * @param {HTMLCanvasElement} canvas - Элемент холста
 * @returns {void}
 */
export function drawMonsters(ctx, camX, camY, canvas) {
  if (!state.monsters || state.monsters.length === 0) return;
  
  for (let m of state.monsters) {
    // Проверка видимости на экране
    if (!isVisibleWithRadius(m.x, m.y, m.radius + 30, camX, camY, canvas.width, canvas.height)) {
      continue;
    }
    
    let mx = Math.floor(m.x / CONFIG.cellSize);
    let my = Math.floor(m.y / CONFIG.cellSize);
    
    if (!state.grid[my] || !state.grid[my][mx]) continue;
    if (!state.grid[my][mx].revealed && !player.hasMap) continue;
    
    const distToPlayer = Math.hypot(player.px - m.x, player.py - m.y);
    
    // Видимость в тумане
    const visibility = getDistanceVisibility(m.x, m.y);
    if (visibility <= 0.05) continue;
    
    const hasLineOfSightToMonster = hasLineOfSight(player.px, player.py, m.x, m.y);
    const isNearTorch = isNearTorchLight(m.x, m.y);
    const isInDark = (!hasLineOfSightToMonster || distToPlayer > CONFIG.glowingEyes.minDistance) && !isNearTorch;
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, visibility * 0.9 + 0.1);

    // Свечение от ловушек (эффект после активации ловушки монстром)
    if (m.trapGlowColor && m.trapGlowTimer > 0) {
      const pulse = 0.6 + Math.sin(Date.now() * 0.008 + m.x) * 0.3;
      const intensity = Math.min(1, m.trapGlowTimer / 60) * pulse;
      
      ctx.shadowBlur = 35 * intensity;
      ctx.shadowColor = m.trapGlowColor;
    } else {
      ctx.shadowBlur = 0;
    }
    
    // Эффекты призрака
    if (m.isGhost) {
      if (m.isPhasing) {
        const opacity = 0.4 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.globalAlpha *= opacity;
      }
      if (m.state === 'chase' && m.glowIntensity > 0) {
        ctx.shadowBlur = 20 * m.glowIntensity;
        ctx.shadowColor = `${COLORS.monsters.ghost.glow}${0.5 * m.glowIntensity})`;
      }
    }

    // ===== ОСОБАЯ ОТРИСОВКА БОССОВ (фазы 2-3) =====
    if ((m.isBoss || m.isDuoBoss) && m.currentPhase > 1) {
      drawBossPhaseGlow(ctx, m);
    }
    
    // ===== ОТРИСОВКА МОНСТРА =====
    if (isInDark) {
      // В темноте — только светящиеся глаза
      drawGlowingEyes(ctx, m, distToPlayer, visibility);
    } else {
      // Полная отрисовка
      ctx.fillStyle = COLORS.player.shadow;
      ctx.font = `${m.radius * 1.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.emoji, m.x, m.y);
      
      // Боссы с низким HP — пульсирующее свечение
      if (m.isBoss || m.isDuoBoss) {
        const hpPercent = m.hp / m.maxHp;
        if (hpPercent < 0.5) {
          ctx.save();
          ctx.shadowBlur = 35;
          ctx.shadowColor = COLORS.ui.health.fillDanger;
          ctx.fillText(m.emoji, m.x, m.y);
          ctx.restore();
        } else {
          ctx.fillText(m.emoji, m.x, m.y);
        }
      }
    }
    
    ctx.restore();
    
    // ===== ИНДИКАТОРЫ ФАЗ БОССА =====
    if ((m.isBoss || m.isDuoBoss) && !isInDark && visibility > 0.5) {
      let exclamationText = '';
      
      if (m.currentPhase === 2) {
        exclamationText = EMOJIS.ui.exclamation;
      } else if (m.currentPhase === 3) {
        exclamationText = EMOJIS.ui.doubleExclamation;
      }
      
      if (exclamationText) {
        ctx.fillStyle = COLORS.ui.textRed;
        ctx.font = `bold ${24 + (m.currentPhase === 3 ? 4 : 0)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(exclamationText, m.x, m.y - m.radius - 15);
      }
    }

    // Индикатор подготовки луча (босс Демон)
    if (m.isPreparingBeam && m.beamPrepareStart) {
      drawBeamIndicator(ctx, m);
    }
    
    // ===== ПОЛОСКА ЗДОРОВЬЯ ДЛЯ ОБЫЧНЫХ МОНСТРОВ =====
    // Используем baseRadius для консистентной ширины полоски
    const drawRadius = m.baseRadius || m.radius;
    
    if (!isInDark && visibility > 0.3 && !m.isBoss && !m.isDuoBoss) {
      const barWidth = drawRadius * 2;
      const barHeight = 6;
      const barX = m.x - drawRadius;
      const barY = m.y - drawRadius - 12;
      const hpPercent = Math.max(0, Math.min(1, m.hp / m.maxHp));
      
      // Фон полоски
      ctx.fillStyle = COLORS.monsters.healthBar.bg;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Заполнение
      ctx.fillStyle = COLORS.monsters.healthBar.fill;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
  }
}

/**
 * Отрисовка свечения для фаз босса
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} m - Объект босса
 * @returns {void}
 * @private
 */
function drawBossPhaseGlow(ctx, m) {
  let glowColor = '';
  let glowIntensity = 0;
  let pulseIntensity = 0;
  
  const time = Date.now() * 0.003;
  const pulse = 0.6 + Math.sin(time) * 0.3;
  
  // Определение цвета и интенсивности в зависимости от типа и фазы
  if (m.bossType === 'mind') {
    if (m.currentPhase === 2) {
      glowColor = COLORS.monsters.boss.phase2.mind;
      glowIntensity = 0.5;
      pulseIntensity = 0.35;
    } else if (m.currentPhase === 3) {
      glowColor = COLORS.monsters.boss.phase3.mind;
      glowIntensity = 0.7;
      pulseIntensity = 0.45;
    }
  } else {
    if (m.currentPhase === 2) {
      glowColor = COLORS.monsters.boss.phase2.demon;
      glowIntensity = 0.4;
      pulseIntensity = 0.3;
    } else if (m.currentPhase === 3) {
      glowColor = COLORS.monsters.boss.phase3.demon;
      glowIntensity = 0.6;
      pulseIntensity = 0.4;
    }
  }
  
  ctx.save();
  
  ctx.shadowBlur = 25 * (glowIntensity + pulseIntensity * pulse);
  ctx.shadowColor = glowColor;
  
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = `${m.radius * 1.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.emoji, m.x, m.y);
  
  // Дополнительный градиент свечения
  const gradient = ctx.createRadialGradient(m.x, m.y, m.radius * 0.5, m.x, m.y, m.radius * 1.5);

  if (m.bossType === 'mind') {
    if (m.currentPhase === 2) {
      gradient.addColorStop(0, `rgba(68, 170, 255, ${0.15 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(0.5, `rgba(34, 136, 204, ${0.08 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(1, 'rgba(17, 68, 102, 0)');
    } else if (m.currentPhase === 3) {
      gradient.addColorStop(0, `rgba(155, 89, 182, ${0.2 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(0.5, `rgba(108, 52, 131, ${0.1 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(1, 'rgba(54, 26, 65, 0)');
    }
  } else {
    if (m.currentPhase === 2) {
      gradient.addColorStop(0, `rgba(255, 136, 0, ${0.1 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.05 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
    } else {
      gradient.addColorStop(0, `rgba(255, 0, 0, ${0.15 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(0.5, `rgba(200, 0, 0, ${0.08 * (glowIntensity + pulseIntensity * pulse)})`);
      gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
    }
  }
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // Повторная отрисовка эмодзи поверх градиента
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = `${m.radius * 1.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.emoji, m.x, m.y);
}

/**
 * Отрисовка светящихся глаз монстра в темноте
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} m - Объект монстра
 * @param {number} distToPlayer - Расстояние до игрока
 * @param {number} visibility - Коэффициент видимости
 * @returns {void}
 * @private
 */
function drawGlowingEyes(ctx, m, distToPlayer, visibility) {
  let eyeColor = COLORS.monsters.eyes.normal;
  let eyeSize = m.radius * 0.35;
  let eyeOffset = m.radius * 0.45;
  
  // Определение цвета глаз в зависимости от типа монстра
  if (m.isGhost) {
    eyeColor = COLORS.monsters.eyes.ghost;
  }
  
  if (m.bossType === 'mind') {
    eyeColor = COLORS.monsters.eyes.mind;
    eyeSize = m.radius * 0.4;
    eyeOffset = m.radius * 0.45;
  }
  
  if ((m.isBoss || m.isDuoBoss) && m.bossType !== 'mind') {
    eyeColor = COLORS.monsters.eyes.boss;
    eyeSize = m.radius * 0.4;
    eyeOffset = m.radius * 0.45;
  }
  
  // Интенсивность свечения зависит от расстояния и видимости
  let intensity = 0.9 * visibility;
  if (distToPlayer > 400) {
    intensity = 0.6 * visibility;
  } else if (distToPlayer < 200) {
    intensity = 1.1 * visibility;
  }
  
  ctx.save();
  
  ctx.shadowBlur = 10 * intensity;
  ctx.shadowColor = eyeColor;
  ctx.fillStyle = eyeColor;
  ctx.globalAlpha = 0.85 * intensity;
  
  // Левый глаз
  ctx.beginPath();
  ctx.arc(m.x - eyeOffset, m.y - eyeSize * 0.8, eyeSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  // Правый глаз
  ctx.beginPath();
  ctx.arc(m.x + eyeOffset, m.y - eyeSize * 0.8, eyeSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Проверка, находится ли монстр рядом со светом факела
 * 
 * @param {number} x - Координата X монстра
 * @param {number} y - Координата Y монстра
 * @returns {boolean} - true, если монстр рядом с факелом
 * @private
 */
function isNearTorchLight(x, y) {
  const gridX = Math.floor(x / CONFIG.cellSize);
  const gridY = Math.floor(y / CONFIG.cellSize);
  
  for (let torch of state.torches) {
    if (torch.active) {
      const dist = Math.hypot(gridX - torch.x, gridY - torch.y);
      if (dist < 3) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Отрисовка индикатора подготовки луча босса
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} boss - Объект босса
 * @returns {void}
 * @private
 */
function drawBeamIndicator(ctx, boss) {
  const now = Date.now();
  const elapsed = now - boss.beamPrepareStart;
  const progress = Math.min(1, elapsed / 1500);
  const timeLeft = Math.max(0, 1500 - elapsed);
  const timeLeftSec = (timeLeft / 1000).toFixed(1);
  
  const barWidth = 100;
  const barHeight = 12;
  const barX = boss.x - barWidth / 2;
  const barY = boss.y - boss.radius - 45;
  
  ctx.save();
  
  // Фон индикатора
  ctx.fillStyle = COLORS.background.overlay;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Оставшееся время (уменьшается)
  const remainingWidth = barWidth * (1 - progress);
  ctx.fillStyle = COLORS.ui.health.fillDanger;
  ctx.fillRect(barX, barY, remainingWidth, barHeight);
  
  // Пульсация при близком завершении
  if (progress > 0.8) {
    const pulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
    ctx.fillRect(barX, barY, remainingWidth, barHeight);
  }
  
  // Рамка индикатора
  ctx.strokeStyle = COLORS.ui.textGold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Текст времени
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillStyle = progress > 0.8 ? COLORS.effects.fire : COLORS.player.shadow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`🌋 ЛУЧ: ${timeLeftSec}с`, boss.x, barY - 5);
  
  // Подсказка для игрока
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = COLORS.ui.textGold;
  ctx.fillText('⚔️ УДАРЬ, ЧТОБЫ ПРЕРВАТЬ!', boss.x, barY - 18);
  
  ctx.restore();
}