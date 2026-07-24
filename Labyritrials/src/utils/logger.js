/**
 * @fileoverview Система логирования с возможностью отключения в продакшене.
 * Позволяет управлять выводом в консоль через единую настройку.
 * 
 * @module utils/logger
 */

/**
 * Режим отладки.
 * Установите в false для отключения всех логов (кроме ошибок).
 * 
 * @type {boolean}
 */
const DEBUG = true;

/**
 * Уровни логирования
 * @enum {number}
 */
const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  ALL: 5
};

/**
 * Текущий уровень логирования.
 * По умолчанию — DEBUG (показываем всё).
 * Для продакшена установить LOG_LEVELS.ERROR или LOG_LEVELS.NONE.
 * 
 * @type {number}
 */
let currentLevel = LOG_LEVELS.DEBUG;

/**
 * Установка уровня логирования
 * 
 * @param {number} level - Уровень из LOG_LEVELS
 * @returns {void}
 */
export function setLogLevel(level) {
  currentLevel = level;
}

/**
 * Установка режима отладки
 * 
 * @param {boolean} enabled - true — включить все логи, false — отключить
 * @returns {void}
 */
export function setDebugMode(enabled) {
  currentLevel = enabled ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
}

/**
 * Проверка, активен ли уровень логирования
 * 
 * @param {number} level - Уровень для проверки
 * @returns {boolean} - true, если уровень активен
 */
function isLevelActive(level) {
  return level <= currentLevel;
}

/**
 * Логирование с цветными метками
 * 
 * @param {string} label - Метка (цветная)
 * @param {string} color - CSS-цвет
 * @param {string} message - Сообщение
 * @param {...any} args - Дополнительные аргументы
 * @returns {void}
 */
function logWithColor(label, color, message, ...args) {
  if (args.length > 0) {
    console.log(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', ...args);
  } else {
    console.log(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;');
  }
}

/**
 * Логирование с цветными метками для warn
 * 
 * @param {string} label - Метка (цветная)
 * @param {string} color - CSS-цвет
 * @param {string} message - Сообщение
 * @param {...any} args - Дополнительные аргументы
 * @returns {void}
 */
function warnWithColor(label, color, message, ...args) {
  if (args.length > 0) {
    console.warn(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', ...args);
  } else {
    console.warn(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;');
  }
}

/**
 * Логирование с цветными метками для error
 * 
 * @param {string} label - Метка (цветная)
 * @param {string} color - CSS-цвет
 * @param {string} message - Сообщение
 * @param {...any} args - Дополнительные аргументы
 * @returns {void}
 */
function errorWithColor(label, color, message, ...args) {
  if (args.length > 0) {
    console.error(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', ...args);
  } else {
    console.error(`%c${label}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;');
  }
}

/**
 * @namespace logger
 * @description Объект с методами логирования
 */
export const logger = {
  /**
   * Информационное сообщение (зелёная метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  info(message, ...args) {
    if (isLevelActive(LOG_LEVELS.INFO)) {
      logWithColor('ℹ️ INFO', '#4CAF50', message, ...args);
    }
  },

  /**
   * Сообщение об успехе (зелёная метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  success(message, ...args) {
    if (isLevelActive(LOG_LEVELS.INFO)) {
      logWithColor('✅ SUCCESS', '#4CAF50', message, ...args);
    }
  },

  /**
   * Предупреждение (жёлтая метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  warn(message, ...args) {
    if (isLevelActive(LOG_LEVELS.WARN)) {
      warnWithColor('⚠️ WARN', '#FFC107', message, ...args);
    }
  },

  /**
   * Ошибка (красная метка) — всегда показывается
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  error(message, ...args) {
    errorWithColor('❌ ERROR', '#F44336', message, ...args);
  },

  /**
   * Отладочное сообщение (синяя метка) — только в режиме DEBUG
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  debug(message, ...args) {
    if (isLevelActive(LOG_LEVELS.DEBUG)) {
      logWithColor('🔍 DEBUG', '#2196F3', message, ...args);
    }
  },

  /**
   * Игровое событие (фиолетовая метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  game(message, ...args) {
    if (isLevelActive(LOG_LEVELS.INFO)) {
      logWithColor('🎮 GAME', '#9C27B0', message, ...args);
    }
  },

  /**
   * Сохранение/загрузка (голубая метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  save(message, ...args) {
    if (isLevelActive(LOG_LEVELS.INFO)) {
      logWithColor('💾 SAVE', '#00BCD4', message, ...args);
    }
  },

  /**
   * Достижение (золотая метка)
   * 
   * @param {string} message - Сообщение
   * @param {...any} args - Дополнительные аргументы
   * @returns {void}
   */
  achievement(message, ...args) {
    if (isLevelActive(LOG_LEVELS.INFO)) {
      logWithColor('🏆 ACHIEVEMENT', '#FFD700', message, ...args);
    }
  },

  /**
   * Группа логов (для структурирования)
   * 
   * @param {string} name - Название группы
   * @param {Function} fn - Функция с логами
   * @returns {void}
   */
  group(name, fn) {
    if (isLevelActive(LOG_LEVELS.DEBUG)) {
      console.group(`%c📂 ${name}`, 'color: #9E9E9E; font-weight: bold;');
      fn();
      console.groupEnd();
    }
  },

  /**
   * Таблица данных (для отладки)
   * 
   * @param {string} name - Название таблицы
   * @param {Array|Object} data - Данные для отображения
   * @returns {void}
   */
  table(name, data) {
    if (isLevelActive(LOG_LEVELS.DEBUG)) {
      console.log(`%c📊 ${name}`, 'color: #9E9E9E; font-weight: bold;');
      console.table(data);
    }
  },

  /**
   * Время выполнения функции
   * 
   * @param {string} label - Метка для замера
   * @param {Function} fn - Функция для замера
   * @returns {*} - Результат функции
   */
  time(label, fn) {
    if (isLevelActive(LOG_LEVELS.DEBUG)) {
      console.time(`⏱️ ${label}`);
      const result = fn();
      console.timeEnd(`⏱️ ${label}`);
      return result;
    }
    return fn();
  }
};

/**
 * Краткие алиасы для удобства
 */
export const log = logger;
export const { info, success, warn, error, debug, game, save, achievement, group, table, time } = logger;

/**
 * Проверка, включён ли режим отладки
 * 
 * @returns {boolean} - true, если режим отладки включён
 */
export function isDebugMode() {
  return currentLevel >= LOG_LEVELS.DEBUG;
}