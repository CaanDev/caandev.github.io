/**
 * @fileoverview Обработка смерти монстров.
 * Управляет удалением монстров, созданием эффектов смерти,
 * дропом предметов, обновлением достижений и статистики.
 * 
 * @module entities/monsters/death
 */

import { state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { audio } from '../../audio/audioManager.js';
import { addMonsterKilled } from '../../game/levelTransition.js';
import { createBloodPuddle } from '../objects/utils/bloodSystem.js';
import { handleMonsterDrop } from './drop.js';
import { createBossExplosion } from '../../systems/particles/bossExplosion.js';
import { spawnBloodDrops } from '../../systems/rendering/player/particleSpawner.js';
import { updateProgress, setProgress } from '../../systems/achievements/index.js';

/**
 * Обработка смерти монстра (полная версия)
 * 
 * Выполняет все необходимые действия при смерти монстра:
 * - Воспроизводит звук (кроме боссов)
 * - Останавливает активные звуковые эффекты
 * - Обновляет статистику и достижения
 * - Обрабатывает смерть монстров в комнате-ловушке
 * - Создаёт кровавую лужу и эффекты
 * - Обрабатывает дроп предметов
 * - Удаляет монстра из массива
 * 
 * @param {Object} m - Объект монстра
 * @param {number} index - Индекс монстра в массиве
 * @param {Array} monstersArray - Массив монстров (обычно state.monsters)
 * @returns {void}
 */
export function handleMonsterDeath(m, index, monstersArray) {
  // Звук смерти (кроме боссов)
  if (!m.isBoss && !m.isDuoBoss) audio.playSound('monsterDeath', 0.3);

  // Останавливаем звук эффекта шока (если есть)
  if (m._shockSound) {
    audio.sound.stopEffectSound(m._shockSound);
    m._shockSound = null;
  }

  // Сбрасываем флаг "Тень" (достижение — пройти уровень без убийств)
  state.shadowActive = false;
  
  // Обновляем статистику и достижения
  state.gameStats.monstersKilled++;
  updateProgress('monsters_killed', 1);

  // ===== ОБРАБОТКА СМЕРТИ В КОМНАТЕ-ЛОВУШКЕ =====
  if (m.isTrapMonster) {
    const trapIndex = state.trapMonsters.indexOf(m);
    if (trapIndex !== -1) {
      state.trapMonsters.splice(trapIndex, 1);
    }
    state.trapMonstersKilled = (state.trapMonstersKilled || 0) + 1;

    // Проверяем завершение волны в комнате-ловушке
    import('../../world/rooms/trapRoom/index.js').then(module => {
      if (state.inTrapRoom && state.trapActivated) {
        setTimeout(() => {
          module.checkTrapWaveComplete();
        }, 100);
      }
    });

    monstersArray.splice(index, 1);
    return;
  }

  // ===== ЭФФЕКТ ИСЧЕЗНОВЕНИЯ ДЛЯ ПРИЗРАКА =====
  if (m.isGhost) {
    state.damageTexts.push({
      x: m.x,
      y: m.y - 30,
      text: `ИСЧЕЗАЕТ...`,
      color: COLORS.monsters.eyes.ghost,
      size: 18,
      life: 40,
      speedy: 0.8
    });
    
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      state.sparks.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        size: 2 + Math.random() * 3,
        color: COLORS.monsters.eyes.ghost,
        gravity: 0.05
      });
    }
  }

  // ===== ОБРАБОТКА СМЕРТИ БОССА =====
  if (m.isBoss || m.isDuoBoss) {
    const bossLevel = Math.floor(state.gameLevel / 5) * 5;
    
    // Уровень 5: Верховный демон
    if (bossLevel === 5) {
      state.gameStats.bossesTotal++;
      updateProgress('bosses_killed', 1);
      setProgress('boss_5_killed', 1);
    }
    
    // Уровень 10: Разум
    if (bossLevel === 10) {
      state.gameStats.bossesTotal++;
      updateProgress('bosses_killed', 1);
      setProgress('boss_10_killed', 1);
    }
    
    // Уровень 15: Стражи (два босса)
    if (bossLevel === 15) {
      const otherBossAlive = state.monsters.some(monster => 
        monster.isDuoBoss && monster.id !== m.id && monster.hp > 0
      );
      
      // Достижение разблокируется только после победы над обоими стражами
      if (!otherBossAlive) {
        state.gameStats.bossesTotal++;
        updateProgress('bosses_killed', 1);
        setProgress('boss_15_killed', 1);
      }
    }
    
    // Взрыв босса
    const bossType = m.bossType || (m.isDuoBoss ? 'duo' : 'demon');
    createBossExplosion(m.x, m.y, true, bossType);
  }

  // Обновление счётчика убитых монстров на уровне
  addMonsterKilled();
  
  // Создание кровавой лужи (призраки не оставляют крови)
  createBloodPuddle(m.x, m.y, m.isGhost);

  // Дроп предметов (миньоны и монстры в ловушке не дропают)
  const canDrop = !(m.isMinion && m.canDropItems === false) && !m.isTrapMonster;

  if (canDrop) {
    handleMonsterDrop(m);
  }

  // Эффект вампиризма игрока (посох вампира)
  if (player.meleeWeapon === 'vampire') {
    spawnBloodDrops(m.x, m.y, true);
  }

  // Удаляем монстра из массива
  monstersArray.splice(index, 1);
}

/**
 * Упрощённая обработка смерти обычного монстра
 * 
 * Используется для быстрой смерти без сложной логики боссов и ловушек.
 * 
 * @param {Object} m - Объект монстра
 * @param {number} idx - Индекс монстра в массиве
 * @param {Array} monstersArray - Массив монстров
 * @returns {void}
 */
export function handleNormalMonsterDeath(m, idx, monstersArray) {
  // Звук смерти
  audio.playSound('monsterDeath', 0.3);

  // Обновление статистики
  addMonsterKilled();
  createBloodPuddle(m.x, m.y, m.isGhost);
  updateProgress('monsters_killed', 1);

  // Дроп предметов (миньоны не дропают)
  const canDrop = !(m.isMinion && m.canDropItems === false);

  if (canDrop) {
    handleMonsterDrop(m);
  }

  // Эффект вампиризма игрока
  if (player.meleeWeapon === 'vampire') {
    spawnBloodDrops(m.x, m.y, true);
  }

  // Удаляем монстра из массива
  monstersArray.splice(idx, 1);
}