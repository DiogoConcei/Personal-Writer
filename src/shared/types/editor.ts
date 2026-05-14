import { ReactNode } from 'react';
import { Editor, Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { LucideIcon } from 'lucide-react';

import { CutPatch } from './canvas';

export interface CommandItem {
  title: string;
  icon: ReactNode;
  color: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

export interface NoteData {
  noteId: string;
  title: string;
  contentSnippet?: string;
  startPage?: number;
  endPage?: number;
  totalPages?: number;
  patches?: CutPatch[];
}

export interface PostItData {
  text: string;
  color: string;
}

export interface TextData {
  text: string;
}

export interface PageData {
  title?: string;
  backgroundColor?: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type Typography = 'sans' | 'serif';

/**
 * Configuração de campo dinâmico no editor.
 */
export interface FieldConfig {
  type: 'text' | 'number' | 'single-select' | 'multi-select';
  options?: string[];
}

/**
 * Metadados específicos do Editor (YAML Frontmatter).
 */
export interface EditorMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface EditorMetadata {
  type?: string;
  icon?: string;
  images?: string[];
  documents?: string[];
  music?: string;
  linked_characters?: string[];
  wordGoal?: number;
  sessionGoal?: number;
  margins?: EditorMargins;
  config?: Record<string, FieldConfig>;
  fields?: Record<string, unknown>;
}

export interface HeaderProps {
  metadata?: EditorMetadata;
  readOnly?: boolean;
}

export type CharacterHeaderProps = HeaderProps;
export type DefaultHeaderProps = HeaderProps;
export type LocationHeaderProps = HeaderProps;
export type MetadataHeaderProps = HeaderProps;

export interface CharacterLink {
  path: string;
  name: string;
  icon?: string;
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
  HTMLAttributes: Record<string, unknown>;
  onLinkClick?: (noteName: string) => void;
  suggestion: Record<string, unknown>;
}

export interface DictionaryContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  word: string;
  onClose: () => void;
}

export interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export interface EditorModalsProps {
  editor: Editor | null;
  templateToApply: string | null;
  setTemplateToApply: (val: string | null) => void;
}

export interface EditorToolbarProps {
  children: ReactNode;
}

export interface ActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}

export interface DropdownProps {
  icon: LucideIcon;
  label: string;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  children: ReactNode;
}

export interface DropdownItemProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

export interface TableOfContentsProps {
  editor: Editor | null;
  onClose: () => void;
}
