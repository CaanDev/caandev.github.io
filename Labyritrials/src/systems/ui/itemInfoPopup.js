import { state, player } from '../../core/config/index.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { getItemData } from '../../data/items.js';
import { getSpriteWithSize } from '../../sprites/index.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';
import { loadTemplateIfNeeded, isTemplateLoaded } from '../../utils/htmlLoader.js';

const MODAL_ID = 'itemInfoPopup';

/** @type {Object|null} - Текущий предмет в окне */
let currentItem = null;
/** @type {Function|null} - Колбэк при взятии предмета */
let onTakeCallback = null;
/** @type {Function|null} - Колбэк при отказе */
let onLeaveCallback = null;
/** @type {boolean} - Открыто ли окно */
let isOpen = false;

/**
 * Создание data URL для спрайта (обрезанного)
 * 
 * @param {Object} sprite - Объект спрайта из getSpriteWithSize
 * @param {number} size - Размер иконки
 * @returns {string|null} - Data URL или null
 */
function getSpriteDataUrl(sprite, size) {
  if (!sprite) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(
    sprite.texture,
    sprite.sx, sprite.sy,
    sprite.sw, sprite.sh,
    sprite.offsetX, sprite.offsetY,
    sprite.drawW, sprite.drawH
  );
  
  return canvas.toDataURL('image/png');
}

/**
 * Показ окна с информацией о предмете
 * 
 * @param {Object} item - Объект предмета на полу
 * @param {Function} onTake - Колбэк при нажатии "Взять"
 * @param {Function} onLeave - Колбэк при нажатии "Оставить"
 * @returns {Promise<void>}
 */
export async function showItemInfoPopup(item, onTake, onLeave) {
  const itemData = getItemData(item.type);
  if (!itemData) return;

  // Закрытие предыдущего окна
  if (isOpen) closeItemInfoPopup();

  // Принудительная остановка сердцебиения
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });

  // Загрузка шаблона
  if (!isTemplateLoaded('itemInfoPopup')) await loadTemplateIfNeeded('itemInfoPopup');

  currentItem = item;
  onTakeCallback = onTake;
  onLeaveCallback = onLeave;

  const popup = document.getElementById('itemInfo-popup');
  if (!popup) return;

  // Заполнение данных
  const titleEl = document.getElementById('itemInfo-popup-title');
  const iconEl = document.getElementById('itemInfo-popup-icon');
  const descEl = document.getElementById('itemInfo-popup-description');
  const imageEl = document.getElementById('itemInfo-popup-image');

  if (titleEl) titleEl.textContent = itemData.name || 'Неизвестный предмет';

  if (iconEl && imageEl) {
    // Маппинг типа предмета -> имя спрайта
    const spriteMap = {
      'talismanMimicHunter': 'invTalismanMimicHunter',
      'talismanFire': 'invTalismanFire',
      'map': 'invMapLevel',
    };
    
    const spriteName = spriteMap[item.type];
    const sprite = spriteName ? getSpriteWithSize(spriteName, 80) : null;
    
    if (sprite) {
      // Создание обрезанного изображения через canvas
      const dataUrl = getSpriteDataUrl(sprite, 80);
      
      if (dataUrl) {
        imageEl.src = dataUrl;
        imageEl.style.width = `${sprite.drawW}px`;
        imageEl.style.height = `${sprite.drawH}px`;
        imageEl.style.objectFit = 'contain';
        imageEl.style.display = 'block';
        // Скрытие fallback
        const fallback = iconEl.querySelector('.fallback-icon');
        if (fallback) fallback.remove();
      } else {
        // Fallback: эмодзи
        imageEl.style.display = 'none';
        let fallback = iconEl.querySelector('.fallback-icon');
        if (!fallback) {
          fallback = document.createElement('span');
          fallback.className = 'fallback-icon';
          iconEl.appendChild(fallback);
        }
        fallback.textContent = itemData.icon || '❓';
      }
    } else {
      // Fallback: эмодзи
      imageEl.style.display = 'none';
      let fallback = iconEl.querySelector('.fallback-icon');
      if (!fallback) {
        fallback = document.createElement('span');
        fallback.className = 'fallback-icon';
        iconEl.appendChild(fallback);
      }
      fallback.textContent = itemData.icon || '❓';
    }
  }

  if (descEl) {
    // Замена \n на <br>
    const description = itemData.desc || 'Описание отсутствует...';
    descEl.innerHTML = description.replace(/\n/g, '<br>');
  }

  // Настройка кнопок
  setupPopupButtons(item, onTake, onLeave);

  isOpen = true;
  popup.style.display = 'flex';
  registerModalOpen(MODAL_ID);

  // Пауза игры
  Game.pauseTime();
  audio.isGameActive = false;
  audio.pause();

  if (Game.isRunning) Game.stopLoop();
}

/**
 * Настройка кнопок окна
 * 
 * @param {Object} item - Объект предмета
 * @param {Function} onTake - Колбэк при взятии
 * @param {Function} onLeave - Колбэк при отказе
 * @returns {void}
 * @private
 */
function setupPopupButtons(item, onTake, onLeave) {
  const takeBtn = document.getElementById('itemInfo-popup-take');
  const leaveBtn = document.getElementById('itemInfo-popup-leave');

  if (takeBtn) {
    const newTakeBtn = takeBtn.cloneNode(true);
    takeBtn.parentNode.replaceChild(newTakeBtn, takeBtn);
    
    newTakeBtn.addEventListener('click', () => {
      // Удаление предмета с пола
      removeItemFromLoot(item);

      if (onTake) onTake(item);
      closeItemInfoPopup();
    });
  }

  if (leaveBtn) {
    const newLeaveBtn = leaveBtn.cloneNode(true);
    leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
    
    newLeaveBtn.addEventListener('click', () => {
      if (onLeave) onLeave(item);
      closeItemInfoPopup();
    });
  }

  // Закрытие по клику на overlay
  const overlay = document.querySelector('.itemInfo-popup-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onLeave) onLeave(item);
        closeItemInfoPopup();
      }
    });
  }

  // Закрытие по Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (onLeave) onLeave(item);
      closeItemInfoPopup();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);
}

/**
 * Закрытие окна предмета
 * 
 * @returns {void}
 */
export function closeItemInfoPopup() {
  const popup = document.getElementById('itemInfo-popup');
  if (popup) popup.style.display = 'none';

  isOpen = false;
  registerModalClose(MODAL_ID);

  currentItem = null;
  onTakeCallback = null;
  onLeaveCallback = null;

  // Возобновление игры
  Game.resumeTime();
  audio.isGameActive = true;
  audio.resume();

  if (!Game.isRunning) Game.startLoop();
}

/**
 * Проверка, открыто ли окно предмета
 * 
 * @returns {boolean}
 */
export function isItemInfoPopupOpen() {
  return isOpen;
}

/**
 * Удаление предмета с пола
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 */
function removeItemFromLoot(item) {
  const index = state.lootItems.indexOf(item);
  if (index !== -1) state.lootItems.splice(index, 1);
}