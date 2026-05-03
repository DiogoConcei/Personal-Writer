import { useState } from "react";
import { EditorContent } from "@tiptap/react";
import { MetadataHeader } from "../../Headers/MetadataHeader/MetadataHeader";
import { useEditorStore } from "../../../store/editorStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useNativeDragDrop } from "@/shared/hooks/useNativeDragDrop/useNativeDragDrop";
import { useImageManager } from "@/shared/hooks/useImageManager/useImageManager";
import { useDocumentManager } from "@/shared/hooks/useDocumentManager/useDocumentManager";

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

// Utils e Tipos
import { useUIStore } from "@/store/uiStore";
import { DEFAULT_TEMPLATES } from "@/features/templates/data/defaultTemplates";
import {
  ImageIcon,
  FileText,
  List,
  History,
  LayoutTemplate,
} from "lucide-react";

import styles from "./Editor.module.scss";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const PDF_EXTENSIONS = [".pdf"];

export default function Editor() {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { editorModals, setEditorModal } = useUIStore();
  const { metadata, typography, setMetadata, save } = useEditorStore();

  const [templateToApply, setTemplateToApply] = useState<string | null>(null);

  // 1. Configuração do Core do Editor (Agnóstico de Persistência/Métricas)
  const editor = useEditorSetup({
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

  // 3. Drag & Drop Nativo (OS -> Editor)
  const { uploadImages } = useImageManager();
  const { handleUpload: uploadPdfs } = useDocumentManager();

  // Verifica se há qualquer modal aberto para desativar o drop global do editor
  const isAnyModalOpen = Object.values(editorModals).some((isOpen) => isOpen);

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
        const importedImages = await uploadImages("", imagePaths);

        if (importedImages && importedImages.length > 0) {
          let chain = editor.chain().focus();
          importedImages.forEach((src) => {
            chain = chain.insertContentAt(pos, {
              type: "image",
              attrs: { src },
            });
          });
          chain.run();
        }
      }

      if (pdfPaths.length > 0) {
        const importedPdfs = await uploadPdfs(pdfPaths);
        if (importedPdfs && importedPdfs.length > 0) {
          const currentDocs = metadata.documents || [];
          const newDocs = [...currentDocs];

          importedPdfs.forEach((src) => {
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
      className={`${styles.container} ${styles[`container--${typography}`]}`}
    >
      <EditorToolbar>
        <EditorToolbar.Dropdown
          icon={LayoutTemplate}
          label="Modelo"
          isOpen={editorModals.showTemplates}
          onToggle={(val) => setEditorModal("showTemplates", val)}
        >
          {DEFAULT_TEMPLATES.map((t) => (
            <EditorToolbar.DropdownItem
              key={t.id}
              label={t.name}
              onClick={() => {
                setTemplateToApply(t.content);
                setEditorModal("showTemplates", false);
              }}
            />
          ))}
        </EditorToolbar.Dropdown>

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
      </EditorToolbar>

      <div onContextMenu={handleContextMenu} onClick={closeContextMenu}>
        <MetadataHeader />

        {editorModals.showTOC && (
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
