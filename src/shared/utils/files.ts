import { FileNode } from "@/tauri-bridge/types";

/**
 * Busca recursivamente por um arquivo na árvore de arquivos do workspace pelo nome.
 * Ignora a extensão .md para facilitar a busca de notas via WikiLinks.
 */
export function findFileInTree(nodes: FileNode[], targetName: string): FileNode | null {
  for (const node of nodes) {
    if (node.is_dir) {
      const found = findFileInTree(node.children || [], targetName);
      if (found) return found;
    } else {
      // Normaliza o nome removendo a extensão .md para comparação
      const fileNameWithoutExt = node.name.replace(/\.md$/, "");
      if (fileNameWithoutExt.toLowerCase() === targetName.toLowerCase()) {
        return node;
      }
    }
  }
  return null;
}
