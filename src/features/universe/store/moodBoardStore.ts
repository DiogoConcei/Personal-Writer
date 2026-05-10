import { create } from 'zustand';
import { MesaTrabalhoState } from './moodBoardStore.types';
import { createConfigSlice } from './slices/configSlice';
import { createUISlice } from './slices/uiSlice';
import { createSelectionSlice } from './slices/selectionSlice';
import { createWorkspaceSlice } from './slices/workspaceSlice';
import { createGroupsSlice } from './slices/groupsSlice';
import { createPersistenceSlice } from './slices/persistenceSlice';
import { createHistorySlice } from './slices/historySlice';

/**
 * Store principal da Mesa de Trabalho (Moodboard).
 * Refatorada para seguir o padrão de Slices, reduzindo a complexidade do arquivo principal.
 */
export const useMesaTrabalhoStore = create<MesaTrabalhoState>()((...a) => ({
  ...createConfigSlice(...a),
  ...createUISlice(...a),
  ...createSelectionSlice(...a),
  ...createWorkspaceSlice(...a),
  ...createGroupsSlice(...a),
  ...createPersistenceSlice(...a),
  ...createHistorySlice(...a),
} as MesaTrabalhoState));
