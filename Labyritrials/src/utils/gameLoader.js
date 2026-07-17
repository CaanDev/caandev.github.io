/**
 * @fileoverview Прелоадер игры.
 * Отображает экран загрузки с анимацией прогресса и сменой текста/иконок.
 * 
 * @module utils/gameLoader
 */

/** @type {HTMLElement|null} - Элемент загрузчика */
let loaderElement = null;
/** @type {number|null} - Таймаут для скрытия загрузчика */
let loaderTimeout = null;

/**
 * Создание DOM-элемента загрузчика
 * 
 * @returns {HTMLElement} - Созданный элемент загрузчика
 */
function createLoader() {
  if (loaderElement) return loaderElement;
  
  loaderElement = document.createElement('div');
  loaderElement.id = 'game-loader';
  
  loaderElement.innerHTML = `
    <div class="loader-content">
      <div class="loader-corner-tl"></div>
      <div class="loader-corner-br"></div>
      
      <div id="loader-icon" class="loader-icon">🔮</div>
      
      <h2 id="loader-title" class="loader-title">ЗАГРУЗКА</h2>
      
      <p id="loader-text" class="loader-text">Подождите, идёт подготовка...</p>
      
      <div class="loader-bar-container">
        <div id="loader-bar" class="loader-bar"></div>
      </div>
      
      <p id="loader-subtext" class="loader-subtext">Подготовка мира...</p>
    </div>
  `;
  
  document.body.appendChild(loaderElement);
  return loaderElement;
}

/**
 * Показ загрузчика с начальными параметрами
 * 
 * @param {string} [text='Подождите, идёт подготовка...'] - Основной текст
 * @param {string} [icon='🔮'] - Иконка загрузки
 * @param {string} [subtext='Подготовка мира...'] - Дополнительный текст
 * @param {number} [progress=0] - Начальный прогресс (0-100)
 * @returns {void}
 */
export function showLoader(text = 'Подождите, идёт подготовка...', icon = '🔮', subtext = 'Подготовка мира...', progress = 0) {
  const loader = createLoader();
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  
  const iconEl = document.getElementById('loader-icon');
  const textEl = document.getElementById('loader-text');
  const barEl = document.getElementById('loader-bar');
  const subtextEl = document.getElementById('loader-subtext');
  
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = text;
  if (barEl) barEl.style.width = Math.min(100, progress) + '%';
  if (subtextEl) subtextEl.textContent = subtext || 'Подготовка мира...';
}

/**
 * Обновление параметров загрузчика
 * 
 * @param {string|null} [text=null] - Основной текст (null — не менять)
 * @param {string|null} [icon=null] - Иконка (null — не менять)
 * @param {string|null} [subtext=null] - Дополнительный текст (null — не менять)
 * @param {number|null} [progress=null] - Прогресс (0-100, null — не менять)
 * @returns {void}
 */
export function updateLoader(text = null, icon = null, subtext = null, progress = null) {
  const iconEl = document.getElementById('loader-icon');
  const textEl = document.getElementById('loader-text');
  const barEl = document.getElementById('loader-bar');
  const subtextEl = document.getElementById('loader-subtext');
  
  if (icon !== null && iconEl) iconEl.textContent = icon;
  if (text !== null && textEl) textEl.textContent = text;
  if (subtext !== null && subtextEl) subtextEl.textContent = subtext;
  if (progress !== null && barEl) {
    barEl.style.width = Math.min(100, progress) + '%';
  }
}

/**
 * Скрытие загрузчика с задержкой
 * 
 * @param {number} [delay=300] - Задержка перед скрытием (мс)
 * @returns {void}
 */
export function hideLoader(delay = 300) {
  if (loaderTimeout) clearTimeout(loaderTimeout);
  
  loaderTimeout = setTimeout(() => {
    if (loaderElement) {
      loaderElement.style.opacity = '0';
      setTimeout(() => {
        loaderElement.style.display = 'none';
      }, 400);
    }
  }, delay);
}