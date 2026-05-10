import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCanvasTextOptions {
  initialText: string;
  onSave: (text: string) => void;
  isEnabled?: boolean;
}

/**
 * Hook compartilhado para gerenciar a lógica de escrita em entidades do canvas.
 * Funciona para MesaTrabalho (text simples) e futuramente InfiniteCanvas (notas rápidas).
 */
export function useCanvasText({ 
  initialText, 
  onSave, 
  isEnabled = true 
}: UseCanvasTextOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const editableRef = useRef<HTMLDivElement>(null);

  // Sincroniza estado interno se o texto inicial mudar externamente
  useEffect(() => {
    if (!isEditing) {
      setText(initialText);
    }
  }, [initialText, isEditing]);

  const startEditing = useCallback(() => {
    if (!isEnabled) return;
    setIsEditing(true);
    
    // Pequeno delay para garantir que o elemento está pronto para o foco
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus();
        
        // Coloca o cursor no final do texto
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editableRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }, [isEnabled]);

  const stopEditing = useCallback(() => {
    if (!isEditing) return;
    setIsEditing(false);
    
    const finalContent = editableRef.current?.textContent || '';
    setText(finalContent);
    onSave(finalContent);
  }, [isEditing, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Atalhos de Undo/Redo específicos para o texto enquanto edita
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.stopPropagation(); // Não propaga para o canvas
      // O navegador já lida com isso nativamente no contentEditable, 
      // mas garantimos que não dispare o undo global do canvas
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.stopPropagation();
      return;
    }

    // Shift + Enter para nova linha, Enter sozinho para salvar (opcional, configurável)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    }
    
    if (e.key === 'Escape') {
      setIsEditing(false);
      setText(initialText); // Cancela mudanças
      if (editableRef.current) {
        editableRef.current.textContent = initialText;
        editableRef.current.blur();
      }
    }
  }, [stopEditing, initialText]);

  return {
    isEditing,
    text,
    editableRef,
    startEditing,
    stopEditing,
    handleKeyDown,
    setText
  };
}
