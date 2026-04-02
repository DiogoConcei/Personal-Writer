import { create } from 'zustand';
import { readFile, writeFile, createSnapshot } from '@/tauri-bridge';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { Metadata, parseMarkdownMetadata } from './metadataParser';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type Typography = 'sans' | 'serif';

interface EditorState {
  metadata: Metadata;
  markdownContent: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  lastSnapshotAt: Date | null;
  typography: Typography;
  wordCount: number;

  // Actions
  loadContent: (path: string) => Promise<void>;
  setMarkdownContent: (content: string) => void;
  setMetadata: (metadata: Metadata) => void;
  save: (path: string, workspaceRoot?: string) => Promise<void>;
  setTypography: (typography: Typography) => void;
  setWordCount: (count: number) => void;
}

const stringifyYAML = (metadata: Metadata) => {
  if (Object.keys(metadata).length === 0) return '';

  const normalize = (path: string) => path.replace(/\\/g, '/');

  let yaml = '---\n';
  if (metadata.type) yaml += `type: ${metadata.type}\n`;
  if (metadata.icon) yaml += `icon: "${normalize(metadata.icon)}"\n`;
  if (metadata.music !== undefined) yaml += `music: "${normalize(metadata.music)}"\n`;
  if (metadata.images) {
    yaml += `images: [${metadata.images.map(i => `"${normalize(i)}"`).join(', ')}]\n`;
  }
  if (metadata.linked_characters) {
    yaml += `linked_characters: [${metadata.linked_characters.map(c => `"${c}"`).join(', ')}]\n`;
  }
  if (metadata.config && Object.keys(metadata.config).length > 0) {
    yaml += `config: '${JSON.stringify(metadata.config)}'\n`;
  }
  if (metadata.fields && Object.keys(metadata.fields).length > 0) {
    yaml += `fields:\n`;
    Object.entries(metadata.fields).forEach(([k, v]) => {
      const formattedValue = typeof v === 'string' ? `"${v}"` : v;
      yaml += `  ${k}: ${formattedValue}\n`;
    });
  }
  yaml += '---';
  return yaml;
};

let saveTimeout: any = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  metadata: {},
  markdownContent: '',
  saveStatus: 'idle',
  lastSavedAt: null,
  lastSnapshotAt: null,
  typography: 'sans',
  wordCount: 0,

  loadContent: async (path: string) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    set({ saveStatus: 'idle', lastSnapshotAt: null });
    try {
      const fullContent = await readFile(path);
      const { metadata, markdown } = parseMarkdownMetadata(fullContent);
      set({ 
        metadata,
        markdownContent: markdown,
        saveStatus: 'idle',
        lastSavedAt: new Date() 
      });
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      set({ saveStatus: 'error' });
    }
  },

  setMarkdownContent: (markdownContent: string) => {
    set({ markdownContent });
    
    // Auto-save disparado por mudança de conteúdo
    const activeFile = (window as any).__ACTIVE_FILE_PATH__; 
    // Nota: Como a store não tem o path, vamos usar um hack temporário ou 
    // passar o path no trigger. Mas melhor: o Editor.tsx já chama save().
    // Para resolver o bug da imagem, o setMetadata deve disparar o save.
  },

  setMetadata: (metadata: Metadata) => {
    set({ metadata });
  },

  save: async (path: string, workspaceRoot?: string) => {
    const { metadata, markdownContent, lastSnapshotAt } = get();
    set({ saveStatus: 'saving' });

    try {
      const yaml = stringifyYAML(metadata);
      const fullContent = yaml ? `${yaml}\n\n${markdownContent}` : markdownContent;
      await writeFile(path, fullContent);
      
      const now = new Date();
      
      // Atualizar o índice do Universo (Aqui usamos o acesso dinâmico para evitar problemas de init circular)
      useUniverseStore.getState().updateEntity(path, fullContent, now.getTime() / 1000);

      // Snapshot automático a cada 10 min
      if (workspaceRoot && (!lastSnapshotAt || now.getTime() - lastSnapshotAt.getTime() > 10 * 60 * 1000)) {
        await createSnapshot(path, workspaceRoot, fullContent);
        set({ lastSnapshotAt: now });
      }

      set({ 
        saveStatus: 'saved', 
        lastSavedAt: now
      });
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      set({ saveStatus: 'error' });
    }
  },

  setTypography: (typography: Typography) => {
    set({ typography });
  },

  setWordCount: (count: number) => {
    set({ wordCount: count });
  },
}));
