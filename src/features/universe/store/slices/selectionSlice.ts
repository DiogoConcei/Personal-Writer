import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '@/shared/types';

export const createSelectionSlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set) => ({
  selectedItems: [],

  toggleSelection: (id, multi) => set((state) => {
    if (!multi) {
      return { selectedItems: state.selectedItems.includes(id) ? [] : [id] };
    }
    
    if (state.selectedItems.includes(id)) {
      return { selectedItems: state.selectedItems.filter(sid => sid !== id) };
    }
    
    return { selectedItems: [...state.selectedItems, id] };
  }),

  setSelectedItems: (ids) => set({ selectedItems: ids }),

  clearSelection: () => set({ selectedItems: [] }),
});
