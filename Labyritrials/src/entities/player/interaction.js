/**
 * @fileoverview Взаимодействие игрока с объектами.
 * Обрабатывает открытие сундуков, взаимодействие с записками и другие объекты.
 * 
 * @module entities/player/interaction
 */

import { CONFIG, SPRITE_SIZES, state, player } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';
import { Game } from '../../core/game.js';
import { audio } from '../../audio/audioManager.js';
import { triggerGameOver } from './gameOver.js';
import { removeFlies } from '../objects/fly.js';
import { updateProgress } from '../../systems/achievements/index.js';
import { showItemInfoPopup } from '../../systems/ui/itemInfoPopup.js';
import { getItemData } from '../../data/items.js';
import { playerTakeDamageFromMonster } from './combat.js';
import { canAddItemToInventory, addItemToInventory } from '../../systems/ui/inventory/inventoryUtils.js';

/**
 * Проверка взаимодействия с запиской
 * Сканирует соседние клетки на наличие записок
 * 
 * @returns {void}
 */
export function checkNoteInteraction() {
  if (state.isShopOpen) return;
  if (player.hp <= 0) return;
  
  const playerGridX = Math.floor(player.px / CONFIG.cellSize);
  const playerGridY = Math.floor(player.py / CONFIG.cellSize);
  
  // Проверка соседних клеток (8 направлений)
  const neighbors = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  
  // Расстояние, на котором игрок должен быть от метки на стене
  const proximityThreshold = CONFIG.cellSize * 0.7;
  let foundNote = false;
  
  for (const [dx, dy] of neighbors) {
    const x = playerGridX + dx;
    const y = playerGridY + dy;
    
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) continue;
    
    const cell = state.grid[y]?.[x];
    if (!cell) continue;
    
    if (cell.hasNote && cell.noteId) {
      // Вычисление позиции метки на стене
      const noteId = cell.noteId;
      const seed = noteId * 31 + 17;
      const seededRandom = (offset) => {
        const s = (seed + offset * 7 + 313) % 10000;
        return Math.abs((Math.sin(s) * 43758.5453) % 1);
      };
      
      const margin = 12;
      const availableWidth = CONFIG.cellSize - margin * 2;
      const availableHeight = CONFIG.cellSize - margin * 2;
      
      // Позиция метки на стене (относительно левого верхнего угла клетки)
      const offsetX = margin + seededRandom(100) * availableWidth;
      const offsetY = margin + seededRandom(200) * availableHeight;
      // Глобальная позиция метки
      const noteWorldX = x * CONFIG.cellSize + offsetX;
      const noteWorldY = y * CONFIG.cellSize + offsetY;
      // Расстояние от игрока до метки
      const distToNote = Math.hypot(player.px - noteWorldX, player.py - noteWorldY);
      
      // Игрок должен быть достаточно близко к метке
      if (distToNote < proximityThreshold) {
        state.showNotePrompt = true;
        state.notePromptId = cell.noteId;
        state.notePromptX = x;
        state.notePromptY = y;
        foundNote = true;
        break;
      }
    }
  }
  
  if (!foundNote) {
    state.showNotePrompt = false;
    state.notePromptId = null;
    state.notePromptX = null;
    state.notePromptY = null;
  }
}

/**
 * Взаимодействие со всеми сундуками и мимиками
 * Проверяет, находится ли игрок рядом с сундуком
 * 
 * @returns {void}
 */
export function interactWithChests() {
  // Определение ключа смещения по типу комнаты
  let offsetKey = 'chest';
  if (state.inSafeRoom) offsetKey = 'safeChest';
  else if (state.inTreasureRoom) offsetKey = 'treasureChest';
  else if (state.inTrapRoom) offsetKey = 'trapChest';
  
  const chestOffsets = SPRITE_SIZES.cells.offsets?.[offsetKey] || { x: 0, y: 0 };
  const mimicOffsets = SPRITE_SIZES.cells.offsets?.mimic || { x: 0, y: 0 };

  // Обычные сундуки
  for (let i = state.chests.length - 1; i >= 0; i--) {
    let ch = state.chests[i];

    // Защита от Undefined
    if (!ch) {
      state.chests.splice(i, 1);
      continue;
    }

    // Учёт смещения спрайта сундука
    const chestWorldX = ch.x + chestOffsets.x;
    const chestWorldY = ch.y + chestOffsets.y;

    if (!ch.opened && Math.hypot(player.px - chestWorldX, player.py - chestWorldY) < 45) {
      ch.opened = true;

      switch (ch.type) {
        case 'gold':
          handleGoldChest(ch);
          break;
        case 'artifact':
          handleArtifactChest(ch);
          break;
        case 'potion_chest':
          handlePotionChest(ch);
          break;
        case 'mimic_hunter_chest':
          handleMimicHunterChest(ch);
          break;
        case 'empty':
          handleEmptyChest(ch);
          break;
      }
    }
  }

  // Мимики
  for (let i = state.mimics.length - 1; i >= 0; i--) {
    const mimic = state.mimics[i];
    if (!mimic || mimic.isDead) continue;
    
    // Учёт смещения спрайта мимика
    const mimicWorldX = mimic.x + mimicOffsets.x;
    const mimicWorldY = mimic.y + mimicOffsets.y;
    
    // Проверка, находится ли игрок рядом с мимиком
    if (Math.hypot(player.px - mimicWorldX, player.py - mimicWorldY) < 45) {
      // Проверка кулдауна атаки (1 секунда между укусами)
      const now = Date.now();
      if (!mimic.lastAttackTime || (now - mimic.lastAttackTime) > 1000) {
        // Обновление времени последней атаки
        mimic.lastAttackTime = now;
        
        if (!mimic.countedForAchievement) {
          mimic.countedForAchievement = true;
          updateProgress('mimic_total', 1);
        }
        
        handleMimicAttack(mimic);
      }
    }
  }
}

/**
 * Обработка сундука с золотом
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleGoldChest(ch) {
  let reward = Math.floor(Math.random() * 20) + 15 + state.gameLevel * 2;
  player.gold += reward;
  
  updateProgress('gold_collected', reward);
  state.gameStats.goldCollected += reward;
  
  Game.updateUI();
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `+${reward} 💰`,
    color: COLORS.ui.textGold,
    size: 22, life: 50, speedy: 1.2
  });

  import('../../systems/particles/goldParticles.js').then(module => {
    module.createGoldParticles(ch.x, ch.y, reward);
  });

  // Удаление сундука через 2 секунды
  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 2000);
}

/**
 * Обработка сундука с артефактом
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleArtifactChest(ch) {
  player.artifactsCollected++;
  state.gameStats.artifactsCollected++;
  
  updateProgress('artifacts_collected', 1);
  
  state.damageTexts.push({
    x: ch.x, y: ch.y - 20,
    text: `Артефакт! 👑`,
    color: COLORS.effects.magic,
    size: 24, life: 60, speedy: 1.0
  });

  import('../../systems/particles/artifactParticles.js').then(module => {
    module.createArtifactParticles(ch.x, ch.y);
  });

  // Удаление сундука через 2 секунды
  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 2000);
}

/**
 * Обработка сундука с зельем в безопасной комнате
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handlePotionChest(ch) {
  const healAmount = 50;
  const oldHp = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
  const actualHeal = player.hp - oldHp;
  state.safeChestOpened = true;

  ch.opened = true;

  // Инициализация анимации
  if (ch.fadeTimer === undefined) {
    ch.fadeTimer = 0;
    ch.fadeComplete = false;
    ch.fadeDelay = 0;
  }

  // Создание частиц
  import('../../systems/particles/potionParticles.js').then(module => {
    module.createPotionParticles(ch.x, ch.y, actualHeal);
  });

  if (actualHeal > 0) {
    state.damageTexts.push({
      x: ch.x, y: ch.y - 20,
      text: `+${actualHeal} ❤️`,
      color: COLORS.effects.potion.mid,
      size: 24, life: 50, speedy: 1.2
    });
  } else {
    state.damageTexts.push({
      x: ch.x, y: ch.y - 20,
      text: `❤️ Здоровье максимально!`,
      color: COLORS.ui.textGold,
      size: 18, life: 40, speedy: 1.0
    });
  }
}

/**
 * Обработка атаки мимика
 * 
 * @param {Object} mimic - Объект мимика
 * @returns {void}
 * @private
 */
function handleMimicAttack(mimic) {
  // Открытие мимика при атаке
  mimic.opened = true;
  // Сброс таймера закрытия (будет закрыт через 1.5 секунды)
  mimic.closeTimer = Date.now() + 1500;

  removeFlies(mimic.x, mimic.y);
  
  let maxDamage = Math.floor(player.hp * 0.33);
  let mimicDamage = Math.max(Math.floor(Math.random() * (maxDamage - 5)) + 5, 5);
  
  audio.playSound('monsters.attacks.mimicBite');
  playerTakeDamageFromMonster(mimicDamage);
  state.gameStats.mimicBites++;
  
  state.screenShake = 25;
  state.damageTexts.push({
    x: player.px, y: player.py - 50,
    text: `МИМИК!`,
    color: COLORS.ui.textRed,
    size: 22, life: 40, speedy: 0.8
  });
  
  if (player.hp <= 0) {
    triggerGameOver();
    return;
  }
}

/**
 * Обработка сундука с талисманом охотника на мимиков
 * 
 * @param {Object} ch - Объект сундука
 * @param {number} ch.x - Координата X сундука в пикселях
 * @param {number} ch.y - Координата Y сундука в пикселях
 * @returns {void}
 */
function handleMimicHunterChest(ch) {
  // Проверка, нет ли уже талисмана у игрока
  if (player.inventory?.items?.equipment?.includes('talismanMimicHunter')) {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
    return;
  }

  const chestX = ch.x;
  const chestY = ch.y;

  // Удаление сундука
  const index = state.chests.indexOf(ch);
  if (index !== -1) state.chests.splice(index, 1);

  // Создание талисмана на полу
  state.lootItems.push({
    x: chestX,
    y: chestY,
    type: 'talismanMimicHunter',
    value: 1,
    imageKey: 'talismanMimicHunter',
    requiresInteraction: true,
  });
}

/**
 * Обработка пустого сундука
 * 
 * @param {Object} ch - Объект сундука
 * @returns {void}
 * @private
 */
function handleEmptyChest(ch) {
  // Удаление сундука через 2 секунды
  setTimeout(() => {
    const index = state.chests.indexOf(ch);
    if (index !== -1) state.chests.splice(index, 1);
  }, 2000);
}

/**
 * Проверка интерактивных предметов на полу
 * 
 * Сканирует все предметы на полу в поисках тех, у которых
 * установлен флаг requiresInteraction: true.
 * 
 * Находит ближайший предмет и сохраняет его в state.interactiveItems
 * для отображения подсказки и последующего подбора.
 * 
 * @returns {void}
 */
export function checkInteractiveItems() {
  // Сброс состояния
  state.interactiveItems.showPrompt = false;
  state.interactiveItems.nearestItem = null;
  state.interactiveItems.actionLabel = null;
  
  // Сбор интерактивных предметов (с флагом requiresInteraction)
  const interactiveLoot = state.lootItems.filter(item => 
    item.requiresInteraction === true
  );
  
  if (interactiveLoot.length === 0) return;
  
  // Поиск ближайшего предмета
  let nearest = null;
  let nearestDist = Infinity;
  
  for (const item of interactiveLoot) {
    const dist = Math.hypot(player.px - item.x, player.py - item.y);
    // Радиус взаимодействия — 45 пикселей
    if (dist < 45 && dist < nearestDist) {
      nearestDist = dist;
      nearest = item;
    }
  }
  
  if (nearest) {
    state.interactiveItems.showPrompt = true;
    state.interactiveItems.nearestItem = nearest;
    state.interactiveItems.actionLabel = getItemActionLabel(nearest.type);
  }
}

/**
 * Получение текста действия для предмета
 * 
 * @param {string} itemType - Тип предмета
 * @returns {string} - Текст для подсказки
 */
function getItemActionLabel(itemType) {
  const labels = {
    'talismanMimicHunter': 'Подобрать талисман',
    'spiritCatcher': 'Подобрать "Ловец духов"',
    'batWing': 'Подобрать',
  };
  return labels[itemType] || 'Подобрать';
}

/**
 * Подбор интерактивного предмета с пола по нажатию E
 * 
 * @returns {void}
 */
export function pickupInteractiveItem() {
  if (!state.interactiveItems.showPrompt) return;
  if (!state.interactiveItems.nearestItem) return;
  
  const item = state.interactiveItems.nearestItem;
  const itemData = getItemData(item.type);

  // Проверка возможности подбора с учётом типа предмета
  if (itemData?.requiresInteraction) {
    // Снаряжение (equipment) - проверяется, нет ли уже такого предмета
    // Снаряжение не занимает ячейки обычных предметов, оно кладётся в слоты экипировки
    if (itemData.type === 'equipment') {
      const alreadyOwned = player.inventory?.items?.equipment?.includes(item.type) || false;
      if (alreadyOwned) {
        state.damageTexts.push({
          x: player.px,
          y: player.py - 50,
          text: 'Уже есть в инвентаре!',
          color: '#ff4444',
          size: 18,
          life: 60,
          speedy: 0.5
        });
        // Удаление предмета с пола
        const index = state.lootItems.indexOf(item);
        if (index !== -1) state.lootItems.splice(index, 1);
        return;
      }
    } else {
      // Обычные предметы - проверка на свободную ячейку
      if (!canAddItemToInventory(item.type, 1)) {
        state.damageTexts.push({
          x: player.px,
          y: player.py - 50,
          text: 'Инвентарь полон!',
          color: '#ff4444',
          size: 18,
          life: 60,
          speedy: 0.5
        });
        // Предмет остаётся на полу
        return;
      }
    }
  }

  // Проверка, нужно ли показывать popup
  if (itemData?.showPopup) {
    // Отображение окна с выбором
    showItemInfoPopup(
      item,
      // onTake - взять предмет
      (selectedItem) => {
        handleItemPickup(selectedItem);
      },
      // onLeave - оставить предмет (ничего не делать)
      (selectedItem) => {
        // Предмет остаётся на полу
        state.interactiveItems.showPrompt = false;
        state.interactiveItems.nearestItem = null;
      }
    );
    return;
  }
  
  handleItemPickup(item);
}

/**
 * Обработка подбора предмета (универсальная)
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 */
function handleItemPickup(item) {
  switch (item.type) {
    case 'talismanMimicHunter':
      pickupTalismanMimicHunter(item);
      break;
    case 'spiritCatcher':
      pickupSpiritCatcher(item);
      break;
    case 'batWing':
      pickupBatWing(item);
      break;
    default:
      removeItemFromLoot(item);
      break;
  }
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
  state.interactiveItems.showPrompt = false;
  state.interactiveItems.nearestItem = null;
}

/**
 * Подбор талисмана охотника на мимиков
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 */
function pickupTalismanMimicHunter(item) {
  // Проверка, нет ли уже талисмана
  if (player.inventory?.items?.equipment?.includes('talismanMimicHunter')) {
    removeItemFromLoot(item);
    return;
  }
  
  // Добавление в инвентарь
  if (!player.inventory) player.inventory = { equipped: {}, items: { equipment: [] } };
  if (!player.inventory.items) player.inventory.items = { equipment: [] };
  if (!player.inventory.items.equipment) player.inventory.items.equipment = [];
  
  player.inventory.items.equipment.push('talismanMimicHunter');
  audio.playSound('interactions.equip');
  
  removeItemFromLoot(item);
}

/**
 * Подбор "Ловца духов"
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 */
function pickupSpiritCatcher(item) {
  // Проверка, нет ли уже Ловца духов
  if (player.inventory?.items?.equipment?.includes('spiritCatcher')) {
    removeItemFromLoot(item);
    return;
  }
  
  // Добавление в инвентарь
  if (!player.inventory) player.inventory = { equipped: {}, items: { equipment: [] } };
  if (!player.inventory.items) player.inventory.items = { equipment: [] };
  if (!player.inventory.items.equipment) player.inventory.items.equipment = [];
  
  player.inventory.items.equipment.push('spiritCatcher');
  audio.playSound('interactions.equip');
  
  removeItemFromLoot(item);
  
  // Обновление прогресса задания Астрид
  import('../../entities/npc/researcher/manager.js').then(module => {
    module.checkResearcherQuestReady();
  });
}

/**
 * Подбор крыла летучей мыши
 * 
 * @param {Object} item - Объект предмета
 * @returns {void}
 */
function pickupBatWing(item) {
  // Проверка наличия места в инвентаре
  if (!canAddItemToInventory('batWing', 1)) {
    state.damageTexts.push({
      x: player.px,
      y: player.py - 50,
      text: 'Инвентарь полон!',
      color: '#ff4444',
      size: 18,
      life: 60,
      speedy: 0.5
    });
    // Предмет остаётся на полу
    return;
  }

  // Инициализация инвентаря
  if (!player.inventory) player.inventory = {};
  if (!player.inventory.items) player.inventory.items = {};
  if (!player.inventory.items.counts) player.inventory.items.counts = {};
  
  const currentCount = player.inventory.items.counts['batWing'] || 0;
  const MAX_STACK = 50;
  
  // Проверка лимита
  if (currentCount >= MAX_STACK) {
    // Отображение уведомления
    state.damageTexts.push({
      x: player.px,
      y: player.py - 30,
      text: `Превышен лимит!`,
      color: COLORS.ui.textRed,
      size: 18,
      life: 50,
      speedy: 0.8
    });
    // не подбирается
    return;
  }
  
  // Добавление крыла
  player.inventory.items.counts['batWing'] = currentCount + 1;
  
  // Добавление в available (если ещё нет)
  if (!player.inventory.items.available) player.inventory.items.available = [];
  if (!player.inventory.items.available.includes('batWing')) player.inventory.items.available.push('batWing');

  // Обновление прогресса заданий
  import('../../systems/quests/index.js').then(({ trackItemPickup }) => {
    trackItemPickup('batWing', 1);
  });
  
  // Отображение уведомления "+1"
  state.damageTexts.push({
    x: player.px,
    y: player.py - 30,
    text: `🦇 +1`,
    color: COLORS.ui.textGold,
    size: 18,
    life: 40,
    speedy: 1.0
  });
  
  // Удаление с пола
  removeItemFromLoot(item);
  // Воспроизведение звука подбора
  audio.playSound('interactions.equip');
}