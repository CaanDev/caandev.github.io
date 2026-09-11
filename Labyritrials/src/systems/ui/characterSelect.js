/**
 * @fileoverview Окно выбора персонажа
 * @module systems/ui/characterSelect
 */

import { loadTemplateIfNeeded, isTemplateLoaded } from '../../utils/htmlLoader.js';
import { registerModalOpen, registerModalClose } from './modalManager.js';
import { player, state } from '../../core/config/index.js';
import { getGenderConfig } from '../../data/genderConfig.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { getCroppedSprite } from '../../sprites/spriteUtils.js';
import { exitToMainMenu } from '../../utils/exitToMainMenu.js';

const MODAL_ID = 'characterSelect';

/** @type {Function|null} - Колбэк при выборе персонажа */
let onSelectCallback = null;

/** @type {boolean} - Открыто ли окно */
let isOpen = false;

/** @type {string|null} - Выбранный пол для анимации */
let selectedGender = null;

/** @type {string} - Контекст вызова ('menu' или 'gameOver') */
let currentContext = 'menu';

/**
 * Применение характеристик в зависимости от пола
 * 
 * @param {string} gender
 * @returns {void}
 */
function applyGenderStats(gender) {
  const config = getGenderConfig(gender);
  
  // Основные характеристики
  player.maxHp = 100;
  player.hp = 100;
  player.baseDamage = config.baseDamage;
  player.baseSpeed = config.baseSpeed;
  player.speed = config.baseSpeed;
  player.maxStamina = config.maxStamina;
  player.stamina = config.maxStamina;
  player.staminaRegenInCombat = config.staminaRegenInCombat;
  player.staminaRegenOutOfCombat = config.staminaRegenOutOfCombat;
  player.staminaUpgradeCost = config.staminaUpgradeCost;
  player.dmgCost = config.dmgCost;
  player.evasionBonus = config.evasionBonus || 0;
  // Бонусы к оружию
  player.genderBonuses = config.weaponBonuses || {};
  // Пол
  player.gender = gender;
}

/**
 * Загрузка спрайтов персонажей в карточки
 * 
 * @returns {void}
 * @private
 */
function loadCharacterSprites() {
  const spriteSize = 120;
  const attackFrames = 9;
  const frameInterval = 120;

  import('../../sprites/spriteUtils.js').then(({ getCroppedSprite }) => {
    // Мужской персонаж
    const maleIdle = getCroppedSprite('male_idle_south');
    const maleCard = document.querySelector('.character-card[data-gender="male"]');
    const maleContainer = document.getElementById('male-sprite-container');
    
    if (maleContainer && maleCard) {
      maleContainer.innerHTML = '';
      
      // Idle спрайт
      const idleImg = createSpriteImage(maleIdle, spriteSize);
      idleImg.style.cssText = `
        width: ${spriteSize}px;
        height: ${spriteSize}px;
        object-fit: contain;
        image-rendering: auto;
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 1;
        z-index: 1;
        transition: opacity 0.3s ease;
      `;
      maleContainer.appendChild(idleImg);
      
      // Загрузка всех кадров атаки
      const attackFramesList = [];
      for (let i = 0; i < attackFrames; i++) {
        const frameSprite = getCroppedSprite(`male_attack_south_${i}`);
        if (frameSprite) {
          const frameImg = createSpriteImage(frameSprite, spriteSize);
          frameImg.style.cssText = `
            width: ${spriteSize}px;
            height: ${spriteSize}px;
            object-fit: contain;
            image-rendering: auto;
            display: block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            z-index: 2;
            transition: opacity 0.05s ease;
          `;
          maleContainer.appendChild(frameImg);
          attackFramesList.push(frameImg);
        }
      }
      
      // Анимация атаки при наведении на карточку
      let animationId = null;
      let currentFrame = 0;
      
      maleCard.addEventListener('mouseenter', () => {
        idleImg.style.opacity = '0';
        currentFrame = 0;
        
        if (attackFramesList.length > 0) attackFramesList[0].style.opacity = '1';
        if (animationId) clearInterval(animationId);
        
        animationId = setInterval(() => {
          if (currentFrame < attackFramesList.length) attackFramesList[currentFrame].style.opacity = '0';
          currentFrame++;
          
          if (currentFrame >= attackFramesList.length) {
            clearInterval(animationId);
            animationId = null;
            if (attackFramesList.length > 0) attackFramesList[attackFramesList.length - 1].style.opacity = '1';
            return;
          }
          
          if (currentFrame < attackFramesList.length) attackFramesList[currentFrame].style.opacity = '1';
        }, frameInterval);
      });
      
      maleCard.addEventListener('mouseleave', () => {
        if (animationId) {
          clearInterval(animationId);
          animationId = null;
        }
        
        for (const frame of attackFramesList) {
          frame.style.opacity = '0';
        }
        
        idleImg.style.opacity = '1';
        currentFrame = 0;
      });
    }

    // Женский персонаж
    const femaleIdle = getCroppedSprite('female_idle_south');
    const femaleCard = document.querySelector('.character-card[data-gender="female"]');
    const femaleContainer = document.getElementById('female-sprite-container');
    
    if (femaleContainer && femaleCard) {
      femaleContainer.innerHTML = '';
      
      // Idle спрайт
      const idleImg = createSpriteImage(femaleIdle, spriteSize);
      idleImg.style.cssText = `
        width: ${spriteSize}px;
        height: ${spriteSize}px;
        object-fit: contain;
        image-rendering: auto;
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 1;
        z-index: 1;
        transition: opacity 0.3s ease;
      `;
      femaleContainer.appendChild(idleImg);
      
      // Загрузка всех кадров атаки
      const attackFramesList = [];
      for (let i = 0; i < attackFrames; i++) {
        const frameSprite = getCroppedSprite(`female_attack_south_${i}`);
        if (frameSprite) {
          const frameImg = createSpriteImage(frameSprite, spriteSize);
          frameImg.style.cssText = `
            width: ${spriteSize}px;
            height: ${spriteSize}px;
            object-fit: contain;
            image-rendering: auto;
            display: block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            z-index: 2;
            transition: opacity 0.05s ease;
          `;
          femaleContainer.appendChild(frameImg);
          attackFramesList.push(frameImg);
        }
      }
      
      let animationId = null;
      let currentFrame = 0;
      
      femaleCard.addEventListener('mouseenter', () => {
        idleImg.style.opacity = '0';
        currentFrame = 0;
        
        if (attackFramesList.length > 0) attackFramesList[0].style.opacity = '1';
        if (animationId) clearInterval(animationId);
        
        animationId = setInterval(() => {
          if (currentFrame < attackFramesList.length) attackFramesList[currentFrame].style.opacity = '0';
          currentFrame++;
          
          if (currentFrame >= attackFramesList.length) {
            clearInterval(animationId);
            animationId = null;
            if (attackFramesList.length > 0) attackFramesList[attackFramesList.length - 1].style.opacity = '1';
            return;
          }
          
          if (currentFrame < attackFramesList.length) attackFramesList[currentFrame].style.opacity = '1';
        }, frameInterval);
      });
      
      femaleCard.addEventListener('mouseleave', () => {
        if (animationId) {
          clearInterval(animationId);
          animationId = null;
        }
        
        for (const frame of attackFramesList) {
          frame.style.opacity = '0';
        }
        
        idleImg.style.opacity = '1';
        currentFrame = 0;
      });
    }
  });
}

/**
 * Создание изображения спрайта на canvas
 * 
 * @param {Object} sprite - Обрезанный спрайт из getCroppedSprite
 * @param {number} spriteSize - Размер canvas
 * @returns {HTMLImageElement} - Созданное изображение
 * @private
 */
function createSpriteImage(sprite, spriteSize) {
  const canvas = document.createElement('canvas');
  canvas.width = spriteSize;
  canvas.height = spriteSize;
  const ctx = canvas.getContext('2d');
  
  if (sprite) {
    const aspectRatio = sprite.sw / sprite.sh;
    let drawWidth, drawHeight;
    
    if (aspectRatio > 1) {
      drawWidth = spriteSize;
      drawHeight = spriteSize / aspectRatio;
    } else {
      drawHeight = spriteSize;
      drawWidth = spriteSize * aspectRatio;
    }
    
    const offsetX = (spriteSize - drawWidth) / 2;
    const offsetY = (spriteSize - drawHeight) / 2;
    
    ctx.drawImage(
      sprite.texture,
      sprite.sx, sprite.sy,
      sprite.sw, sprite.sh,
      offsetX, offsetY,
      drawWidth, drawHeight
    );
  }
  
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  return img;
}

/**
 * Показ окна выбора персонажа
 * 
 * @param {Function} onSelect - Колбэк при выборе персонажа (принимает 'male' или 'female')
 * @param {string} [context='menu'] - Контекст вызова ('menu' или 'gameOver')
 * @returns {Promise<void>}
 */
export async function showCharacterSelect(onSelect, context = 'menu') {
  // Закрытие предыдущего окна, если открыто
  if (isOpen) closeCharacterSelect();
  onSelectCallback = onSelect;
  currentContext = context;

  // Загрузка шаблона
  if (!isTemplateLoaded('characterSelect')) await loadTemplateIfNeeded('characterSelect');

  const ui = document.getElementById('character-select-ui');
  if (!ui) return;

  // Сохранение контекста для кнопки "Назад"
  ui.dataset.context = context;

  isOpen = true;
  ui.style.display = 'flex';
  registerModalOpen(MODAL_ID);

  // Загрузка спрайтов
  loadCharacterSprites();
  // Настройка кнопки
  setupButtons();

  // Принудительная остановка сердцебиения
  import('../../audio/audioManager.js').then(({ audio }) => {
    audio.sound.stopLowHPSound();
  });

  // Пауза игры
  Game.pauseTime();
  audio.isGameActive = false;
  audio.pause();

  if (Game.isRunning) Game.stopLoop();
}

/**
 * Настройка кнопок выбора персонажа
 * 
 * @returns {void}
 * @private
 */
function setupButtons() {
  // Карточки кликабельны
  document.querySelectorAll('.character-card').forEach(card => {
    // Удаление старых обработчиков
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    
    newCard.addEventListener('click', () => {
      const gender = newCard.dataset.gender;
      if (gender === 'random') handleRandomSelect(newCard);
      else handleSelect(gender, newCard);
    });
  });

  // Кнопка отмены
  const cancelBtn = document.getElementById('character-select-cancel');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      handleCancel();
    });
  }
}

/**
 * Обработка нажатия на кнопку "Назад"
 * 
 * @returns {void}
 * @private
 */
function handleCancel() {
  closeCharacterSelect();
  
  // Контекст gameOver — возвращение в главное меню
  if (currentContext === 'gameOver') {
    // Выход в главное меню без подтверждения (сохранение уже удалено)
    exitToMainMenu(true);
  }
  // Контекст menu — просто закрытие окна (остаёмся в меню)
}

/**
 * Обработка выбора персонажа
 * 
 * @param {string} gender - 'male' или 'female'
 * @param {HTMLElement} card - Элемент карточки
 * @returns {void}
 * @private
 */
function handleSelect(gender, card) {
  if (selectedGender) return;
  selectedGender = gender;

  // Применение характеристик
  applyGenderStats(gender);

  // Если магазин уже открыт — обновление UI
  if (state.isShopOpen) {
    import('../shop/index.js').then(module => {
      if (module.updateShopUIForExternal) setTimeout(module.updateShopUIForExternal, 100);
    });
  }

  // Подсветка выбранной карточки
  card.classList.add('selected');

  // Все остальные карточки невзрачные
  const allCards = document.querySelectorAll('.character-card');
  allCards.forEach((otherCard) => {
    if (otherCard !== card) {
      otherCard.classList.add('dimmed');
    }
  });

  // Запуск завершения выбора через небольшую задержку
  setTimeout(() => {
    if (onSelectCallback) onSelectCallback(gender);
    closeCharacterSelect();
    selectedGender = null;
  }, 700);
}

/**
 * Обработка случайного выбора
 * 
 * @param {HTMLElement} card - Элемент карточки
 * @returns {void}
 * @private
 */
function handleRandomSelect(card) {
  if (selectedGender) return;

  // Случайный выбор
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  selectedGender = gender;

  // Применение характеристик
  applyGenderStats(gender);
  // Подсветка выбранной карточки
  card.classList.add('selected');

  // Все остальные карточки невзрачные
  const allCards = document.querySelectorAll('.character-card');
  allCards.forEach((otherCard) => {
    if (otherCard !== card) {
      otherCard.classList.add('dimmed');
    }
  });

  // Запуск завершения выбора через небольшую задержку
  setTimeout(() => {
    if (onSelectCallback) onSelectCallback(gender);
    closeCharacterSelect();
    selectedGender = null;
  }, 700);
}

/**
 * Закрытие окна выбора персонажа
 * 
 * @returns {void}
 */
export function closeCharacterSelect() {
  const ui = document.getElementById('character-select-ui');
  if (ui) ui.style.display = 'none';

  // Сброс всех состояний с карточек
  document.querySelectorAll('.character-card').forEach(el => {
    el.classList.remove('selected', 'dimmed');
  });

  isOpen = false;
  registerModalClose(MODAL_ID);

  selectedGender = null;

  // Возобновление игры
  Game.resumeTime();
  audio.isGameActive = true;
  audio.resume();

  if (!Game.isRunning) Game.startLoop();
}

/**
 * Проверка, открыто ли окно выбора персонажа
 * 
 * @returns {boolean} - true, если окно открыто
 */
export function isCharacterSelectOpen() {
  return isOpen;
}