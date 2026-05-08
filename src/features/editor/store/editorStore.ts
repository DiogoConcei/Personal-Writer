import { create } from 'zustand';
import { readFile, writeFile, createSnapshot } from '@/tauri-bridge';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { EditorMetadata, SaveStatus, Typography, EditorMargins } from '@/shared/types';
import { parseMarkdownMetadata, stringifyYAML } from './metadataParser';
import { countWords } from '@/shared/utils/string';

export const DEFAULT_MARGINS: EditorMargins = {
  left: 80,
  right: 80,
  top: 40,
  bottom: 40
};

interface EditorState {
  metadata: EditorMetadata;
  markdownContent: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  lastSnapshotAt: Date | null;
  typography: Typography;
  wordCount: number;
  wordGoal: number;
  sessionGoal: number;
  sessionStartWordCount: number;

  loadContent: (path: string) => Promise<string>;
  setMarkdownContent: (content: string) => void;
  setMetadata: (metadata: EditorMetadata) => void;
  setMargins: (margins: EditorMargins) => void;
  save: (path: string, workspaceRoot?: string) => Promise<boolean>;
  setTypography: (typography: Typography) => void;
  setWordCount: (count: number) => void;
  setWordGoal: (goal: number) => void;
  setSessionGoal: (goal: number) => void;
  startNewSession: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  metadata: {},
  markdownContent: '',
  saveStatus: 'idle',
  lastSavedAt: null,
  lastSnapshotAt: null,
  typography: 'sans',
  wordCount: 0,
  wordGoal: 0,
  sessionGoal: 0,
  sessionStartWordCount: 0,

  loadContent: async (path: string) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    set({ saveStatus: 'idle', lastSnapshotAt: null });
    try {
      const fullContent = await readFile(path);
      const { metadata, markdown } = parseMarkdownMetadata(fullContent);

      // Garantir que as margens existem
      if (!metadata.margins) {
        metadata.margins = { ...DEFAULT_MARGINS };
      }

      const wordGoal = metadata.wordGoal ? Number(metadata.wordGoal) : 0;
      const sessionGoal = metadata.sessionGoal ? Number(metadata.sessionGoal) : 0;

      const initialWordCount = countWords(markdown);

      set({
        metadata,
        markdownContent: markdown,
        saveStatus: 'idle',
        lastSavedAt: new Date(),
        wordGoal,
        sessionGoal,
        wordCount: initialWordCount,
        sessionStartWordCount: initialWordCount
      });

      return markdown;
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      set({ saveStatus: 'error' });
      return "";
    }
  },

  setMarkdownContent: (markdownContent: string) => {
    set({ markdownContent });
  },

  setMetadata: (metadata: EditorMetadata) => {
    set({ metadata });
  },

  setMargins: (margins: EditorMargins) => {
    const { metadata } = get();
    set({ metadata: { ...metadata, margins } });
  },

  save: async (path: string, workspaceRoot?: string) => {
    const { metadata, markdownContent, lastSnapshotAt, wordGoal, sessionGoal } = get();
    set({ saveStatus: 'saving' });

    try {

      const updatedMetadata = {
        ...metadata,
        wordGoal: wordGoal > 0 ? wordGoal : undefined,
        sessionGoal: sessionGoal > 0 ? sessionGoal : undefined
      };

      const yaml = stringifyYAML(updatedMetadata);
      const fullContent = yaml ? `${yaml}\n\n${markdownContent}` : markdownContent;
      await writeFile(path, fullContent);

      const now = new Date();

      useUniverseStore.getState().updateEntity(path, fullContent, now.getTime() / 1000);

      if (workspaceRoot && (!lastSnapshotAt || now.getTime() - lastSnapshotAt.getTime() > 30 * 60 * 1000)) {
        await createSnapshot(path, workspaceRoot, fullContent);
        set({ lastSnapshotAt: now });
      }

      set({
        saveStatus: 'saved',
        lastSavedAt: now,
        metadata: updatedMetadata
      });
      return true;
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      set({ saveStatus: 'error' });
      return false;
    }
  },

  setTypography: (typography: Typography) => {
    set({ typography });
  },

  setWordCount: (count: number) => {
    set({ wordCount: count });
  },

  setWordGoal: (goal: number) => {
    set({ wordGoal: goal });
  },

  setSessionGoal: (goal: number) => {
    set({ sessionGoal: goal });
  },

  startNewSession: () => {
    const { wordCount } = get();
    set({ sessionStartWordCount: wordCount });
  },
}));
