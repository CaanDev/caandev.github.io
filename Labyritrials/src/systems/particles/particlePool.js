/**
 * @fileoverview Пул объектов и пул частиц для оптимизации памяти.
 * Предоставляет переиспользуемые объекты для уменьшения нагрузки на GC.
 * 
 * @module systems/particles/particlePool
 */

import { CONFIG } from '../../core/config/index.js';
import { COLORS } from '../../core/config/colors.js';

/**
 * Универсальный пул объектов
 * 
 * @class ObjectPool
 * @template T
 */
export class ObjectPool {
  /**
   * Создание пула объектов
   * 
   * @param {Function} createFn - Функция создания нового объекта
   * @param {Function} resetFn - Функция сброса объекта перед использованием
   * @param {number} [initialSize=50] - Начальный размер пула
   * @param {number} [maxSize=200] - Максимальный размер пула
   */
  constructor(createFn, resetFn, initialSize = 50, maxSize = 200) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this._pool = [];
    this._active = [];
    
    // Заполняем пул начальными объектами
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this.createFn());
    }
  }

  /**
   * Получение массива активных объектов
   * 
   * @returns {Array} - Массив активных объектов
   */
  get active() {
    return this._active;
  }

  /**
   * Получение объекта из пула
   * 
   * @param {Object} data - Данные для инициализации объекта
   * @returns {T} - Объект из пула
   */
  acquire(data) {
    let obj;
    
    if (this._pool.length > 0) {
      obj = this._pool.pop();
      this.resetFn(obj, data);
    } else {
      obj = this.createFn();
      this.resetFn(obj, data);
      console.warn('⚠️ Пул пуст, создан новый объект');
    }
    
    obj.active = true;
    this._active.push(obj);
    return obj;
  }

  /**
   * Возврат объекта в пул
   * 
   * @param {T} obj - Объект для возврата
   * @returns {void}
   */
  release(obj) {
    if (!obj || !obj.active) return;
    
    obj.active = false;
    this._active = this._active.filter(o => o !== obj);
    
    if (this._pool.length < this.maxSize) {
      this._pool.push(obj);
    }
  }

  /**
   * Возврат всех активных объектов в пул
   * 
   * @returns {void}
   */
  releaseAll() {
    for (const obj of this._active) {
      obj.active = false;
      if (this._pool.length < this.maxSize) {
        this._pool.push(obj);
      }
    }
    this._active = [];
  }

  /**
   * Получение количества активных объектов
   * 
   * @returns {number} - Количество активных объектов
   */
  getActiveCount() {
    return this._active.length;
  }

  /**
   * Получение количества свободных объектов в пуле
   * 
   * @returns {number} - Количество свободных объектов
   */
  getFreeCount() {
    return this._pool.length;
  }

  /**
   * Обновление всех активных объектов
   * 
   * @param {Function} updateFn - Функция обновления, возвращает true для освобождения
   * @returns {void}
   */
  updateAll(updateFn) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const obj = this._active[i];
      if (!obj.active) {
        this.release(obj);
        continue;
      }
      
      const shouldRelease = updateFn(obj);
      if (shouldRelease) {
        this.release(obj);
      }
    }
  }
}

/**
 * Специализированный пул частиц
 * 
 * @class ParticlePool
 * @extends ObjectPool
 */
export class ParticlePool extends ObjectPool {
  /**
   * Создание пула частиц
   * 
   * @param {number} [initialSize=30] - Начальный размер пула
   * @param {number} [maxSize=150] - Максимальный размер пула
   */
  constructor(initialSize = 30, maxSize = 150) {
    super(
      // Фабрика создания частицы
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        color: COLORS.player.shadow,
        active: false,
        type: 'gold',
        targetX: 0,
        targetY: 0,
        attracted: false,
        attractionDelay: 0,
        rotation: 0,
        rotSpeed: 0,
        simple: true,
        isGem: false,
        isDrop: false,
        gravity: 0,
        drag: 0.98,
        glow: false,
        alpha: 1,
        isLootSpark: false,
        glowIntensity: 0,
        glowColor: null
      }),
      // Функция сброса частицы
      (particle, data) => {
        particle.x = data.x || 0;
        particle.y = data.y || 0;
        particle.vx = data.vx || 0;
        particle.vy = data.vy || 0;
        particle.life = data.life || 40;
        particle.maxLife = data.maxLife || 40;
        particle.size = data.size || 3;
        particle.color = data.color || COLORS.player.shadow;
        particle.type = data.type || 'gold';
        particle.targetX = data.targetX || 0;
        particle.targetY = data.targetY || 0;
        particle.attracted = data.attracted || false;
        particle.attractionDelay = data.attractionDelay || 0;
        particle.rotation = data.rotation || 0;
        particle.rotSpeed = data.rotSpeed || 0;
        particle.simple = data.simple !== undefined ? data.simple : true;
        particle.isGem = data.isGem || false;
        particle.isDrop = data.isDrop || false;
        particle.gravity = data.gravity || 0.15;
        particle.drag = data.drag || 0.98;
        particle.glow = data.glow || false;
        particle.alpha = data.alpha || 1;
        particle.isLootSpark = data.isLootSpark || false;
        particle.glowIntensity = data.glowIntensity || 0;
        particle.glowColor = data.glowColor || null;
        particle.active = true;
      },
      initialSize,
      maxSize
    );
  }

  /**
   * Создание частицы золота
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} value - Количество золота
   * @param {boolean} [simple=true] - Упрощённый режим
   * @returns {Object} - Частица
   */
  createGoldParticle(x, y, value, simple = true) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    
    return this.acquire({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40,
      maxLife: 40,
      size: simple ? 2 + Math.random() * 2 : 2 + Math.random() * 4,
      color: COLORS.effects.gold.light,
      type: 'gold',
      targetX: 0,
      targetY: 0,
      attracted: false,
      attractionDelay: simple ? 5 + Math.random() * 10 : 10 + Math.random() * 20,
      simple: simple
    });
  }

  /**
   * Создание частицы артефакта
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {boolean} [simple=true] - Упрощённый режим
   * @returns {Object} - Частица
   */
  createArtifactParticle(x, y, simple = true) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    
    return this.acquire({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 50,
      maxLife: 50,
      size: simple ? 2 + Math.random() * 3 : 2 + Math.random() * 5,
      color: COLORS.effects.magic,
      type: 'artifact',
      targetX: 0,
      targetY: 0,
      attracted: false,
      attractionDelay: simple ? 5 + Math.random() * 10 : 8 + Math.random() * 15,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      simple: simple,
      isGem: !simple && Math.random() > 0.7
    });
  }

  /**
   * Создание частицы зелья
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} healAmount - Количество лечения
   * @param {boolean} [simple=true] - Упрощённый режим
   * @returns {Object} - Частица
   */
  createPotionParticle(x, y, healAmount, simple = true) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    
    return this.acquire({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 50,
      maxLife: 50,
      size: simple ? 2 + Math.random() * 2 : 2 + Math.random() * 4,
      color: COLORS.effects.potion.mid,
      type: 'potion',
      targetX: 0,
      targetY: 0,
      attracted: false,
      attractionDelay: simple ? 5 + Math.random() * 10 : 10 + Math.random() * 20,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      simple: simple,
      isDrop: !simple && Math.random() > 0.6
    });
  }

  /**
   * Создание искры (вспомогательная функция)
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {string} [color=COLORS.sparks.fire] - Цвет искры
   * @param {number} [gravity=0.15] - Гравитация
   * @returns {Object} - Частица
   */
  createSpark(x, y, color = COLORS.sparks.fire, gravity = 0.15) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const life = 30 + Math.random() * 30;
    const cellSize = CONFIG.cellSize;
    
    return this.acquire({
      x: x + cellSize / 2,
      y: y + cellSize / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      size: 2 + Math.random() * 4,
      color: color,
      type: 'spark',
      gravity: gravity,
      drag: 0.98,
      glow: true
    });
  }
}