import { EditorMetadata } from "@/shared/types";

/**
 * Utilitários para manipulação de metadados da nota.
 * Centraliza a lógica que antes ficava espalhada no Editor.
 */

/**
 * Adiciona um documento à lista de anexos nos metadados.
 * Retorna os novos metadados se houve alteração, ou null caso contrário.
 */
export function addDocumentToMetadata(metadata: EditorMetadata, path: string): EditorMetadata | null {
  const currentDocs = metadata.documents || [];
  if (currentDocs.includes(path)) return null;

  return {
    ...metadata,
    documents: [...currentDocs, path],
  };
}

/**
 * Remove um documento da lista de anexos nos metadados.
 */
export function removeDocumentFromMetadata(metadata: EditorMetadata, path: string): EditorMetadata {
  const currentDocs = metadata.documents || [];
  return {
    ...metadata,
    documents: currentDocs.filter((d) => d !== path),
  };
}

/**
 * Sincroniza imagens detectadas no conteúdo Markdown com a lista de imagens nos metadados.
 * (Placeholder para futura implementação de limpeza automática de assets)
 */
export function syncImagesInMetadata(metadata: EditorMetadata): EditorMetadata {
  // Lógica para extrair ![alt](./assets/img.png) e atualizar metadata.images
  return metadata;
}
