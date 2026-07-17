/**
 * @fileoverview Финальный экран игры.
 * Отображается при завершении игры (после прохождения всех уровней).
 * Показывает подробную статистику прохождения.
 * 
 * @module game/finalScreen
 */

import { state, player } from '../core/config/index.js';
import { Game } from '../core/game.js';
import { resetGameFull } from '../core/config/functions.js';
import { formatPlayTime } from '../save/timeFormatter.js';
import { loadTemplateIfNeeded, isTemplateLoaded } from '../utils/htmlLoader.js';

/**
 * Внутренняя функция показа финального экрана (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function doShowFinalScreen() {
  Game.stopLoop();
  
  const gameUI = document.getElementById('ui');
  if (gameUI) gameUI.style.display = 'none';
  
  const controlButtons = document.getElementById('control-buttons-container');
  if (controlButtons) controlButtons.style.display = 'none';
  
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'none';
  
  const levelUpUI = document.getElementById('level-up-ui');
  if (levelUpUI) levelUpUI.style.display = 'none';
  
  const gameOverUI = document.getElementById('game-over-ui');
  if (gameOverUI) gameOverUI.style.display = 'none';
  
  updateFinalStats();
  
  const finalScreen = document.getElementById('final-screen-ui');
  if (finalScreen) {
    finalScreen.style.display = 'flex';
    finalScreen.style.animation = 'fadeInText 0.8s ease forwards';
  }
}

/**
 * Показ финального экрана
 * 
 * Выполняет следующие действия:
 * 1. Останавливает игровой цикл
 * 2. Скрывает все игровые UI элементы
 * 3. Обновляет статистику
 * 4. Показывает финальный экран
 * 
 * @returns {void}
 */
export function showFinalScreen() {
  // ==== ЗАГРУЗКА ШАБЛОНА (ЕСЛИ НУЖНО) =====
  if (!isTemplateLoaded('final')) {
    loadTemplateIfNeeded('final').then(() => {
      // Кнопки уже инициализированы через initModalHandlers()
      doShowFinalScreen();
    });
    return;
  }
  
  doShowFinalScreen();
}

/**
 * Обновление статистики на финальном экране
 * 
 * Заполняет все поля статистики:
 * - HP, урон, золото
 * - Артефакты, монстры, боссы
 * - Оружие, тайные комнаты
 * - Ловушки, мимики, время
 * 
 * @returns {void}
 */
function updateFinalStats() {
  const stats = state.gameStats;
  
  // ===== ОСНОВНЫЕ ХАРАКТЕРИСТИКИ =====
  state.gameStats.maxHpAtEnd = player.maxHp;
  state.gameStats.hpRemaining = player.hp;
  
  document.getElementById('final-maxhp').textContent = state.gameStats.maxHpAtEnd;
  document.getElementById('final-hp-remaining').textContent = state.gameStats.hpRemaining;
  document.getElementById('final-damage').textContent = player.baseDamage;
  document.getElementById('final-gold-collected').textContent = stats.goldCollected;
  document.getElementById('final-gold-spent').textContent = stats.goldSpent;
  document.getElementById('final-artifacts-collected').textContent = stats.artifactsCollected;
  
  // ===== АРТЕФАКТЫ (всего возможных) =====
  const totalArtifacts = (() => {
    let count = 0;
    for (let level = 1; level <= 15; level++) {
      if (level % 5 !== 0) count += 3;
    }
    return count;
  })();
  document.getElementById('final-artifacts-total').textContent = totalArtifacts;
  
  // ===== МОНСТРЫ И БОССЫ =====
  document.getElementById('final-monsters-killed').textContent = stats.monstersKilled;
  document.getElementById('final-bosses-total').textContent = stats.bossesTotal;
  
  // ===== ОРУЖИЕ =====
  const weaponNames = {
    default: '🧙 Обычный посох',
    stun: '⚡ Громовой посох',
    vampire: '🦇 Посох Вампира',
    fireball: '🔥 Огненный шар'
  };
  
  document.getElementById('final-weapon-default').textContent = stats.weaponHits.default || 0;
  document.getElementById('final-weapon-stun').textContent = stats.weaponHits.stun || 0;
  document.getElementById('final-weapon-vampire').textContent = stats.weaponHits.vampire || 0;
  document.getElementById('final-weapon-fireball').textContent = stats.weaponHits.fireball || 0;
  
  // ===== ЛЮБИМОЕ ОРУЖИЕ =====
  const hits = stats.weaponHits;
  let favorite = 'default';
  let maxHits = hits.default || 0;
  if ((hits.stun || 0) > maxHits) { favorite = 'stun'; maxHits = hits.stun; }
  if ((hits.vampire || 0) > maxHits) { favorite = 'vampire'; maxHits = hits.vampire; }
  if ((hits.fireball || 0) > maxHits) { favorite = 'fireball'; maxHits = hits.fireball; }
  
  document.getElementById('final-favorite-weapon').textContent = weaponNames[favorite] || 'Обычный посох';
  
  // ===== ТАЙНЫЕ КОМНАТЫ =====
  document.getElementById('final-rooms-visited').textContent = stats.secretRoomsVisited || 0;
  document.getElementById('final-rooms-generated').textContent = stats.secretRoomsGenerated || 0;
  
  // ===== ЛОВУШКИ =====
  document.getElementById('final-trap-spike').textContent = stats.trapsTriggered.spike || 0;
  document.getElementById('final-trap-ice').textContent = stats.trapsTriggered.ice || 0;
  document.getElementById('final-trap-acid').textContent = stats.trapsTriggered.acid || 0;
  document.getElementById('final-trap-lightning').textContent = stats.trapsTriggered.lightning || 0;
  document.getElementById('final-mimic-bites').textContent = stats.mimicBites || 0;

  // ===== ВРЕМЯ ИГРЫ =====
  const playTimeFormatted = formatPlayTime(state.gameStats.playTime || 0);
  document.getElementById('final-play-time').textContent = playTimeFormatted;
  state.gameStats.playTimeFormatted = playTimeFormatted;
}

/**
 * Настройка кнопок финального экрана
 * 
 * @returns {void}
 */
export function setupFinalScreenButtons() {
  const menuBtn = document.getElementById('final-menu-btn');
  
  if (menuBtn) {
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    newMenuBtn.addEventListener('click', () => {
      // ===== СКРЫТИЕ ФИНАЛЬНОГО ЭКРАНА =====
      const finalScreen = document.getElementById('final-screen-ui');
      if (finalScreen) finalScreen.style.display = 'none';
      
      // ===== СБРОС ИГРЫ =====
      resetGameFull();
      
      // ===== ПОКАЗ ГЛАВНОГО МЕНЮ =====
      const startScreen = document.getElementById('start-screen-ui');
      if (startScreen) {
        startScreen.style.display = 'flex';
        startScreen.classList.remove('fade-out-screen');
      }
      
      // ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ О СОХРАНЕНИИ =====
      if (typeof window.updateSaveInfoOnStartScreen === 'function') {
        setTimeout(() => {
          window.updateSaveInfoOnStartScreen();
        }, 50);
      }
      
      // ===== УДАЛЕНИЕ СОХРАНЕНИЯ =====
      import('../save/saveStorage.js').then(module => {
        module.deleteSave();
      });
    });
  }
}