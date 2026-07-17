/**
 * @fileoverview Управление данными в настройках.
 * Предоставляет функции для очистки всех игровых данных,
 * экспорта и импорта сохранений.
 * 
 * @module systems/ui/settings/settingsData
 */

import { state } from '../../../core/config/state.js';
import { closeSettings } from './settingsUI.js';

/**
 * Очистка всех игровых данных
 * 
 * Удаляет сохранение, достижения и записки из localStorage,
 * сбрасывает состояние игры и перезагружает страницу.
 * 
 * @returns {void}
 */
export function clearAllGameData() {
  try {
    state.isClearingData = true;
    
    // ===== УДАЛЕНИЕ ДАННЫХ ИЗ LOCALSTORAGE =====
    localStorage.removeItem('labirithria_save');
    localStorage.removeItem('labirithria_achievements');
    localStorage.removeItem('labirithria_notes');
    
    // ===== СБРОС ДОСТИЖЕНИЙ =====
    if (state.achievements) {
      state.achievements.unlocked = [];
      state.achievements.progress = {};
    }
    
    // ===== СБРОС ЗАПИСОК =====
    if (state.notes) {
      state.notes.found = [];
      state.notes.spawned = {};
      state.notes.positions = {};
    }
    
    state.mapClearedAchievementUnlocked = false;
    
    // ===== СБРОС ИГРЫ =====
    import('../../../core/config/functions.js').then(({ resetGameFull }) => {
      resetGameFull();
      state.isClearingData = false;
    });
    
    // ===== ОБНОВЛЕНИЕ UI =====
    if (typeof window.updateSaveInfoOnStartScreen === 'function') {
      setTimeout(() => {
        window.updateSaveInfoOnStartScreen();
      }, 100);
    }
    
    closeSettings();
    showClearNotification();
    
    // ===== ПЕРЕЗАГРУЗКА СТРАНИЦЫ =====
    setTimeout(() => {
      if (confirm('✅ Все данные очищены!\n\nДля полного обновления игры страница будет перезагружена.')) {
        window.location.reload();
      }
    }, 600);
    
  } catch (err) {
    console.error('❌ Ошибка при очистке данных:', err);
    state.isClearingData = false;
    alert('❌ Произошла ошибка при очистке данных!');
  }
}

/**
 * Показ уведомления об очистке данных
 * 
 * @returns {void}
 * @private
 */
function showClearNotification() {
  let notification = document.getElementById('clear-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'clear-notification';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(46, 204, 113, 0.95);
      color: #ffffff;
      padding: 20px 40px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 18px;
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      transition: opacity 0.5s ease;
      box-shadow: 0 0 60px rgba(46, 204, 113, 0.3);
      border: 2px solid rgba(46, 204, 113, 0.5);
    `;
    document.body.appendChild(notification);
  }

  notification.textContent = '🗑️ Все данные очищены!';
  notification.style.opacity = '1';
  notification.style.display = 'block';

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.display = 'none';
      }
    }, 500);
  }, 2000);
}

/**
 * Экспорт данных сохранения в файл JSON
 * 
 * @returns {void}
 */
export function exportSaveData() {
  const raw = localStorage.getItem('labirithria_save');
  if (raw) {
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labirithria_save_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    alert('❌ Нет сохранения для экспорта!');
  }
}

/**
 * Импорт данных сохранения из файла JSON
 * 
 * @param {File} file - Файл с данными сохранения
 * @returns {void}
 */
export function importSaveData(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      localStorage.setItem('labirithria_save', JSON.stringify(data));
      alert('✅ Сохранение импортировано! Перезагрузите игру для применения.');
      closeSettings();
    } catch (err) {
      alert('❌ Ошибка импорта: неверный формат файла!');
    }
  };
  reader.readAsText(file);
}