import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '../moodBoardStore.types';
import * as HistoryUtils from '@/shared/utils/history';

export const createHistorySlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set, get) => ({
  past: [],
  future: [],

  takeSnapshot: () => {
    const { items, groups, drawings, connections, past, future } = get();
    const currentState = { items, groups, drawings, connections };
    const history = { past, future };
    
    const newHistory = HistoryUtils.takeSnapshot(currentState, history);
    set(newHistory);
  },

  undo: () => {
    const { items, groups, drawings, connections, past, future } = get();
    const currentState = { items, groups, drawings, connections };
    const history = { past, future };

    const result = HistoryUtils.undo(currentState, history);
    if (!result) return;

    set({
      ...result.state,
      ...result.history
    });
  },

  redo: () => {
    const { items, groups, drawings, connections, past, future } = get();
    const currentState = { items, groups, drawings, connections };
    const history = { past, future };

    const result = HistoryUtils.redo(currentState, history);
    if (!result) return;

    set({
      ...result.state,
      ...result.history
    });
  }
});
