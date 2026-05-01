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
      if (!selectedItemId) return;

      // Não agir se o usuário estiver digitando em campos de texto
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

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
