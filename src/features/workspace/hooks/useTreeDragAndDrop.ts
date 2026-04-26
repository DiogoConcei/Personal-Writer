import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { normalizePath, getParentPath } from '@/shared/utils/path';

/**
 * Hook centralizado para gerenciar a lógica de arrastar e soltar itens
 * dentro da árvore de arquivos (FileTree).
 */
export function useTreeDragAndDrop() {
  const { rootPath, moveItem } = useWorkspaceStore();
  const { dragInfo, setDragInfo, resetDrag } = useUIStore();

  useEffect(() => {
    if (!dragInfo.sourcePath) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { startX, startY, isDragging, sourcePath } = useUIStore.getState().dragInfo;

      if (!sourcePath) return;

      let newIsDragging = isDragging;

      // KI-023: Threshold para evitar arrastes acidentais
      if (!isDragging) {
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);

        if (deltaX > 5 || deltaY > 5) {
          newIsDragging = true;
        } else {
          return;
        }
      }

      // Detecção de colisão com elementos da árvore
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const targetItem = element?.closest('[data-path]') as HTMLElement;

      let newTargetPath: string | null = null;

      if (targetItem) {
        const isDir = targetItem.getAttribute('data-is-dir') === "true";
        if (isDir) {
          newTargetPath = targetItem.getAttribute('data-path');
        } else {
          // Se soltar sobre um arquivo, o alvo é o diretório pai dele
          const p = targetItem.getAttribute('data-path');
          if (p) {
            newTargetPath = getParentPath(p, rootPath);
          }
        }
      }

      setDragInfo({
        isDragging: newIsDragging,
        currentX: e.clientX,
        currentY: e.clientY,
        targetPath: newTargetPath
      });
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const { sourcePath, targetPath, isDragging } = useUIStore.getState().dragInfo;

      if (isDragging && sourcePath) {
        // Verifica se soltou dentro da área da árvore (CSS Selector depende do componente)
        const treeElement = document.querySelector('[data-file-tree]');
        const rect = treeElement?.getBoundingClientRect();
        const isInTree = rect && 
          e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom;

        // Se não houver alvo específico mas estiver na árvore, move para a raiz
        const finalTarget = targetPath || (isInTree ? rootPath : null);

        if (finalTarget && rootPath) {
          const normSource = normalizePath(sourcePath);
          const normTarget = normalizePath(finalTarget);
          const sourceParent = normalizePath(getParentPath(sourcePath, rootPath) || '');

          // Validações de movimentação:
          // 1. Não mover para o mesmo lugar
          // 2. Não mover para dentro de si mesmo (recursão infinita)
          // 3. Não mover para o pai atual (redundante)
          if (normSource !== normTarget && 
              !normTarget.startsWith(normSource + '/') && 
              sourceParent !== normTarget) {
            await moveItem(sourcePath, finalTarget);
          }
        }
      }
      resetDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo.sourcePath, rootPath, moveItem, resetDrag, setDragInfo]);

  return { dragInfo };
}
