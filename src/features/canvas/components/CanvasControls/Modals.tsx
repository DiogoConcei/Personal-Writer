import { useCanvasControls } from './CanvasControls';
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import { PdfGallery } from "../../../references/components/PdfGallery/PdfGallery";
import { NoteSelectionModal } from "../NoteSelectionModal/NoteSelectionModal";
import { SplitModal } from "../SplitModal/SplitModal";
import { FocusModal } from "../FocusModal/FocusModal";
import { ModalsProps } from '@/shared/types';

export function Modals({
  entities,
  onNoteSelect,
  onImageSelect,
  onPdfSelect,
  onConfirmSplit,
  onUpdate,
  onAddPendingCollage,
  rootPath = null
}: ModalsProps) {
  const { openModal, splittingItem, focusItem, close } = useCanvasControls();

  const activeFocusItem = focusItem ? (entities.find(e => e.id === focusItem.id) || focusItem) : null;

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
        entity={activeFocusItem}
        rootPath={rootPath}
        onUpdate={onUpdate}
        onAddPendingCollage={onAddPendingCollage}
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
