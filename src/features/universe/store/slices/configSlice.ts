import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '@/shared/types';

export const createConfigSlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set) => ({
  boardMode: 'free',
  backgroundPattern: 'grid',
  backgroundImage: null,
  backgroundRotation: 0,
  backgroundZoom: 1,

  setBoardMode: (mode) => set({ boardMode: mode }),
  setBackgroundPattern: (pattern) => set({ backgroundPattern: pattern }),
  setBackgroundImage: (path) => set({ backgroundImage: path }),
  setBackgroundRotation: (rotation) => set({ backgroundRotation: rotation }),
  setBackgroundZoom: (zoom) => set({ backgroundZoom: zoom }),
});
