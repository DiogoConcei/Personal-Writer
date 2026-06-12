import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '@/shared/types';
import { readFile, writeFile } from '@/tauri-bridge/fs';
import { useUIStore } from '@/store/uiStore';

export const createPersistenceSlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set, get) => ({
  boardId: null,
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
    
    const muraisDir = `${rootPath}/murais`;
    if (!(await exists(muraisDir))) {
      await createDirectory(muraisDir);
    }

    const targetId = boardId || get().boardId || 'default';
    const configPath = `${muraisDir}/${targetId}.json`;
    const legacyPath = `${rootPath}/mesa.json`;
    
    try {
      let data;
      let shouldMigrateLegacy = false;

      if (await exists(configPath)) {
        const content = await readFile(configPath);
        data = JSON.parse(content);
      } else if (!boardId && await exists(legacyPath)) {
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
    
    if (get().boardId === id) {
      set({ boardId: null, items: [], groups: [], boardName: 'Mesa Principal' });
    }
  },
});
