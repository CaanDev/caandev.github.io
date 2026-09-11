/**
 * @fileoverview Конфигурация биомов (типов местности)
 * @module core/config/biomes
 * 
 * @deprecated Используйте импорт из 'data/biomes.js'
 */

// Реэкспорт для обратной совместимости
export {
  BIOMES_DATA,
  getBiomeData,
  getBiomeByLevel,
  getBiomeConfig,
  getFloorColorForBiome,
  getMonsterTypesForBiome,
  getMonsterTypesByLevel,
  getTrapTypesForBiome,
  getTrapTypesByLevel,
  getEventTypesForBiome,
  getEventTypesByLevel
} from '../../data/biomes.js';