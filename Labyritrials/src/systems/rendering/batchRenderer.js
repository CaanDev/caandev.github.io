/**
 * @fileoverview Пакетный рендерер для оптимизации отрисовки частиц.
 * Группирует частицы по типу (круги, эллипсы, прямоугольники)
 * и отрисовывает их одной операцией для повышения производительности.
 * 
 * @module systems/rendering/batchRenderer
 */

/**
 * Пакет для отрисовки кругов
 * 
 * @class CircleBatch
 */
export class CircleBatch {
  constructor() {
    this.particles = [];
    this.style = null;
  }

  /**
   * Добавление круга в пакет
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} radius - Радиус круга
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  add(x, y, radius, style) {
    this.particles.push({ x, y, radius });
    this.style = style;
  }

  /**
   * Отрисовка всех кругов в пакете
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @returns {void}
   */
  draw(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    
    if (this.style) {
      ctx.fillStyle = this.style.fillStyle || '#ffffff';
      ctx.globalAlpha = this.style.alpha || 1;
      ctx.shadowBlur = this.style.shadowBlur || 0;
      ctx.shadowColor = this.style.shadowColor || 'transparent';
      ctx.shadowOffsetX = this.style.shadowOffsetX || 0;
      ctx.shadowOffsetY = this.style.shadowOffsetY || 0;
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    
    this.clear();
  }

  /**
   * Очистка пакета
   * 
   * @returns {void}
   */
  clear() {
    this.particles = [];
    this.style = null;
  }

  /** @type {number} - Количество частиц в пакете */
  get size() {
    return this.particles.length;
  }

  /** @type {boolean} - Пуст ли пакет */
  get isEmpty() {
    return this.particles.length === 0;
  }
}

/**
 * Пакет для отрисовки эллипсов
 * 
 * @class EllipseBatch
 */
export class EllipseBatch {
  constructor() {
    this.particles = [];
    this.style = null;
  }

  /**
   * Добавление эллипса в пакет
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} radiusX - Радиус по X
   * @param {number} radiusY - Радиус по Y
   * @param {number} rotation - Угол поворота
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  add(x, y, radiusX, radiusY, rotation, style) {
    this.particles.push({ x, y, radiusX, radiusY, rotation });
    this.style = style;
  }

  /**
   * Отрисовка всех эллипсов в пакете
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @returns {void}
   */
  draw(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    
    if (this.style) {
      ctx.fillStyle = this.style.fillStyle || '#ffffff';
      ctx.globalAlpha = this.style.alpha || 1;
      ctx.shadowBlur = this.style.shadowBlur || 0;
      ctx.shadowColor = this.style.shadowColor || 'transparent';
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, p.rotation || 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.clear();
  }

  /**
   * Очистка пакета
   * 
   * @returns {void}
   */
  clear() {
    this.particles = [];
    this.style = null;
  }

  /** @type {number} - Количество частиц в пакете */
  get size() {
    return this.particles.length;
  }

  /** @type {boolean} - Пуст ли пакет */
  get isEmpty() {
    return this.particles.length === 0;
  }
}

/**
 * Пакет для отрисовки прямоугольников
 * 
 * @class RectBatch
 */
export class RectBatch {
  constructor() {
    this.particles = [];
    this.style = null;
  }

  /**
   * Добавление прямоугольника в пакет
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} width - Ширина
   * @param {number} height - Высота
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  add(x, y, width, height, style) {
    this.particles.push({ x, y, width, height });
    this.style = style;
  }

  /**
   * Отрисовка всех прямоугольников в пакете
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @returns {void}
   */
  draw(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    
    if (this.style) {
      ctx.fillStyle = this.style.fillStyle || '#ffffff';
      ctx.globalAlpha = this.style.alpha || 1;
      ctx.shadowBlur = this.style.shadowBlur || 0;
      ctx.shadowColor = this.style.shadowColor || 'transparent';
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.width, p.height);
      ctx.fill();
    }

    ctx.restore();
    this.clear();
  }

  /**
   * Очистка пакета
   * 
   * @returns {void}
   */
  clear() {
    this.particles = [];
    this.style = null;
  }

  /** @type {number} - Количество частиц в пакете */
  get size() {
    return this.particles.length;
  }

  /** @type {boolean} - Пуст ли пакет */
  get isEmpty() {
    return this.particles.length === 0;
  }
}

/**
 * Менеджер пакетов для управления всеми типами частиц
 * 
 * @class BatchManager
 */
export class BatchManager {
  constructor() {
    this.circles = new CircleBatch();
    this.ellipses = new EllipseBatch();
    this.rects = new RectBatch();
  }

  /**
   * Добавление круга
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} radius - Радиус
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  addCircle(x, y, radius, style) {
    this.circles.add(x, y, radius, style);
  }

  /**
   * Добавление эллипса
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} radiusX - Радиус по X
   * @param {number} radiusY - Радиус по Y
   * @param {number} rotation - Угол поворота
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  addEllipse(x, y, radiusX, radiusY, rotation, style) {
    this.ellipses.add(x, y, radiusX, radiusY, rotation, style);
  }

  /**
   * Добавление прямоугольника
   * 
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {number} width - Ширина
   * @param {number} height - Высота
   * @param {Object} style - Стиль отрисовки
   * @returns {void}
   */
  addRect(x, y, width, height, style) {
    this.rects.add(x, y, width, height, style);
  }

  /**
   * Отрисовка всех пакетов
   * 
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @returns {void}
   */
  drawAll(ctx) {
    this.circles.draw(ctx);
    this.ellipses.draw(ctx);
    this.rects.draw(ctx);
  }

  /**
   * Очистка всех пакетов
   * 
   * @returns {void}
   */
  clearAll() {
    this.circles.clear();
    this.ellipses.clear();
    this.rects.clear();
  }

  /** @type {boolean} - Пусты ли все пакеты */
  get isEmpty() {
    return this.circles.isEmpty && this.ellipses.isEmpty && this.rects.isEmpty;
  }

  /** @type {number} - Общее количество частиц во всех пакетах */
  get totalSize() {
    return this.circles.size + this.ellipses.size + this.rects.size;
  }
}

/**
 * @namespace ParticleStyles
 * @description Предопределённые стили для различных типов частиц
 */
export const ParticleStyles = {
  gold: {
    fillStyle: '#f1c40f',
    shadowBlur: 8,
    shadowColor: 'rgba(241, 196, 15, 0.5)',
    alpha: 0.9
  },
  goldSpark: {
    fillStyle: '#f1c40f',
    shadowBlur: 15,
    shadowColor: 'rgba(241, 196, 15, 0.7)',
    alpha: 0.95
  },
  artifact: {
    fillStyle: '#9b59b6',
    shadowBlur: 8,
    shadowColor: 'rgba(155, 89, 182, 0.5)',
    alpha: 0.9
  },
  artifactSpark: {
    fillStyle: '#9b59b6',
    shadowBlur: 20,
    shadowColor: 'rgba(155, 89, 182, 0.7)',
    alpha: 0.95
  },
  potion: {
    fillStyle: '#2ecc71',
    shadowBlur: 8,
    shadowColor: 'rgba(46, 204, 113, 0.5)',
    alpha: 0.9
  },
  potionSpark: {
    fillStyle: '#2ecc71',
    shadowBlur: 15,
    shadowColor: 'rgba(46, 204, 113, 0.7)',
    alpha: 0.95
  },
  fire: {
    fillStyle: '#ff8800',
    shadowBlur: 10,
    shadowColor: 'rgba(255, 136, 0, 0.5)',
    alpha: 0.8
  },
  spark: {
    fillStyle: '#ffaa00',
    shadowBlur: 4,
    shadowColor: 'rgba(255, 170, 0, 0.4)',
    alpha: 0.9
  },
  blood: {
    fillStyle: '#8b0000',
    shadowBlur: 0,
    alpha: 0.6
  },
  magic: {
    fillStyle: '#9b59b6',
    shadowBlur: 12,
    shadowColor: 'rgba(155, 89, 182, 0.6)',
    alpha: 0.8
  },
  white: {
    fillStyle: '#ffffff',
    shadowBlur: 0,
    alpha: 1
  },
  dust: {
    fillStyle: '#886644',
    shadowBlur: 0,
    alpha: 0.5
  }
};