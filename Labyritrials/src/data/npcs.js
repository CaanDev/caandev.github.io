/**
 * @fileoverview Данные NPC.
 * 
 * @module data/npcs
 */

/**
 * @typedef {Object} NpcData
 * @property {string} id - Уникальный идентификатор
 * @property {string} [name] - Отображаемое имя (может отсутствовать, если у NPC нет имени)
 * @property {string} title - Роль
 * @property {string} [icon] - Эмодзи или иконка
 * @property {string} [spriteName] - Имя спрайта в атласе (если есть)
 * @property {string} [description] - Краткое описание для UI
 */

/**
 * @constant {Object<string, NpcData>} NPCS_DATA - Все NPC в игре
 */
export const NPCS_DATA = {
  /**
   * Торговец - встречается в основном лабиринте (уровни 2–4)
   * и в безопасной комнате (с 6 уровня).
   */
  trader: {
    id: 'trader',
    title: 'Торговец',
    icon: '🏪',
    spriteName: 'objShopStand',
    description: 'Торговец, обосновавшийся в безопасной комнате.',
  },

  /**
   * Девушка-исследовательница.
   * Сначала появляется в лабиринте, после первого разговора перемещается в безопасную комнату.
   * Всегда сидит и пишет (анимация write).
   */
  researcher: {
    id: 'researcher',
    name: 'Астрид',
    title: 'Исследовательница',
    icon: '🔍',
    spriteName: 'researcher_write_south_0',
    description: 'Юная странствующая исследовательница.',
  },
};

/**
 * Получение данных NPC по ID
 * 
 * @param {string} id - ID NPC
 * @returns {NpcData|undefined} - Данные NPC или undefined
 */
export function getNpcData(id) {
  return NPCS_DATA[id];
}

/**
 * Получение отображаемого имени NPC.
 * Если у NPC есть имя - возвращается оно.
 * Если имени нет - возвращается роль.
 * 
 * @param {string} id - ID NPC
 * @returns {string} - Имя или роль (или ID, если данных нет)
 */
export function getNpcName(id) {
  const npc = NPCS_DATA[id];
  if (!npc) return id;
  return npc.name || npc.title || id;
}

/**
 * Получение роли NPC по ID
 * 
 * @param {string} id - ID NPC
 * @returns {string} - Роль или пустая строка
 */
export function getNpcTitle(id) {
  return NPCS_DATA[id]?.title || '';
}

/**
 * Проверка, есть ли у NPC настоящее имя
 * 
 * @param {string} id - ID NPC
 * @returns {boolean} - true, если у NPC есть имя
 */
export function hasNpcName(id) {
  return !!NPCS_DATA[id]?.name;
}