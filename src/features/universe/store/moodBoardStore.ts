import { create } from 'zustand';
import { readFile, writeFile, exists } from '@/tauri-bridge/fs';
import { MoodBoardItem, MoodBoardGroup } from '@/shared/types';

interface MoodBoardState {
  items: MoodBoardItem[];
  groups: MoodBoardGroup[];
  selectedItems: string[];
  backgroundImage: string | null;
  backgroundRotation: number;
  backgroundZoom: number;
  isLoading: boolean;
  error: string | null;

  loadBoard: (rootPath: string) => Promise<void>;
  saveBoard: (rootPath: string) => Promise<void>;
  addItem: (item: Omit<MoodBoardItem, 'id' | 'zIndex'>) => void;
  updateItem: (id: string, updates: Partial<MoodBoardItem>) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;
  
  // Grupos
  updateGroup: (id: string, updates: Partial<MoodBoardGroup>) => void;
  removeGroup: (id: string) => void;
  groupSelectedItems: () => string | null;
  ungroupItems: (groupId: string) => void;
  reorderInGroup: (groupId: string, itemId: string, direction: 'left' | 'right') => void;

  // Seleção
  toggleSelection: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  mergeIntoGroup: (sourceId: string, targetId: string) => void;
  
  // Fundo
  setBackgroundImage: (path: string | null) => void;
  setBackgroundRotation: (rotation: number) => void;
  setBackgroundZoom: (zoom: number) => void;
}

export const useMoodBoardStore = create<MoodBoardState>((set, get) => ({
  items: [],
  groups: [],
  selectedItems: [],
  backgroundImage: null,
  backgroundRotation: 0,
  backgroundZoom: 1,
  isLoading: false,
  error: null,

  loadBoard: async (rootPath) => {
    set({ isLoading: true, error: null });
    const configPath = `${rootPath}/moodboard.json`;
    try {
      if (await exists(configPath)) {
        const content = await readFile(configPath);
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          set({ 
            items: data, 
            groups: [], 
            backgroundImage: null, 
            backgroundRotation: 0,
            backgroundZoom: 1,
            isLoading: false 
          });
        } else {
          set({ 
            items: data.items || [], 
            groups: data.groups || [], 
            backgroundImage: data.backgroundImage || null,
            backgroundRotation: data.backgroundRotation || 0,
            backgroundZoom: data.backgroundZoom || 1,
            isLoading: false 
          });
        }
      } else {
        set({ items: [], groups: [], backgroundImage: null, backgroundRotation: 0, backgroundZoom: 1, isLoading: false });
      }
    } catch (err) {
      console.error('Erro ao carregar moodboard.json:', err);
      set({ items: [], groups: [], backgroundImage: null, backgroundRotation: 0, backgroundZoom: 1, isLoading: false });
    }
  },

  saveBoard: async (rootPath) => {
    const configPath = `${rootPath}/moodboard.json`;
    try {
      const { items, groups, backgroundImage, backgroundRotation, backgroundZoom } = get();
      await writeFile(configPath, JSON.stringify({ items, groups, backgroundImage, backgroundRotation, backgroundZoom }, null, 2));
    } catch (err) {
      console.error('Erro ao salvar moodboard.json:', err);
    }
  },

  addItem: (itemData) => set((state) => {
    const newItem: MoodBoardItem = {
      ...itemData,
      id: crypto.randomUUID(),
      zIndex: state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) + 1 : 1
    };
    return { items: [...state.items, newItem] };
  }),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, ...updates } : item)
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
    selectedItems: state.selectedItems.filter(sid => sid !== id)
  })),

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

  // Grupos
  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeGroup: (id) => set((state) => ({
    groups: state.groups.filter(g => g.id !== id),
    items: state.items.map(item => item.groupId === id ? { ...item, groupId: undefined } : item)
  })),

  groupSelectedItems: () => {
    const { selectedItems, items, groups } = get();
    if (selectedItems.length < 2) return null;

    const itemsToGroup = items.filter(i => selectedItems.includes(i.id));
    
    // Calcular posição média
    const avgX = itemsToGroup.reduce((acc, i) => acc + i.x, 0) / itemsToGroup.length;
    const avgY = itemsToGroup.reduce((acc, i) => acc + i.y, 0) / itemsToGroup.length;
    const maxZ = Math.max(0, ...items.map(i => i.zIndex), ...groups.map(g => g.zIndex));

    const groupId = crypto.randomUUID();
    const newGroup: MoodBoardGroup = {
      id: groupId,
      x: avgX,
      y: avgY,
      zIndex: maxZ + 1,
      title: 'Novo Grupo'
    };

    set(state => ({
      groups: [...state.groups, newGroup],
      items: state.items.map(item => {
        if (selectedItems.includes(item.id)) {
          const index = selectedItems.indexOf(item.id);
          return { 
            ...item, 
            groupId, 
            groupOrder: index,
            rotation: 0,
            scale: item.scale > 1.2 ? 1.2 : item.scale
          };
        }
        return item;
      }),
      selectedItems: []
    }));

    return groupId;
  },

  ungroupItems: (groupId) => set(state => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return state;

    return {
      groups: state.groups.filter(g => g.id !== groupId),
      items: state.items.map(item => {
        if (item.groupId === groupId) {
          return { 
            ...item, 
            groupId: undefined, 
            groupOrder: undefined,
            x: group.x + (item.groupOrder || 0) * 80, // Espaçamento maior ao desagrupar
            y: group.y
          };
        }
        return item;
      })
    };
  }),

  reorderInGroup: (groupId, itemId, direction) => set(state => {
    const groupItems = state.items
      .filter(i => i.groupId === groupId)
      .sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
    
    const index = groupItems.findIndex(i => i.id === itemId);
    if (index === -1) return state;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= groupItems.length) return state;

    const newItems = [...groupItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    return {
      items: state.items.map(item => {
        const foundIndex = newItems.findIndex(ni => ni.id === item.id);
        if (foundIndex !== -1) {
          return { ...item, groupOrder: foundIndex };
        }
        return item;
      })
    };
  }),

  // Seleção
  toggleSelection: (id, multi) => set((state) => {
    if (!multi) {
      return { selectedItems: state.selectedItems.includes(id) ? [] : [id] };
    }
    
    if (state.selectedItems.includes(id)) {
      return { selectedItems: state.selectedItems.filter(sid => sid !== id) };
    }
    
    return { selectedItems: [...state.selectedItems, id] };
  }),

  clearSelection: () => set({ selectedItems: [] }),

  mergeIntoGroup: (sourceId, targetId) => set(state => {
    const source = state.items.find(i => i.id === sourceId);
    const target = state.items.find(i => i.id === targetId);
    if (!source || !target || sourceId === targetId) return state;

    // Se já estão no mesmo grupo, ignorar
    if (source.groupId && source.groupId === target.groupId) return state;

    let targetGroupId = target.groupId;
    let updatedGroups = [...state.groups];

    if (!targetGroupId) {
      // Se o target não tem grupo mas o source tem, adicionar target ao grupo do source
      if (source.groupId) {
        targetGroupId = source.groupId;
      } else {
        // Criar novo grupo se nenhum tiver
        targetGroupId = crypto.randomUUID();
        const maxZ = Math.max(0, ...state.items.map(i => i.zIndex), ...state.groups.map(g => g.zIndex));
        updatedGroups.push({
          id: targetGroupId,
          x: target.x,
          y: target.y,
          zIndex: maxZ + 1,
          title: 'Novo Grupo'
        });
      }
    }

    return {
      groups: updatedGroups,
      items: state.items.map(item => {
        if (item.id === sourceId || item.id === targetId) {
          // Contar itens já no grupo para definir a ordem
          const itemsInGroupCount = state.items.filter(i => i.groupId === targetGroupId).length;
          const order = item.id === targetId && target.groupId ? target.groupOrder : itemsInGroupCount;
          
          return {
            ...item,
            groupId: targetGroupId,
            groupOrder: item.id === sourceId ? itemsInGroupCount : (target.groupId ? target.groupOrder : 0),
            rotation: 0,
            scale: item.scale > 1.2 ? 1.2 : item.scale
          };
        }
        return item;
      })
    };
  }),

  setBackgroundImage: (path) => set({ backgroundImage: path }),

  setBackgroundRotation: (rotation) => set({ backgroundRotation: rotation }),

  setBackgroundZoom: (zoom) => set({ backgroundZoom: zoom }),
}));
