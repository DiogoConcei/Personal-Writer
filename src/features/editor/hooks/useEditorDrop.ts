import { Editor } from "@tiptap/react";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useEditorStore } from "@/features/editor/store/editorStore";
import { absoluteToRelativeMarkdown } from "@/shared/utils/path";
import { isCoordinateInsideElement, getPosAtCoords } from "@/shared/utils/ui";
import { useEffect } from "react";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const PDF_EXTENSIONS = [".pdf"];

interface UseEditorDropOptions {
  editor: Editor | null;
  containerSelector: string;
}

/**
 * Hook especializado para gerenciar o Drag & Drop dentro do editor TipTap.
 * Resolve movimentações internas de nós e inserção de arquivos da Sidebar/Explorador.
 */
export function useEditorDrop({ editor, containerSelector }: UseEditorDropOptions) {
  const { rootPath, activeFile } = useWorkspaceStore();
  const { setMetadata, save, metadata } = useEditorStore();

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const {
        isDragging,
        sourcePath,
        sourceNodePos,
        startX,
        startY,
        startTime,
      } = useUIStore.getState().dragInfo;

      if (!editor || !rootPath) return;

      // Threshold de segurança (KI-023)
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      const deltaTime = Date.now() - startTime;

      if (!isDragging && deltaX < 5 && deltaY < 5 && deltaTime < 150) {
        useUIStore.getState().resetDrag();
        return;
      }

      // Verifica se o drop ocorreu dentro do container do editor
      if (!isCoordinateInsideElement(e.clientX, e.clientY, containerSelector)) {
        useUIStore.getState().resetDrag();
        return;
      }

      const dropPos = getPosAtCoords(editor, e.clientX, e.clientY);

      const { sourceData } = useUIStore.getState().dragInfo;

      if (sourceData?.type === 'postit') {
        // DROP DE POST-IT DO CANVAS
        editor
          .chain()
          .focus()
          .insertContentAt(dropPos, {
            type: "postIt",
            attrs: { 
              backgroundColor: sourceData.backgroundColor,
              color: sourceData.color
            },
            content: [{ type: 'text', text: sourceData.text || ' ' }]
          })
          .run();
        
        useUIStore.getState().resetDrag();
        return;
      }

      if (sourceNodePos !== null) {
        // MOVIMENTAÇÃO INTERNA (Ex: arrastar uma imagem de um parágrafo para outro)
        const from = sourceNodePos;
        const node = editor.state.doc.nodeAt(from);
        
        if (node) {
          editor
            .chain()
            .focus()
            .deleteRange({ from, to: from + node.nodeSize })
            .insertContentAt(
              dropPos > from ? dropPos - node.nodeSize : dropPos,
              node.toJSON(),
            )
            .run();
        }
      } else if (sourcePath) {
        // MOVIMENTAÇÃO EXTERNA (Ex: Sidebar -> Editor)
        const isImage = IMAGE_EXTENSIONS.some((ext) => sourcePath.toLowerCase().endsWith(ext));
        const isPdf = PDF_EXTENSIONS.some((ext) => sourcePath.toLowerCase().endsWith(ext));

        if (isImage || isPdf) {
          const relativePath = absoluteToRelativeMarkdown(sourcePath, rootPath);

          if (isImage) {
            editor
              .chain()
              .focus()
              .insertContentAt(dropPos, {
                type: "image",
                attrs: { src: relativePath },
              })
              .run();
          } else if (isPdf) {
            const currentDocs = metadata.documents || [];
            if (!currentDocs.includes(relativePath)) {
              setMetadata({
                ...metadata,
                documents: [...currentDocs, relativePath],
              });
              if (activeFile) save(activeFile, rootPath);
            }
          }
        }
      }
      
      useUIStore.getState().resetDrag();
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [editor, rootPath, containerSelector, activeFile, metadata, setMetadata, save]);

  return {};
}
