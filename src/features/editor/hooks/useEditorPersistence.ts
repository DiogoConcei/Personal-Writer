import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useEditorStore } from "../store/editorStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";

/**
 * Hook especializado para gerenciar a persistência (autosave) do editor.
 * Controla o debounce e garante que o conteúdo seja salvo no sistema de arquivos.
 */
export function useEditorPersistence(editor: Editor | null) {
  const { save, setMarkdownContent } = useEditorStore();
  const { activeFile, rootPath } = useWorkspaceStore();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      // 1. Extrai o Markdown atual
      // @ts-ignore
      const markdown = editor.storage.markdown.getMarkdown();
      
      // 2. Atualiza a store reativa (Buffer de memória)
      setMarkdownContent(markdown);

      // 3. Gerencia o Autosave (Persistência em Disco)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      if (activeFile && rootPath) {
        saveTimeoutRef.current = setTimeout(() => {
          save(activeFile, rootPath);
        }, 1500); // 1.5s de debounce para não sobrecarregar o IO
      }
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor, activeFile, rootPath, save, setMarkdownContent]);

  return {
    forceSave: () => {
      if (activeFile && rootPath) save(activeFile, rootPath);
    }
  };
}
