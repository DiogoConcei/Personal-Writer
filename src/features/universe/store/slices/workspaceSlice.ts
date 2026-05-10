import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '../moodBoardStore.types';
import { MesaItem } from '@/shared/types';

export const createWorkspaceSlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set, get) => ({
  items: [],
  drawings: [],
  connections: [],
  boardName: 'Mesa Principal',

  setBoardName: (name) => set({ boardName: name }),

  addItem: (itemData) => {
    get().takeSnapshot();
    set((state) => {
      const newItem: MesaItem = {
        ...itemData,
        id: crypto.randomUUID(),
        zIndex: state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) + 1 : 1
      };
      return { items: [...state.items, newItem] };
    });
  },

  updateItem: (id, updates) => {
    // Para updates contínuos (como drag), o snapshot deve ser tirado no início do drag
    // Mas para updates pontuais, tiramos aqui
    set((state) => ({
      items: state.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  },

  removeItem: (id) => {
    get().takeSnapshot();
    set((state) => ({
      // Deleta o item E todos os itens atrelados a ele (se for personagem)
      items: state.items.filter(item => item.id !== id && item.ownerId !== id),
      selectedItems: state.selectedItems.filter(sid => sid !== id)
    }));
  },

  bringToFront: (id) => set((state) => {
    const allZ = [
      ...state.items.map(i => i.zIndex || 0), 
      ...state.groups.map(g => g.zIndex || 0)
    ];
    const topZ = allZ.length > 0 ? Math.max(...allZ) : 0;
    
    // Se for um item
    if (state.items.some(i => i.id === id)) {
      return {
        items: state.items.map(item => item.id === id ? { ...item, zIndex: topZ + 1 } : item)
      };
    }
    
    // Se for um grupo
    return {
      groups: state.groups.map(group => group.id === id ? { ...group, zIndex: topZ + 1 } : group)
    };
  }),

  // Desenhos
  addDrawing: (drawing) => set((state) => ({
    drawings: [...state.drawings, drawing]
  })),

  updateDrawing: (id, updates) => set((state) => ({
    drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
  })),

  removeDrawing: (id) => set((state) => ({
    drawings: state.drawings.filter(d => d.id !== id)
  })),

  clearDrawings: () => {
    get().takeSnapshot();
    set({ drawings: [] });
  },

  // Conexões
  addConnection: (from, to) => set((state) => {
    // Evitar conexões duplicadas
    const exists = state.connections.some(c => 
      (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (exists || from === to) return state;

    const newConnection = {
      id: crypto.randomUUID(),
      from,
      to,
      color: '#ef4444' // Cor padrão de "fio"
    };

    return { connections: [...state.connections, newConnection] };
  }),

  removeConnection: (id) => set((state) => ({
    connections: state.connections.filter(c => c.id !== id)
  })),

  // Anexar itens a personagens
  attachItemToCharacter: (itemId, characterId) => set((state) => ({
    items: state.items.map(item => 
      item.id === itemId 
        ? { ...item, ownerId: characterId, groupId: undefined, groupOrder: undefined } 
        : item
    ),
    selectedItems: state.selectedItems.filter(sid => sid !== itemId)
  })),

  detachItemFromCharacter: (itemId, x, y) => set((state) => {
    const maxZ = Math.max(0, ...state.items.map(i => i.zIndex), ...state.groups.map(g => g.zIndex));
    return {
      items: state.items.map(item => 
        item.id === itemId 
          ? { ...item, ownerId: undefined, x, y, zIndex: maxZ + 1 } 
          : item
      )
    };
  }),
});
