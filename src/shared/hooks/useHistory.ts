import { useState, useCallback } from 'react';
import * as HistoryUtils from '../utils/history';

/**
 * Hook centralizado para gerenciar histórico de ações (Undo/Redo).
 * Ele armazena snapshots genéricos e retorna funções para navegar entre eles.
 */
export function useHistory<T>() {
  const [history, setHistory] = useState<HistoryUtils.HistoryState<T>>({
    past: [],
    future: []
  });

  const takeSnapshot = useCallback((currentState: T) => {
    setHistory(prev => HistoryUtils.takeSnapshot(currentState, prev));
  }, []);

  const undo = useCallback((currentState: T): T | null => {
    const result = HistoryUtils.undo(currentState, history);
    if (!result) return null;
    
    setHistory(result.history);
    return result.state;
  }, [history]);

  const redo = useCallback((currentState: T): T | null => {
    const result = HistoryUtils.redo(currentState, history);
    if (!result) return null;

    setHistory(result.history);
    return result.state;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory({ past: [], future: [] });
  }, []);

  return { 
    takeSnapshot, 
    undo, 
    redo, 
    clearHistory,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}
