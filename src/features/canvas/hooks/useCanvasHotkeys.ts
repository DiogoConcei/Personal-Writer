import { useEffect } from 'react';

interface UseCanvasHotkeysOptions {
  selectedItemId: string | null;
  onRemove: (id: string) => void;
  onDeselect: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Hook para gerenciar atalhos de teclado globais no Canvas.
 */
export function useCanvasHotkeys({
  selectedItemId,
  onRemove,
  onDeselect,
  onUndo,
  onRedo
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
          onUndo?.();
        } else if (e.key === "y" || (e.key === 'Z' && e.shiftKey)) {
          e.preventDefault();
          onRedo?.();
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
  }, [selectedItemId, onRemove, onDeselect, onUndo, onRedo]);
}
