/**
 * @fileoverview Точка входа утилит.
 * Экспортирует все вспомогательные функции: кэширование, загрузчик, HTML-загрузчик, выход в меню и логирование.
 * 
 * @module utils
 */

// ============================================================
// КЭШИРОВАНИЕ
// ============================================================

export { 
  pathCache, 
  distanceCache, 
  visibilityCache, 
  gridCache,
  clearAllCaches,
  getCacheStats
} from './cache.js';

// ============================================================
// ЗАГРУЗЧИК ИГРЫ
// ============================================================

export { showLoader, updateLoader, hideLoader } from './gameLoader.js';

// ============================================================
// ЗАГРУЗЧИК HTML-ШАБЛОНОВ
// ============================================================

export { 
  loadTemplate, 
  loadEssentialTemplates,
  loadTemplateIfNeeded,
  isTemplateLoaded,
  isTemplateInitialized,
  initTemplateHandlers,
  getTemplateContent
} from './htmlLoader.js';

// ============================================================
// ВЫХОД В ГЛАВНОЕ МЕНЮ
// ============================================================

export { exitToMainMenu } from './exitToMainMenu.js';

// ============================================================
// ЛОГИРОВАНИЕ
// ============================================================

export { 
  logger,
  log,
  info,
  success,
  warn,
  error,
  debug,
  game,
  save,
  achievement,
  group,
  table,
  time,
  isDebugMode,
  setLogLevel,
  setDebugMode
} from './logger.js';