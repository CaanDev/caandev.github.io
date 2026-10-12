/**
 * @fileoverview Рендерер снарядов и эффектов.
 * Отрисовывает огненные шары, кольцевые снаряды, тексты урона,
 * искры, лучи и псионические волны.
 * 
 * @module systems/rendering/projectileRenderer
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { checkWallCollision } from '../../world/physics.js';
import { triggerGameOver } from '../../entities/player/gameOver.js';

/**
 * Отрисовка всех огненных шаров и снарядов
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawFireballs(ctx) {
  for (let fb of state.fireballs) {
    ctx.save();
    
    // Кольцевые снаряды (босс-стрелок)
    if (fb.isRingProjectile && fb.ringActive) {
      drawRingProjectile(ctx, fb);
      ctx.restore();
      continue;
    }
    
    // Обычные снаряды
    drawNormalFireball(ctx, fb);
    ctx.restore();
  }
}

/**
 * Отрисовка кольцевого снаряда
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} fb - Объект снаряда
 * @returns {void}
 * @private
 */
function drawRingProjectile(ctx, fb) {
  const ringRadius = fb.ringOrbitRadius || 50;
  const ballCount = fb.ringBallCount || 8;
  const orbitAngle = fb.ringOrbitAngle || 0;
  const pulse = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
  
  // Центральное свечение
  ctx.shadowBlur = 35;
  ctx.shadowColor = COLORS.effects.fireGlow;
  
  const coreGradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, 35);
  coreGradient.addColorStop(0, `rgba(255, 100, 0, ${0.8 * pulse})`);
  coreGradient.addColorStop(0.4, `rgba(255, 60, 0, ${0.5 * pulse})`);
  coreGradient.addColorStop(0.7, `rgba(200, 30, 0, ${0.2 * pulse})`);
  coreGradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, 35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = `rgba(255, 120, 20, ${0.9 * pulse})`;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, 14, 0, Math.PI * 2);
  ctx.fill();
  
  // Огненные шары по кольцу
  for (let b = 0; b < ballCount; b++) {
    const angle = orbitAngle + (Math.PI * 2 / ballCount) * b;
    const ballX = fb.x + Math.cos(angle) * ringRadius;
    const ballY = fb.y + Math.sin(angle) * ringRadius;
    
    const ballSize = 12 + Math.sin(Date.now() * 0.012 + b) * 2;
    
    const gradient = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, ballSize);
    gradient.addColorStop(0, '#fff4a0');
    gradient.addColorStop(0.3, COLORS.effects.gold.light);
    gradient.addColorStop(0.6, COLORS.effects.fire);
    gradient.addColorStop(1, COLORS.effects.blood);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.effects.fireGlow;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Блик на шаре
    ctx.fillStyle = COLORS.player.shadow;
    ctx.beginPath();
    ctx.arc(ballX - 3, ballY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Искры вокруг шаров
    const time = Date.now() * 0.015;
    for (let s = 0; s < 3; s++) {
      const sparkAngle = angle + time + s * Math.PI * 1.5;
      const sparkX = ballX + Math.cos(sparkAngle) * 8;
      const sparkY = ballY + Math.sin(sparkAngle) * 8;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2 + Math.sin(time * 2 + s) * 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 180, 50, ${0.7 + Math.sin(time * 3) * 0.3})`;
      ctx.fill();
    }
  }
  
  // Частицы вокруг кольца
  const time2 = Date.now() * 0.01;
  for (let p = 0; p < 12; p++) {
    const angle = time2 + (Math.PI * 2 / 12) * p;
    const particleX = fb.x + Math.cos(angle) * (ringRadius + 8);
    const particleY = fb.y + Math.sin(angle) * (ringRadius + 8);
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2 + Math.sin(time2 * 3 + p) * 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${0.4 + Math.sin(time2 * 4) * 0.2})`;
    ctx.fill();
  }
}

/**
 * Отрисовка обычного огненного шара
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} fb - Объект снаряда
 * @returns {void}
 * @private
 */
function drawNormalFireball(ctx, fb) {
  const isGlowingMindBall = fb.isMindBall && fb.isGlowing;
  
  let gradient;
  if (isGlowingMindBall) {
    // Светящийся пси-шар (фаза 2 Разума)
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.player.shadow);
    gradient.addColorStop(0.3, COLORS.effects.artifact.light);
    gradient.addColorStop(0.6, COLORS.effects.magic);
    gradient.addColorStop(1, COLORS.effects.artifact.dark);
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLORS.effects.magic;
  } else if (fb.isMindBall) {
    // Обычный пси-шар
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.effects.artifact.light);
    gradient.addColorStop(0.5, COLORS.effects.magic);
    gradient.addColorStop(1, COLORS.effects.artifact.dark);
    ctx.shadowBlur = 12;
    ctx.shadowColor = COLORS.effects.magic;
  } else {
    // Огненный шар
    gradient = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.radius);
    gradient.addColorStop(0, COLORS.effects.gold.light);
    gradient.addColorStop(0.5, COLORS.effects.fire);
    gradient.addColorStop(1, COLORS.effects.blood);
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.effects.fireGlow;
  }
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(fb.x, fb.y, fb.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Эмодзи в центре (только для инвертирующих или обычных огненных шаров)
  ctx.fillStyle = COLORS.player.shadow;
  ctx.font = `${fb.radius + 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (fb.isMindBall) {
    // Пси-шар: эмодзи только для инвертирующих
    if (fb.canInvertControls) ctx.fillText('🧠', fb.x, fb.y);
  } else {
    ctx.fillText('🔥', fb.x, fb.y);
  }
}

/**
 * Отрисовка текстов урона и сообщений
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawDamageTexts(ctx) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let i = state.damageTexts.length - 1; i >= 0; i--) {
    let dt = state.damageTexts[i];
    ctx.fillStyle = dt.color;
    ctx.font = `bold ${dt.size}px Arial`;
    ctx.fillText(dt.text, dt.x, dt.y);
    
    dt.y -= dt.speedy;
    dt.life--;
    
    if (dt.life <= 0) state.damageTexts.splice(i, 1);
  }
}

/**
 * Отрисовка искр
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawSparks(ctx) {
  if (!state.sparks || state.sparks.length === 0) return;

  // Ограничение количества искр
  const maxSparks = CONFIG.maxParticles.spark || 120;
  if (state.sparks.length > maxSparks) {
    const removeCount = state.sparks.length - maxSparks;
    state.sparks.splice(0, removeCount);
  }
  
  for (let spark of state.sparks) {
    const lifeProgress = spark.life / spark.maxLife;
    
    // Искры от рун
    if (spark.isRuneSpark) {
      drawRuneSpark(ctx, spark, lifeProgress);
      continue;
    }
    
    // Обычные искры
    const opacity = Math.min(1, lifeProgress * 1.5);
    const size = spark.size * (0.5 + lifeProgress * 0.5);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 4;
    ctx.shadowColor = spark.color || COLORS.sparks.fire;
    
    if (spark.isDust) {
      ctx.fillStyle = spark.color || COLORS.sparks.dust;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = spark.color || COLORS.sparks.fire;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = COLORS.player.shadow;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Отрисовка искры от руны
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} spark - Объект искры
 * @param {number} lifeProgress - Прогресс жизни (0-1)
 * @returns {void}
 * @private
 */
function drawRuneSpark(ctx, spark, lifeProgress) {
  let opacity = 1;
  if (lifeProgress < 0.1) opacity = lifeProgress / 0.1;
  else if (lifeProgress > 0.7) opacity = (1 - lifeProgress) / 0.3;
  
  if (spark.flickerPhase !== undefined) {
    spark.flickerPhase += spark.flickerSpeed || 0.01;
    const flicker = 0.6 + Math.sin(spark.flickerPhase) * 0.25;
    opacity *= (0.5 + flicker * 0.5);
  }
  
  const size = spark.size * (0.7 + lifeProgress * 0.3);
  
  ctx.save();
  ctx.globalAlpha = Math.min(0.8, opacity);
  
  if (spark.glow) {
    const glowSize = 10 + (spark.glowIntensity || 0.8) * 12;
    ctx.shadowBlur = glowSize;
    ctx.shadowColor = spark.color || COLORS.sparks.magic;
  }
  
  const color = spark.color || COLORS.sparks.magic;
  
  const gradient = ctx.createRadialGradient(
    spark.x, spark.y, 0,
    spark.x, spark.y, size * 2.5
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, size * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Отрисовка предупреждающей линии луча (во время тряски босса)
 * 
 * Линия следует за игроком до момента фиксации (BEAM_LOCK_TIME = 1200 мс),
 * затем фиксируется, подсвечивается белым — момент для уворота.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBeamWarning(ctx) {
  // Ищем босса, который готовит луч
  for (const boss of state.monsters) {
    if (!boss.isPreparingBeam) continue;
    if (boss.beamInterrupted) continue;
    if (boss.beamAngle === null || boss.beamAngle === undefined) continue;

    const elapsed = Date.now() - boss.beamPrepareStart;
    const progress = Math.min(1, elapsed / 1500);

    // Фаза фиксации: последние 300 мс
    const isLocked = elapsed >= 1200;

    // Толщина линии: от 2 до 14 px
    const lineWidth = 2 + progress * 12;

    // Яркость: от 0.2 до 0.9
    const opacity = 0.2 + progress * 0.7;

    // Длина луча
    const maxDistance = Math.max(CONFIG.cols, CONFIG.rows) * CONFIG.cellSize;
    const endX = boss.x + Math.cos(boss.beamAngle) * maxDistance;
    const endY = boss.y + Math.sin(boss.beamAngle) * maxDistance;

    ctx.save();

    // Пульсация ближе к концу
    const pulse = progress > 0.7
      ? 0.7 + Math.sin(Date.now() * 0.03) * 0.3
      : 1.0;

    ctx.globalAlpha = opacity * pulse;

    // Свечение
    ctx.shadowBlur = 20 * progress;
    ctx.shadowColor = COLORS.effects.fire;

    // Градиент от босса к концу
    const gradient = ctx.createLinearGradient(boss.x, boss.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 100, 0, ${0.5 + progress * 0.4})`);
    gradient.addColorStop(0.3, `rgba(255, 150, 50, ${0.4 + progress * 0.4})`);
    gradient.addColorStop(0.7, `rgba(255, 200, 100, ${0.2 + progress * 0.3})`);
    gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Яркое ядро ближе к концу
    if (progress > 0.5) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 200, ${(progress - 0.5) * 1.2})`;
      ctx.lineWidth = lineWidth * 0.4;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Индикация фиксации (последние 300 мс)
    if (isLocked) {
      const lockPulse = 0.5 + Math.sin(Date.now() * 0.05) * 0.5;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + lockPulse * 0.4})`;
      ctx.lineWidth = lineWidth + 3;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Отрисовка лучей (атака босса Демон) + обработка урона.
 * 
 * Хитбокс синхронизирован с визуальной шириной луча:
 * игрок получает урон только если реально попал под расширяющуюся полосу.
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBeams(ctx) {
  if (!state.beams || state.beams.length === 0) return;

  const now = Date.now();

  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];

    // Обновление жизни луча
    beam.life--;
    if (beam.life <= 0) {
      state.beams.splice(i, 1);
      continue;
    }

    const lifeProgress = beam.life / (beam.maxLife || 20);
    const opacity = Math.min(1, lifeProgress * 2);

    let endX = beam.endX;
    let endY = beam.endY;
    if (!endX || !endY) {
      endX = beam.x + Math.cos(beam.angle) * beam.length;
      endY = beam.y + Math.sin(beam.angle) * beam.length;
    }

    // Расчёт текущей толщины луча
    let currentWidth = beam.startWidth || 12;
    if (beam.startWidth !== undefined && beam.endWidth !== undefined) {
      const elapsed = now - (beam.startTime || now);
      const expandDuration = beam.expandDuration || 250;
      const t = Math.min(1, elapsed / expandDuration);
      const eased = t * t * (3 - 2 * t);
      currentWidth = beam.startWidth + (beam.endWidth - beam.startWidth) * eased;
    }

    // ПРОВЕРКА ПОПАДАНИЯ ИГРОКА ПОД ЛУЧ
    if (!beam.hasHitPlayer && beam.damage) {
      const hitRadius = currentWidth / 2 + 24; // 24 — радиус игрока

      const dx = endX - beam.x;
      const dy = endY - beam.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq > 0.001) {
        // Проекция игрока на отрезок
        const t = ((player.px - beam.x) * dx + (player.py - beam.y) * dy) / lenSq;

        if (t >= 0 && t <= 1) {
          // Перпендикулярное расстояние от игрока до осевой линии луча
          const projX = beam.x + dx * t;
          const projY = beam.y + dy * t;
          const perpDist = Math.hypot(player.px - projX, player.py - projY);

          if (perpDist < hitRadius) {
            const hasWall = hasWallBetweenBeam(beam.x, beam.y, player.px, player.py);

            if (!hasWall) {
              beam.hasHitPlayer = true;
              player.hp -= beam.damage;

              state.damageTexts.push({
                x: player.px, y: player.py - 30,
                text: `⚡ МОЩНЫЙ ЛУЧ! -${beam.damage}`,
                color: COLORS.ui.textRed,
                size: 24,
                life: 50,
                speedy: 1.2
              });
              state.screenShake = 15;

              if (player.hp <= 0) triggerGameOver();
            }
          }
        }
      }
    }

    // ОТРИСОВКА
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.bosses.demon.beam;

    const gradient = ctx.createLinearGradient(beam.x, beam.y, endX, endY);
    gradient.addColorStop(0, COLORS.bosses.demon.beam);
    gradient.addColorStop(0.3, COLORS.effects.fire);
    gradient.addColorStop(0.6, COLORS.effects.fireGlow);
    gradient.addColorStop(1, COLORS.effects.gold.light);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = currentWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Внутренняя яркая линия (пропорционально основной ширине)
    ctx.strokeStyle = COLORS.player.shadow;
    ctx.lineWidth = Math.max(2, currentWidth * 0.33);
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Проверка наличия стены между двумя точками (для луча босса)
 * 
 * @param {number} x1 - Координата X начальной точки
 * @param {number} y1 - Координата Y начальной точки
 * @param {number} x2 - Координата X конечной точки
 * @param {number} y2 - Координата Y конечной точки
 * @returns {boolean} - true, если между точками есть стена
 * @private
 */
function hasWallBetweenBeam(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
    const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
    if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
      if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isWall) return true;
    }
  }
  return false;
}

/**
 * Отрисовка псионической волны (атака босса Разум)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawPsionicWave(ctx) {
  if (!state.psionicWave) return;

  const wave = state.psionicWave;

  // НАНЕСЕНИЕ УРОНА ПО МЕРЕ РАСШИРЕНИЯ

  // Монстры: бьются, если кольцо волны достигло их
  if (wave.hitMonsters && wave.damage) {
    const tolerance = 30;
    for (const m of state.monsters) {
      if (m === wave.owner) continue;
      if (wave.hitMonsters.has(m)) continue;

      const dist = Math.hypot(m.x - wave.x, m.y - wave.y);
      if (dist <= wave.radius + tolerance) {
        wave.hitMonsters.add(m);
        m.hp -= wave.damage;

        const angle = Math.atan2(m.y - wave.y, m.x - wave.x);
        m.x += Math.cos(angle) * 40;
        m.y += Math.sin(angle) * 40;

        state.damageTexts.push({
          x: m.x, y: m.y - 20,
          text: `🌊 -${wave.damage}`,
          color: COLORS.effects.magic,
          size: 16,
          life: 30,
          speedy: 1.0
        });
      }
    }
  }

  // Игрок: бьётся один раз, когда кольцо достигло его
  if (!wave.hasHitPlayer && wave.damage) {
    const tolerance = 30;
    const distToPlayer = Math.hypot(player.px - wave.x, player.py - wave.y);
    if (distToPlayer <= wave.radius + tolerance) {
      wave.hasHitPlayer = true;
      const finalDamage = Math.floor(wave.damage);
      player.hp -= finalDamage;

      state.damageTexts.push({
        x: player.px, y: player.py - 30,
        text: `🌊 ПСИ-ВОЛНА! -${finalDamage}`,
        color: COLORS.effects.magic,
        size: 22,
        life: 40,
        speedy: 1.2
      });

      // Отбрасывание игрока (с проверкой стен)
      const angle = Math.atan2(player.py - wave.y, player.px - wave.x);
      let newX = player.px + Math.cos(angle) * 50;
      let newY = player.py + Math.sin(angle) * 50;

      if (!checkWallCollision(newX, player.py, 24)) player.px = newX;
      if (!checkWallCollision(player.px, newY, 24)) player.py = newY;
      if (player.hp <= 0) triggerGameOver();
    }
  }

  // ВИЗУАЛЬНАЯ ЧАСТЬ

  wave.radius += 12;
  wave.life--;
  wave.opacity *= 0.94;

  ctx.save();
  ctx.globalAlpha = wave.opacity;

  // Внешнее кольцо
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.bosses.mind.wave;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Внутреннее кольцо
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.effects.artifact.light;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Точки по окружности
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const x = wave.x + Math.cos(angle) * wave.radius;
    const y = wave.y + Math.sin(angle) * wave.radius;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bosses.mind.wave;
    ctx.fill();
  }

  ctx.restore();

  // Автоматическое удаление по окончании
  if (wave.life <= 0 || wave.radius >= wave.maxRadius) state.psionicWave = null;
}