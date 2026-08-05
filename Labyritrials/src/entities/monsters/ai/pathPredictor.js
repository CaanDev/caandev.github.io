/**
 * @fileoverview Предсказание пути игрока для монстров
 * @module entities/monsters/ai/pathPredictor
 */

import { state, player } from '../../../core/config/index.js';
import { CONFIG } from '../../../core/config/index.js';

export function predictPlayerPath(m, gridX, gridY, dirX, dirY) {
  const predicted = [];
  const maxSteps = m.predictionLength || 8;
  
  if (dirX === 0 && dirY === 0) {
    const dx = m.lastKnownX - m.x;
    const dy = m.lastKnownY - m.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      dirX = Math.sign(dx);
      dirY = 0;
    } else {
      dirX = 0;
      dirY = Math.sign(dy);
    }
    if (dirX === 0 && dirY === 0) dirY = 1;
  }
  
  let currentX = gridX;
  let currentY = gridY;
  
  for (let step = 1; step <= maxSteps; step++) {
    let nextX = currentX + dirX;
    let nextY = currentY + dirY;
    
    const cell = state.grid[nextY]?.[nextX];
    const isWalkable = cell && !cell.isWall && !cell.isPillar;
    
    if (isWalkable) {
      predicted.push({ x: nextX, y: nextY });
      currentX = nextX;
      currentY = nextY;
    } else {
      const possibleDirs = [
        { x: dirX, y: 0 },
        { x: 0, y: dirY },
        { x: dirX, y: dirY },
        { x: -dirX, y: 0 },
        { x: 0, y: -dirY },
        { x: -dirX, y: -dirY },
        { x: dirY, y: dirX },
        { x: -dirY, y: -dirX },
      ];
      
      let foundAlternative = false;
      
      for (let i = possibleDirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleDirs[i], possibleDirs[j]] = [possibleDirs[j], possibleDirs[i]];
      }
      
      for (const alt of possibleDirs) {
        const testX = currentX + alt.x;
        const testY = currentY + alt.y;
        const testCell = state.grid[testY]?.[testX];
        if (testCell && !testCell.isWall && !testCell.isPillar) {
          predicted.push({ x: testX, y: testY });
          currentX = testX;
          currentY = testY;
          dirX = alt.x;
          dirY = alt.y;
          foundAlternative = true;
          break;
        }
      }
      
      if (!foundAlternative) {
        break;
      }
    }
  }
  
  return predicted;
}

export function updatePredictedPath(m, playerGridX, playerGridY) {
  const dx = m.lastKnownX - m.x;
  const dy = m.lastKnownY - m.y;
  
  let dirX = 0;
  let dirY = 0;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    dirX = Math.sign(dx);
  } else {
    dirY = Math.sign(dy);
  }
  
  if (dirX === 0 && dirY === 0) {
    if (m.lastKnownDirection) {
      dirX = m.lastKnownDirection.x || 0;
      dirY = m.lastKnownDirection.y || 1;
    }
    if (dirX === 0 && dirY === 0) dirY = 1;
  }
  
  const predicted = predictPlayerPath(m, playerGridX, playerGridY, dirX, dirY);
  m.predictedPath = predicted;
  m.predictionTimer = m.memoryDuration;
  m.predictionStep = 1;
  
  m.lastKnownDirection = { x: dirX, y: dirY };
}

export function getNextPredictionTarget(m) {
  if (!m.predictedPath || m.predictedPath.length === 0) return null;
  
  const step = Math.min(m.predictionStep || 0, m.predictedPath.length - 1);
  const target = m.predictedPath[step];
  
  if (!target) return null;
  
  return {
    x: target.x * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: target.y * CONFIG.cellSize + CONFIG.cellSize / 2
  };
}

export function advancePredictionStep(m, currentX, currentY) {
  if (!m.predictedPath || m.predictedPath.length === 0) return true;
  
  const currentStep = m.predictionStep || 0;
  
  if (currentStep >= m.predictedPath.length - 1) {
    return true;
  }
  
  const target = m.predictedPath[currentStep];
  const targetX = target.x * CONFIG.cellSize + CONFIG.cellSize / 2;
  const targetY = target.y * CONFIG.cellSize + CONFIG.cellSize / 2;
  const dist = Math.hypot(currentX - targetX, currentY - targetY);
  
  if (dist < 35) {
    m.predictionStep = currentStep + 1;
  }
  
  return false;
}