import { useCanvasControls } from './CanvasControls';
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import { PdfGallery } from "../../../references/components/PdfGallery/PdfGallery";
import { NoteSelectionModal } from "../NoteSelectionModal/NoteSelectionModal";
import { SplitModal } from "../SplitModal/SplitModal";
import { FocusModal } from "../FocusModal/FocusModal";

interface ModalsProps {
  onNoteSelect: (path: string, name: string) => void;
  onImageSelect: (path: string) => void;
  onPdfSelect: (path: string) => void;
  onConfirmSplit: (data: any) => void;
  onExtractCrop?: (base64: string | null, status?: 'start' | 'finish', id?: string) => string | void;
  rootPath?: string | null;
}

export function Modals({
  onNoteSelect,
  onImageSelect,
  onPdfSelect,
  onConfirmSplit,
  onExtractCrop,
  rootPath = null
}: ModalsProps) {
  const { openModal, splittingItem, focusItem, close } = useCanvasControls();

  return (
    <>
      <NoteSelectionModal
        isOpen={openModal === 'note'}
        onClose={close}
        onSelect={(path, name) => {
          onNoteSelect(path, name);
          close();
        }}
      />

      <SplitModal
        isOpen={openModal === 'split'}
        onClose={close}
        onConfirm={(data) => {
          onConfirmSplit(data);
          close();
        }}
        totalItems={splittingItem?.total || 0}
        itemName={splittingItem?.name || ""}
        initialPage={splittingItem?.initialPage}
      />

      <FocusModal
        isOpen={openModal === 'focus'}
        onClose={close}
        entity={focusItem}
        rootPath={rootPath}
        onExtractCrop={onExtractCrop}
      />

      {openModal === 'image' && (
        <ImageGallery
          disableOrganization
          largeModal
          onSelect={(path: string) => {
            onImageSelect(path);
            close();
          }}
          onClose={close}
        />
      )}

      {openModal === 'pdf' && (
        <PdfGallery
          onSelect={(path: string) => {
            onPdfSelect(path);
            close();
          }}
          onClose={close}
        />
      )}
    </>
  );
}
