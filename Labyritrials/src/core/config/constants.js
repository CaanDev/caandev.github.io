/**
 * @fileoverview Глобальные константы и статические настройки игры.
 * Содержит все конфигурационные параметры: размеры карты, настройки боя, магазина,
 * частиц, порталов и другие игровые параметры.
 * 
 * @module config
 */

import { COLORS } from './colors.js';

/**
 * @namespace CONFIG
 * @description Объект со всеми настройками игры.
 * Изменение этих параметров влияет на игровой процесс и производительность.
 */
export const CONFIG = {
  // ============================================================
  // БАЗОВЫЕ РАЗМЕРЫ КАРТЫ
  // ============================================================
  
  /** @type {number} - Минимальное количество колонок */
  baseCols: 35,
  /** @type {number} - Минимальное количество строк */
  baseRows: 35,
  /** @type {number} - Текущее количество колонок */
  cols: 35,
  /** @type {number} - Текущее количество строк */
  rows: 35,
  
  // ============================================================
  // НАСТРОЙКИ ОСВЕЩЕНИЯ И ТУМАНА
  // ============================================================
  
  /** @type {Object} - Настройки тумана войны */
  fog: {
    /** @type {number} - Базовый радиус видимости */
    baseRadius: 550,
    /** @type {number} - Минимальный радиус видимости */
    minRadius: 300,
    /** @type {number} - Максимальный радиус видимости */
    maxRadius: 900,
    /** @type {number} - Задержка затухания памяти о клетках */
    memoryFadeDelay: 900,
    /** @type {number} - Длительность затухания памяти */
    memoryFadeDuration: 900,
    /** @type {Object} - Цвета событий для тумана */
    eventColors: COLORS.fog.events,
  },
  
  /** @type {Object} - Уровни освещения */
  lightLevels: {
    bright: { radius: 720, intensity: 0.92 },
    normal: { radius: 620, intensity: 0.85 },
    dim: { radius: 480, intensity: 0.72 },
    magic: { radius: 750, intensity: 0.9, color: COLORS.effects.magic }
  },
  
  /** @type {number} - Плавность изменения освещения */
  lightSmoothness: 0.05,
  
  // ============================================================
  // НАСТРОЙКИ МАГАЗИНА
  // ============================================================
  
  /** @type {Object} - Настройки магазина */
  shop: {
    /** @type {number} - Минимальный уровень для появления магазина */
    minLevel: 2,
    /** @type {number} - Базовая цена улучшения HP */
    hpBaseCost: 30,
    /** @type {number} - Множитель роста цены HP */
    hpCostMultiplier: 1.25,
    /** @type {number} - Максимальная цена HP */
    hpMaxCost: 200,
    /** @type {number} - Базовая цена улучшения урона */
    dmgBaseCost: 40,
    /** @type {number} - Множитель роста цены урона */
    dmgCostMultiplier: 1.25,
    /** @type {number} - Максимальная цена урона */
    dmgMaxCost: 250,
    /** @type {number} - Стоимость карты */
    mapCost: 70,
    /** @type {number} - Стоимость огненного шара */
    fireballCost: 200,
    /** @type {number} - Минимальный уровень для огненного шара */
    fireballMinLevel: 10,
    /** @type {number} - Стоимость посоха вампира */
    vampireStaffCost: 400,
    /** @type {number} - Минимальный уровень для посоха вампира */
    vampireStaffMinLevel: 12,
    /** @type {number} - Стоимость громового посоха */
    stunStaffCost: 200,
    /** @type {number} - Минимальный уровень для громового посоха */
    stunMinLevel: 4,
  },
  
  // ============================================================
  // РАЗМЕРЫ ИГРОВОГО МИРА
  // ============================================================
  
  /** @type {number} - Размер арены босса */
  bossArenaSize: 25,
  /** @type {number} - Размер одной клетки в пикселях */
  cellSize: 120,
  /** @type {number} - Толщина стен */
  wallThickness: 6,
  
  /** @type {Object} - Позиция магазина (обновляется динамически) */
  shopPos: { x: 1, y: 1 },
  /** @type {Object} - Позиция выхода с уровня */
  goal: { x: 12, y: 12 },
  
  // ============================================================
  // НАСТРОЙКИ ПУТЕЙ (Pathfinding)
  // ============================================================
  
  /** @type {boolean} - Включен ли поиск пути */
  pathfindingEnabled: true,
  /** @type {number} - Задержка обновления путей (в кадрах) */
  pathUpdateDelay: 30,
  
  // ============================================================
  // СИСТЕМА УКЛОНЕНИЯ ОТ ЛОВУШЕК
  // ============================================================
  
  /** @type {number} - Базовая вероятность уклонения */
  baseEvasionChance: 0.5,
  /** @type {number} - Снижение шанса за каждого побеждённого босса */
  evasionDecayPerBoss: 0.05,
  /** @type {number} - Минимальная вероятность уклонения */
  minEvasionChance: 0.1,
  
  // ============================================================
  // НАСТРОЙКИ АЛТАРЕЙ
  // ============================================================
  
  /** @type {number} - Шанс появления алтаря */
  shrineSpawnChance: 0.35,
  /** @type {number} - Максимальное количество попыток размещения */
  shrineMaxAttempts: 400,
  /** @type {number} - Минимальное количество сплошных стен вокруг */
  shrineMinSolidWalls: 6,
  
  // ============================================================
  // НАСТРОЙКИ ФАКЕЛОВ
  // ============================================================
  
  /** @type {number} - Шанс появления факела */
  torchSpawnChance: 0.06,
  /** @type {number} - Радиус активации факела */
  torchActivationRadius: 180,
  /** @type {number} - Длительность появления факела (кадры) */
  torchFadeInDuration: 20,
  /** @type {number} - Радиус света от факела */
  torchLightRadius: 140,
  /** @type {number} - Скорость мерцания факела */
  torchFlickerSpeed: 0.01,
  
  // ============================================================
  // НАСТРОЙКИ ЧАСТИЦ ФАКЕЛОВ
  // ============================================================
  
  /** @type {number} - Шанс появления частицы */
  particleSpawnChance: 0.1,
  /** @type {number} - Жизнь частицы (кадры) */
  particleLife: 50,
  /** @type {number} - Минимальный размер частицы */
  particleMinSize: 1,
  /** @type {number} - Максимальный размер частицы */
  particleMaxSize: 3,
  /** @type {number} - Максимальное количество частиц */
  particleMaxCount: 40,

  // ============================================================
  // МАКСИМАЛЬНОЕ КОЛИЧЕСТВО ЧАСТИЦ ПО ТИПАМ
  // ============================================================
  
  /** @type {Object} - Лимиты частиц для оптимизации */
  maxParticles: {
    /** @type {number} */
    gold: 60,
    /** @type {number} */
    artifact: 40,
    /** @type {number} */
    potion: 40,
    /** @type {number} */
    spark: 120,
    /** @type {number} */
    blood: 60,
    /** @type {number} */
    fire: 50,
    /** @type {number} */
    reality: 30,
    /** @type {number} */
    rune: 40,
    /** @type {number} */
    bossExplosion: 200
  },

  // ============================================================
  // ПАРАМЕТРЫ ЧАСТИЦ ПО ТИПАМ
  // ============================================================
  
  /** @type {Object} - Параметры генерации частиц */
  particles: {
    /** @type {Object} - Параметры частиц золота */
    gold: {
      countMin: 8,
      countMax: 35,
      life: 40,
      sizeMin: 2,
      sizeMax: 4,
    },
    /** @type {Object} - Параметры частиц артефактов */
    artifact: {
      countMin: 6,
      countMax: 20,
      life: 50,
      sizeMin: 2,
      sizeMax: 5,
    },
    /** @type {Object} - Параметры частиц зелий */
    potion: {
      countMin: 3,
      countMax: 15,
      life: 50,
      sizeMin: 2,
      sizeMax: 4,
    },
    /** @type {Object} - Параметры искр */
    spark: {
      countMin: 12,
      countMax: 28,
      lifeMin: 20,
      lifeMax: 60,
      sizeMin: 2,
      sizeMax: 5,
    },
    /** @type {Object} - Параметры капель крови */
    blood: {
      countMin: 3,
      countMax: 7,
      life: 600,
      sizeMin: 12,
      sizeMax: 37,
      opacity: 0.35,
    },
    /** @type {Object} - Параметры светлячков */
    firefly: {
      countMin: 4,
      countMax: 10,
      size: 1.8,
      radiusMin: 8,
      radiusMax: 18,
    },
    /** @type {Object} - Параметры взрыва босса */
    bossExplosion: {
      countMin: 120,
      countMax: 200,
      secondaryCount: 60,
    },
  },
  
  // ============================================================
  // НАСТРОЙКИ СВЕТЯЩИХСЯ ГЛАЗ МОНСТРОВ
  // ============================================================
  
  /** @type {Object} - Настройки глаз монстров */
  glowingEyes: {
    /** @type {boolean} - Включены ли светящиеся глаза */
    enabled: true,
    /** @type {number} - Минимальная дистанция видимости */
    minDistance: 500,
    /** @type {number} - Максимальная дистанция видимости */
    maxDistance: 800,
    /** @type {number} - Радиус свечения */
    glowRadius: 6,
    /** @type {number} - Размер глаза относительно радиуса монстра */
    eyeSizeRatio: 0.25,
    /** @type {number} - Смещение глаза относительно центра */
    eyeOffsetRatio: 0.35,
    /** @type {number} - Интенсивность свечения */
    intensity: 0.8,
    /** @type {Object} - Цвета глаз */
    colors: COLORS.monsters.eyes,
  },
  
  // ============================================================
  // НАСТРОЙКИ КРОВАВЫХ ПЯТЕН
  // ============================================================
  
  /** @type {number} - Базовая прозрачность крови */
  bloodBaseOpacity: 0.5,
  /** @type {number} - Минимальный размер пятна */
  bloodSizeMin: 12,
  /** @type {number} - Максимальный размер пятна */
  bloodSizeMax: 37,
  /** @type {number} - Время жизни пятна (кадры) */
  bloodLifeTime: 300,
  
  // ============================================================
  // НАСТРОЙКИ ПОРТАЛОВ
  // ============================================================
  
  /** @type {Object} - Типы порталов */
  portalTypes: {
    normal: { color: COLORS.portals.normal, icon: '🌀' },
    secret: { color: COLORS.portals.secret, icon: '🌟' },
    exit: { color: COLORS.portals.exit, icon: '🚪' }
  },
  
  /** @type {number} - Шанс появления портала в сокровищницу */
  treasurePortalChance: 0.30,
  /** @type {number} - Шанс появления портала в комнату с алтарём */
  shrinePortalChance: 0.30,
  /** @type {number} - Шанс появления портала в комнату-ловушку */
  trapPortalChance: 0.25,
  
  /** @type {number} - Размер карты сокровищницы */
  treasureMapSize: 15,
  /** @type {number} - Размер комнаты с алтарём */
  shrineRoomSize: 11,

  // ============================================================
  // НАСТРОЙКИ БЕЗОПАСНОЙ КОМНАТЫ
  // ============================================================
  
  /** @type {Object} - Настройки безопасной комнаты */
  safeRoom: {
    /** @type {number} - Размер комнаты */
    size: 9,
    /** @type {number} - Минимальный уровень для появления */
    minLevel: 6,
    /** @type {string} - Цвет портала */
    portalColor: '#3498db',
  },

  // ============================================================
  // НАСТРОЙКИ КЭШИРОВАНИЯ
  // ============================================================
  
  /** @type {Object} - Настройки кэшей */
  cache: {
    /** @type {Object} - Кэш путей */
    path: {
      maxSize: 500,
      ttl: 30000
    },
    /** @type {Object} - Кэш расстояний */
    distance: {
      maxSize: 300,
      ttl: 1000
    },
    /** @type {Object} - Кэш видимости */
    visibility: {
      maxSize: 200,
      ttl: 500
    },
    /** @type {Object} - Кэш сетки */
    grid: {
      maxSize: 100,
      ttl: 10000
    }
  },

  // ============================================================
  // ПАРАМЕТРЫ ПОИСКА ПУТИ
  // ============================================================
  
  /** @type {Object} - Настройки поиска пути */
  pathfinding: {
    /** @type {boolean} - Включён ли поиск пути */
    enabled: true,
    /** @type {number} - Задержка обновления (кадры) */
    updateDelay: 60,
    /** @type {number} - Максимальное количество шагов */
    maxSteps: 150,
    /** @type {number} - Максимальная дистанция поиска */
    maxDistance: 30,
    /** @type {boolean} - Использовать кэш */
    cacheEnabled: true
  },
};

export { COLORS };