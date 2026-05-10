import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '../moodBoardStore.types';

export const createUISlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set) => ({
  activeDetailsIds: [],
  modalZIndexes: {},
  isLoading: false,
  error: null,

  toggleDetailsId: (id, forceClose) => set((state) => {
    if (forceClose) {
      const newZIndexes = { ...state.modalZIndexes };
      delete newZIndexes[id];
      return { 
        activeDetailsIds: state.activeDetailsIds.filter(activeId => activeId !== id),
        modalZIndexes: newZIndexes
      };
    }
    
    const exists = state.activeDetailsIds.includes(id);
    if (exists) {
      const newZIndexes = { ...state.modalZIndexes };
      delete newZIndexes[id];
      return { 
        activeDetailsIds: state.activeDetailsIds.filter(activeId => activeId !== id),
        modalZIndexes: newZIndexes
      };
    }

    const currentMaxZ = Object.values(state.modalZIndexes).length > 0 
      ? Math.max(...Object.values(state.modalZIndexes)) 
      : 10000;

    return { 
      activeDetailsIds: [...state.activeDetailsIds, id],
      modalZIndexes: { ...state.modalZIndexes, [id]: currentMaxZ + 1 }
    };
  }),

  bringDetailsToFront: (id) => set((state) => {
    const currentMaxZ = Object.values(state.modalZIndexes).length > 0 
      ? Math.max(...Object.values(state.modalZIndexes)) 
      : 10000;
    
    if (state.modalZIndexes[id] === currentMaxZ) return state;

    return {
      modalZIndexes: { ...state.modalZIndexes, [id]: currentMaxZ + 1 }
    };
  }),
});
