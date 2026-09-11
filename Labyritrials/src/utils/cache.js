/**
 * @fileoverview Система кэширования для оптимизации производительности.
 * Предоставляет универсальный класс Cache и специализированные кэши для различных нужд.
 * 
 * @module utils/cache
 */

/**
 * Класс универсального кэша с поддержкой TTL и ограничением размера
 * 
 * @class Cache
 * @template T - Тип хранимых значений
 */
class Cache {
  /**
   * Создание экземпляра кэша
   * 
   * @param {number} [maxSize=1000] - Максимальное количество элементов в кэше
   * @param {number} [ttl=60000] - Время жизни элемента в миллисекундах (0 — бесконечно)
   */
  constructor(maxSize = 1000, ttl = 60000) {
    /** @type {Map<string, {value: T, timestamp: number}>} */
    this.cache = new Map();
    /** @type {number} */
    this.maxSize = maxSize;
    /** @type {number} */
    this.ttl = ttl;
    /** @type {number} */
    this.hits = 0;
    /** @type {number} */
    this.misses = 0;
  }

  /**
   * Получение значения из кэша по ключу
   * 
   * @param {string} key - Ключ для поиска
   * @returns {T|null} - Значение из кэша или null, если не найдено
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    
    if (this.ttl > 0 && Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return item.value;
  }

  /**
   * Сохранение значения в кэше
   * 
   * @param {string} key - Ключ для сохранения
   * @param {T} value - Сохраняемое значение
   * @returns {void}
   */
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  /**
   * Проверка наличия ключа в кэше
   * 
   * @param {string} key - Ключ для проверки
   * @returns {boolean} - true, если ключ существует и не истёк
   */
  has(key) {
    if (!this.cache.has(key)) return false;
    
    const item = this.cache.get(key);
    if (this.ttl > 0 && Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Удаление элемента из кэша
   * 
   * @param {string} key - Ключ для удаления
   * @returns {void}
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Полная очистка кэша
   * 
   * @returns {void}
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Получение статистики кэша
   * 
   * @returns {Object} - Объект со статистикой
   * @returns {number} size - Текущий размер кэша
   * @returns {number} maxSize - Максимальный размер
   * @returns {number} hits - Количество попаданий
   * @returns {number} misses - Количество промахов
   * @returns {string} hitRate - Процент попаданий
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// ============================================================
// СПЕЦИАЛИЗИРОВАННЫЕ КЭШИ
// ============================================================

/**
 * Кэш для путей поиска (Pathfinding)
 * @type {Cache}
 */
export const pathCache = new Cache(500, 30000);

/**
 * Кэш для расстояний
 * @type {Cache}
 */
export const distanceCache = new Cache(300, 1000);

/**
 * Кэш для проверки видимости
 * @type {Cache}
 */
export const visibilityCache = new Cache(200, 500);

/**
 * Кэш для данных сетки
 * @type {Cache}
 */
export const gridCache = new Cache(100, 10000);

/**
 * Очистка всех кэшей
 * 
 * @returns {void}
 */
export function clearAllCaches() {
  pathCache.clear();
  distanceCache.clear();
  visibilityCache.clear();
  gridCache.clear();
}

/**
 * Получение статистики по всем кэшам
 * 
 * @returns {Object} - Объект со статистикой каждого кэша
 */
export function getCacheStats() {
  return {
    path: pathCache.getStats(),
    distance: distanceCache.getStats(),
    visibility: visibilityCache.getStats(),
    grid: gridCache.getStats()
  };
}

export default Cache;