import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useEditorStore } from "../store/editorStore";
import { countWords } from "@/shared/utils/string";

interface UseEditorSyncOptions {
  editor: Editor | null;
  activeFile: string | null;
}

/**
 * Hook especializado para sincronizar o estado do sistema de arquivos/store com o TipTap.
 * Gerencia o carregamento inicial da nota e a atualização de métricas (contagem de palavras).
 */
export function useEditorSync({ editor, activeFile }: UseEditorSyncOptions) {
  const { loadContent, setWordCount } = useEditorStore();
  const loadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (activeFile && editor && !loadingRef.current) {
      loadingRef.current = true;
      
      loadContent(activeFile).then(() => {
        if (!isMounted) return;
        
        try {
          // Obtemos o conteúdo mais recente da store após o loadContent
          const content = useEditorStore.getState().markdownContent || "";
          
          // Injetamos no editor sem disparar o evento onUpdate para evitar loops
          editor.commands.setContent(content, { emitUpdate: false });

          // Atualizamos as métricas iniciais
          const text = editor.getText();
          setWordCount(countWords(text));
        } catch (error) {
          console.error("[useEditorSync] Erro ao sincronizar conteúdo:", error);
        } finally {
          loadingRef.current = false;
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeFile, editor, loadContent, setWordCount]);

  return {
    isLoading: loadingRef.current
  };
}
