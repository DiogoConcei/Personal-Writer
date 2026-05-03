/**
 * Interface base para metadados extraídos de arquivos Markdown (YAML Frontmatter).
 */
export interface Metadata {
  type?: 'character' | 'location' | 'note' | string;
  icon?: string;
  tags?: string[];
  banner?: string;
  fields?: Record<string, any>;
  [key: string]: any;
}

/**
 * Entidade rica do sistema. Representa um arquivo Markdown indexado
 * com metadados, resumo e relacionamentos.
 */
export interface Entity extends Metadata {
  path: string;           // Caminho completo no sistema de arquivos
  name: string;           // Nome amigável (geralmente o nome do arquivo)
  lastModified: number;   // Timestamp da última alteração
  excerpt: string;        // Pequeno trecho de texto limpo para preview
  links: string[];        // Lista de WikiLinks ([[Link]]) encontrados no texto
  previewImage?: string;  // URL da primeira imagem encontrada no corpo
}

/**
 * Filtros dinâmicos aplicáveis a coleções de entidades.
 */
export interface EntityFilters {
  search?: string;
  type?: string;
  activeFilters?: Record<string, string>;
}

/**
 * Item individual de um Mood Board (mural visual).
 */
export interface MoodBoardItem {
  id: string;
  path: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  category?: string;
  groupId?: string;
  groupOrder?: number;
}

/**
 * Grupo de itens no Mood Board.
 */
export interface MoodBoardGroup {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  title?: string;
}
