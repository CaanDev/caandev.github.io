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

/** @type {number} - Минимальный радиус псионической ловушки босса Разум */
const MIND_TRAP_RADIUS_MIN = 25;
/** @type {number} - Максимальный радиус псионической ловушки босса Разум */
const MIND_TRAP_RADIUS_MAX = 45;

/** @type {number} - Время подготовки луча (мс) */
const BEAM_PREPARE_TIME = 2000;
/** @type {number} - Время до выпуска, за которое луч фиксирует направление (мс) */
const BEAM_LOCK_TIME = 1000;

/** @type {number} - Начальная толщина луча при выстреле (px) */
const BEAM_START_WIDTH = 12;
/** @type {number} - Конечная толщина луча при выстреле (px) */
const BEAM_END_WIDTH = 240;
/** @type {number} - Длительность визуального расширения луча (мс) */
const BEAM_EXPAND_DURATION = 350;

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
    boss.beamAngle = null;

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
   * Обновление угла луча во время подготовки.
   * 
   * До момента BEAM_LOCK_TIME угол следует за игроком.
   * После — фиксируется, чтобы игрок мог увернуться.
   * 
   * @param {Object} boss - Объект босса
   * @returns {void}
   */
  updateBeamAngle(boss) {
    if (!boss.isPreparingBeam) return;
    if (boss.beamInterrupted) return;

    const elapsed = Date.now() - boss.beamPrepareStart;
    if (elapsed < BEAM_LOCK_TIME) boss.beamAngle = Math.atan2(player.py - boss.y, player.px - boss.x);
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
    boss.beamAngle = null;

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
      boss.beamAngle = null;
      return false;
    }

    const elapsed = Date.now() - boss.beamPrepareStart;
    if (elapsed >= BEAM_PREPARE_TIME) {
      if (boss.hp > 0) this.executeBeamAttack(boss);
      boss.isPreparingBeam = false;
      boss.isTremoring = false;
      boss.beamAngle = null;
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
   * Создание луча (без нанесения урона - урон обрабатывается в drawBeams)
   * 
   * Урон наносится динамически в projectileRenderer.js, когда расширяющаяся
   * полоса луча догоняет игрока. Это синхронизирует визуал и хитбокс.
   * 
   * @param {Object} boss - Объект босса
   * @returns {void}
   * @private
   */
  beamAttack(boss) {
    const angle = boss.beamAngle !== null 
      ? boss.beamAngle 
      : Math.atan2(player.py - boss.y, player.px - boss.x);
    const maxDistance = Math.max(CONFIG.cols, CONFIG.rows) * CONFIG.cellSize;

    const endX = boss.x + Math.cos(angle) * maxDistance;
    const endY = boss.y + Math.sin(angle) * maxDistance;

    if (!state.beams) state.beams = [];
    state.beams.push({
      x: boss.x,
      y: boss.y,
      endX: endX,
      endY: endY,
      angle: angle,
      length: maxDistance,
      life: 20,
      maxLife: 20,
      damage: Math.floor(boss.damage * 2),
      owner: boss,
      startWidth: BEAM_START_WIDTH,
      endWidth: BEAM_END_WIDTH,
      expandDuration: BEAM_EXPAND_DURATION,
      startTime: Date.now(),
      hasHitPlayer: false,
    });
  }
}

/**
 * Способность "Пси-волна" (босс Разум, фаза 3)
 * 
 * Выпускает волну пси-энергии, которая расширяется от босса.
 * Урон наносится по мере достижения цели волной - можно увернуться.
 * 
 * @class PsionicWaveAbility
 * @extends BossAbility
 */
export class PsionicWaveAbility extends BossAbility {
  constructor() {
    super({
      id: 'psionic_wave',
      name: 'Пси-волна',
      description: 'Выпускает расширяющуюся волну пси-энергии',
      icon: '🌊',
      cooldown: 180,
      phaseRequired: 'third'
    });
  }

  /**
   * Выполнение способности
   * 
   * Создаёт волну. Урон не наносится мгновенно, он применяется по мере расширения волны в drawPsionicWave().
   * 
   * @param {Object} boss - Объект босса
   * @returns {boolean} - true, если способность была выполнена
   */
  execute(boss) {
    const waveRadius = 400;
    const damage = boss.damage * 1.2;

    // Визуальные эффекты
    state.screenShake = 12;

    // Волна расширяется, урон наносится по мере достижения
    state.psionicWave = {
      x: boss.x,
      y: boss.y,
      radius: 10,
      maxRadius: waveRadius,
      life: 35,
      opacity: 0.8,
      damage: damage,
      owner: boss,
      hitMonsters: new Set(),
      hasHitPlayer: false,
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
    // Размер ловушки рандомизируется
    const trapRadius = MIND_TRAP_RADIUS_MIN + Math.random() * (MIND_TRAP_RADIUS_MAX - MIND_TRAP_RADIUS_MIN);

    state.traps.push({
      x: oldX,
      y: oldY,
      damage: Math.floor(boss.damage * 0.6),
      type: 'psionic',
      triggered: false,
      resetTimer: 60,
      radius: trapRadius
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