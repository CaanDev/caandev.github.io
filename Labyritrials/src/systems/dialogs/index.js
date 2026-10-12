/**
 * @fileoverview Точка входа для системы диалогов.
 * Экспортирует публичный API контроллера диалогов.
 * 
 * @module systems/dialogs/index
 */

export {
  openDialog,
  openDialogWithChoice,
  isAnyDialogOpen,
  forceCloseDialog,
} from './dialogManager.js';