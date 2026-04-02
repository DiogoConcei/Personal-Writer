import { create } from 'zustand';
import { readFile, writeFile, createSnapshot } from '@/tauri-bridge';
import { useUniverseStore } from '@/features/universe/store/universeStore';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type Typography = 'sans' | 'serif';

export interface FieldConfig {
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface Metadata {
  type?: string;
  icon?: string;
  images?: string[];
  music?: string;
  linked_characters?: string[];
  config?: Record<string, FieldConfig>;
  fields?: Record<string, any>;
}

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

export const parseMarkdownMetadata = (content: string) => {
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!yamlMatch) return { metadata: {}, markdown: content };

  const yamlStr = yamlMatch[1];
  const markdown = content.replace(yamlMatch[0], '').trim();
  const data: Metadata = { fields: {} };

  const typeMatch = yamlStr.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
  const iconMatch = yamlStr.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);
  const musicMatch = yamlStr.match(/music:\s*["']?([^"'\r\n]+)["']?/i);
  const configMatch = yamlStr.match(/config:\s*'(.*?)'/i);

  // Parsers de arrays simples (estilo [item1, item2])
  const imagesMatch = yamlStr.match(/images:\s*\[(.*?)\]/i);
  const linkedMatch = yamlStr.match(/linked_characters:\s*\[(.*?)\]/i);

  if (typeMatch) data.type = typeMatch[1].trim();
  if (iconMatch) data.icon = iconMatch[1].trim();
  if (musicMatch) data.music = musicMatch[1].trim();
  
  if (imagesMatch) {
    data.images = imagesMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.images = [];
  }

  if (linkedMatch) {
    data.linked_characters = linkedMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.linked_characters = [];
  }

  if (configMatch) {
    try {
      data.config = JSON.parse(configMatch[1]);
    } catch (e) {}
  }

  const fieldsBlock = yamlStr.match(/fields:\r?\n([\s\S]*?)(?=\r?\n[a-z]|$)/i);
  if (fieldsBlock) {
    const lines = fieldsBlock[1].split('\n');
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim().replace(/["']/g, '');
        if (k) data.fields![k] = isNaN(Number(v)) ? v : Number(v);
      }
    });
  }
  return { metadata: data, markdown };
};

const stringifyYAML = (metadata: Metadata) => {
  if (Object.keys(metadata).length === 0) return '';

  let yaml = '---\n';
  if (metadata.type) yaml += `type: ${metadata.type}\n`;
  if (metadata.icon) yaml += `icon: "${metadata.icon}"\n`;
  if (metadata.music !== undefined) yaml += `music: "${metadata.music}"\n`;
  if (metadata.images) {
    yaml += `images: [${metadata.images.map(i => `"${i}"`).join(', ')}]\n`;
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

export const useEditorStore = create<EditorState>((set, get) => ({
  metadata: {},
  markdownContent: '',
  saveStatus: 'idle',
  lastSavedAt: null,
  lastSnapshotAt: null,
  typography: 'sans',
  wordCount: 0,

  loadContent: async (path: string) => {
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
      
      // Atualizar o índice do Universo
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

