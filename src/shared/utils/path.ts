/**
 * Utilitários para manipulação de caminhos de arquivos de forma agnóstica ao sistema operacional.
 */

/**
 * Normaliza o caminho para usar barras invertidas padronizadas e remover barras finais.
 * Útil para comparações de strings de caminhos.
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  return path.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
}

/**
 * Retorna o separador de caminho (barra ou contra-barra) baseado na string fornecida.
 */
export function getSeparator(path: string): string {
  return path.includes('\\') ? '\\' : '/';
}

/**
 * Retorna o caminho do diretório pai.
 * Se for a raiz (rootPath), retorna a própria raiz.
 */
export function getParentPath(path: string, rootPath: string | null): string | null {
  if (!path) return null;
  const normalizedPath = normalizePath(path);
  const normalizedRoot = rootPath ? normalizePath(rootPath) : null;

  if (normalizedRoot && normalizedPath === normalizedRoot) return rootPath;

  const separator = getSeparator(path);
  const lastIndex = path.lastIndexOf(separator);
  
  if (lastIndex === -1) return rootPath;
  
  return path.substring(0, lastIndex) || rootPath;
}

/**
 * Extrai apenas o nome do arquivo ou pasta de um caminho completo.
 */
export function getBaseName(path: string): string {
  if (!path) return '';
  const separator = getSeparator(path);
  return path.substring(path.lastIndexOf(separator) + 1);
}
