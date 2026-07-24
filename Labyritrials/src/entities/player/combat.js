/**
 * @fileoverview Боевая система игрока.
 * Обрабатывает атаки, урон по монстрам, разрушение стен и эффекты оружия.
 * 
 * @module entities/player/combat
 */

import { CONFIG, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { hasLineOfSight } from '../../world/physics.js';
import { getEventDamageMultiplier } from '../../systems/events/index.js';
import { addMonsterKilled } from '../../game/levelTransition.js';
import { spawnLightningSparks, spawnBloodDrops } from '../../systems/rendering/player/particleSpawner.js';
import { updateAttackCounter, hasStunImmunity, getHealingMultiplier } from '../monsters/adaptations/index.js';
import { createBloodPuddle } from '../objects/utils/bloodSystem.js';
import { handleMonsterDeath } from '../monsters/death.js';
import { updateProgress } from '../../systems/achievements/index.js';
import { triggerGameOver } from './gameOver.js';

/** @type {number} - Время последней атаки для кулдауна */
let lastAttackTime = 0;
/** @type {number} - Кулдаун атаки в миллисекундах */
const ATTACK_COOLDOWN = 500;

/**
 * Выполнение атаки игрока
 * 
 * @param {boolean} isStrong - Является ли атака усиленной (заряженной)
 * @returns {void}
 */
export function executeAttack(isStrong) {
  // Блокируем атаку, если босс появляется
  if (state.isBossLevel && state.bossSpawnTriggered && !state.bossReady) {
    state.damageTexts.push({
      x: player.px, y: player.py - 30,
      text: '⏳ Подождите появления босса...',
      color: COLORS.ui.textGold,
      size: 16,
      life: 30,
      speedy: 0.5
    });
    return;
  }

  const now = Date.now();
  if (now - lastAttackTime < ATTACK_COOLDOWN) {
    return;
  }
  lastAttackTime = now;

  player.attackExecuted = true;
  let dirX = player.dirX;
  let dirY = player.dirY;
  
  if (dirX === 0 && dirY === 0) {
    dirX = player.lastMoveDirX || 0;
    dirY = player.lastMoveDirY || 1;
  }
  
  if (dirX === 0 && dirY === 0) {
    dirY = 1;
  }
  
  const attackDirX = dirX;
  const attackDirY = dirY;
  
  const attackDistance = CONFIG.cellSize * 0.6;
  const targetWorldX = player.px + attackDirX * attackDistance;
  const targetWorldY = player.py + attackDirY * attackDistance;
  
  const targetX = Math.floor(targetWorldX / CONFIG.cellSize);
  const targetY = Math.floor(targetWorldY / CONFIG.cellSize);
  
  breakWall(targetX, targetY, isStrong);
  
  const damage = isStrong ? player.baseDamage * 3 : player.baseDamage;
  const attackWorldX = player.px + attackDirX * 78;
  const attackWorldY = player.py + attackDirY * 78;
  
  dealDamageToMonsters(attackWorldX, attackWorldY, damage, isStrong, attackDirX, attackDirY);
}

/**
 * Разрушение стены (только усиленным ударом)
 * 
 * @param {number} targetX - Координата X цели по сетке
 * @param {number} targetY - Координата Y цели по сетке
 * @param {boolean} isStrong - Является ли атака усиленной
 * @returns {void}
 * @private
 */
function breakWall(targetX, targetY, isStrong) {
  if (!isStrong) return;
  if (targetY < 0 || targetY >= CONFIG.rows || targetX < 0 || targetX >= CONFIG.cols) return;
  
  const cell = state.grid[targetY]?.[targetX];
  
  if (!cell) return;
  
  if (cell.isWall && cell.isBreakable) {
    cell.isWall = false;
    cell.isBreakable = false;
    cell.revealed = true;
    state.screenShake = 15;

    audio.playSound('wallDestroy', 0.6);
    
    if (cell.hasTreasurePortal && state.treasurePortal && !state.treasurePortal.active) activateTreasurePortal(targetX, targetY);
    if (cell.hasShrinePortal && state.shrinePortal && !state.shrinePortal.active) activateShrinePortal(targetX, targetY);
    if (cell.hasTrapPortal && state.trapPortal && !state.trapPortal.active) activateTrapPortal(targetX, targetY);
    
    import('../objects/sparks.js').then(module => {
      module.createSparks(targetX * CONFIG.cellSize, targetY * CONFIG.cellSize);
    });
  }
}

/**
 * Активация портала в сокровищницу
 * 
 * @param {number} wallX - Координата X стены по сетке
 * @param {number} wallY - Координата Y стены по сетке
 * @returns {void}
 * @private
 */
function activateTreasurePortal(wallX, wallY) {
  if (!state.treasurePortal) return;

  state.treasurePortal.x = wallX;
  state.treasurePortal.y = wallY;
  state.treasurePortal.active = true;
  state.treasurePortal.hidden = false;
  
  if (state.grid[wallY] && state.grid[wallY][wallX]) {
    state.grid[wallY][wallX].isPortal = true;
    state.grid[wallY][wallX].revealed = true;
  }
  
  state.damageTexts.push({
    x: player.px,
    y: player.py - 50,
    text: `💰 ВЫ НАШЛИ ПОРТАЛ В СОКРОВИЩНИЦУ! 💰`,
    color: COLORS.portals.treasure,
    size: 24,
    life: 80,
    speedy: 0.8
  });
  
  state.screenShake = 10;
}

/**
 * Активация портала в комнату с алтарём
 * 
 * @param {number} wallX - Координата X стены по сетке
 * @param {number} wallY - Координата Y стены по сетке
 * @returns {void}
 * @private
 */
function activateShrinePortal(wallX, wallY) {
  if (!state.shrinePortal) return;
  
  state.shrinePortal.x = wallX;
  state.shrinePortal.y = wallY;
  state.shrinePortal.active = true;
  state.shrinePortal.hidden = false;
  
  if (state.grid[wallY] && state.grid[wallY][wallX]) {
    state.grid[wallY][wallX].isShrinePortal = true;
    state.grid[wallY][wallX].revealed = true;
  }
  
  state.damageTexts.push({
    x: player.px,
    y: player.py - 50,
    text: `🔮 ВЫ НАШЛИ ПОРТАЛ В КОМНАТУ С АЛТАРЁМ! 🔮`,
    color: COLORS.effects.magic,
    size: 24,
    life: 80,
    speedy: 0.8
  });
  
  state.screenShake = 10;
}

/**
 * Активация портала в комнату-ловушку
 * 
 * @param {number} wallX - Координата X стены по сетке
 * @param {number} wallY - Координата Y стены по сетке
 * @returns {void}
 * @private
 */
function activateTrapPortal(wallX, wallY) {
  if (!state.trapPortal) return;

  state.trapPortal.x = wallX;
  state.trapPortal.y = wallY;
  state.trapPortal.active = true;
  state.trapPortal.hidden = false;

  if (state.grid[wallY] && state.grid[wallY][wallX]) {
    state.grid[wallY][wallX].isPortal = true;
    state.grid[wallY][wallX].revealed = true;
  }

  import('../objects/firefly.js').then(module => {
    module.updateFirefliesColor(wallX, wallY, 'trap_activated');
  });

  state.damageTexts.push({
    x: player.px,
    y: player.py - 50,
    text: `💰 ВЫ НАШЛИ ПОРТАЛ В СОКРОВИЩНИЦУ! 💰`,
    color: '#ff6600',
    size: 24,
    life: 80,
    speedy: 0.8
  });

  state.screenShake = 10;
}

/**
 * Нанесение урона монстрам в области атаки
 * 
 * @param {number} attackX - Координата X атаки в пикселях
 * @param {number} attackY - Координата Y атаки в пикселях
 * @param {number} damage - Базовый урон
 * @param {boolean} isStrong - Является ли атака усиленной
 * @param {number} dirX - Направление атаки X
 * @param {number} dirY - Направление атаки Y
 * @returns {void}
 * @private
 */
function dealDamageToMonsters(attackX, attackY, damage, isStrong, dirX, dirY) {
  /**
   * Проверка наличия колонны между двумя точками
   * 
   * @param {number} x1 - X начальной точки
   * @param {number} y1 - Y начальной точки
   * @param {number} x2 - X конечной точки
   * @param {number} y2 - Y конечной точки
   * @returns {boolean} - true, если между точками есть колонна
   */
  const hasPillarBetween = (x1, y1, x2, y2) => {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
      const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
      if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
        if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isPillar) {
          return true;
        }
      }
    }
    return false;
  };

  // Обновляем счётчик попаданий для оружия
  if (player.meleeWeapon === 'default') {
    state.gameStats.weaponHits.default++;
  } else if (player.meleeWeapon === 'stun') {
    state.gameStats.weaponHits.stun++;
  } else if (player.meleeWeapon === 'vampire') {
    state.gameStats.weaponHits.vampire++;
  }

  // ===== УРОН ПО МОНСТРАМ =====
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    
    if (Math.hypot(m.x - attackX, m.y - attackY) < CONFIG.cellSize * 0.85) {
      if (hasLineOfSight(player.px, player.py, m.x, m.y) && !hasPillarBetween(player.px, player.py, m.x, m.y)) {
        const finalDamage = getEventDamageMultiplier(damage);
        m.hp -= finalDamage;
        m.state = 'chase';

        // Прерывание подготовки луча у босса
        if (m.isPreparingBeam && m.abilities && m.abilities.tremor) {
          m.abilities.tremor.interruptBeam(m);
        }

        // Эффекты вампиризма
        if (player.meleeWeapon === 'vampire') {
          spawnBloodDrops(m.x, m.y, isStrong);
        }
            
        applyWeaponEffects(m, damage, isStrong);
        
        // Отображение урона
        state.damageTexts.push({ 
          x: m.x, y: m.y - 15, 
          text: `-${finalDamage}`, 
          color: isStrong ? COLORS.ui.textGold : COLORS.ui.textRed,
          size: isStrong ? 28 : 20, 
          life: 40, 
          speedy: 1.5 
        });

        // Эффекты громового посоха
        if (player.meleeWeapon === 'stun') {
          spawnLightningSparks(m.x, m.y, isStrong);
        }
        
        // Смерть монстра
        if (m.hp <= 0) { 
          handleMonsterDeath(m, i, state.monsters); 
        }
      } else {
        // Блок (колонна или стена)
        state.damageTexts.push({
          x: attackX, y: attackY - 20,
          text: '🏛️ БЛОК!',
          color: COLORS.ui.textDark,
          size: 14,
          life: 25,
          speedy: 0.8
        });
      }
    }
  }

  // ===== ОТРАЖЕНИЕ СНАРЯДОВ БОССА =====
  for (let i = state.fireballs.length - 1; i >= 0; i--) {
    const fb = state.fireballs[i];
    
    if (fb.isFromBoss && !fb.isFromPlayer) {
      const distToAttack = Math.hypot(fb.x - attackX, fb.y - attackY);
      if (distToAttack < 40) {
        state.fireballs.splice(i, 1);
        
        state.damageTexts.push({
          x: fb.x, y: fb.y - 20,
          text: `💥 ОТРАЖЁН!`,
          color: COLORS.ui.textGold,
          size: 16,
          life: 30,
          speedy: 0.8
        });
        state.screenShake = 5;
        break;
      }
    }
  }
}

/**
 * Применение эффектов оружия к монстру
 * 
 * @param {Object} m - Объект монстра
 * @param {number} damage - Нанесённый урон
 * @param {boolean} isStrong - Является ли атака усиленной
 * @returns {void}
 * @private
 */
function applyWeaponEffects(m, damage, isStrong) {
  // ===== ГРОМОВОЙ ПОСОХ (оглушение) =====
  if (player.meleeWeapon === 'stun') {
    if (!hasStunImmunity() && !m.isBoss && !m.isDuoBoss) {
      const stunDuration = isStrong ? 180 : 120;
      m.stunTimer = stunDuration;

      m.trapGlowColor = COLORS.monsters.trapGlow.stun || '#3498db';
      m.trapGlowTimer = stunDuration;

      const points = isStrong ? 3 : 1;
      updateAttackCounter('stun', points);
      updateAttackCounter('magic', points);
      
      updateProgress('stun_kills', 1);

      state.damageTexts.push({
        x: m.x, y: m.y - 25,
        text: `⚡ ОГЛУШЁН!`,
        color: COLORS.effects.lightning,
        size: 16,
        life: 30,
        speedy: 0.8
      });
      
    } else if (m.isBoss || m.isDuoBoss) {
      state.damageTexts.push({
        x: m.x, y: m.y - 25,
        text: `🛡️ НЕВОСПРИИМЧИВ!`,
        color: COLORS.ui.textDark,
        size: 14,
        life: 30,
        speedy: 0.8
      });
    } else if (hasStunImmunity()) {
      state.damageTexts.push({
        x: m.x, y: m.y - 25,
        text: `🔥 ИММУНИТЕТ К ОГЛУШЕНИЮ!`,
        color: COLORS.effects.fire,
        size: 14,
        life: 30,
        speedy: 0.8
      });
    }
  }
  
  // ===== ПОСОХ ВАМПИРА (лечение) =====
  if (player.meleeWeapon === 'vampire') {
    let healPercent;
    
    if (isStrong) {
      healPercent = player.vampireStrongPercent + (player.artifactsCollected * player.vampireArtifactBonus);
    } else {
      healPercent = player.vampireBasePercent + (player.artifactsCollected * player.vampireArtifactBonus);
    }
    
    healPercent = healPercent * player.vampireHealMultiplier;
    
    let healAmount = Math.floor((player.maxHp * healPercent) / 100);
    if (healAmount < 1 && healPercent > 0) healAmount = 1;
    
    // Защита от NaN
    if (isNaN(healAmount) || healAmount < 0) healAmount = 0;
    if (isNaN(player.hp)) player.hp = player.maxHp || 100;
    
    const oldHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    const actualHeal = player.hp - oldHp;
    
    // Обновляем прогресс достижения "Повелитель вампиров"
    if (actualHeal > 0) {
      updateProgress('vampire_heal', actualHeal);
      
      // Визуальный эффект лечения
      state.damageTexts.push({
        x: player.px,
        y: player.py - 40,
        text: `+${actualHeal} ❤️`,
        color: COLORS.effects.poison,
        size: 18,
        life: 30,
        speedy: 1.0
      });
    }
    
    // Обновляем счётчик адаптаций (для системы адаптации монстров)
    const points = isStrong ? 3 : 1;
    updateAttackCounter('vampirism', points);
    if (isStrong) updateAttackCounter('magic', points);
  }
}

/**
 * Обработка получения урона игроком от монстров
 * Используется для сброса флага "Железный человек"
 * 
 * @param {number} damage - Полученный урон
 * @returns {void}
 */
export function playerTakeDamageFromMonster(damage) {
  if (player.hp <= 0) return;
  
  // Сбрасываем флаг "железный человек"
  state.ironManActive = false;
  
  let actualDamage = damage;
  if (player.incomingDamageMultiplier) {
    actualDamage = Math.floor(actualDamage * player.incomingDamageMultiplier);
  }
  player.hp -= actualDamage;
  
  state.screenShake = 10;
  state.damageTexts.push({
    x: player.px, y: player.py - 20,
    text: `-${actualDamage} ❤️`,
    color: COLORS.ui.textRed,
    size: 22,
    life: 40,
    speedy: 1.2
  });
  
  if (player.hp <= 0) {
    triggerGameOver();
  }
}