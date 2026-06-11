import { useState, useCallback } from 'react';
import { CanvasModalType, CanvasModalsState } from '@/shared/types';

export function useCanvasModals() {
  const [state, setState] = useState<CanvasModalsState>({
    openModal: null,
    splittingItem: null,
    focusItem: null,
    sideMenuMode: 'main',
    isGroupingActive: false,
    groupingSourceId: null,
  });

  const open = useCallback((type: CanvasModalType, data?: any) => {
    setState(prev => ({
      ...prev,
      openModal: type,
      splittingItem: type === 'split' ? data : prev.splittingItem,
      focusItem: type === 'focus' ? data : prev.focusItem,
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      openModal: null,
      splittingItem: null,
      focusItem: null,
      isGroupingActive: false,
      groupingSourceId: null,
    }));
  }, []);

  const setSideMenuMode = useCallback((mode: 'main' | 'notes' | 'drawing' | 'postits' | 'text' | 'pages') => {
    setState(prev => ({ ...prev, sideMenuMode: mode }));
  }, []);

  const startGrouping = useCallback((id: string) => {
    setState(prev => ({ ...prev, isGroupingActive: true, groupingSourceId: id }));
  }, []);

  const cancelGrouping = useCallback(() => {
    setState(prev => ({ ...prev, isGroupingActive: false, groupingSourceId: null }));
  }, []);

  return {
    ...state,
    open,
    close,
    setSideMenuMode,
    startGrouping,
    cancelGrouping,
  };
}
