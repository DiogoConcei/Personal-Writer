import { create } from 'zustand';
import { readFile, writeFile, createSnapshot } from '@/tauri-bridge';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { EditorMetadata, Typography, EditorMargins, EditorState } from '@/shared/types';
import { parseMarkdownMetadata, stringifyYAML } from './metadataParser';
import { countWords } from '@/shared/utils/string';

export const DEFAULT_MARGINS: EditorMargins = {
  left: 80,
  right: 80,
  top: 40,
  bottom: 40
};

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
      
      // Notifica o sistema de que um arquivo foi salvo (Útil para o Infinite Canvas)
      const { useUIStore } = await import('@/store/uiStore');
      useUIStore.getState().triggerFileSaveTick();

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

  setGoals: (wordGoal?: number, sessionGoal?: number) => {
    if (wordGoal !== undefined) set({ wordGoal });
    if (sessionGoal !== undefined) set({ sessionGoal });
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
