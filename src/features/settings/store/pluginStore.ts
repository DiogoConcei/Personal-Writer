import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { togglePluginDaemon } from '@/tauri-bridge';

export type PluginStatus = 'not-installed' | 'installed' | 'enabled' | 'disabled';

export interface PluginMetadata {
  id: string;
  title: string;
  description: string;
  version: string;
  category: 'Academic' | 'Writer' | 'DevTools' | 'Language' | 'Design' | 'Performance';
  level: 1 | 2 | 3 | 4;
  status: PluginStatus;
  remoteAssets?: string[]; // URLs ou caminhos para baixar se for 'not-installed'
  hasBackend?: boolean;    // Se precisa ativar daemon no Rust
}

interface PluginState {
  plugins: PluginMetadata[];
  installPlugin: (id: string) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => Promise<void>;
  getPlugin: (id: string) => PluginMetadata | undefined;
}

// Mock inicial baseado no PRD_UNIFICADO_PLUGINS.md
const INITIAL_PLUGINS: PluginMetadata[] = [
  {
    id: 'latex-math',
    title: 'LaTeX Math Avançado',
    description: 'Suporte completo a fórmulas complexas renderizadas via KaTeX.',
    version: '1.0.0',
    category: 'Academic',
    level: 1,
    status: 'not-installed',
    remoteAssets: ['https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'],
  },
  {
    id: 'terminal-integrated',
    title: 'Terminal Integrado',
    description: 'Painel inferior com terminal funcional (xterm.js + PTY Rust).',
    version: '1.0.0',
    category: 'DevTools',
    level: 2,
    status: 'not-installed',
    hasBackend: true,
  },
  {
    id: 'reading-level',
    title: 'Reading Level Indicator',
    description: 'Calcula o nível de complexidade do texto (Flesch-Kincaid) via Rust.',
    version: '1.0.0',
    category: 'Performance',
    level: 3,
    status: 'not-installed',
    hasBackend: true,
  },
  {
    id: 'infinite-canvas',
    title: 'Infinite Canvas / Mood Board',
    description: 'Quadro branco espacial estilo Excalidraw integrado.',
    version: '1.0.0',
    category: 'Design',
    level: 3,
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
        const isEnabled = newStatus === 'enabled';

        if (plugin.hasBackend) {
          try {
            await togglePluginDaemon(id, isEnabled);
          } catch (error) {
            console.error(`Erro ao alternar daemon para ${id}:`, error);
            return;
          }
        }

        set((state) => ({
          plugins: state.plugins.map(p => 
            p.id === id ? { ...p, status: newStatus } : p
          )
        }));
      },
    }),
    {
      name: 'plugin-storage',
    }
  )
);
