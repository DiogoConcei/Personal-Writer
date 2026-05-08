import { create } from 'zustand';
import { readFile, writeFile } from '@/tauri-bridge/fs';
import { MesaItem, MesaGrupo } from '@/shared/types';
import { useUIStore } from '@/store/uiStore';

interface MesaTrabalhoState {
  items: MesaItem[];
  groups: MesaGrupo[];
  drawings: MesaDrawing[];
  selectedItems: string[];
  boardId: string | null;
  boardName: string;
  boardMode: 'free' | 'planning';
  backgroundPattern: 'dots' | 'grid' | 'cork';
  backgroundImage: string | null;
  backgroundRotation: number;
  backgroundZoom: number;
  connections: Array<{ id: string; from: string; to: string; color?: string }>;
  activeDetailsIds: string[];
  modalZIndexes: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  allBoards: Array<{ id: string, name: string, backgroundImage: string | null }>;

  loadBoard: (rootPath: string, boardId?: string) => Promise<void>;
  saveBoard: (rootPath: string) => Promise<void>;
  loadAllBoards: (rootPath: string) => Promise<void>;
  createBoard: (rootPath: string, name: string) => Promise<string>;
  deleteBoard: (rootPath: string, id: string) => Promise<void>;
  setBoardName: (name: string) => void;
  setBoardMode: (mode: 'free' | 'planning') => void;
  setBackgroundPattern: (pattern: 'dots' | 'grid' | 'cork') => void;
  toggleDetailsId: (id: string, forceClose?: boolean) => void;
  bringDetailsToFront: (id: string) => void;
  addItem: (item: Omit<MesaItem, 'id' | 'zIndex'>) => void;
  updateItem: (id: string, updates: Partial<MesaItem>) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;
  
  // Desenhos
  addDrawing: (drawing: MesaDrawing) => void;
  updateDrawing: (id: string, updates: Partial<MesaDrawing>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;

  // Conexões
  addConnection: (from: string, to: string) => void;
  removeConnection: (id: string) => void;

  // Anexar itens a personagens
  attachItemToCharacter: (itemId: string, characterId: string) => void;
  detachItemFromCharacter: (itemId: string, x: number, y: number) => void;

  // Grupos
  updateGroup: (id: string, updates: Partial<MesaGrupo>) => void;
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

export const useMesaTrabalhoStore = create<MesaTrabalhoState>((set, get) => ({
  items: [],
  groups: [],
  drawings: [],
  selectedItems: [],
  boardId: null,
  boardName: 'Mesa Principal',
  boardMode: 'free',
  backgroundPattern: 'grid',
  backgroundImage: null,
  backgroundRotation: 0,
  backgroundZoom: 1,
  connections: [],
  activeDetailsIds: [],
  modalZIndexes: {},
  isLoading: false,
  error: null,
  allBoards: [],

  loadAllBoards: async (rootPath) => {
    const { listDirectory, exists, createDirectory } = await import('@/tauri-bridge/fs');
    const muraisDir = `${rootPath}/murais`;
    
    try {
      if (!(await exists(muraisDir))) {
        await createDirectory(muraisDir);
      }

      const files = await listDirectory(muraisDir);
      const boards = [];

      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const content = await readFile(`${muraisDir}/${file.name}`);
            const data = JSON.parse(content);
            boards.push({
              id: file.name.replace('.json', ''),
              name: data.boardName || 'Sem título',
              backgroundImage: data.backgroundImage || null
            });
          } catch (e) {
            console.error(`Erro ao carregar meta de ${file.name}:`, e);
          }
        }
      }
      set({ allBoards: boards });
    } catch (err) {
      console.error('Erro ao listar murais:', err);
    }
  },

  loadBoard: async (rootPath, boardId) => {
    set({ isLoading: true, error: null });
    const { exists, createDirectory } = await import('@/tauri-bridge/fs');
    
    // Garantir que a pasta murais existe
    const muraisDir = `${rootPath}/murais`;
    if (!(await exists(muraisDir))) {
      await createDirectory(muraisDir);
    }

    const targetId = boardId || get().boardId || 'default';
    const configPath = `${muraisDir}/${targetId}.json`;
    const legacyPath = `${rootPath}/mesa.json`; // Legado agora é o antigo mesa.json
    
    try {
      let data;
      let shouldMigrateLegacy = false;

      if (await exists(configPath)) {
        const content = await readFile(configPath);
        data = JSON.parse(content);
      } else if (!boardId && await exists(legacyPath)) {
        // Migração apenas se estiver tentando carregar o padrão e o legado existir
        const content = await readFile(legacyPath);
        data = JSON.parse(content);
        shouldMigrateLegacy = true;
      }

      if (data) {
        set({ 
          boardId: targetId,
          items: data.items || [], 
          groups: data.groups || [], 
          drawings: data.drawings || [],
          connections: data.connections || [],
          boardName: data.boardName || 'Mesa Principal',
          boardMode: data.boardMode || 'free',
          backgroundPattern: data.backgroundPattern || 'grid',
          backgroundImage: data.backgroundImage || null,
          backgroundRotation: data.backgroundRotation || 0,
          backgroundZoom: data.backgroundZoom || 1,
          isLoading: false 
        });

        if (shouldMigrateLegacy) {
          const { deleteItem } = await import('@/tauri-bridge/fs');
          await get().saveBoard(rootPath);
          await deleteItem(legacyPath);
        }
      } else {
        set({ 
          boardId: targetId,
          items: [], 
          groups: [], 
          drawings: [],
          boardName: 'Novo Mural', 
          boardMode: 'free', 
          backgroundImage: null, 
          backgroundRotation: 0, 
          backgroundZoom: 1, 
          isLoading: false 
        });
      }
    } catch (err) {
      console.error(`Erro ao carregar mural ${targetId}:`, err);
      set({ isLoading: false, error: 'Falha ao carregar mural' });
    }
  },

  saveBoard: async (rootPath) => {
    const { boardId } = get();
    if (!boardId) return;

    const configPath = `${rootPath}/murais/${boardId}.json`;
    const addNotification = useUIStore.getState().addNotification;

    try {
      const { items, groups, drawings, connections, boardName, boardMode, backgroundPattern, backgroundImage, backgroundRotation, backgroundZoom } = get();
      
      const referenceSet = new Set<string>();
      items.forEach(item => { if (item.path) referenceSet.add(item.path); });
      if (backgroundImage) referenceSet.add(backgroundImage);
      
      const references = Array.from(referenceSet);

      await writeFile(configPath, JSON.stringify({ 
        items, 
        groups, 
        drawings,
        connections,
        boardName, 
        boardMode,
        backgroundPattern,
        backgroundImage, 
        backgroundRotation, 
        backgroundZoom,
        references 
      }, null, 2));

      addNotification('Mesa salva com sucesso', 'success');

      // Atualizar lista local de murais após salvar
      await get().loadAllBoards(rootPath);
    } catch (err) {
      console.error('Erro ao salvar mural:', err);
      addNotification('Erro ao salvar mural', 'error');
    }
  },

  createBoard: async (rootPath, name) => {
    const id = crypto.randomUUID();
    const muraisDir = `${rootPath}/murais`;
    const { exists, createDirectory } = await import('@/tauri-bridge/fs');
    
    if (!(await exists(muraisDir))) {
      await createDirectory(muraisDir);
    }

    const newBoardData = {
      boardName: name,
      boardMode: 'free',
      backgroundPattern: 'grid',
      items: [],
      groups: [],
      drawings: [],
      backgroundImage: null,
      backgroundRotation: 0,
      backgroundZoom: 1,
      references: []
    };

    await writeFile(`${muraisDir}/${id}.json`, JSON.stringify(newBoardData, null, 2));
    await get().loadAllBoards(rootPath);
    return id;
  },

  deleteBoard: async (rootPath, id) => {
    const { deleteItem } = await import('@/tauri-bridge/fs');
    const path = `${rootPath}/murais/${id}.json`;
    await deleteItem(path);
    await get().loadAllBoards(rootPath);
    
    // Se o mural deletado for o atual, carregar outro ou resetar
    if (get().boardId === id) {
      set({ boardId: null, items: [], groups: [], boardName: 'Mesa Principal' });
    }
  },

  setBoardName: (name) => set({ boardName: name }),

  setBoardMode: (mode) => set({ boardMode: mode }),

  setBackgroundPattern: (pattern) => set({ backgroundPattern: pattern }),

  addItem: (itemData) => set((state) => {
    const newItem: MesaItem = {
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
    // Deleta o item E todos os itens atrelados a ele (se for personagem)
    items: state.items.filter(item => item.id !== id && item.ownerId !== id),
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

  clearDrawings: () => set({ drawings: [] }),

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

  // Grupos
  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeGroup: (id) => set((state) => ({
    groups: state.groups.filter(g => g.id !== id),
    items: state.items.map(item => item.groupId === id ? { ...item, groupId: undefined } : item)
  })),

  groupSelectedItems: () => {
    const { selectedItems, items, groups, boardMode } = get();
    if (selectedItems.length < 2) return null;

    const itemsToGroup = items.filter(i => selectedItems.includes(i.id));
    
    // MODO PLANEJAMENTO: Fundir em uma única entidade (Galeria)
    if (boardMode === 'planning') {
      const [primaryItem, ...otherItems] = itemsToGroup;
      
      // Coletar todos os caminhos de imagem dos outros itens
      const newExtraPaths = [...(primaryItem.extraPaths || [])];
      otherItems.forEach(item => {
        newExtraPaths.push(item.path);
        if (item.extraPaths) {
          newExtraPaths.push(...item.extraPaths);
        }
      });

      // Remover duplicatas
      const uniqueExtraPaths = Array.from(new Set(newExtraPaths));

      set(state => ({
        items: state.items
          .filter(i => !selectedItems.includes(i.id) || i.id === primaryItem.id)
          .map(i => i.id === primaryItem.id ? { ...i, extraPaths: uniqueExtraPaths } : i),
        selectedItems: []
      }));

      return primaryItem.id;
    }

    // MODO LIVRE: Comportamento padrão de layout em linha
    const avgX = itemsToGroup.reduce((acc, i) => acc + i.x, 0) / itemsToGroup.length;
    const avgY = itemsToGroup.reduce((acc, i) => acc + i.y, 0) / itemsToGroup.length;
    const maxZ = Math.max(0, ...items.map(i => i.zIndex), ...groups.map(g => g.zIndex));

    const groupId = crypto.randomUUID();
    const newGroup: MesaGrupo = {
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

  toggleDetailsId: (id, forceClose) => set((state) => {
    if (forceClose) {
      const newZIndexes = { ...state.modalZIndexes };
      delete newZIndexes[id];
      return { 
        activeDetailsIds: state.activeDetailsIds.filter(activeId => activeId !== id),
        modalZIndexes: newZIndexes
      };
    }
    
    const exists = state.activeDetailsIds.includes(id);
    if (exists) {
      const newZIndexes = { ...state.modalZIndexes };
      delete newZIndexes[id];
      return { 
        activeDetailsIds: state.activeDetailsIds.filter(activeId => activeId !== id),
        modalZIndexes: newZIndexes
      };
    }

    const currentMaxZ = Object.values(state.modalZIndexes).length > 0 
      ? Math.max(...Object.values(state.modalZIndexes)) 
      : 10000;

    return { 
      activeDetailsIds: [...state.activeDetailsIds, id],
      modalZIndexes: { ...state.modalZIndexes, [id]: currentMaxZ + 1 }
    };
  }),

  bringDetailsToFront: (id) => set((state) => {
    const currentMaxZ = Object.values(state.modalZIndexes).length > 0 
      ? Math.max(...Object.values(state.modalZIndexes)) 
      : 10000;
    
    if (state.modalZIndexes[id] === currentMaxZ) return state;

    return {
      modalZIndexes: { ...state.modalZIndexes, [id]: currentMaxZ + 1 }
    };
  }),
}));
