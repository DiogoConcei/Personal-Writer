/**
 * Arquitetura de Entidades Genéricas para o Infinite Canvas.
 * Permite extensibilidade total e personalizações dinâmicas.
 */

export interface CanvasEntity<T = any> {
  id: string;
  type: string; // Ex: 'pdf', 'image', 'note', 'postit'
  
  // Transformações Universais
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // Graus (0-360)
  zIndex?: number;   // Ordem de sobreposição
  
  // Sistemas de Relacionamento e Estrutura
  groupId?: string;       // ID do grupo ao qual pertence
  connections?: string[]; // IDs de outras entidades vinculadas (linhas)
  
  // Estilo Dinâmico (CSS Injection)
  style?: Record<string, string | number>;
  
  // Payload de Dados Específicos
  data: T;
}

// --- Definições de Payloads Padrão ---

export interface PdfData {
  path: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}

export interface ImageData {
  path: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface NoteData {
  noteId: string;
  title: string;
  contentSnippet?: string;
}

export interface PostItData {
  text: string;
  color: string;
}

export type AnyCanvasEntity = CanvasEntity<any>;
