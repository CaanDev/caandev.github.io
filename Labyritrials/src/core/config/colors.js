/**
 * @fileoverview Централизованное хранилище всех цветов игры.
 * 
 * Структура цветов:
 *   1. Базовые цвета (фон, тени, туман)
 *   2. Лабиринт (пол, стены, колонны)
 *   3. Игрок и монстры
 *   4. Эффекты и ловушки
 *   5. UI и интерфейс
 *   6. Портал и предметы
 *   7. Частицы и искры
 * 
 * @module colors
 */

/**
 * @namespace COLORS
 * @description Объект со всеми цветами игры.
 * Сгруппирован по категориям для удобного доступа и изменения.
 */
export const COLORS = {
  // ============================================================
  // 1. БАЗОВЫЕ ЦВЕТА
  // ============================================================
  
  /**
   * @namespace COLORS.background
   * @description Цвета фона и затемнений
   */
  background: {
    /** @type {string} - Основной цвет фона */
    main: '#050508',
    /** @type {string} - Тёмный цвет фона */
    dark: '#000000',
    /** @type {string} - Цвет затемнения (полупрозрачный) */
    overlay: 'rgba(0, 0, 0, 0.85)',
  },

  /**
   * @namespace COLORS.shadows
   * @description Цвета теней различной интенсивности
   */
  shadows: {
    /** @type {string} - Сильная тень */
    strong: 'rgba(0, 0, 0, 0.5)',
    /** @type {string} - Средняя тень */
    medium: 'rgba(0, 0, 0, 0.3)',
    /** @type {string} - Лёгкая тень */
    light: 'rgba(0, 0, 0, 0.15)',
    /** @type {string} - Тень от колонн */
    pillar: 'rgba(60, 60, 80, 0.3)',
    /** @type {string} - Магическая тень */
    magic: 'rgba(150, 120, 255, 0.06)',
    /** @type {string} - Внутренняя магическая тень */
    magicInner: 'rgba(200, 180, 255, 0.02)',
  },

  /**
   * @namespace COLORS.fog
   * @description Цвета тумана войны и его эффектов
   */
  fog: {
    /** @type {Object} - Градиент тумана */
    gradient: {
      center: 'rgba(0, 0, 0, 0)',
      inner: 'rgba(0, 0, 0, 0.02)',
      mid: 'rgba(0, 0, 0, 0.08)',
      outer: 'rgba(0, 0, 0, 0.20)',
      far: 'rgba(0, 0, 0, 0.45)',
      farther: 'rgba(0, 0, 0, 0.70)',
      edge: 'rgba(0, 0, 0, 0.88)',
      full: 'rgba(0, 0, 0, 0.97)',
    },
    /** @type {Object} - Цвета событий для тумана */
    events: {
      bloodMoon: { r: 180, g: 30, b: 30, alpha: 0.15 },
      iceWind: { r: 30, g: 120, b: 200, alpha: 0.12 },
      blessing: { r: 255, g: 215, b: 0, alpha: 0.08 },
      monsterRage: { r: 200, g: 50, b: 0, alpha: 0.1 },
      fragility: { r: 100, g: 20, b: 50, alpha: 0.1 },
    },
    /** @type {Object} - Визуальные эффекты событий */
    effects: {
      bloodMoon: {
        color1: 'rgba(180, 30, 30, ',
        color2: 'rgba(150, 20, 20, ',
        color3: 'rgba(120, 15, 15, ',
        color4: 'rgba(80, 10, 10, 0)',
        spark: '#ff2200',
        sparkShadow: '#ff2200',
        vignette1: 'rgba(100, 10, 10, ',
        vignette2: 'rgba(60, 5, 5, ',
      },
      iceWind: {
        color1: 'rgba(30, 150, 220, ',
        color2: 'rgba(20, 120, 200, ',
        color3: 'rgba(15, 90, 170, ',
        color4: 'rgba(10, 60, 140, 0)',
        spark: '#88ddff',
        sparkShadow: '#66ccff',
        frost1: 'rgba(100, 180, 255, ',
        frost2: 'rgba(60, 140, 220, ',
      },
      blessing: {
        color1: 'rgba(255, 230, 100, ',
        color2: 'rgba(255, 215, 50, ',
        color3: 'rgba(255, 200, 30, ',
        color4: 'rgba(255, 180, 0, 0)',
        ray: 'rgba(255, 215, 0, 0.1)',
        spark: '#ffdd44',
        sparkShadow: '#ffdd44',
      },
      monsterRage: {
        color1: 'rgba(255, 100, 20, ',
        color2: 'rgba(230, 70, 10, ',
        color3: 'rgba(200, 50, 0, ',
        color4: 'rgba(150, 30, 0, 0)',
        shadow1: 'rgba(50, 20, 0, ',
        shadow2: 'rgba(30, 10, 0, ',
        flash: '#ff4400',
        flashShadow: '#ff4400',
      },
      fragility: {
        color1: 'rgba(150, 30, 100, ',
        color2: 'rgba(120, 20, 80, ',
        color3: 'rgba(90, 15, 60, ',
        color4: 'rgba(60, 10, 40, 0)',
        crack: '#8b3a6b',
        spark: '#4a1a3a',
        sparkShadow: '#4a1a3a',
      },
    },
  },

  // ============================================================
  // 2. ЛАБИРИНТ
  // ============================================================

  /**
   * @namespace COLORS.maze
   * @description Цвета лабиринта: пол, стены, колонны
   */
  maze: {
    /** @type {string} - Цвет пола */
    floor: '#0b0d13',
    /** @type {string} - Цвет стен */
    wall: '#14191f',
    /** @type {string} - Цвет обводки стен */
    wallBorder: '#0a0d10',
    /** @type {string} - Цвет трещин */
    crack: '#242d38',
    /** @type {Object} - Цвета колонн */
    pillar: {
      light: '#b0b0c0',
      mid: '#8888a0',
      dark: '#5a5a6a',
      darker: '#3a3a4a',
    },
  },

  // ============================================================
  // 3. ИГРОК
  // ============================================================

  /**
   * @namespace COLORS.player
   * @description Цвета игрока: свечение, атаки
   */
  player: {
    /** @type {string} - Цвет тени (белый для контраста) */
    shadow: '#ffffff',
    /** @type {Object} - Цвета свечения игрока */
    glow: {
      normal: 'rgba(255, 234, 167, 0.9)',
      charging: 'rgba(230, 126, 34, 1.0)',
      vampire: 'rgba(180, 0, 0, 1.0)',
      stun: 'rgba(0, 150, 255, 1.0)',
    },
    /** @type {Object} - Цвета линий атаки */
    attack: {
      vampire: {
        line1: '#330000',
        line2: '#660000',
        line3: '#990000',
        line4: '#cc0000',
        line5: '#ff1a1a',
        inner: '#ff6666',
      },
      stun: {
        line1: '#003366',
        line2: '#0066cc',
        line3: '#0099ff',
        line4: '#66ccff',
        line5: '#ffffff',
        inner: '#aaddff',
      },
      fire: {
        line1: '#ff4400',
        line2: '#ff8800',
        line3: '#ffcc00',
        line4: '#ffff66',
        inner: '#ffffff',
      },
    },
  },

  // ============================================================
  // 4. МОНСТРЫ
  // ============================================================

  /**
   * @namespace COLORS.monsters
   * @description Цвета монстров: глаза, здоровье, свечения
   */
  monsters: {
    /** @type {Object} - Цвета глаз монстров */
    eyes: {
      normal: '#ff2200',
      ghost: '#00aaff',
      boss: '#ff0000',
      mind: '#00aaff',
    },
    /** @type {Object} - Цвета полоски здоровья */
    healthBar: {
      bg: '#c0392b',
      fill: '#2ecc71',
    },
    /** @type {Object} - Свечение призрака */
    ghost: {
      glow: 'rgba(100, 200, 255, ',
    },
    /** @type {Object} - Цвета фаз боссов */
    boss: {
      phase2: {
        demon: '#ff8800',
        mind: '#44aaff',
        chaser: '#ff8800',
      },
      phase3: {
        demon: '#ff0000',
        mind: '#9b59b6',
        chaser: '#ff0000',
      },
    },
    /** @type {Object} - Свечение от ловушек и эффектов */
    trapGlow: {
      spike: '#ff4400',      // Взрывная ловушка
      ice: '#4488ff',        // Ледяная ловушка
      acid: '#2ecc71',       // Кислотная ловушка
      lightning: '#f1c40f',  // Электрическая ловушка
      psionic: '#9b59b6',    // Псионическая ловушка
      stun: '#66ccff',       // Громовой посох (оглушение)
    },
  },

  // ============================================================
  // 5. ЭФФЕКТЫ
  // ============================================================

  /**
   * @namespace COLORS.effects
   * @description Цвета игровых эффектов: огонь, лёд, молния, кровь и др.
   */
  effects: {
    // Огонь
    /** @type {string} */
    fire: '#ff8800',
    /** @type {string} */
    fireGlow: '#ff6600',
    /** @type {string} */
    fireParticle: '#ff8800',
    
    // Лёд
    /** @type {string} */
    ice: '#4488ff',
    /** @type {string} */
    iceGlow: '#2266cc',
    /** @type {string} */
    iceParticle: '#4488ff',
    
    // Молния
    /** @type {string} */
    lightning: '#f1c40f',
    /** @type {string} */
    lightningSpark: '#66ccff',
    
    // Яд
    /** @type {string} */
    poison: '#2ecc71',
    
    // Кровь
    /** @type {string} */
    blood: '#8b0000',
    /** @type {string} */
    bloodLight: '#6b0000',
    /** @type {string} */
    bloodDark: '#4a0000',
    
    // Вампиризм
    /** @type {string} */
    vampire: '#c0392b',
    
    // Магия
    /** @type {string} */
    magic: '#9b59b6',
    /** @type {string} */
    blessing: '#f1c40f',
    /** @type {string} */
    stun: '#3498db',
    
    // Золото
    /** @type {Object} */
    gold: {
      light: '#f1c40f',
      mid: '#f39c12',
      dark: '#e67e22',
    },
    
    // Артефакты
    /** @type {Object} */
    artifact: {
      light: '#dda0dd',
      mid: '#9b59b6',
      dark: '#8e44ad',
    },
    
    // Зелья
    /** @type {Object} */
    potion: {
      light: '#55efc4',
      mid: '#00b894',
      dark: '#009432',
    },
    
    // Кровавые лужи
    /** @type {Object} */
    bloodPuddle: {
      main: '#8b0000',
      mid: '#6b0000',
      dark: '#4a0000',
      center: '#5a0000',
      fade1: 'rgba(60, 0, 0, 0.3)',
      fade2: 'rgba(40, 0, 0, 0)',
    },
  },

  // ============================================================
  // 6. СТАТУСЫ ИГРОКА
  // ============================================================

  /**
   * @namespace COLORS.status
   * @description Цвета статусных эффектов игрока
   */
  status: {
    /** @type {string} */
    frozen: '#3498db',
    /** @type {string} */
    frozenGlow: 'rgba(100, 200, 255, 0.6)',
    /** @type {string} */
    frozenIce: '#88ddff',
    /** @type {string} */
    frozenCrystal: '#aaddff',
    /** @type {string} */
    poisoned: '#2ecc71',
    /** @type {string} */
    shocked: '#f1c40f',
    /** @type {string} */
    shockedGlow: 'rgba(255, 220, 50, 0.9)',
    /** @type {string} */
    slowed: '#3498db',
    /** @type {string} */
    inverted: '#f1c40f',
    /** @type {string} */
    restored: '#2ecc71',
  },

  /**
   * @namespace COLORS.flame
   * @description Цвета пламени
   */
  flame: {
    /** @type {string} - Внутренний цвет пламени */
    inner: '#fff4a0',
    /** @type {string} - Тень внутреннего пламени */
    innerShadow: '#ffdd44',
    /** @type {string} - Свечение внутреннего пламени */
    innerGlow: 'rgba(255, 255, 200, ',
  },

  // ============================================================
  // 7. ПОРТАЛЫ И ПРЕДМЕТЫ
  // ============================================================

  /**
   * @namespace COLORS.portals
   * @description Цвета порталов
   */
  portals: {
    /** @type {string} */
    treasure: '#f39c12',
    /** @type {string} */
    treasureExit: '#2ecc71',
    /** @type {string} */
    shrine: '#9b59b6',
    /** @type {string} */
    shrineExit: '#2ecc71',
    /** @type {string} */
    exit: '#8e44ad',
    /** @type {string} */
    secret: '#f39c12',
    /** @type {string} */
    normal: '#8e44ad',
  },

  // ============================================================
  // 8. ЛОВУШКИ
  // ============================================================

  /**
   * @namespace COLORS.traps
   * @description Цвета различных типов ловушек
   */
  traps: {
    spike: {
      bg: '#0f1116',
      border: '#13181f',
      active: '#e74c3c',
      activeBorder: '#c0392b',
    },
    ice: {
      bg: '#101721',
      border: '#182436',
      active: '#e74c3c',
      activeBorder: '#c0392b',
    },
    acid: {
      bg: '#0d1611',
      border: '#15261b',
      active: '#e74c3c',
      activeBorder: '#c0392b',
    },
    lightning: {
      bg: '#111106',
      border: '#1a1a0a',
      active: '#e74c3c',
      activeBorder: '#c0392b',
    },
    psionic: {
      bg: '#0d0d1a',
      border: '#1a1a2e',
      active: '#9b59b6',
      activeBorder: '#8e44ad',
    },
  },

  // ============================================================
  // 9. ФАКЕЛЫ
  // ============================================================

  /**
   * @namespace COLORS.torches
   * @description Цвета факелов и их света
   */
  torches: {
    /** @type {string} */
    flame: '#ff8800',
    /** @type {string} */
    glow: '#ff6600',
    /** @type {string} */
    particle: '#ff8800',
    /** @type {string} */
    flameMind: '#4488ff',
    /** @type {string} */
    glowMind: '#2266cc',
    /** @type {string} */
    particleMind: '#4488ff',
    /** @type {string} */
    flameTrap: '#ff2200',
    /** @type {string} */
    glowTrap: '#cc0000',
    /** @type {Object} - Световые градиенты */
    light: {
      warm: {
        stop0: 'rgba(255, 220, 150, ',
        stop1: 'rgba(255, 180, 80, ',
        stop2: 'rgba(255, 140, 40, ',
        stop3: 'rgba(255, 100, 20, ',
        stop4: 'rgba(255, 60, 0, ',
        stop5: 'rgba(255, 30, 0, 0)',
      },
      mind: {
        stop0: 'rgba(150, 200, 255, ',
        stop1: 'rgba(100, 180, 255, ',
        stop2: 'rgba(70, 150, 255, ',
        stop3: 'rgba(40, 120, 255, ',
        stop4: 'rgba(20, 80, 200, ',
        stop5: 'rgba(10, 40, 150, 0)',
      },
    },
  },

  // ============================================================
  // 10. АЛТАРИ
  // ============================================================

  /**
   * @namespace COLORS.shrines
   * @description Цвета алтарей и их эффектов
   */
  shrines: {
    /** @type {string} */
    inactive: 'rgba(142, 68, 173, 1.0)',
    /** @type {string} */
    active: 'rgba(142, 68, 173, 1.0)',
    /** @type {Object} - Цвета эффектов алтарей */
    effect: {
      berserk: '#e74c3c',
      greed: '#f1c40f',
      vampire: '#c0392b',
      guardian: '#3498db',
    },
  },

  // ============================================================
  // 11. РУНЫ
  // ============================================================

  /**
   * @namespace COLORS.runes
   * @description Цвета искр рун
   */
  runes: {
    /** @type {Object} */
    spark: {
      default: 'rgba(200, 170, 255, 0.8)',
      mimic: 'rgba(255, 150, 180, 0.8)',
      portal: 'rgba(130, 240, 180, 0.8)',
      shrine: 'rgba(200, 170, 255, 0.8)',
    },
  },

  // ============================================================
  // 12. ЧАСТИЦЫ И ИСКРЫ
  // ============================================================

  /**
   * @namespace COLORS.sparks
   * @description Цвета искр и частиц
   */
  sparks: {
    /** @type {string} */
    fire: '#ffaa00',
    /** @type {string} */
    fireDark: '#ff6600',
    /** @type {string} */
    fireRed: '#ff3300',
    /** @type {string} */
    dust: '#886644',
    /** @type {string} */
    lightning: '#66ccff',
    /** @type {string} */
    lightningWhite: '#ffffff',
    /** @type {string} */
    magic: '#9b59b6',
  },

  // ============================================================
  // 13. UI
  // ============================================================

  /**
   * @namespace COLORS.ui
   * @description Цвета пользовательского интерфейса
   */
  ui: {
    // Текст
    /** @type {string} */
    text: '#c8c0d0',
    /** @type {string} */
    textDark: '#8899aa',
    /** @type {string} */
    textLight: '#f0e8f8',
    /** @type {string} */
    textGold: '#f1c40f',
    /** @type {string} */
    textRed: '#e07080',
    /** @type {string} */
    textGreen: '#2ecc71',

    // Панели
    /** @type {string} */
    panel: 'rgba(8, 6, 12, 0.92)',
    /** @type {string} */
    panelLight: 'rgba(10, 10, 15, 0.85)',
    /** @type {string} */
    panelDark: 'rgba(6, 4, 10, 0.95)',

    // Кнопки
    /** @type {Object} */
    button: {
      primary: '#8e44ad',
      primaryHover: '#9b59b6',
      primaryBorder: 'rgba(142, 68, 173, 0.8)',
      success: '#2ecc71',
      successHover: '#27ae60',
      danger: '#e74c3c',
      dangerHover: '#c0392b',
      warning: '#f39c12',
      warningHover: '#e67e22',
      disabled: '#1e272e',
    },

    // Здоровье
    /** @type {Object} */
    health: {
      bg: '#2c3e50',
      fill: '#e74c3c',
      fillGood: '#2ecc71',
      fillWarning: '#f39c12',
      fillDanger: '#e74c3c',
      boss: '#c0392b',
      bossBg: '#2c3e50',
      bossMind: '#9b59b6',
      bossMindBg: '#2a1a3a',
    },

    // Магазин
    /** @type {Object} */
    shop: {
      bg: '#d35400',
      border: '#e67e22',
      text: '#e67e22',
    },

    // Мини-карта
    /** @type {Object} */
    minimap: {
      bg: 'rgba(10, 10, 15, 0.85)',
      border: '#3d4a5d',
      wall: '#1c2530',
      floor: '#0f141c',
      shop: '#d35400',
      portal: '#8e44ad',
      player: '#e74c3c',
      pillar: '#1c2530',
      pillarBorder: 'rgba(60, 60, 80, 0.3)',
    },

    // Индикаторы
    /** @type {Object} */
    indicator: {
      bg: 'rgba(0, 0, 0, 0.75)',
      border: '#f1c40f',
      text: '#ffffff',
      subtext: '#aaaaaa',
      adaptation: {
        bg: 'rgba(10, 10, 15, 0.85)',
        border: '#e74c3c',
        text: '#ffffff',
        subtext: '#aaaaaa',
      },
    },
  },

  // ============================================================
  // 14. БОССЫ
  // ============================================================

  /**
   * @namespace COLORS.bosses
   * @description Цвета боссов и их атак
   */
  bosses: {
    demon: {
      primary: '#ff4400',
      secondary: '#ff8800',
      glow: '#ff6600',
      beam: '#e74c3c',
    },
    mind: {
      primary: '#9b59b6',
      secondary: '#dda0dd',
      glow: '#9b59b6',
      wave: '#9b59b6',
      ball: '#9b59b6',
    },
    duo: {
      primary: '#c0392b',
      secondary: '#f1c40f',
      glow: '#ff6600',
    },
  },

  // ============================================================
  // 15. БЕЗОПАСНАЯ КОМНАТА
  // ============================================================

  /**
   * @namespace COLORS.safeRoom
   * @description Цвета безопасной комнаты
   */
  safeRoom: {
    /** @type {string} - Цвет портала */
    portalColor: '#3498db',
    /** @type {string} - Цвет портала в RGB */
    portalColorRgb: '52, 152, 219',
    /** @type {string} - Цвет уведомлений */
    notificationColor: '#3498db',
  },
};