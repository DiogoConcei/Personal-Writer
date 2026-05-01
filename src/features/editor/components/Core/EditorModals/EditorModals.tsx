import { Editor } from "@tiptap/react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore } from "../../../store/editorStore";
import { useReferenceStore } from "@/features/references/store/referenceStore";
import { parseMarkdownMetadata } from "../../../store/metadataParser";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { removeDocumentFromMetadata, addDocumentToMetadata } from "@/shared/utils/metadata";

// Componentes de Modal
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import { TemplateGallery } from "@/features/templates/components/TemplateGallery";
import { PdfGallery } from "@/features/references/components/PdfGallery/PdfGallery";
import { DocumentModal } from "@/features/SlashMenu/components/DocumentModal/DocumentModal";
import VersionHistory from "../../History/VersionHistory/VersionHistory";
import ConfirmModal from "@/shared/components/Modal/ConfirmModal/ConfirmModal";

interface EditorModalsProps {
  editor: Editor | null;
  templateToApply: string | null;
  setTemplateToApply: (val: string | null) => void;
}

/**
 * Componente que centraliza a renderização de todos os modais e galerias do Editor.
 * Reduz o ruído visual no componente principal Editor.tsx.
 */
export function EditorModals({ editor, templateToApply, setTemplateToApply }: EditorModalsProps) {
  const { editorModals, setEditorModal, toggleRightSidebar, isRightSidebarVisible } = useUIStore();
  const { metadata, setMetadata, save, setMarkdownContent } = useEditorStore();
  const { setActivePdf } = useReferenceStore();
  const { activeFile, rootPath } = useWorkspaceStore();

  const handleAddPdfFromLibrary = (path: string) => {
    const newMetadata = addDocumentToMetadata(metadata, path);
    if (newMetadata) {
      setMetadata(newMetadata);
      if (activeFile) save(activeFile, rootPath || undefined);
    }
    setEditorModal("showDocuments", false);
  };

  const handleRemoveDocument = (path: string) => {
    const newMetadata = removeDocumentFromMetadata(metadata, path);
    setMetadata(newMetadata);
    if (activeFile) save(activeFile, rootPath || undefined);
  };

  const openPdfAnexo = (path: string) => {
    setActivePdf(path);
    if (!isRightSidebarVisible) toggleRightSidebar();
    setEditorModal("showDocuments", false);
  };

  const handleConfirmTemplate = () => {
    if (templateToApply && editor) {
      editor.commands.clearContent();
      const { metadata: newMeta, markdown } = parseMarkdownMetadata(templateToApply);
      setMetadata(newMeta);
      editor.commands.setContent(markdown);
      
      // @ts-ignore
      const newMarkdown = editor.storage.markdown.getMarkdown();
      setMarkdownContent(newMarkdown);

      if (activeFile) save(activeFile, rootPath || undefined);
      setTemplateToApply(null);
      setEditorModal("showTemplates", false);
    }
  };

  return (
    <>
      {editorModals.showGallery && (
        <ImageGallery
          onSelect={(src) => editor?.chain().focus().setImage({ src }).run()}
          onClose={() => setEditorModal("showGallery", false)}
        />
      )}
      
      {editorModals.showTemplates && (
        <TemplateGallery
          onSelect={(content) => {
            setTemplateToApply(content);
            setEditorModal("showTemplates", false);
          }}
          onClose={() => setEditorModal("showTemplates", false)}
        />
      )}

      {editorModals.showDocuments && (
        <PdfGallery
          onSelect={handleAddPdfFromLibrary}
          onClose={() => setEditorModal("showDocuments", false)}
        />
      )}

      {editorModals.showDocuments && metadata.documents && metadata.documents.length > 0 && (
        <DocumentModal
          documents={metadata.documents || []}
          onClose={() => setEditorModal("showDocuments", false)}
          onOpen={openPdfAnexo}
          onRemove={handleRemoveDocument}
        />
      )}

      {editorModals.showHistory && (
        <VersionHistory
          editor={editor}
          onClose={() => setEditorModal("showHistory", false)}
        />
      )}

      <ConfirmModal
        isOpen={!!templateToApply}
        onClose={() => setTemplateToApply(null)}
        onConfirm={handleConfirmTemplate}
        title="Aplicar Modelo"
        message="Deseja aplicar este modelo? Isso substituirá TODO o conteúdo atual desta nota."
        confirmLabel="Aplicar Modelo"
      />
    </>
  );
}
