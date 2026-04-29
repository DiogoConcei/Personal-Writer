import { PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';

export interface NoteData {
  noteId: string;
  title: string;
  contentSnippet?: string;
  startPage?: number;
  endPage?: number;
  totalPages?: number;
}

export interface PostItData {
  text: string;
  color: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type Typography = 'sans' | 'serif';

/**
 * Configuração de campo dinâmico no editor.
 */
export interface FieldConfig {
  type: 'text' | 'number' | 'select';
  options?: string[];
}

/**
 * Metadados específicos do Editor (YAML Frontmatter).
 */
export interface EditorMetadata {
  type?: string;
  icon?: string;
  images?: string[];
  documents?: string[];
  music?: string;
  linked_characters?: string[];
  wordGoal?: number;
  sessionGoal?: number;
  config?: Record<string, FieldConfig>;
  fields?: Record<string, any>;
}

/**
 * Opções para a extensão de ortografia.
 */
export interface SpellingOptions {
  debounce: number;
}

/**
 * Armazenamento interno da extensão de ortografia.
 */
export interface SpellingStorage {
  pluginKey: PluginKey<SpellingPluginState> | null;
}

/**
 * Estado do plugin de ortografia no ProseMirror.
 */
export interface SpellingPluginState {
  decorations: DecorationSet;
  forceCheck: boolean;
}

/**
 * Opções para a extensão de WikiLink.
 */
export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  onLinkClick?: (noteName: string) => void;
  suggestion: any;
}
