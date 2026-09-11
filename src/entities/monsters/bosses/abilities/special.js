/**
 * @fileoverview Особые способности боссов.
 * Управляет уникальными способностями: тряска с лучом, пси-волна, телепортация с ловушкой.
 * 
 * @module entities/monsters/bosses/abilities/special
 */

import { BossAbility } from './base.js';
import { createTeleportFlash } from './helpers.js';
import { CONFIG, state, player } from '../../../../core/config/index.js';
import { COLORS } from '../../../../core/config/colors.js';
import { triggerGameOver } from '../../../player/gameOver.js';

/**
 * Способность "Тряска" (босс Демон, фаза 3)
 * 
 * Босс начинает трястись, готовясь к мощному лучу.
 * Если игрок успевает ударить босса во время подготовки — атака прерывается.
 * 
 * @class TremorAbility
 * @extends BossAbility
 */
export class TremorAbility extends BossAbility {
  constructor() {
    super({
      id: 'tremor',
      name: 'Тряска',
      description: 'Демон трясётся, готовясь к мощной атаке',
      icon: '🌋',
      cooldown: 15000,
      phaseRequired: 'third'
    });
  }

  /**
   * Начало подготовки луча
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    if (!this.canUse(boss, boss.currentPhase)) return false;
    if (boss.isPreparingBeam) return false;

    boss.isTremoring = true;
    boss.tremorDuration = 90;
    boss.isPreparingBeam = true;
    boss.beamPrepareStart = Date.now();
    boss.beamInterrupted = false;

    state.screenShake = 8;

    state.damageTexts.push({
      x: boss.x, y: boss.y - 60,
      text: `🌋 ДЕМОН ТРЯСЁТСЯ! 🌋`,
      color: COLORS.effects.fire,
      size: 24,
      life: 60,
      speedy: 0.5
    });

    boss.lastTremor = Date.now();
    return true;
  }

  /**
   * Прерывание подготовки луча (при ударе игрока)
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если атака была прервана
   */
  interruptBeam(boss) {
    if (!boss.isPreparingBeam) return false;
    if (boss.beamInterrupted) return false;

    boss.beamInterrupted = true;
    boss.isPreparingBeam = false;
    boss.isTremoring = false;

    state.damageTexts.push({
      x: boss.x, y: boss.y - 60,
      text: `💢 АТАКА ПРЕРВАНА! 💢`,
      color: COLORS.ui.textGold,
      size: 24,
      life: 60,
      speedy: 0.8
    });
    state.screenShake = 10;

    return true;
  }

  /**
   * Попытка выполнить луч после завершения подготовки
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если луч был выполнен
   */
  tryExecuteBeam(boss) {
    if (!boss.isPreparingBeam) return false;

    if (boss.beamInterrupted) {
      boss.isPreparingBeam = false;
      return false;
    }

    const elapsed = Date.now() - boss.beamPrepareStart;
    if (elapsed >= 1500) {
      if (boss.hp > 0) {
        this.executeBeamAttack(boss);
      }
      boss.isPreparingBeam = false;
      boss.isTremoring = false;
      return true;
    }
    return false;
  }

  /**
   * Выполнение атаки лучом
   * 
   * @param {Object} boss - Объект босса
   * @returns {void}
   * @private
   */
  executeBeamAttack(boss) {
    boss.isTremoring = false;
    this.beamAttack(boss);

    state.damageTexts.push({
      x: boss.x, y: boss.y - 80,
      text: `⚡ МОЩНЫЙ ЛУЧ! ⚡`,
      color: COLORS.ui.textRed,
      size: 28,
      life: 60,
      speedy: 0.5
    });
    state.screenShake = 20;
  }

  /**
   * Создание луча и проверка попадания в игрока
   * 
   * @param {Object} boss - Объект босса
   * @returns {void}
   * @private
   */
  beamAttack(boss) {
    const dx = player.px - boss.x;
    const dy = player.py - boss.y;
    const angle = Math.atan2(dy, dx);
    const maxDistance = Math.max(CONFIG.cols, CONFIG.rows) * CONFIG.cellSize;

    const endX = boss.x + Math.cos(angle) * maxDistance;
    const endY = boss.y + Math.sin(angle) * maxDistance;

    // Создаём визуальный луч
    if (!state.beams) state.beams = [];
    state.beams.push({
      x: boss.x,
      y: boss.y,
      endX: endX,
      endY: endY,
      angle: angle,
      length: maxDistance,
      life: 20,
      damage: boss.damage * 2,
      owner: boss
    });

    this.checkBeamHitPlayer(boss, angle, maxDistance);
  }

  /**
   * Проверка попадания луча в игрока
   * 
   * @param {Object} boss - Объект босса
   * @param {number} angle - Угол луча
   * @param {number} maxDistance - Максимальная дальность луча
   * @returns {void}
   * @private
   */
  checkBeamHitPlayer(boss, angle, maxDistance) {
    const toPlayerAngle = Math.atan2(player.py - boss.y, player.px - boss.x);
    let angleDiff = Math.abs(angle - toPlayerAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff < 0.3) {
      const distToPlayer = Math.hypot(player.px - boss.x, player.py - boss.y);
      const hasWall = this.hasWallBetween(boss.x, boss.y, player.px, player.py);

      if (!hasWall && distToPlayer < maxDistance) {
        // Урон луча = 30% от максимального HP игрока
        const damage = Math.floor(player.maxHp * 0.3);
        player.hp -= damage;

        state.damageTexts.push({
          x: player.px, y: player.py - 30,
          text: `⚡ МОЩНЫЙ ЛУЧ! -${damage}`,
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

  /**
   * Проверка наличия стены между двумя точками
   * 
   * @param {number} x1 - Координата X начальной точки
   * @param {number} y1 - Координата Y начальной точки
   * @param {number} x2 - Координата X конечной точки
   * @param {number} y2 - Координата Y конечной точки
   * @returns {boolean} - true, если между точками есть стена
   * @private
   */
  hasWallBetween(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = Math.floor((x1 + (x2 - x1) * t) / CONFIG.cellSize);
      const cy = Math.floor((y1 + (y2 - y1) * t) / CONFIG.cellSize);
      if (cy >= 0 && cy < CONFIG.rows && cx >= 0 && cx < CONFIG.cols) {
        if (state.grid[cy] && state.grid[cy][cx] && state.grid[cy][cx].isWall) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Способность "Пси-волна" (босс Разум, фаза 3)
 * 
 * Выпускает волну пси-энергии, наносящую урон всем врагам и игроку в радиусе.
 * Отбрасывает цель при попадании.
 * 
 * @class PsionicWaveAbility
 * @extends BossAbility
 */
export class PsionicWaveAbility extends BossAbility {
  constructor() {
    super({
      id: 'psionic_wave',
      name: 'Пси-волна',
      description: 'Выпускает волну пси-энергии во все стороны',
      icon: '🌊',
      cooldown: 180,
      phaseRequired: 'third'
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const waveRadius = 150;
    const damage = boss.damage * 1.2;

    // Урон по монстрам (кроме самого босса)
    for (let m of state.monsters) {
      if (m === boss) continue;
      const dist = Math.hypot(boss.x - m.x, boss.y - m.y);
      if (dist < waveRadius) {
        m.hp -= damage;
        const angle = Math.atan2(m.y - boss.y, m.x - boss.x);
        m.x += Math.cos(angle) * 40;
        m.y += Math.sin(angle) * 40;

        state.damageTexts.push({
          x: m.x, y: m.y - 20,
          text: `🌊 -${damage}`,
          color: COLORS.effects.magic,
          size: 16,
          life: 30,
          speedy: 1.0
        });
      }
    }

    // Урон по игроку
    const distToPlayer = Math.hypot(boss.x - player.px, boss.y - player.py);
    if (distToPlayer < waveRadius) {
      const finalDamage = Math.floor(damage);
      player.hp -= finalDamage;

      state.damageTexts.push({
        x: player.px, y: player.py - 30,
        text: `🌊 ПСИ-ВОЛНА! -${finalDamage}`,
        color: COLORS.effects.magic,
        size: 22,
        life: 40,
        speedy: 1.2
      });

      // Отбрасывание игрока
      const angle = Math.atan2(player.py - boss.y, player.px - boss.x);
      player.px += Math.cos(angle) * 50;
      player.py += Math.sin(angle) * 50;

      if (player.hp <= 0) triggerGameOver();
    }

    // Визуальные эффекты
    state.screenShake = 12;
    state.psionicWave = {
      x: boss.x,
      y: boss.y,
      radius: 10,
      maxRadius: waveRadius,
      life: 20,
      opacity: 0.8
    };

    state.damageTexts.push({
      x: boss.x, y: boss.y - 50,
      text: `🌊 ПСИ-ВОЛНА!`,
      color: COLORS.effects.magic,
      size: 20,
      life: 40,
      speedy: 0.5
    });

    return true;
  }
}

/**
 * Способность "Телепортация с ловушкой" (босс Разум, фаза 3)
 * 
 * Телепортируется в позицию за спиной игрока, оставляя псионическую ловушку
 * на месте телепортации.
 * 
 * @class TeleportWithTrapAbility
 * @extends BossAbility
 */
export class TeleportWithTrapAbility extends BossAbility {
  constructor() {
    super({
      id: 'teleport_with_trap',
      name: 'Телепортация',
      description: 'Телепортируется к игроку, оставляя ловушку',
      icon: '🌀',
      cooldown: 240,
      phaseRequired: 'third'
    });
  }

  /**
   * Выполнение способности
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const oldX = boss.x;
    const oldY = boss.y;

    // Телепортация за спину игрока
    const angleToPlayer = Math.atan2(player.py - boss.y, player.px - boss.x);
    const teleportDistance = 350;
    const newX = player.px + Math.cos(angleToPlayer + Math.PI) * teleportDistance;
    const newY = player.py + Math.sin(angleToPlayer + Math.PI) * teleportDistance;

    // Ограничение границами карты
    boss.x = Math.max(50, Math.min(newX, CONFIG.cols * CONFIG.cellSize - 50));
    boss.y = Math.max(50, Math.min(newY, CONFIG.rows * CONFIG.cellSize - 50));

    // Создание ловушки на месте телепортации
    state.traps.push({
      x: oldX,
      y: oldY,
      damage: Math.floor(boss.damage * 0.6),
      type: 'psionic',
      triggered: false,
      resetTimer: 60,
      radius: 25
    });

    // Визуальные эффекты
    state.screenShake = 12;

    state.damageTexts.push({
      x: oldX, y: oldY - 40,
      text: `🌀 ЛОВУШКА ОСТАВЛЕНА!`,
      color: COLORS.ui.textRed,
      size: 16,
      life: 40,
      speedy: 0.5
    });

    state.damageTexts.push({
      x: boss.x, y: boss.y - 50,
      text: `🌀 ТЕЛЕПОРТАЦИЯ!`,
      color: COLORS.effects.magic,
      size: 20,
      life: 40,
      speedy: 0.8
    });

    createTeleportFlash(oldX, oldY);
    createTeleportFlash(boss.x, boss.y);

    return true;
  }
}