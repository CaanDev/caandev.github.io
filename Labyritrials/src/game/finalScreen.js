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
import { loadTemplateIfNeeded, isTemplateLoaded, formatNumber } from '../utils/index.js';

/**
 * Внутренняя функция показа финального экрана (после загрузки шаблона)
 * 
 * @returns {void}
 * @private
 */
function doShowFinalScreen() {
  Game.stopLoop();

  // Принудительная остановка сердцебиения игрока
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });
  
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
  // Загрузка шаблона (если нужно)
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
  
  // Основные характеристики
  state.gameStats.maxHpAtEnd = player.maxHp;
  state.gameStats.hpRemaining = player.hp;
  
  document.getElementById('final-maxhp').textContent = formatNumber(state.gameStats.maxHpAtEnd);
  document.getElementById('final-hp-remaining').textContent = formatNumber(state.gameStats.hpRemaining);
  document.getElementById('final-damage').textContent = formatNumber(player.baseDamage);
  document.getElementById('final-gold-collected').textContent = formatNumber(stats.goldCollected);
  document.getElementById('final-gold-spent').textContent = formatNumber(stats.goldSpent);
  document.getElementById('final-artifacts-collected').textContent = formatNumber(stats.artifactsCollected);
  
  // Артефакты (всего возможных)
  const totalArtifacts = (() => {
    let count = 0;
    for (let level = 1; level <= 15; level++) {
      if (level % 5 !== 0) count += 3;
    }
    return count;
  })();
  document.getElementById('final-artifacts-total').textContent = formatNumber(totalArtifacts);
  
  // Монстры и боссы
  document.getElementById('final-monsters-killed').textContent = formatNumber(stats.monstersKilled);
  document.getElementById('final-bosses-total').textContent = formatNumber(stats.bossesTotal);
  
  // Оружие
  const weaponNames = {
    default: '🧙 Обычный посох',
    stun: '⚡ Громовой посох',
    vampire: '🦇 Посох Вампира',
    fireball: '🔥 Огненный шар'
  };
  
  document.getElementById('final-weapon-default').textContent = formatNumber(stats.weaponHits.default) || 0;
  document.getElementById('final-weapon-stun').textContent = formatNumber(stats.weaponHits.stun) || 0;
  document.getElementById('final-weapon-vampire').textContent = formatNumber(stats.weaponHits.vampire) || 0;
  document.getElementById('final-weapon-fireball').textContent = formatNumber(stats.weaponHits.fireball) || 0;
  
  // Любимое оружие
  const hits = stats.weaponHits;
  let favorite = 'default';
  let maxHits = hits.default || 0;
  if ((hits.stun || 0) > maxHits) { favorite = 'stun'; maxHits = hits.stun; }
  if ((hits.vampire || 0) > maxHits) { favorite = 'vampire'; maxHits = hits.vampire; }
  if ((hits.fireball || 0) > maxHits) { favorite = 'fireball'; maxHits = hits.fireball; }
  
  document.getElementById('final-favorite-weapon').textContent = weaponNames[favorite] || 'Обычный посох';
  
  // Тайные комнаты
  document.getElementById('final-rooms-visited').textContent = formatNumber(stats.secretRoomsVisited) || 0;
  document.getElementById('final-rooms-generated').textContent = formatNumber(stats.secretRoomsGenerated) || 0;
  
  // Ловушки
  document.getElementById('final-trap-spike').textContent = formatNumber(stats.trapsTriggered.spike) || 0;
  document.getElementById('final-trap-ice').textContent = formatNumber(stats.trapsTriggered.ice) || 0;
  document.getElementById('final-trap-acid').textContent = formatNumber(stats.trapsTriggered.acid) || 0;
  document.getElementById('final-trap-lightning').textContent = formatNumber(stats.trapsTriggered.lightning) || 0;
  document.getElementById('final-mimic-bites').textContent = formatNumber(stats.mimicBites) || 0;

  // Время игры
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
      // Скрытие финального экрана
      const finalScreen = document.getElementById('final-screen-ui');
      if (finalScreen) finalScreen.style.display = 'none';
      
      // Сброс игры
      resetGameFull();
      
      // Показ главного меню
      const startScreen = document.getElementById('start-screen-ui');
      if (startScreen) {
        startScreen.style.display = 'flex';
        startScreen.classList.remove('fade-out-screen');
      }
      
      // Обновление информации о сохранении
      if (typeof window.updateSaveInfoOnStartScreen === 'function') {
        setTimeout(() => {
          window.updateSaveInfoOnStartScreen();
        }, 50);
      }
      
      // Удаление сохранения
      import('../save/saveStorage.js').then(module => {
        module.deleteSave();
      });
    });
  }
}