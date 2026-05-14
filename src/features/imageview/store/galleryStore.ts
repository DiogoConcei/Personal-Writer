import { create } from 'zustand';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { exists, readFile, writeFile } from '@/tauri-bridge';
import { GalleryCollection } from '@/shared/types';

interface GalleryState {
  collections: GalleryCollection[];
  isLoading: boolean;

  loadCollections: () => Promise<void>;
  saveCollections: () => Promise<void>;
  createCollection: (name: string, images: string[], parentId?: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<GalleryCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (id: string, imagePaths: string[]) => Promise<void>;
  removeFromCollection: (id: string, imagePath: string) => Promise<void>;
  registerCollage: (imagePath: string) => Promise<void>;
}

const CONFIG_FILE = '.gallery.json';

export const useGalleryStore = create<GalleryState>((set, get) => ({
  collections: [],
  isLoading: false,

  loadCollections: async () => {
    const { rootPath } = useWorkspaceStore.getState();
    if (!rootPath) return;

    set({ isLoading: true });
    try {
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const configPath = `${rootPath}${separator}${CONFIG_FILE}`;

      const fileExists = await exists(configPath);
      if (fileExists) {
        const content = await readFile(configPath);
        const data = JSON.parse(content);
        set({ collections: data.collections || [], isLoading: false });
      } else {
        set({ collections: [], isLoading: false });
      }
    } catch (err) {
      console.error('Erro ao carregar coleções:', err);
      set({ collections: [], isLoading: false });
    }
  },

  saveCollections: async () => {
    const { rootPath } = useWorkspaceStore.getState();
    if (!rootPath) return;

    try {
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const configPath = `${rootPath}${separator}${CONFIG_FILE}`;
      const { collections } = get();

      await writeFile(configPath, JSON.stringify({ collections }, null, 2));
    } catch (err) {
      console.error('Erro ao salvar coleções:', err);
    }
  },

  createCollection: async (name: string, images: string[], parentId?: string) => {
    const newCollection: GalleryCollection = {
      id: crypto.randomUUID(),
      name,
      images,
      parentId
    };

    set(state => ({ collections: [...state.collections, newCollection] }));
    await get().saveCollections();
  },

  updateCollection: async (id: string, updates: Partial<GalleryCollection>) => {
    set(state => ({
      collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    await get().saveCollections();
  },

  deleteCollection: async (id: string) => {

    set(state => ({
      collections: state.collections
        .filter(c => c.id !== id)
        .map(c => c.parentId === id ? { ...c, parentId: undefined } : c)
    }));
    await get().saveCollections();
  },

  addToCollection: async (id: string, imagePaths: string[]) => {
    set(state => ({
      collections: state.collections.map(c => {
        if (c.id === id) {
          const newImages = [...new Set([...c.images, ...imagePaths])];
          return { ...c, images: newImages };
        }
        return c;
      })
    }));
    await get().saveCollections();
  },

  removeFromCollection: async (id: string, imagePath: string) => {
    set(state => ({
      collections: state.collections.map(c => {
        if (c.id === id) {
          return { ...c, images: c.images.filter(img => img !== imagePath) };
        }
        return c;
      })
    }));
    await get().saveCollections();
  },

  registerCollage: async (imagePath: string) => {
    const { collections, createCollection, addToCollection } = get();
    
    // Buscar ou criar a coleção de colagens
    const collageCollection = collections.find(c => c.name === 'Colagens');
    
    if (collageCollection) {
      await addToCollection(collageCollection.id, [imagePath]);
    } else {
      await createCollection('Colagens', [imagePath]);
    }
  },

  removeImageFromAllCollections: async (imagePath: string) => {
    set(state => ({
      collections: state.collections.map(c => ({
        ...c,
        images: c.images.filter(img => img !== imagePath)
      }))
    }));
    await get().saveCollections();
  }
}));
