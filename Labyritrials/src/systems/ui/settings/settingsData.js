/**
 * @fileoverview Управление данными в настройках.
 * 
 * @module systems/ui/settings/settingsData
 */

import { state } from '../../../core/config/state.js';
import { logger } from '../../../utils/logger.js';
import { closeSettings } from './settingsUI.js';

/**
 * Очистка всех игровых данных
 * 
 * @returns {void}
 */
export function clearAllGameData() {
  try {
    state.isClearingData = true;
    
    localStorage.removeItem('labirithria_save');
    localStorage.removeItem('labirithria_achievements');
    localStorage.removeItem('labirithria_notes');
    
    if (state.achievements) {
      state.achievements.unlocked = [];
      state.achievements.progress = {};
    }
    
    if (state.notes) {
      state.notes.found = [];
      state.notes.spawned = {};
      state.notes.positions = {};
    }
    
    state.mapClearedAchievementUnlocked = false;
    
    import('../../../core/config/functions.js').then(({ resetGameFull }) => {
      resetGameFull();
      state.isClearingData = false;
    });
    
    if (typeof window.updateSaveInfoOnStartScreen === 'function') {
      setTimeout(() => {
        window.updateSaveInfoOnStartScreen();
      }, 100);
    }
    
    closeSettings();
    
    setTimeout(() => {
      if (confirm('✅ Все данные очищены!\n\nДля полного обновления игры страница будет перезагружена.')) {
        window.location.reload();
      }
    }, 600);
    
  } catch (err) {
    logger.error('❌ Ошибка при очистке данных:', err);
    state.isClearingData = false;
    alert('❌ Произошла ошибка при очистке данных!');
  }
}

/**
 * Экспорт данных сохранения в файл
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
 * Импорт данных сохранения из файла
 * 
 * @param {File} file - Файл с данными сохранения
 * @returns {Promise<void>}
 */
export async function importSaveData(file) {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const rawData = event.target.result;
      
      if (!rawData || rawData.trim().length === 0) {
        alert('❌ Файл пуст!');
        return;
      }
      
      // Проверяем, что это валидный JSON
      let saveData = null;
      try {
        saveData = JSON.parse(rawData);
      } catch (e) {
        alert('❌ Неверный формат файла!\n\nФайл должен быть в формате JSON.');
        return;
      }
      
      // Проверяем обязательные поля
      if (!saveData.gameLevel || !saveData.maxHp) {
        alert('❌ Файл повреждён!\n\nОтсутствуют обязательные поля.');
        return;
      }
      
      // Сохраняем данные
      localStorage.setItem('labirithria_save', JSON.stringify(saveData));
      
      alert('✅ Сохранение успешно импортировано!\n\nПерезагрузите игру для применения.');
      closeSettings();
      
      setTimeout(() => {
        if (confirm('🔄 Перезагрузить страницу для применения сохранения?')) {
          window.location.reload();
        }
      }, 500);
      
    } catch (err) {
      logger.error('❌ Ошибка импорта:', err);
      alert('❌ Ошибка импорта!');
    }
  };
  
  reader.onerror = () => {
    alert('❌ Ошибка чтения файла!');
    logger.error('❌ Ошибка чтения файла');
  };
  
  reader.readAsText(file);
}