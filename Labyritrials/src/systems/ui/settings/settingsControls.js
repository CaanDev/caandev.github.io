/**
 * @fileoverview Обработчики элементов управления в настройках.
 * Инициализирует слайдеры, переключатели, выпадающие списки и кнопки
 * в окне настроек.
 * 
 * @module systems/ui/settings/settingsControls
 */

import { updateSetting } from './settingsManager.js';
import { updateFpsVisibility } from './settingsFps.js';
import { clearAllGameData, exportSaveData, importSaveData } from './settingsData.js';
import { closeSettings } from './settingsUI.js';

/**
 * Инициализация слайдеров громкости
 * 
 * @returns {void}
 */
export function initSliders() {
  const sliders = [
    { id: 'settings-music-volume', valueId: 'settings-music-value', key: 'musicVolume', suffix: '%' },
    { id: 'settings-sound-volume', valueId: 'settings-sound-value', key: 'soundVolume', suffix: '%' }
  ];

  sliders.forEach(({ id, valueId, key, suffix }) => {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(valueId);
    if (slider && valueDisplay) {
      slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        valueDisplay.textContent = `${value}${suffix}`;
        updateSetting(key, value);
      });
    }
  });
}

/**
 * Инициализация переключателей (toggle)
 * 
 * @returns {void}
 */
export function initToggles() {
  const toggles = [
    { id: 'settings-music-toggle', key: 'musicEnabled' },
    { id: 'settings-sound-toggle', key: 'soundEnabled' },
    { id: 'settings-show-fps', key: 'showFps' },
    { id: 'settings-vsync-toggle', key: 'vsyncEnabled' }
  ];

  toggles.forEach(({ id, key }) => {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.addEventListener('change', () => {
        updateSetting(key, toggle.checked);
        if (key === 'showFps') {
          updateFpsVisibility();
        }
      });
    }
  });
}

/**
 * Инициализация выпадающего списка ограничения FPS
 * 
 * @returns {void}
 */
export function initSelects() {
  const select = document.getElementById('settings-fps-limit');
  if (select) {
    select.addEventListener('change', () => {
      const value = parseInt(select.value);
      updateSetting('fpsLimit', value);
    });
  }
}

/**
 * Инициализация кнопок (сброс прогресса, экспорт, импорт)
 * 
 * @returns {void}
 */
export function initButtons() {
  // ===== КНОПКА СБРОСА ПРОГРЕССА =====
  const resetBtn = document.getElementById('settings-reset-progress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('⚠️ Вы уверены, что хотите очистить ВСЕ данные?\n\n' +
                   'Будут удалены:\n' +
                   '• 📀 Прогресс игры\n' +
                   '• 🏆 Все достижения\n' +
                   '• 📜 Все найденные записки\n\n' +
                   'Это действие НЕОБРАТИМО!')) {
        clearAllGameData();
      }
    });
  }

  // ===== КНОПКА ЭКСПОРТА =====
  const exportBtn = document.getElementById('settings-export-save');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSaveData);
  }

  // ===== КНОПКА ИМПОРТА =====
  const importBtn = document.getElementById('settings-import-save');
  const importFile = document.getElementById('settings-import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importSaveData(file);
      }
      importFile.value = '';
    });
  }
}