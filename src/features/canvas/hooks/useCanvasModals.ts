import { useState, useCallback } from 'react';
import { CanvasModalType, CanvasModalsState } from '@/shared/types';

export function useCanvasModals() {
  const [state, setState] = useState<CanvasModalsState>({
    openModal: null,
    splittingItem: null,
    sideMenuMode: 'main',
  });

  const open = useCallback((type: CanvasModalType, data?: any) => {
    setState(prev => ({
      ...prev,
      openModal: type,
      splittingItem: type === 'split' ? data : prev.splittingItem,
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      openModal: null,
      splittingItem: null,
    }));
  }, []);

  const setSideMenuMode = useCallback((mode: 'main' | 'notes') => {
    setState(prev => ({ ...prev, sideMenuMode: mode }));
  }, []);

  return {
    ...state,
    open,
    close,
    setSideMenuMode,
  };
}
