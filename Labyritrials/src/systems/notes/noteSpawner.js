/**
 * @fileoverview Спавнер записок на уровне.
 * Размещает записки на стенах лабиринта с учётом уровня игры,
 * уже найденных записок и сохранённых позиций.
 * 
 * @module systems/notes/noteSpawner
 */

import { CONFIG, state } from '../../core/config/index.js';
import { getNotesForLevel, isBossLevel } from '../../data/notes.js';

/**
 * Спавн записок на уровне
 * 
 * Размещает записки, соответствующие текущему уровню, на стенах лабиринта.
 * Учитывает уже найденные записки и восстанавливает позиции из сохранения.
 * 
 * @returns {void}
 */
export function spawnNotes() {
  const level = state.gameLevel;

  // Инициализация структуры данных, если её нет
  if (!state.notes) {
    state.notes = { found: [], spawned: {}, positions: {} };
  }

  // На босс-уровнях записки не спавнятся
  if (isBossLevel(level)) return;

  // Получаем записки для этого уровня
  const notesForLevel = getNotesForLevel(level);
  if (notesForLevel.length === 0) return;

  // Проверяем, есть ли уже заспавненные записки на этом уровне
  if (state.notes.spawned[level] && state.notes.spawned[level].length > 0) {
    // Проверяем, есть ли записки на карте
    let notesOnMap = 0;
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        if (state.grid[y]?.[x]?.hasNote) notesOnMap++;
      }
    }

    // Если записки есть на карте — ничего не делаем
    if (notesOnMap > 0) return;

    // Если записок на карте нет — очищаем spawned и спавним заново
    state.notes.spawned[level] = [];
  }

  // Инициализация структур данных, если их нет
  if (!state.notes.spawned[level]) {
    state.notes.spawned[level] = [];
  }
  if (!state.notes.positions) {
    state.notes.positions = {};
  }

  let spawnedCount = 0;
  const existingPositions = []; // Для отслеживания позиций уже заспавненных записок

  for (const noteData of notesForLevel) {
    // Пропускаем уже найденные записки
    if (state.notes.found.includes(noteData.id)) continue;

    // Пропускаем уже заспавненные на этом уровне
    if (state.notes.spawned[level].includes(noteData.id)) continue;

    // Проверяем, есть ли уже сохранённая позиция для этой записки
    if (state.notes.positions[noteData.id]) {
      const pos = state.notes.positions[noteData.id];
      const cell = state.grid[pos.y]?.[pos.x];
      
      // Проверяем, что клетка подходит для размещения записки
      if (cell && cell.isWall && !cell.isBreakable && !cell.hasNote) {
        cell.hasNote = true;
        cell.noteId = noteData.id;
        state.notes.spawned[level].push(noteData.id);
        existingPositions.push({ x: pos.x, y: pos.y });
        spawnedCount++;
        continue;
      } else {
        // Если позиция невалидна — удаляем из сохранения
        delete state.notes.positions[noteData.id];
      }
    }

    // Ищем новую позицию для записки
    const position = findNoteSpawnPosition(noteData.id, existingPositions);
    if (position) {
      state.notes.spawned[level].push(noteData.id);
      state.notes.positions[noteData.id] = { x: position.x, y: position.y };
      existingPositions.push({ x: position.x, y: position.y });

      const cell = state.grid[position.y][position.x];
      cell.hasNote = true;
      cell.noteId = noteData.id;

      spawnedCount++;
    } else {
      console.warn(`📜 ❌ Не удалось найти место для записки #${noteData.id} на уровне ${level}`);
    }
  }
}

/**
 * Поиск позиции для спавна записки
 * 
 * Ищет подходящую стену для размещения записки с учётом:
 * - Расстояния от стартовой позиции
 * - Расстояния от выхода
 * - Расстояния между записками
 * - Наличия свободной соседней клетки
 * 
 * @param {number|null} noteId - ID записки (для детерминированного выбора позиции)
 * @param {Array<{x: number, y: number}>} existingPositions - Массив уже занятых позиций
 * @returns {{x: number, y: number}|null} - Координаты позиции или null
 * @private
 */
function findNoteSpawnPosition(noteId = null, existingPositions = []) {
  const attempts = 200;
  const minDistanceFromPlayer = 5;
  const minDistanceBetweenNotes = 5; // Минимальное расстояние между записками в клетках

  let checkedWalls = 0;
  let validCandidates = 0;

  for (let attempt = 0; attempt < attempts; attempt++) {
    let x, y;

    if (noteId !== null) {
      // Создаём уникальный seed для каждой записки для детерминированного результата
      const seed = noteId * 1000 + attempt;
      const rand1 = (Math.sin(seed) * 43758.5453) % 1;
      const rand2 = (Math.sin(seed + 313.7) * 43758.5453) % 1;
      x = Math.floor(Math.abs(rand1) * (CONFIG.cols - 2)) + 1;
      y = Math.floor(Math.abs(rand2) * (CONFIG.rows - 2)) + 1;
    } else {
      // Если noteId не передан — используем обычный рандом
      x = Math.floor(Math.random() * (CONFIG.cols - 2)) + 1;
      y = Math.floor(Math.random() * (CONFIG.rows - 2)) + 1;
    }

    const cell = state.grid[y]?.[x];
    
    // Проверка: клетка должна быть стеной, неразрушаемой, не порталом, не колонной
    if (!cell || !cell.isWall) continue;
    if (cell.isBreakable) continue;
    if (cell.isPortal || cell.isPillar) continue;
    if (cell.hasNote) continue;

    checkedWalls++;

    // Проверка расстояния до других записок
    let tooCloseToNote = false;
    for (const pos of existingPositions) {
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < minDistanceBetweenNotes) {
        tooCloseToNote = true;
        break;
      }
    }
    if (tooCloseToNote) continue;

    // Проверка, что рядом есть свободная клетка (для доступа игрока)
    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let hasFreeNeighbor = false;
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
        const neighbor = state.grid[ny]?.[nx];
        if (neighbor && !neighbor.isWall && !neighbor.isPortal) {
          hasFreeNeighbor = true;
          break;
        }
      }
    }
    if (!hasFreeNeighbor) continue;

    // Проверка расстояния от стартовой позиции (игрок не должен видеть записку сразу)
    const distFromStart = Math.hypot(x - 1, y - 1);
    if (distFromStart < minDistanceFromPlayer) continue;

    // Проверка, что не слишком близко к выходу
    const distFromGoal = Math.hypot(x - CONFIG.goal.x, y - CONFIG.goal.y);
    if (distFromGoal < 4) continue;

    validCandidates++;

    return { x, y };
  }

  return null;
}