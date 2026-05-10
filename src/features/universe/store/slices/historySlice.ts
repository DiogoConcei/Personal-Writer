import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '../moodBoardStore.types';

export const createHistorySlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set, get) => ({
  past: [],
  future: [],

  takeSnapshot: () => {
    const { items, groups, drawings, connections, past } = get();
    const newSnapshot = JSON.parse(JSON.stringify({ items, groups, drawings, connections }));
    
    // Limitar o histórico para as últimas 30 ações
    const newPast = [...past, newSnapshot].slice(-30);
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, items, groups, drawings, connections } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const current = JSON.parse(JSON.stringify({ items, groups, drawings, connections }));

    set({
      items: previous.items,
      groups: previous.groups,
      drawings: previous.drawings,
      connections: previous.connections,
      past: newPast,
      future: [current, ...future].slice(0, 30)
    });
  },

  redo: () => {
    const { past, future, items, groups, drawings, connections } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = JSON.parse(JSON.stringify({ items, groups, drawings, connections }));

    set({
      items: next.items,
      groups: next.groups,
      drawings: next.drawings,
      connections: next.connections,
      past: [...past, current].slice(-30),
      future: newFuture
    });
  }
});
