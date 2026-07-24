/**
 * @fileoverview Общее динамическое состояние игрового мира.
 * Содержит все игровые объекты, флаги и данные о состоянии игры.
 * 
 * @module core/config/state
 */

/**
 * @namespace state
 * @description Глобальное состояние игры.
 * Изменяется в процессе игры и частично сохраняется.
 */
export const state = {
  // ============================================================
  // ИГРОВОЙ МИР
  // ============================================================
  
  /** @type {string} - Текущий биом ('cave', 'ice', 'sand') */
  currentBiome: 'cave',
  /** @type {Array[]} - Двумерная сетка лабиринта */
  grid: [],
  /** @type {Array} - Зоны освещения */
  lightZones: [],
  /** @type {Array} - Монстры на уровне */
  monsters: [],
  /** @type {Array} - Предметы на полу (золото, зелья) */
  lootItems: [],
  /** @type {Array} - Ловушки */
  traps: [],
  /** @type {Array} - Артефакты */
  artifacts: [],
  /** @type {Array} - Сундуки */
  chests: [],
  /** @type {Array} - Святилища (алтари) */
  shrines: [],
  /** @type {Array} - Руны */
  runes: [],
  /** @type {Array} - Следы игрока */
  playerTrails: [],
  /** @type {Array} - Тексты урона */
  damageTexts: [],
  /** @type {Array} - Огненные шары */
  fireballs: [],
  /** @type {Array} - Факелы */
  torches: [],
  /** @type {Array} - Частицы огня от факелов */
  fireParticles: [],
  
  // ============================================================
  // ВВОД
  // ============================================================
  
  /** @type {Object} - Состояние клавиш */
  keys: {},
  
  // ============================================================
  // ПРОГРЕСС
  // ============================================================
  
  /** @type {number} - Текущий уровень игры */
  gameLevel: 1,
  /** @type {boolean} - Открыт ли магазин */
  isShopOpen: false,
  /** @type {boolean} - Показывать ли подсказку магазина */
  showShopPrompt: false,
  /** @type {number} - Сила тряски экрана */
  screenShake: 0,
  
  // ============================================================
  // ЧАСТИЦЫ
  // ============================================================
  
  /** @type {Array} - Частицы золота */
  goldParticles: [],
  /** @type {Array} - Частицы артефактов */
  artifactParticles: [],
  /** @type {Array} - Частицы зелий */
  potionParticles: [],
  /** @type {Array} - Искры */
  sparks: [],
  /** @type {Array} - Колонны */
  pillars: [],
  /** @type {Object|null} - Ударная волна */
  shockwave: null,
  
  // ============================================================
  // ПОРТАЛЫ
  // ============================================================
  
  /** @type {Object|null} - Выходной портал */
  exitPortal: null,
  /** @type {Array} - Оригинальные факелы (для восстановления) */
  originalTorches: [],
  
  // ============================================================
  // СУЩЕСТВА
  // ============================================================
  
  /** @type {Array} - Мухи (над сундуками-мимиками) */
  flies: [],
  /** @type {Array} - Светлячки (у порталов) */
  fireflies: [],
  
  // ============================================================
  // ФЛАГИ СОСТОЯНИЯ
  // ============================================================
  
  /** @type {boolean} - Идёт ли очистка данных */
  isClearingData: false,
  /** @type {boolean} - Босс-уровень */
  isBossLevel: false,
  /** @type {boolean} - Идёт респавн */
  isRespawning: false,
  /** @type {boolean} - Показан ли экран смерти */
  gameOverShown: false,
  /** @type {boolean} - Только что загружена игра */
  justLoaded: false,
  /** @type {boolean} - Был ли выдан бонус за зачистку */
  bonusGiven: false,
  /** @type {boolean} - Были ли монстры на уровне */
  hadMonsters: false,
  /** @type {number} - Начальное количество монстров */
  initialMonstersCount: 0,
  
  // ============================================================
  // ЭФФЕКТЫ
  // ============================================================
  
  /** @type {Array} - Кровавые лужи */
  bloodPuddles: [],
  /** @type {Array} - Лучи (атаки боссов) */
  beams: [],
  
  // ============================================================
  // ЗАПИСКИ
  // ============================================================
  
  /** @type {Object} - Система записок */
  notes: {
    /** @type {number[]} - Найденные записки (ID) */
    found: [],
    /** @type {Object} - Заспавненные записки по уровням */
    spawned: {},
    /** @type {Object} - Позиции записок на карте */
    positions: {}
  },
  
  /** @type {boolean} - Показывать ли подсказку записки */
  showNotePrompt: false,
  /** @type {number|null} - ID записки у подсказки */
  notePromptId: null,
  /** @type {number|null} - X позиция записки */
  notePromptX: null,
  /** @type {number|null} - Y позиция записки */
  notePromptY: null,
  
  // ============================================================
  // ВЗРЫВЫ
  // ============================================================
  
  /** @type {Array} - Частицы взрыва */
  explosionParticles: [],
  /** @type {number} - Вспышка взрыва */
  explosionFlash: 0,
  
  // ============================================================
  // ГЕНЕРАТОР
  // ============================================================
  
  /** @type {number|null} - Сид генератора */
  seed: null,
  /** @type {number} - Счётчик случайных чисел */
  randomCounter: 0,
  
  // ============================================================
  // ТУМАН ВОЙНЫ
  // ============================================================
  
  /** @type {Object} - Состояние тумана войны */
  fogState: {
    /** @type {Object} - Память затухания клеток */
    memoryFade: {},
    /** @type {number} - Текущий радиус видимости */
    currentRadius: 800,
    /** @type {number} - Целевой радиус видимости */
    targetRadius: 800,
    /** @type {string|null} - Цвет события */
    eventColor: null,
    /** @type {number} - Интенсивность события */
    eventIntensity: 0
  },
  
  // ============================================================
  // БОСС
  // ============================================================
  
  /** @type {boolean} - Босс готов к бою */
  bossReady: false,
  /** @type {Object} - Отображаемое HP босса (для анимации) */
  bossDisplayHp: {},
  /** @type {Object} - Отображаемое максимальное HP босса */
  bossDisplayMaxHp: {},
  /** @type {boolean} - Босс заспавнен */
  bossSpawned: false,
  /** @type {boolean} - Активирован ли спавн босса */
  bossSpawnTriggered: false,
  /** @type {number} - Таймер спавна босса */
  bossSpawnTimer: 0,
  /** @type {number} - Счётчик дропа миньонов */
  bossMinionDropCounter: 0,
  /** @type {Array} - Взрывы босса */
  bossExplosions: [],
  /** @type {Object} - Круг призыва босса */
  bossSummonCircle: {
    active: true,
    fadeProgress: 0,
    particles: []
  },
  /** @type {Object} - Затемнение перед боссом */
  bossLightFade: {
    active: false,
    progress: 0,
    flashActive: false,
    flashTimer: 0,
  },
  
  // ============================================================
  // СТАТИСТИКА УРОВНЯ
  // ============================================================
  
  /** @type {number} - Всего убито монстров на уровне */
  totalMonstersKilledOnLevel: 0,
  /** @type {boolean} - Флаг "Железный человек" (без урона до босса) */
  ironManActive: true,
  /** @type {boolean} - Флаг "Тень" (без убийств монстров) */
  shadowActive: true,
  
  // ============================================================
  // СЛУЧАЙНЫЕ СОБЫТИЯ
  // ============================================================
  
  /** @type {string|null} - Текущее событие */
  currentEvent: null,
  /** @type {boolean} - Показано ли сообщение о событии */
  eventMessageShown: false,
  /** @type {boolean} - Активна ли Кровавая луна */
  bloodMoonActive: false,
  /** @type {boolean} - Активен ли Ледяной ветер */
  eventIceWindActive: false,
  /** @type {boolean} - Активна ли Ярость монстров */
  eventMonsterRageActive: false,
  
  // ============================================================
  // АДАПТАЦИЯ МОНСТРОВ
  // ============================================================
  
  /** @type {Object} - Активные адаптации монстров */
  monsterAdaptation: {
    fireImmunity: false,
    stunImmunity: false,
    healingBlock: false,
    healthBoost: false,
  },
  /** @type {number} - Уровень адаптации */
  adaptationLevel: 0,
  /** @type {Object} - Счётчики атак для адаптации */
  totalAttacks: {
    fireball: 0,
    stun: 0,
    vampirism: 0,
    magic: 0,
  },
  
  // ============================================================
  // ТАЙНЫЕ КОМНАТЫ (старая система)
  // ============================================================
  
  /** @type {Object|null} - Секретный портал */
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
  
  // ============================================================
  // НАЗВАНИЕ КОМНАТЫ
  // ============================================================
  
  /** @type {string|null} - Название текущей комнаты */
  roomLabel: null,
  /** @type {string|null} - Цвет рамки и текста названия */
  roomLabelColor: null,
  
  // ============================================================
  // ВРЕМЕННЫЕ ДАННЫЕ ДЛЯ ВОССТАНОВЛЕНИЯ
  // ============================================================
  
  /** @type {Object|null} - Оригинальный портал в сокровищницу */
  originalTreasurePortal: null,
  /** @type {Object|null} - Оригинальный портал в комнату с алтарём */
  originalShrinePortal: null,
  /** @type {boolean} - Оригинальный флаг наличия монстров */
  originalHadMonsters: false,
  
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
  
  // ============================================================
  // ЭФФЕКТЫ РЕАЛЬНОСТИ
  // ============================================================
  
  /** @type {Object} - Сдвиг реальности (эффект инверсии) */
  realityShift: {
    active: false,
    intensity: 0,
    timer: 0
  },
  
  // ============================================================
  // СТАТИСТИКА ЗА ВСЮ ИГРУ
  // ============================================================
  
  /** @type {Object} - Статистика прохождения */
  gameStats: {
    maxHpAtEnd: 0,
    hpRemaining: 0,
    goldCollected: 0,
    goldSpent: 0,
    artifactsCollected: 0,
    artifactsTotalPossible: 0,
    monstersKilled: 0,
    bossesTotal: 0,
    weaponHits: {
      default: 0,
      stun: 0,
      vampire: 0,
      fireball: 0
    },
    favoriteWeapon: 'default',
    secretRoomsVisited: 0,
    secretRoomsGenerated: 0,
    trapsTriggered: {
      spike: 0,
      ice: 0,
      acid: 0,
      lightning: 0,
      psionic: 0
    },
    mimicBites: 0,
    playTime: 0,
    playTimeFormatted: '00:00:00'
  },
  
  // ============================================================
  // ВРЕМЯ ИГРЫ
  // ============================================================
  
  /** @type {number} - Аккумулятор времени игры (секунды) */
  playTimeAccumulator: 0,
  /** @type {number} - Время последнего обновления */
  lastUpdateTime: 0
};