/**
 * @fileoverview Спавнер ловушек.
 * Размещает ловушки на уровне с учётом типа комнаты и уровня сложности.
 * 
 * @module entities/objects/spawners/trapSpawner
 */

import { CONFIG, state } from '../../../core/config/index.js';
import { getRandomFreeCells, markCellUsed, isPortalCell } from '../utils/spawnUtils.js';

/**
 * Создание ловушек на уровне
 * 
 * @param {boolean} [isTreasureRoom=false] - Является ли комната сокровищницей
 * @param {Function} [isProtectedCell=()=>false] - Функция проверки защищённой клетки
 * @returns {void}
 */
export function spawnTraps(isTreasureRoom = false, isProtectedCell = () => false) {
  state.traps = [];

  // ===== РАСЧЁТ КОЛИЧЕСТВА ЛОВУШЕК =====
  let trapCount;
  if (isTreasureRoom) {
    trapCount = Math.min(3, Math.floor(3 + state.gameLevel * 0.5));
  } else {
    trapCount = Math.max(10, Math.floor(10 + state.gameLevel * 1.5));
    trapCount = Math.min(trapCount, 40);
  }

  // ===== ПОИСК КЛЕТОК ДЛЯ ЛОВУШЕК =====
  const cells = getRandomFreeCells(trapCount * 2, (x, y) => {
    if (isProtectedCell(x, y)) return false;
    if (isPortalCell(x, y)) return false;
    
    // Не спавним рядом со стартовой позицией
    if (Math.abs(x - 1) < 3 && Math.abs(y - 1) < 3) return false;
    if (Math.hypot(x - 1, y - 1) < 4) return false;
    
    // Не спавним на выходе
    if (x === CONFIG.goal.x && y === CONFIG.goal.y) return false;
    if (Math.hypot(x - CONFIG.goal.x, y - CONFIG.goal.y) < 4) return false;

    // Проверка, нет ли уже ловушки на этой клетке
    const existing = state.traps.some(t =>
      Math.floor(t.x / CONFIG.cellSize) === x &&
      Math.floor(t.y / CONFIG.cellSize) === y
    );
    if (existing) return false;

    return true;
  });

  // ===== СОЗДАНИЕ ЛОВУШЕК =====
  for (const cell of cells) {
    if (state.traps.length >= trapCount) break;

    // ===== ВЫБОР ТИПА ЛОВУШКИ =====
    let availableTypes = ['spike'];
    if (state.gameLevel >= 3) availableTypes.push('ice');
    if (state.gameLevel >= 6) availableTypes.push('acid');
    if (state.gameLevel >= 8) availableTypes.push('lightning');
    if (state.gameLevel >= 11) availableTypes.push('psionic');

    const chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const baseDmg = Math.floor(12 + state.gameLevel * 3);

    // Проверка, есть ли монстр на этой клетке
    let hasMonster = false;
    for (let monster of state.monsters) {
      const monsterX = Math.floor(monster.x / CONFIG.cellSize);
      const monsterY = Math.floor(monster.y / CONFIG.cellSize);
      if (monsterX === cell.x && monsterY === cell.y) {
        hasMonster = true;
        break;
      }
    }

    if (!hasMonster) {
      // Случайное смещение в пределах клетки
      const maxOffset = 35;
      const offsetX = (Math.random() - 0.5) * maxOffset * 2;
      const offsetY = (Math.random() - 0.5) * maxOffset * 2;

      state.traps.push({
        x: cell.x * CONFIG.cellSize + CONFIG.cellSize / 2 + offsetX,
        y: cell.y * CONFIG.cellSize + CONFIG.cellSize / 2 + offsetY,
        damage: baseDmg,
        type: chosenType,
        triggered: false,
        resetTimer: 30,
        cellX: cell.x,
        cellY: cell.y,
        offsetX: offsetX,
        offsetY: offsetY
      });

      markCellUsed(cell.x, cell.y);
    }
  }

  if (state.traps.length < trapCount) {
    console.log(`⚠️ Размещено только ${state.traps.length} из ${trapCount} ловушек`);
  }
}