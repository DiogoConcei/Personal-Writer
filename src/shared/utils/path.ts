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

/**
 * Calcula a subpasta relativa de um arquivo em relação à raiz do workspace.
 * Útil para organizar assets na mesma pasta da nota.
 */
export function getRelativeSubfolder(filePath: string, rootPath: string | null): string | undefined {
  if (!filePath || !rootPath) return undefined;
  
  const separator = getSeparator(rootPath);
  const folderPath = filePath.substring(0, filePath.lastIndexOf(separator));

  if (folderPath.toLowerCase().startsWith(rootPath.toLowerCase())) {
    let sub = folderPath.substring(rootPath.length);
    if (sub.startsWith(separator)) sub = sub.substring(1);
    return sub || undefined;
  }
  return undefined;
}

/**
 * Converte um caminho absoluto para um formato relativo amigável ao Markdown (./assets/...).
 */
export function absoluteToRelativeMarkdown(absolutePath: string, rootPath: string | null): string {
  if (!absolutePath || !rootPath) return absolutePath;

  return absolutePath
    .replace(rootPath, '')
    .replace(/^[\\/]/, './')
    .replace(/\\/g, '/');
}
