import { createContext, useContext, ReactNode } from 'react';
import { CanvasControlsContextValue } from '@/shared/types';

const CanvasControlsContext = createContext<CanvasControlsContextValue | undefined>(undefined);

export function useCanvasControls() {
  const context = useContext(CanvasControlsContext);
  if (!context) {
    throw new Error('useCanvasControls must be used within a CanvasControls provider');
  }
  return context;
}

import { Sidebar } from './Sidebar';
import { Modals } from './Modals';
import { CanvasControlsProps } from '@/shared/types';

export function CanvasControls({ children, value }: CanvasControlsProps) {
  return (
    <CanvasControlsContext.Provider value={value}>
      {children}
    </CanvasControlsContext.Provider>
  );
}

CanvasControls.Sidebar = Sidebar;
CanvasControls.Modals = Modals;
