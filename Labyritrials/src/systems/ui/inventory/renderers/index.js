/**
 * @fileoverview Точка входа для рендереров инвентаря
 * @module systems/ui/inventory/renderers/index
 */

export { renderInventory, setRefreshCallback, switchInventoryTab } from './inventoryRenderer.js';
export { renderWeaponGrid, renderRangedGrid, renderWeaponSlots } from './weaponsRenderer.js';
export { renderEquipmentGrid, renderEquipmentSlots } from './equipmentRenderer.js';
export { renderItemGrid } from './itemsRenderer.js';
export { 
  updateDescription, 
  updateDescriptionForItem, 
  clearDescription, 
  getLastSelectedItem, 
  setLastSelectedItem 
} from './descriptionRenderer.js';
export { getWeaponIconHTML, getItemIconHTML } from './utils.js';