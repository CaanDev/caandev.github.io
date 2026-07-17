/**
 * @fileoverview Полоска здоровья босса.
 * Отрисовывает полоску HP для одиночных боссов и дуэта боссов (уровень 15)
 * с плавной анимацией изменения здоровья.
 * 
 * @module systems/rendering/ui/bossHealthBar
 */

import { state } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { roundedRect, roundedRectLeft, roundedRectRight } from './utils.js';

/** @type {number} - Скорость плавного изменения полоски здоровья */
const SMOOTH_SPEED = 0.12;
/** @type {number} - Минимальное изменение HP для анимации */
const MIN_HP_CHANGE = 0.5;

/**
 * Отрисовка полоски здоровья босса
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 */
export function drawBossHealthBar(ctx) {
  if (!state.isBossLevel || !state.bossSpawned) return;
  
  const bossLevel = Math.floor(state.gameLevel / 5) * 5;

  // Определение цветов в зависимости от типа босса
  let barColor = COLORS.ui.health.boss;
  let barBgColor = COLORS.ui.health.bossBg;
  let textColor = COLORS.ui.textGold;
  
  if (bossLevel === 10) {
    barColor = COLORS.ui.health.bossMind;
    barBgColor = COLORS.ui.health.bossMindBg;
    textColor = COLORS.effects.artifact.light;
  }

  // Для уровня 15 используется отдельная функция (дуэт боссов)
  if (bossLevel === 15) {
    drawDuoBossHealthBar(ctx);
    return;
  }
  
  const boss = state.monsters.find(m => m.isBoss === true);
  if (!boss) return;

  const bossId = boss.id || 'boss';
  if (!state.bossDisplayHp) state.bossDisplayHp = {};
  if (!state.bossDisplayMaxHp) state.bossDisplayMaxHp = {};
  
  // Инициализация отображаемого HP
  if (state.bossDisplayHp[bossId] === undefined || 
      state.bossDisplayMaxHp[bossId] !== boss.maxHp) {
    state.bossDisplayHp[bossId] = boss.hp;
    state.bossDisplayMaxHp[bossId] = boss.maxHp;
  }
  
  // Плавное обновление отображаемого HP
  const displayHp = state.bossDisplayHp[bossId] || boss.hp;
  const targetHp = boss.hp;
  const diff = targetHp - displayHp;
  
  if (Math.abs(diff) > MIN_HP_CHANGE) {
    state.bossDisplayHp[bossId] += diff * SMOOTH_SPEED;
  } else {
    state.bossDisplayHp[bossId] = targetHp;
  }
  
  const currentHp = Math.max(0, state.bossDisplayHp[bossId]);
  const maxHp = boss.maxHp;
  const hpPercent = currentHp / maxHp;
  
  ctx.save();
  
  const bw = window.innerWidth * 0.5;
  const bx = window.innerWidth * 0.25;
  const by = 85;
  const barHeight = 16;
  const radius = 8;
  const bgRadius = radius + 4;
  
  // Фон полоски
  ctx.fillStyle = COLORS.background.overlay;
  roundedRect(ctx, bx - 4, by - 4, bw + 8, barHeight + 32, bgRadius);
  ctx.fill();

  // Пульсация при низком HP
  let pulseAlpha = 1;
  if (hpPercent < 0.2 && hpPercent > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.002);
    pulseAlpha = 0.6 + 0.4 * pulse;
  } else if (hpPercent <= 0) {
    pulseAlpha = 0.3;
  }
  
  ctx.globalAlpha = pulseAlpha;
  
  // Фон полоски HP
  ctx.fillStyle = barBgColor;
  roundedRect(ctx, bx, by, bw, barHeight, radius);
  ctx.fill();
  
  // Заполнение полоски HP
  ctx.fillStyle = barColor;
  roundedRect(ctx, bx, by, bw * hpPercent, barHeight, radius);
  ctx.fill();

  ctx.globalAlpha = 1;
  
  // Имя босса
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`👑 ${boss.name}`, bx + bw / 2, by - 8);
  
  // Текст HP
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${Math.floor(currentHp)} / ${Math.floor(maxHp)}`, bx + bw / 2, by + barHeight + 18);
  
  ctx.restore();
}

/**
 * Отрисовка полоски здоровья для дуэта боссов (уровень 15)
 * 
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @returns {void}
 * @private
 */
function drawDuoBossHealthBar(ctx) {
  const chaser = state.monsters.find(m => m.duoRole === 'chaser');
  const shooter = state.monsters.find(m => m.duoRole === 'shooter');
  
  const chaserAlive = chaser && chaser.hp > 0;
  const shooterAlive = shooter && shooter.hp > 0;
  
  if (!chaserAlive && !shooterAlive) return;
  
  const chaserId = chaser?.id || 'duo_chaser';
  const shooterId = shooter?.id || 'duo_shooter';
  
  if (!state.bossDisplayHp) state.bossDisplayHp = {};
  if (!state.bossDisplayMaxHp) state.bossDisplayMaxHp = {};
  
  // Инициализация HP для преследователя
  if (chaser) {
    if (state.bossDisplayHp[chaserId] === undefined || 
        state.bossDisplayMaxHp[chaserId] !== chaser.maxHp) {
      state.bossDisplayHp[chaserId] = chaser.hp;
      state.bossDisplayMaxHp[chaserId] = chaser.maxHp;
    }
    const diffChaser = chaser.hp - (state.bossDisplayHp[chaserId] || chaser.hp);
    if (Math.abs(diffChaser) > MIN_HP_CHANGE) {
      state.bossDisplayHp[chaserId] += diffChaser * SMOOTH_SPEED;
    } else {
      state.bossDisplayHp[chaserId] = chaser.hp;
    }
  }
  
  // Инициализация HP для стрелка
  if (shooter) {
    if (state.bossDisplayHp[shooterId] === undefined || 
        state.bossDisplayMaxHp[shooterId] !== shooter.maxHp) {
      state.bossDisplayHp[shooterId] = shooter.hp;
      state.bossDisplayMaxHp[shooterId] = shooter.maxHp;
    }
    const diffShooter = shooter.hp - (state.bossDisplayHp[shooterId] || shooter.hp);
    if (Math.abs(diffShooter) > MIN_HP_CHANGE) {
      state.bossDisplayHp[shooterId] += diffShooter * SMOOTH_SPEED;
    } else {
      state.bossDisplayHp[shooterId] = shooter.hp;
    }
  }
  
  const chaserHp = chaserAlive ? Math.max(0, state.bossDisplayHp[chaserId] || 0) : 0;
  const shooterHp = shooterAlive ? Math.max(0, state.bossDisplayHp[shooterId] || 0) : 0;
  const chaserMax = chaser ? chaser.maxHp : 1;
  const shooterMax = shooter ? shooter.maxHp : 1;
  
  const barColor = COLORS.ui.health.boss;
  const barBgColor = COLORS.ui.health.bossBg;
  const textColor = COLORS.ui.textGold;
  
  const bw = window.innerWidth * 0.7;
  const bx = window.innerWidth * 0.15;
  const by = 85;
  const barHeight = 16;
  const radius = 8;
  const bgRadius = 16;
  const halfWidth = bw / 2;
  
  ctx.save();
  
  // Фон полоски
  ctx.fillStyle = COLORS.background.overlay;
  roundedRect(ctx, bx - 4, by - 4, bw + 8, barHeight + 45, bgRadius);
  ctx.fill();

  // Пульсация для левой полоски
  let chaserPulse = 1;
  if (chaserAlive) {
    const chaserPercent = chaserHp / chaserMax;
    if (chaserPercent < 0.2 && chaserPercent > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.002);
      chaserPulse = 0.6 + 0.4 * pulse;
    } else if (chaserPercent <= 0) {
      chaserPulse = 0.3;
    }
  }
  
  // Пульсация для правой полоски
  let shooterPulse = 1;
  if (shooterAlive) {
    const shooterPercent = shooterHp / shooterMax;
    if (shooterPercent < 0.2 && shooterPercent > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + 0.5);
      shooterPulse = 0.6 + 0.4 * pulse;
    } else if (shooterPercent <= 0) {
      shooterPulse = 0.3;
    }
  }
  
  ctx.fillStyle = COLORS.ui.health.bossBg;
  
  // Отрисовка двух полосок
  if (chaserAlive && shooterAlive) {
    // Левая полоска (преследователь)
    ctx.globalAlpha = chaserPulse;
    roundedRectLeft(ctx, bx, by, halfWidth, barHeight, radius);
    ctx.fill();
    
    // Правая полоска (стрелок)
    ctx.globalAlpha = shooterPulse;
    roundedRectRight(ctx, bx + halfWidth, by, halfWidth, barHeight, radius);
    ctx.fill();
    
    // Заполнение левой полоски
    const chaserPercent = chaserHp / chaserMax;
    if (chaserPercent > 0) {
      ctx.globalAlpha = chaserPulse;
      ctx.fillStyle = COLORS.ui.health.boss;
      const chaserStartX = bx + halfWidth * (1 - chaserPercent);
      const chaserWidth = halfWidth * chaserPercent;
      roundedRectLeft(ctx, chaserStartX, by, chaserWidth, barHeight, radius);
      ctx.fill();
    }
    
    // Заполнение правой полоски
    const shooterPercent = shooterHp / shooterMax;
    if (shooterPercent > 0) {
      ctx.globalAlpha = shooterPulse;
      ctx.fillStyle = COLORS.ui.health.boss;
      const rightStartX = bx + halfWidth;
      const rightWidth = halfWidth * shooterPercent;
      roundedRectRight(ctx, rightStartX, by, rightWidth, barHeight, radius);
      ctx.fill();
    }
    
    // Разделительная линия
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(bx + halfWidth, by);
    ctx.lineTo(bx + halfWidth, by + barHeight);
    ctx.strokeStyle = COLORS.ui.textGold;
    ctx.lineWidth = 2;
    ctx.stroke();
    
  } else if (chaserAlive && !shooterAlive) {
    // Только преследователь жив
    ctx.globalAlpha = chaserPulse;
    const healthPercent = chaserHp / chaserMax;
    ctx.fillStyle = COLORS.ui.health.bossBg;
    roundedRect(ctx, bx, by, bw, barHeight, radius);
    ctx.fill();
    
    ctx.fillStyle = COLORS.ui.health.boss;
    roundedRect(ctx, bx, by, bw * healthPercent, barHeight, radius);
    ctx.fill();
    
  } else if (!chaserAlive && shooterAlive) {
    // Только стрелок жив
    ctx.globalAlpha = shooterPulse;
    const healthPercent = shooterHp / shooterMax;
    ctx.fillStyle = COLORS.ui.health.bossBg;
    roundedRect(ctx, bx, by, bw, barHeight, radius);
    ctx.fill();
    
    ctx.fillStyle = COLORS.ui.health.boss;
    roundedRect(ctx, bx, by, bw * healthPercent, barHeight, radius);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  
  // Заголовок
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillStyle = COLORS.ui.textGold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('СТРАЖИ ЛАБИРИНТА', bx + bw / 2, by - 6);
  
  // Имена и значения HP
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  
  if (chaserAlive && shooterAlive) {
    ctx.fillStyle = COLORS.ui.textLight;
    ctx.fillText(`👑 ${chaser.name}`, bx + halfWidth / 2, by + barHeight + 14);
    ctx.fillText(`👑 ${shooter.name}`, bx + halfWidth + halfWidth / 2, by + barHeight + 14);
    
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.fillText(`${Math.floor(chaserHp)}/${Math.floor(chaserMax)}`, bx + halfWidth / 2, by + barHeight + 30);
    ctx.fillText(`${Math.floor(shooterHp)}/${Math.floor(shooterMax)}`, bx + halfWidth + halfWidth / 2, by + barHeight + 30);
    
  } else if (chaserAlive && !shooterAlive) {
    ctx.fillStyle = COLORS.ui.textLight;
    ctx.fillText(`👑 ${chaser.name}`, bx + bw / 2, by + barHeight + 14);
    
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.fillText(`${Math.floor(chaserHp)}/${Math.floor(chaserMax)}`, bx + bw / 2, by + barHeight + 30);
    
    if (shooter) {
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = COLORS.ui.textDark;
      ctx.fillText(`${shooter.name} (ПОВЕРЖЕН)`, bx + bw * 0.85, by + barHeight + 12);
    }
    
  } else if (!chaserAlive && shooterAlive) {
    ctx.fillStyle = COLORS.ui.textLight;
    ctx.fillText(`👑 ${shooter.name}`, bx + bw / 2, by + barHeight + 14);
    
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.fillText(`${Math.floor(shooterHp)}/${Math.floor(shooterMax)}`, bx + bw / 2, by + barHeight + 30);
    
    if (chaser) {
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = COLORS.ui.textDark;
      ctx.fillText(`${chaser.name} (ПОВЕРЖЕН)`, bx + bw * 0.15, by + barHeight + 12);
    }
  }
  
  ctx.restore();
}