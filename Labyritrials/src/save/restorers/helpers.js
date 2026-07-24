/**
 * @fileoverview Вспомогательные функции для рестореров сохранения.
 * 
 * @module save/restorers/helpers
 */

import { state, CONFIG } from '../../core/config/index.js';
import { logger } from '../../utils/logger.js';
import { Cell } from '../../world/cells/cell.js';
import {
  PhaseSummonAbility,
  SummonMinionsAbility,
  SpeedBoostAbility,
  ShootFireballAbility,
  MindBallAbility,
  PsionicWaveAbility,
  TeleportWithTrapAbility,
  RageAbility,
  EmpoweredSummonAbility,
  TremorAbility,
  CircleFireballAbility
} from '../../entities/monsters/bosses/abilities/index.js';
import { getBossByLevel, BOSS_TYPES } from '../../entities/monsters/bosses/config.js';

/**
 * Восстановление сетки лабиринта
 * 
 * @param {Array} gridData - Данные сетки
 * @returns {boolean} - true, если восстановление успешно
 */
export function restoreMazeGrid(gridData) {
  if (!gridData || !Array.isArray(gridData)) {
    logger.warn('⚠️ Нет данных о лабиринте в сохранении');
    return false;
  }

  state.grid = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    state.grid[y] = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      if (gridData[y] && gridData[y][x]) {
        const cell = new Cell(x, y);
        cell.isWall = gridData[y][x].isWall;
        cell.isBreakable = gridData[y][x].isBreakable;
        cell.revealed = gridData[y][x].revealed;
        cell.hasSecretPortal = gridData[y][x].hasSecretPortal || false;
        cell.hasTreasurePortal = gridData[y][x].hasTreasurePortal || false;
        cell.hasShrinePortal = gridData[y][x].hasShrinePortal || false;
        cell.isPortal = gridData[y][x].isPortal || false;
        cell.isShrinePortal = gridData[y][x].isShrinePortal || false;
        cell.isPillar = gridData[y][x].isPillar || false;
        state.grid[y][x] = cell;
      } else {
        const cell = new Cell(x, y);
        cell.isWall = true;
        state.grid[y][x] = cell;
      }
    }
  }

  return true;
}

/**
 * Восстановление оригинальной сетки (для сокровищницы)
 * 
 * @param {Array} gridData - Данные сетки
 * @param {number} cols - Количество колонок
 * @param {number} rows - Количество строк
 * @returns {boolean} - true, если восстановление успешно
 */
export function restoreOriginalMazeGrid(gridData, cols, rows) {
  if (!gridData) return false;

  state.originalGrid = [];
  for (let y = 0; y < rows; y++) {
    state.originalGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      if (gridData[y] && gridData[y][x]) {
        const cell = new Cell(x, y);
        cell.isWall = gridData[y][x].isWall;
        cell.isBreakable = gridData[y][x].isBreakable;
        cell.revealed = gridData[y][x].revealed;
        state.originalGrid[y][x] = cell;
      } else {
        const cell = new Cell(x, y);
        cell.isWall = true;
        state.originalGrid[y][x] = cell;
      }
    }
  }
  return true;
}

/**
 * Восстановление открытых клеток
 * 
 * @param {Array} revealedCells - Массив открытых клеток
 * @returns {void}
 */
export function restoreRevealedCells(revealedCells) {
  if (!revealedCells || !Array.isArray(revealedCells)) return;

  for (let cell of revealedCells) {
    if (state.grid[cell.y] && state.grid[cell.y][cell.x]) {
      state.grid[cell.y][cell.x].revealed = true;
    }
  }
}

/**
 * Восстановление способностей босса
 * 
 * @param {Object} monster - Объект монстра
 * @returns {Object} - Восстановленный монстр
 */
export function restoreBossAbilities(monster) {
  if (!monster.isBoss && !monster.isDuoBoss) return monster;

  const bossLevel = Math.floor(state.gameLevel / 5) * 5;
  const bossConfig = getBossByLevel(bossLevel);

  if (!bossConfig) return monster;

  const bossType = monster.bossType || 'demon';

  switch (bossType) {
    case BOSS_TYPES.DEMON:
      monster.abilities = {
        phaseSummon: new PhaseSummonAbility(),
        periodicSummon: new SummonMinionsAbility(),
        speedBoost: new SpeedBoostAbility(),
        rage: new RageAbility(),
        empoweredSummon: new EmpoweredSummonAbility(),
        tremor: new TremorAbility()
      };
      break;

    case BOSS_TYPES.MIND:
      monster.abilities = {
        mindBall: new MindBallAbility(),
        psionicWave: new PsionicWaveAbility(),
        teleportWithTrap: new TeleportWithTrapAbility()
      };
      monster.lastWave = monster.lastWave || 0;
      monster.lastTeleport = monster.lastTeleport || 0;
      monster.phase2MessageShown = monster.phase2MessageShown || false;
      monster.phase3MessageShown = monster.phase3MessageShown || false;
      monster.lastPhase = monster.lastPhase || 1;
      break;

    case BOSS_TYPES.DUO_CHASER:
      monster.abilities = {
        speedBoost: new SpeedBoostAbility()
      };
      break;

    case BOSS_TYPES.DUO_SHOOTER:
      monster.abilities = {
        shootFireball: new ShootFireballAbility(),
        circleFireball: new CircleFireballAbility()
      };
      monster.rageModeActive = monster.rageModeActive || false;
      monster.originalSpeed = monster.originalSpeed || monster.speed;
      monster.currentDynamicCooldown = monster.currentDynamicCooldown || 100;
      monster.fastModeIndicatorShown = monster.fastModeIndicatorShown || false;
      break;

    default:
      monster.abilities = {};
  }

  if (!monster.updatePhase) {
    monster.updatePhase = function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      let newPhase = 1;

      if (this.phaseThresholds) {
        for (let i = 0; i < this.phaseThresholds.length; i++) {
          if (percent < this.phaseThresholds[i]) {
            newPhase = i + 2;
          } else {
            break;
          }
        }
      } else {
        if (percent < 0.5) newPhase = 2;
      }

      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    };
  }

  if (monster.isDuoBoss && !monster.updatePhase) {
    monster.updatePhase = function(currentHp, maxHp) {
      const percent = currentHp / maxHp;
      const newPhase = percent < 0.5 ? 2 : 1;
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.phaseChanged = true;
      } else {
        this.phaseChanged = false;
      }
      return this.phaseChanged;
    };
  }

  return monster;
}

/**
 * Восстановление флагов порталов на сетке
 * 
 * @param {Object} save - Объект сохранения
 * @returns {void}
 */
export function restorePortalFlagsOnGrid(save) {
  // Восстанавливаем портал в сокровищницу
  if (save.treasurePortal && save.treasurePortal.x !== undefined && save.treasurePortal.y !== undefined) {
    const { x, y } = save.treasurePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTreasurePortal = true;
      if (save.treasurePortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  // Восстанавливаем портал в комнату с алтарём
  if (save.shrinePortal && save.shrinePortal.x !== undefined && save.shrinePortal.y !== undefined) {
    const { x, y } = save.shrinePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasShrinePortal = true;
      if (save.shrinePortal.active) {
        state.grid[y][x].isShrinePortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  // Восстанавливаем портал в комнату-ловушку
  if (save.trapPortal && save.trapPortal.x !== undefined && save.trapPortal.y !== undefined) {
    const { x, y } = save.trapPortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasTrapPortal = true;
      if (save.trapPortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
      }
    }
  }

  // Восстанавливаем портал в безопасную комнату
  if (save.safePortal && save.safePortal.x !== undefined && save.safePortal.y !== undefined) {
    const { x, y } = save.safePortal;
    if (state.grid[y] && state.grid[y][x]) {
      state.grid[y][x].hasSafePortal = true;
      if (save.safePortal.active) {
        state.grid[y][x].isPortal = true;
        state.grid[y][x].revealed = true;
        state.grid[y][x].isWall = false;
      }
    }
  }
}

/**
 * Восстановление записок на сетке
 * 
 * @returns {void}
 */
export function restoreNotesOnGrid() {
  if (!state.notes || !state.notes.positions) return;

  // Сначала очищаем все записки на сетке
  for (let y = 0; y < CONFIG.rows; y++) {
    for (let x = 0; x < CONFIG.cols; x++) {
      if (state.grid[y] && state.grid[y][x]) {
        state.grid[y][x].hasNote = false;
        state.grid[y][x].noteId = null;
      }
    }
  }

  const notesFound = state.notes.found || [];

  for (const [noteIdStr, pos] of Object.entries(state.notes.positions)) {
    const noteId = parseInt(noteIdStr);

    // Пропускаем уже найденные записки
    if (notesFound.includes(noteId)) {
      continue;
    }

    const x = pos.x;
    const y = pos.y;

    if (x === undefined || y === undefined) {
      logger.warn(`📜 Записка #${noteId} имеет невалидные координаты:`, pos);
      continue;
    }

    if (!state.grid[y] || !state.grid[y][x]) {
      logger.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) не существует`);
      continue;
    }

    const cell = state.grid[y][x];

    if (!cell.isWall) {
      logger.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) не является стеной (isWall: ${cell.isWall})`);
      delete state.notes.positions[noteIdStr];
      continue;
    }

    if (cell.hasNote) {
      logger.warn(`📜 Записка #${noteId} — клетка (${x}, ${y}) уже содержит записку #${cell.noteId}`);
      continue;
    }

    cell.hasNote = true;
    cell.noteId = noteId;
  }
}