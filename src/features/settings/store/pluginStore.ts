import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PluginStatus, PluginMetadata } from '@/shared/types';

interface PluginState {
  plugins: PluginMetadata[];
  installPlugin: (id: string) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => Promise<void>;
  getPlugin: (id: string) => PluginMetadata | undefined;
  resetPlugins: () => void;
}

// Mock inicial baseado no PRD_UNIFICADO_PLUGINS.md
const INITIAL_PLUGINS: PluginMetadata[] = [
  {
    id: 'mood-board',
    title: 'Mesa de Trabalho',
    description: 'Mural de referências visuais para colagem de imagens e inspiração.',
    version: '1.0.0',
    category: 'Design',
    level: 2,
    status: 'not-installed',
  },
  {
    id: 'infinite-canvas',
    title: 'Infinite Canvas',
    description: 'Quadro branco espacial infinito que integra notas .md e conexões.',
    version: '1.0.0',
    category: 'Planning',
    level: 3,
    status: 'not-installed',
  },
  {
    id: 'drawing-board',
    title: 'Desenho (Excalidraw)',
    description: 'Ferramenta de desenho vetorial com estética de quadro branco.',
    version: '1.0.0',
    category: 'Design',
    level: 2,
    status: 'not-installed',
  },
  {
    id: 'universe-dashboard',
    title: 'Dashboard & Timeline',
    description: 'Visão geral do projeto, estatísticas e linha do tempo dos eventos.',
    version: '1.0.0',
    category: 'Writer',
    level: 2,
    status: 'not-installed',
  },
  {
    id: 'character-gallery',
    title: 'Galeria de Personagens',
    description: 'Gerenciador visual de personagens, locais e itens do universo.',
    version: '1.0.0',
    category: 'Writer',
    level: 2,
    status: 'not-installed',
  }
];

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: INITIAL_PLUGINS,

      getPlugin: (id) => get().plugins.find(p => p.id === id),

      installPlugin: async (id) => {
        set((state) => ({
          plugins: state.plugins.map(p => 
            p.id === id ? { ...p, status: 'installed' } : p
          )
        }));
      },

      uninstallPlugin: async (id) => {
        set((state) => ({
          plugins: state.plugins.map(p => 
            p.id === id ? { ...p, status: 'not-installed' } : p
          )
        }));
      },

      togglePlugin: async (id) => {
        const plugin = get().plugins.find(p => p.id === id);
        if (!plugin || plugin.status === 'not-installed') return;

        const newStatus: PluginStatus = plugin.status === 'enabled' ? 'disabled' : 'enabled';

        set((state) => ({
          plugins: state.plugins.map(p => 
            p.id === id ? { ...p, status: newStatus } : p
          )
        }));
      },

      resetPlugins: () => {
        set({ plugins: INITIAL_PLUGINS });
      },
    }),
    {
      name: 'plugin-storage',
    }
  )
);
