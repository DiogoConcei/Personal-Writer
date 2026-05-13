import { PdfData, ImageData } from './assets';
import { NoteData, PostItData, TextData, PageData } from './editor';

export interface Point {
  x: number;
  y: number;
}

export interface CropOptions {
  points: Point[];
  boundingBox: { x: number; y: number; width: number; height: number };
  container: HTMLElement;
}

/**
 * Arquitetura de Entidades Genéricas para o Infinite Canvas.
 */
export interface CanvasEntity<T = unknown> {
  id: string;
  type: string; // Ex: 'pdf', 'image', 'note', 'postit', 'text', 'page'
  
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

export type AnyCanvasEntity = CanvasEntity<PdfData | ImageData | NoteData | PostItData | TextData | PageData | unknown>;


export interface CutPatch {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  points?: Point[];
}
