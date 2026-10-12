/**
 * @fileoverview Логика взаимодействия с лавкой торговца.
 * @module entities/player/interactions/shop
 */

import { CONFIG, state, player } from '../../../core/config/index.js';
import { INTERACTION_CONFIG } from './config.js';
import { getObjectWorldPos, isPlayerNear } from './helpers.js';
import { audio } from '../../../audio/audioManager.js';
import { isTemplateLoaded, loadTemplateIfNeeded } from '../../../utils/htmlLoader.js';

/**
 * Проверка, находится ли игрок рядом с лавкой
 * 
 * @returns {boolean} - true, если игрок рядом с лавкой
 */
export function isNearShop() {
  if (state.isBossLevel) return false;
  if (CONFIG.shopPos.x < 0 || CONFIG.shopPos.y < 0) return false;
  
  const config = INTERACTION_CONFIG.shop;
  const pos = getObjectWorldPos(CONFIG.shopPos.x, CONFIG.shopPos.y, config.offsetsKey);
  return isPlayerNear(pos.x, pos.y, config.radius);
}

/**
 * Обновление подсказки магазина
 * 
 * @returns {void}
 */
export function updateShopPrompt() {
  // Безопасная комната
  if (state.inSafeRoom) {
    if (state.isShopOpen || player.hp <= 0) {
      state.showShopPrompt = false;
      return;
    }
    
    state.showShopPrompt = isNearShop();
    return;
  }

  // Основной лабиринт
  if (state.isShopOpen || state.isBossLevel || player.hp <= 0) {
    state.showShopPrompt = false;
    return;
  }

  // Подсказка только на уровнях 2-4
  if (state.gameLevel >= 5) {
    state.showShopPrompt = false;
    return;
  }

  state.showShopPrompt = isNearShop();
}

/**
 * Обработка нажатия E на лавке
 * 
 * @returns {Promise<boolean>} - true, если взаимодействие выполнено
 */
export async function interactWithShop() {
  if (!isNearShop()) return false;
  
  // Диалог с NPC -> магазин
  const { interactWithTrader } = await import('../../../systems/dialogs/npcInteraction.js');
  const result = await interactWithTrader();
  
  if (result === 'open_shop') {
    await openShop();
    return true;
  }
  
  // Диалог выполнен, даже если магазин не открылся
  return true;
}

/**
 * Открытие UI магазина
 * 
 * @returns {Promise<void>}
 * @private
 */
async function openShop() {
  if (state.isShopOpen) return;

  // Загрузка шаблона магазина
  if (!isTemplateLoaded('shop')) await loadTemplateIfNeeded('shop');

  // Импорт модуля магазина
  const shopModule = await import('../../../systems/ui/shop/index.js');

  // Инициализация обработчиков
  if (shopModule.initShopHandlers) shopModule.initShopHandlers();

  // Открытие магазина
  state.isShopOpen = true;
  const shopUI = document.getElementById('shop-ui');
  if (shopUI) shopUI.style.display = 'block';

  // Регистрация модального окна
  const { registerModalOpen } = await import('../../../systems/ui/modalManager.js');
  registerModalOpen('shop');

  // Обновление UI магазина
  if (shopModule.updateShopUIForExternal) {
    setTimeout(shopModule.updateShopUIForExternal, 50);
  }

  // Остановка игрового цикла
  const { Game } = await import('../../../core/game.js');
  Game.stopLoop();
  Game.pauseTime();
  audio.pause();
  audio.setGameState(false);

  Game.updateUI();
}