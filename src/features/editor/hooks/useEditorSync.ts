import { useEffect } from "react";
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

  useEffect(() => {
    let isMounted = true;

    if (activeFile && editor) {
      // Limpa imediatamente para evitar flicker e race conditions da UI
      editor.commands.setContent("", { emitUpdate: false });
      
      loadContent(activeFile).then((content) => {
        if (!isMounted) return;
        
        try {
          // Injetamos o conteúdo retornado diretamente, eliminando a dependência do estado global assíncrono
          editor.commands.setContent(content, { emitUpdate: false });

          // Atualizamos as métricas iniciais
          const text = editor.getText();
          setWordCount(countWords(text));
        } catch (error) {
          console.error("[useEditorSync] Erro ao sincronizar conteúdo:", error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeFile, editor, loadContent, setWordCount]);

  return {
    isLoading: false
  };
}
