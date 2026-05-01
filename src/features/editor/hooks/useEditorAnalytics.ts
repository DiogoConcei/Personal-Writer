import { useEffect } from "react";
import { Editor } from "@tiptap/react";
import { useEditorStore } from "../store/editorStore";
import { countWords } from "@/shared/utils/string";

/**
 * Hook especializado para gerenciar métricas de análise do editor.
 * Monitora o conteúdo e atualiza contagem de palavras e progresso de metas.
 */
export function useEditorAnalytics(editor: Editor | null) {
  const { setWordCount } = useEditorStore();

  useEffect(() => {
    if (!editor) return;

    // Função que reage às mudanças de texto para métricas
    const updateMetrics = () => {
      const text = editor.getText();
      const words = countWords(text);
      
      // Atualiza a store global de editor
      setWordCount(words);
      
      // Aqui poderiam ser adicionadas lógicas de:
      // - Reading time
      // - Progressão de Word Goal (Arquivo e Sessão)
      // - Heatmap de escrita
    };

    // Registra o listener no editor
    editor.on("update", updateMetrics);

    // Executa uma vez no início
    updateMetrics();

    return () => {
      editor.off("update", updateMetrics);
    };
  }, [editor, setWordCount]);

  return {};
}
