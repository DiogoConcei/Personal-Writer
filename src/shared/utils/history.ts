/**
 * Utilitários compartilhados para lógica de Histórico (Undo/Redo).
 * Centraliza a lógica para ser usada tanto em Hooks (Canvas) quanto em Zustand Slices (Universe).
 */

export interface HistoryState<T> {
  past: T[];
  future: T[];
}

const MAX_HISTORY_SIZE = 30;

/**
 * Cria um snapshot do estado atual.
 */
export function takeSnapshot<T>(currentState: T, history: HistoryState<T>): HistoryState<T> {
  const snapshot = JSON.parse(JSON.stringify(currentState));
  return {
    past: [...history.past, snapshot].slice(-MAX_HISTORY_SIZE),
    future: []
  };
}

/**
 * Retorna o estado anterior e o novo estado do histórico.
 */
export function undo<T>(currentState: T, history: HistoryState<T>): { state: T; history: HistoryState<T> } | null {
  if (history.past.length === 0) return null;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);
  const currentSnapshot = JSON.parse(JSON.stringify(currentState));

  return {
    state: previous,
    history: {
      past: newPast,
      future: [currentSnapshot, ...history.future].slice(0, MAX_HISTORY_SIZE)
    }
  };
}

/**
 * Retorna o próximo estado e o novo estado do histórico.
 */
export function redo<T>(currentState: T, history: HistoryState<T>): { state: T; history: HistoryState<T> } | null {
  if (history.future.length === 0) return null;

  const next = history.future[0];
  const newFuture = history.future.slice(1);
  const currentSnapshot = JSON.parse(JSON.stringify(currentState));

  return {
    state: next,
    history: {
      past: [...history.past, currentSnapshot].slice(-MAX_HISTORY_SIZE),
      future: newFuture
    }
  };
}
