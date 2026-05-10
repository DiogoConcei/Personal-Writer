import { useEffect } from 'react';

interface UseCanvasHotkeysOptions {
  selectedItemId: string | null;
  onRemove: (id: string) => void;
  onDeselect: () => void;
}

/**
 * Hook para gerenciar atalhos de teclado globais no Canvas.
 */
export function useCanvasHotkeys({
  selectedItemId,
  onRemove,
  onDeselect
}: UseCanvasHotkeysOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em campos de texto
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          // onUndo? (Precisa ser injetado se o InfiniteCanvas tiver store de histórico)
        } else if (e.key === "y") {
          e.preventDefault();
          // onRedo?
        }
        return;
      }

      if (!selectedItemId) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onRemove(selectedItemId);
        onDeselect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, onRemove, onDeselect]);
}
