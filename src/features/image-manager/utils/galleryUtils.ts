/**
 * Utilitários para a Galeria de Imagens.
 * Focado em lógica pura, manipulação de caminhos e labels de UI.
 */

/**
 * Extrai o nome de uma pasta a partir do seu caminho completo.
 * Suporta separadores Windows (\) e Unix (/).
 */
export function getFolderNameFromPath(path: string): string {
  if (!path) return '';
  const parts = path.split(/[\\/]/);
  return parts.pop() || '';
}

/**
 * Determina se um alvo de navegação é igual a outro.
 */
export function isSameNavTarget(a: any, b: any): boolean {
  if (!a || !b) return a === b;
  if (a.type !== b.type) return false;
  if (a.type === 'virtual') return a.id === b.id;
  if (a.type === 'physical') return a.path === b.path;
  return false;
}

/**
 * Filtra imagens que já estão em uma seleção ou são o alvo atual para evitar loops no DND.
 */
export function isValidGalleryDrop(draggedItemId: string, targetId: string, selectedPaths: string[]): boolean {
  if (draggedItemId === targetId) return false;
  if (selectedPaths.includes(targetId)) return false;
  return true;
}
