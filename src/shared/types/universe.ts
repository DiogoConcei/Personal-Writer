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
 * Item individual de uma Mesa de Trabalho (mural visual).
 */
export interface MesaItem {
  id: string;
  type?: 'image' | 'text';
  path?: string; // Para imagens
  text?: string; // Para blocos de texto
  extraPaths?: string[]; // Novos caminhos para galeria interna do item
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  category?: string;
  groupId?: string;
  groupOrder?: number;
  ownerId?: string;
  customName?: string;
  fontSize?: number;
  color?: string;
}

/**
 * Desenho livre (lápis) na Mesa de Trabalho.
 */
export interface MesaDrawing {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity?: number;
  groupId?: string;
}

/**
 * Grupo de itens na Mesa de Trabalho.
 */
export interface MesaGrupo {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  title?: string;
}
