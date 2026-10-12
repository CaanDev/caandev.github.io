/**
 * @fileoverview Порталы, тайные комнаты, безопасная комната.
 * 
 * @module core/config/state/roomState
 */

import { state } from './stateBase.js';

Object.assign(state, {
  // ============================================================
  // ТАЙНЫЕ КОМНАТЫ (старая система - частично используется)
  // ============================================================
  
  /** 
   * @type {Object|null} - Секретный портал
   * @deprecated Заменён на treasurePortal / shrinePortal / trapPortal 
   */
  secretPortal: null,
  /** @type {boolean} - В сокровищнице */
  inTreasureRoom: false,
  /** @type {Object|null} - Портал возврата */
  returnPortal: null,
  /** @type {number} - Оригинальное количество колонок */
  originalMapCols: 35,
  /** @type {number} - Оригинальное количество строк */
  originalMapRows: 35,
  /** @type {Array|null} - Оригинальная сетка */
  originalGrid: null,
  /** @type {Object|null} - Оригинальная цель */
  originalGoal: null,
  /** @type {Object|null} - Оригинальная позиция магазина */
  originalShopPos: null,
  /** @type {Array} - Оригинальные монстры */
  originalMonsters: [],
  /** @type {Array} - Оригинальные ловушки */
  originalTraps: [],
  /** @type {Array} - Оригинальные артефакты */
  originalArtifacts: [],
  /** @type {Array} - Оригинальные сундуки */
  originalChests: [],
  /** @type {Array} - Оригинальные святилища */
  originalShrines: [],
  /** @type {Array} - Оригинальные факелы (для восстановления) */
  originalTorches: [],
  /** @type {Array} - Оригинальные мимики (для восстановления) */
  originalMimics: [],
  /** @type {boolean} - Оригинальный флаг наличия монстров */
  originalHadMonsters: false,
  /** @type {boolean|undefined} - Оригинальный флаг бонуса (для восстановления) */
  originalBonusGiven: undefined,

  // ============================================================
  // ВРЕМЕННЫЕ ДАННЫЕ ДЛЯ ВОССТАНОВЛЕНИЯ ПОРТАЛОВ
  // ============================================================
  
  /** @type {Object|null} - Оригинальный портал в сокровищницу */
  originalTreasurePortal: null,
  /** @type {Object|null} - Оригинальный портал в комнату с алтарём */
  originalShrinePortal: null,

  // ============================================================
  // ТАЙНЫЕ КОМНАТЫ (новая система)
  // ============================================================
  
  /** @type {Object|null} - Портал в сокровищницу */
  treasurePortal: null,
  /** @type {Object|null} - Портал выхода из сокровищницы */
  treasureExitPortal: null,
  /** @type {Object|null} - Портал в комнату с алтарём */
  shrinePortal: null,
  /** @type {Object|null} - Портал выхода из комнаты с алтарём */
  shrineExitPortal: null,
  /** @type {boolean} - В комнате с алтарём */
  inShrineRoom: false,
  /** @type {number} - Последний уровень с сокровищницей */
  treasureRoomLastLevel: 0,
  /** @type {number} - Последний уровень с комнатой с алтарём */
  shrineRoomLastLevel: 0,

  // ============================================================
  // БЕЗОПАСНАЯ КОМНАТА
  // ============================================================
  
  /** @type {Object|null} - Портал входа в безопасную комнату */
  safePortal: null,
  /** @type {Object|null} - Портал выхода из безопасной комнаты */
  safeExitPortal: null,
  /** @type {boolean} - В безопасной комнате */
  inSafeRoom: false,
  /** @type {Object|null} - Оригинальный портал для восстановления */
  originalSafePortal: null,
  /** @type {boolean} - Был ли открыт сундук в безопасной комнате */
  safeChestOpened: false,
  /** @type {number} - Время входа в безопасную комнату */
  safeRoomEntranceTime: 0,
  /** @type {boolean} - Показан ли интро-диалог при первом входе */
  safeRoomIntroShown: false,
  /** @type {boolean} - Показана ли реплика торговца о доске заданий */
  taskBoardIntroShown: false,

  // ============================================================
  // КОМНАТА-ЛОВУШКА
  // ============================================================
  
  /** @type {boolean} - В комнате-ловушке */
  inTrapRoom: false,
  /** @type {boolean} - Активирована ли комната-ловушка */
  trapActivated: false,
  /** @type {Object|null} - Портал в комнату-ловушку */
  trapPortal: null,
  /** @type {Object|null} - Фальшивый портал (ловушка) */
  trapFakePortal: null,
  /** @type {Object|null} - Портал выхода из комнаты-ловушки */
  trapExitPortal: null,
  /** @type {number} - Текущая волна */
  trapWave: 0,
  /** @type {number} - Всего монстров в волне */
  trapMonstersTotal: 0,
  /** @type {number} - Убито монстров в волне */
  trapMonstersKilled: 0,
  /** @type {number} - Последний уровень с комнатой-ловушкой */
  trapRoomLastLevel: 0,
  /** @type {Array} - Монстры в комнате-ловушке */
  trapMonsters: [],
  /** @type {boolean} - Активна ли волна */
  trapWaveActive: false,
  /** @type {boolean} - Открыт ли выход */
  trapExitRevealed: false,
  /** @type {boolean} - Загружена ли волна */
  trapWaveLoaded: false,
  /** @type {Set<string>} - ID монстров в комнате-ловушке */
  trapMonsterIds: new Set(),
  /** @type {boolean} - Был ли заспавнен сундук с талисманом охотника на мимиков */
  mimicHunterChestSpawned: false,

  // ============================================================
  // ПРОЧЕЕ
  // ============================================================
  
  /** 
   * @type {Object|null} 
   * @deprecated Заменён на treasureExitPortal / shrineExitPortal / trapExitPortal 
   */
  exitPortal: null,
});