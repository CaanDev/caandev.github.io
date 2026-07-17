/**
 * @fileoverview Взаимодействие монстров с ловушками.
 * Управляет активацией ловушек монстрами, уворотом и применением эффектов.
 * 
 * @module entities/monsters/trapInteraction
 */

import { state, CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { checkWallCollision } from '../../world/physics.js';
import { handleMonsterDeath } from './death.js';

/**
 * Обработка уворота монстра от ловушки с анимацией смещения
 * 
 * Пытается найти безопасное направление для уворота,
 * проверяя несколько вариантов и постепенно уменьшая дистанцию.
 * 
 * @param {Object} m - Объект монстра
 * @param {Object} t - Объект ловушки
 * @returns {boolean} - true, если монстру удалось увернуться
 * @private
 */
function performMonsterDodge(m, t) {
  // Выбираем направление уворота (от ловушки)
  const angle = Math.atan2(m.y - t.y, m.x - t.x);
  const dodgeDistance = 50 + Math.random() * 30;
  
  // Пробуем разные направления (отклонения от основного)
  const directions = [
    { dx: Math.cos(angle), dy: Math.sin(angle) },
    { dx: Math.cos(angle + 0.5), dy: Math.sin(angle + 0.5) },
    { dx: Math.cos(angle - 0.5), dy: Math.sin(angle - 0.5) },
    { dx: Math.cos(angle + 1.0), dy: Math.sin(angle + 1.0) },
    { dx: Math.cos(angle - 1.0), dy: Math.sin(angle - 1.0) },
    { dx: -Math.cos(angle), dy: -Math.sin(angle) },
  ];
  
  // Перемешиваем направления для случайности
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }
  
  for (const dir of directions) {
    // Проверяем несколько точек по пути уворота
    const steps = 5;
    let canDodge = true;
    let finalX = m.x;
    let finalY = m.y;
    
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const testX = m.x + dir.dx * dodgeDistance * t;
      const testY = m.y + dir.dy * dodgeDistance * t;
      
      // Проверяем коллизию со стенами и колоннами
      if (checkWallCollision(testX, m.y, m.radius, true) || 
          checkWallCollision(m.x, testY, m.radius, true) ||
          checkWallCollision(testX, testY, m.radius, true)) {
        canDodge = false;
        break;
      }
      
      // Проверяем, не выходит ли монстр за границы карты
      const gridX = Math.floor(testX / CONFIG.cellSize);
      const gridY = Math.floor(testY / CONFIG.cellSize);
      if (gridX < 0 || gridX >= CONFIG.cols || gridY < 0 || gridY >= CONFIG.rows) {
        canDodge = false;
        break;
      }
      
      finalX = testX;
      finalY = testY;
    }
    
    if (canDodge) {
      // Проверяем финальную позицию
      if (!checkWallCollision(finalX, m.y, m.radius, true) && 
          !checkWallCollision(m.x, finalY, m.radius, true) &&
          !checkWallCollision(finalX, finalY, m.radius, true)) {
        
        // Выполняем плавное смещение
        const stepX = (finalX - m.x) / steps;
        const stepY = (finalY - m.y) / steps;
        
        m.dodgeAnimation = {
          active: true,
          currentStep: 0,
          maxSteps: steps,
          stepX: stepX,
          stepY: stepY,
          startX: m.x,
          startY: m.y,
          endX: finalX,
          endY: finalY
        };
        
        m.x += stepX;
        m.y += stepY;
        
        return true;
      }
    }
  }
  
  // Если не удалось найти место для уворота — пробуем уменьшить дистанцию
  for (const dir of directions) {
    for (let dist = dodgeDistance * 0.6; dist >= 20; dist -= 10) {
      const testX = m.x + dir.dx * dist;
      const testY = m.y + dir.dy * dist;
      
      if (!checkWallCollision(testX, m.y, m.radius, true) && 
          !checkWallCollision(m.x, testY, m.radius, true) &&
          !checkWallCollision(testX, testY, m.radius, true)) {
        
        const gridX = Math.floor(testX / CONFIG.cellSize);
        const gridY = Math.floor(testY / CONFIG.cellSize);
        if (gridX < 0 || gridX >= CONFIG.cols || gridY < 0 || gridY >= CONFIG.rows) {
          continue;
        }
        
        const steps = 5;
        const stepX = (testX - m.x) / steps;
        const stepY = (testY - m.y) / steps;
        
        m.dodgeAnimation = {
          active: true,
          currentStep: 0,
          maxSteps: steps,
          stepX: stepX,
          stepY: stepY,
          startX: m.x,
          startY: m.y,
          endX: testX,
          endY: testY
        };
        
        m.x += stepX;
        m.y += stepY;
        
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Обновление анимации уворота монстра
 * Вызывается каждый кадр из gameLoop для плавного перемещения.
 * 
 * @returns {void}
 */
export function updateMonsterDodgeAnimations() {
  for (const m of state.monsters) {
    if (m.dodgeAnimation && m.dodgeAnimation.active) {
      const anim = m.dodgeAnimation;
      if (anim.currentStep < anim.maxSteps) {
        anim.currentStep++;
        m.x += anim.stepX;
        m.y += anim.stepY;
      } else {
        // Анимация завершена
        anim.active = false;
        // Корректируем финальную позицию
        m.x = anim.endX;
        m.y = anim.endY;
        delete m.dodgeAnimation;
      }
    }
  }
}

/**
 * Обработка взаимодействия монстра с ловушкой
 * 
 * Проверяет, находится ли монстр на ловушке, обрабатывает уворот
 * или применяет эффект ловушки.
 * 
 * @param {Object} m - Объект монстра
 * @param {number} i - Индекс монстра в массиве
 * @returns {boolean} - true, если монстр умер
 */
export function handleMonsterTrapInteraction(m, i) {
  // Боссы не реагируют на ловушки
  if (m.isBoss || m.isDuoBoss) return false;

  // Только что заспавненный монстр не активирует ловушки
  if (m.justSpawned) {
    if (m.justSpawnedTimer > 0) {
      m.justSpawnedTimer--;
      if (m.justSpawnedTimer <= 0) {
        m.justSpawned = false;
      }
    }
    return false;
  }

  // Пропускаем, если монстр уже в анимации уворота
  if (m.dodgeAnimation && m.dodgeAnimation.active) {
    return false;
  }

  for (let t of state.traps) {
    if (t.triggered || t.resetTimer > 0) continue;

    // Проверка, находится ли монстр на ловушке
    if (Math.hypot(m.x - t.x, m.y - t.y) < m.radius + 12) {
      // Активируем ловушку
      t.triggered = true;
      t.resetTimer = 90;

      // Шанс активации увеличивается с уровнем
      const triggerChance = Math.min(0.9, 0.4 + state.gameLevel / 50);

      // Попытка уворота
      if (Math.random() > triggerChance) {
        const dodged = performMonsterDodge(m, t);

        if (dodged) {
          audio.playSound('dodge', 0.4);
          
          state.damageTexts.push({ 
            x: m.x, y: m.y - 30, 
            text: `✨ УВЕРНУЛСЯ!`, 
            color: COLORS.ui.textGold,
            size: 16, 
            life: 35, 
            speedy: 1.2 
          });
          
          // Эффект искр при увороте
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            state.sparks.push({
              x: m.x,
              y: m.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1,
              life: 10 + Math.random() * 10,
              maxLife: 20,
              size: 1 + Math.random() * 2,
              color: '#ffdd44',
              gravity: 0.05
            });
          }
        } else {
          // Не удалось увернуться — применяем эффект
          return applyTrapEffect(m, i, t);
        }
        return false;
      }

      // Монстр не пытается увернуться — применяем эффект
      const died = applyTrapEffect(m, i, t);
      if (died) return true;
      break;
    }
  }
  return false;
}

/**
 * Применение эффекта ловушки к монстру
 * 
 * @param {Object} m - Объект монстра
 * @param {number} i - Индекс монстра в массиве
 * @param {Object} t - Объект ловушки
 * @returns {boolean} - true, если монстр умер
 * @private
 */
function applyTrapEffect(m, i, t) {
  // Устанавливаем цвет свечения
  m.trapGlowColor = COLORS.monsters.trapGlow[t.type] || null;
  m.trapGlowTimer = 300;

  switch (t.type) {
    case 'acid':
      // Кислотная ловушка: отравление
      m.poisonTimer = 300;
      m.poisonTick = 0;
      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `🧪 ОТРАВЛЕН!`,
        color: COLORS.effects.poison,
        size: 18, life: 35, speedy: 1.2
      });
      return false;

    case 'ice':
      // Ледяная ловушка: заморозка
      audio.playSound('trapIceActivate', 0.7);
      m.isFrozen = true;
      m.freezeTimer = 180;
      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `❄️ ЗАМОРОЗКА`,
        color: COLORS.effects.ice,
        size: 18, life: 35, speedy: 1.2
      });
      return false;

    case 'lightning': {
      // Электрическая ловушка: шок + замедление
      audio.playSound('trapLightningActivate', 0.6);
      
      // Создаём отдельный звук для каждого монстра
      m._shockSound = audio.playEffect('trapLightningEffect', 0.3);
      
      m.shockTimer = 300;
      m.shockTick = 0;
      m.shockSlowAmount = 0.6;
      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `⚡ ШОК!`,
        color: COLORS.effects.lightning,
        size: 18, life: 35, speedy: 1.2
      });
      
      return false;
    }

    case 'psionic':
      // Псионическая ловушка: оглушение
      m.stunTimer = 180;
      m.trapGlowColor = '#9b59b6';
      m.trapGlowTimer = 180;
      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `🧠 ОГЛУШЕН!`,
        color: COLORS.effects.magic,
        size: 18, life: 35, speedy: 1.2
      });
      return false;

    case 'spike':
    default:
      // Взрывная ловушка: прямой урон
      audio.playSound('trapSpikeActivate', 0.7);
      
      m.hp -= t.damage;
      state.damageTexts.push({
        x: m.x, y: m.y - 15,
        text: `💥 -${t.damage}`,
        color: COLORS.ui.textRed,
        size: 18, life: 35, speedy: 1.2
      });
      
      if (m.hp <= 0) {
        handleMonsterDeath(m, i, state.monsters);
        return true;
      }
      return false;
  }
}