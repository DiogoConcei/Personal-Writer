import { create } from 'zustand';
import { MesaDrawing } from '@/shared/types';

interface DrawingState {
  drawings: MesaDrawing[];
  strokeColor: string;
  strokeWidth: number;
  addDrawing: (drawing: MesaDrawing) => void;
  updateDrawing: (id: string, updates: Partial<MesaDrawing>) => void;
  addPointToDrawing: (id: string, point: { x: number, y: number }) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  setDrawings: (drawings: MesaDrawing[]) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  drawings: [],
  strokeColor: '#ef4444',
  strokeWidth: 3,
  
  setDrawings: (drawings) => set({ drawings }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),

  addDrawing: (drawing) => set((state) => ({ 
    drawings: [...state.drawings, drawing] 
  })),

  updateDrawing: (id, updates) => set((state) => ({
    drawings: state.drawings.map((d) => (d.id === id ? { ...d, ...updates } : d)),
  })),

  addPointToDrawing: (id, point) => set((state) => ({
    drawings: state.drawings.map((d) => 
      d.id === id ? { ...d, points: [...d.points, point] } : d
    ),
  })),

  removeDrawing: (id) => set((state) => ({ 
    drawings: state.drawings.filter((d) => d.id !== id) 
  })),

  clearDrawings: () => set({ drawings: [] }),
}));
