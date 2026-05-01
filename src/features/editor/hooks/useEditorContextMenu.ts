import { useState } from "react";
import { Editor } from "@tiptap/react";

/**
 * Hook especializado para gerenciar o menu de contexto do editor.
 * Identifica palavras sob o mouse e detecta erros ortográficos.
 */
export function useEditorContextMenu(editor: Editor | null) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    word: string;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const isMisspelled = target.classList.contains("misspelled");

    let word = "";

    if (isMisspelled) {
      word = target.getAttribute("data-word") || "";
    } else {
      const selection = window.getSelection();
      word = selection?.toString().trim() || "";

      if (!word && editor) {
        const { view } = editor;
        const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (pos) {
          const $pos = view.state.doc.resolve(pos.pos);
          const text = $pos.parent.textContent;
          const offset = $pos.parentOffset;
          const before = text.slice(0, offset).match(/[\p{L}\p{N}]+$/u);
          const after = text.slice(offset).match(/^[\p{L}\p{N}]+/u);
          word = (before ? before[0] : "") + (after ? after[0] : "");
        }
      }
    }

    if (word) {
      setContextMenu({ x: e.clientX, y: e.clientY, word });
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
}
