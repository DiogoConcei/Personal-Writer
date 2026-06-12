import { useState } from "react";
import { EditorContent } from "@tiptap/react";
import { MetadataHeader } from "../../Headers/MetadataHeader/MetadataHeader";
import { useEditorStore } from "../../../store/editorStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useNativeDragDrop } from "@/shared/hooks/useNativeDragDrop/useNativeDragDrop";
import { useMediaManager } from "@/shared/hooks/useMediaManager/useMediaManager";

// Hooks Customizados
import { useEditorDrop } from "../../../hooks/useEditorDrop";
import { useEditorSetup } from "../../../hooks/useEditorSetup";
import { useEditorSync } from "../../../hooks/useEditorSync";
import { useEditorContextMenu } from "../../../hooks/useEditorContextMenu";
import { useEditorAnalytics } from "../../../hooks/useEditorAnalytics";
import { useEditorPersistence } from "../../../hooks/useEditorPersistence";

// Componentes Modulares
import { EditorToolbar } from "../EditorToolbar/EditorToolbar";
import { EditorModals } from "../EditorModals/EditorModals";
import EditorBubbleMenu from "../EditorBubbleMenu/EditorBubbleMenu";
import { DictionaryContextMenu } from "../DictionaryContextMenu/DictionaryContextMenu";
import { TableOfContents } from "../TableOfContents/TableOfContents";
import { EditorRuler } from "./EditorRuler";

import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { exportPdf } from "@/tauri-bridge";

// Utils e Tipos
import { useUIStore } from "@/store/uiStore";
import { ImageIcon, FileText, List, History, Ruler, FileDown } from "lucide-react";

import styles from "./Editor.module.scss";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const PDF_EXTENSIONS = [".pdf"];

export default function Editor({ isCanvasMode = false }: { isCanvasMode?: boolean }) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { editorModals, setEditorModal, addNotification } = useUIStore();
  const { metadata, typography, setMetadata, save } = useEditorStore();

  const [templateToApply, setTemplateToApply] = useState<string | null>(null);

  const handleExportPdf = async () => {
    if (!activeFile) return;

    const defaultName = activeFile.split(/[\\/]/).pop()?.replace(".md", ".pdf") || "nota.pdf";

    const path = await saveDialog({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      defaultPath: defaultName,
    });

    if (path) {
      try {
        await exportPdf(path);
        addNotification("PDF exportado com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        addNotification("Falha ao exportar PDF.", "error");
      }
    }
  };

  // 1. Configuração do Core do Editor (Agnóstico de Persistência/Métricas)
  const editor = useEditorSetup({
    isCanvasMode,
    onUpdate: () => {
      // O editor apenas sinaliza mudança.
      // Hooks especializados (Analytics/Persistence) ouvem e agem via listeners internos.
    },
  });

  // 2. Hooks de Domínio e Serviços (Responsabilidades Separadas)
  useEditorDrop({ editor, containerSelector: `.${styles.container}` });
  useEditorSync({ editor, activeFile });
  useEditorAnalytics(editor);
  useEditorPersistence(editor);
  const { contextMenu, handleContextMenu, closeContextMenu } =
    useEditorContextMenu(editor);

  // 3. Motor de Mídias Unificado (ADR-019)
  const { uploadMedia } = useMediaManager('all');

  // Verifica se há qualquer modal aberto para desativar o drop global do editor
  const isAnyModalOpen = Object.values(editorModals).some((isOpen) => isOpen);
  const isLocation = metadata.type === "location";

  useNativeDragDrop({
    onDrop: async (paths) => {
      if (!editor || !rootPath) return;

      const imagePaths = paths.filter((p) =>
        IMAGE_EXTENSIONS.some((ext) => p.toLowerCase().endsWith(ext)),
      );
      const pdfPaths = paths.filter((p) =>
        PDF_EXTENSIONS.some((ext) => p.toLowerCase().endsWith(ext)),
      );

      if (imagePaths.length > 0) {
        const pos = editor.state.selection.from;
        const importedImages = await uploadMedia("", imagePaths);

        if (importedImages && importedImages.length > 0) {
          let chain = editor.chain().focus();
          importedImages.forEach((src: string) => {
            chain = chain.insertContentAt(pos, {
              type: "image",
              attrs: { src },
            });
          });
          chain.run();
        }
      }

      if (pdfPaths.length > 0) {
        const importedPdfs = await uploadMedia("", pdfPaths);
        if (importedPdfs && importedPdfs.length > 0) {
          const currentDocs = metadata.documents || [];
          const newDocs = [...currentDocs];

          importedPdfs.forEach((src: string) => {
            if (!newDocs.includes(src)) newDocs.push(src);
          });

          setMetadata({ ...metadata, documents: newDocs });
          if (activeFile) save(activeFile, rootPath);
        }
      }
    },
    filters: [...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS],
    disabled: !rootPath || !editor || isAnyModalOpen,
  });

  if (!activeFile) return null;

  return (
    <div
      className={`
        ${styles.container} 
        ${styles[`container--${typography}`]}
        ${isLocation ? styles["container--location"] : ""}
      `}
      style={
        {
          "--editor-margin-left": `${metadata.margins?.left ?? 80}px`,
          "--editor-margin-right": `${metadata.margins?.right ?? 80}px`,
          "--editor-margin-top": `${metadata.margins?.top ?? 40}px`,
          "--editor-margin-bottom": `${metadata.margins?.bottom ?? 40}px`,
        } as React.CSSProperties
      }
    >
      {!isLocation && (
        <EditorToolbar>
          <EditorToolbar.Action
            icon={Ruler}
            label="Régua"
            onClick={() => setEditorModal("showRuler", !editorModals.showRuler)}
            active={editorModals.showRuler}
          />

          <EditorToolbar.Action
            icon={FileText}
            label="Documentos"
            onClick={() => setEditorModal("showDocuments", true)}
            badge={metadata.documents?.length}
          />

          <EditorToolbar.Action
            icon={ImageIcon}
            label="Galeria"
            onClick={() => setEditorModal("showGallery", true)}
          />
          <EditorToolbar.Action
            icon={List}
            label="Sumário"
            onClick={() => setEditorModal("showTOC", !editorModals.showTOC)}
          />
          <EditorToolbar.Action
            icon={History}
            label="Histórico"
            onClick={() => setEditorModal("showHistory", true)}
          />
          <EditorToolbar.Action
            icon={FileDown}
            label="Exportar PDF"
            onClick={handleExportPdf}
          />
        </EditorToolbar>
      )}

      <div onContextMenu={handleContextMenu} onClick={closeContextMenu}>
        <MetadataHeader />

        {!isLocation && editorModals.showRuler && <EditorRuler />}

        {!isLocation && editorModals.showTOC && (
          <TableOfContents
            editor={editor}
            onClose={() => setEditorModal("showTOC", false)}
          />
        )}

        <EditorBubbleMenu editor={editor} />

        {editor && contextMenu && (
          <DictionaryContextMenu
            editor={editor}
            {...contextMenu}
            onClose={closeContextMenu}
          />
        )}

        <EditorContent editor={editor} className={styles.editor} />
      </div>

      <EditorModals
        editor={editor}
        templateToApply={templateToApply}
        setTemplateToApply={setTemplateToApply}
      />
    </div>
  );
}
