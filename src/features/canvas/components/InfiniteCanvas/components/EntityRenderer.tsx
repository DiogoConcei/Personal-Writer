import React from 'react';
import { NoteData, PdfData, EntityRendererProps } from '@/shared/types';
import { CanvasNoteItem } from '../../CanvasNoteItem/CanvasNoteItem';
import { CanvasImageItem } from '../../CanvasImageItem/CanvasImageItem';
import { CanvasPdfItem } from '../../CanvasPdfItem/CanvasPdfItem';
import { CanvasTextItem } from '../../CanvasTextItem/CanvasTextItem';
import { CanvasPostItItem } from '../../CanvasPostItItem/CanvasPostItItem';
import { CanvasPageItem } from '../../CanvasPageItem/CanvasPageItem';

export const EntityRenderer: React.FC<EntityRendererProps> = ({
  entity,
  selectedItemIds,
  isSplitModeActive,
  isScissorsActive,
  rootPath,
  onSelect,
  onUpdate,
  onRemove,
  onStartTransform,
  onEndTransform,
  onOpenModal,
  onDropEntity
}) => {
  const isSelected = selectedItemIds.includes(entity.id);

  const commonProps = {
    entity,
    isSelected,
    isSepararActive: isSplitModeActive,
    isScissorsActive,
    onSelect: () => onSelect(entity.id),
    onUpdate,
    onRemove,
    onStart: onStartTransform,
    onEnd: () => onEndTransform(entity.id),
    onFocus: () => onOpenModal("focus", entity),
    onDropEntity
  };

  switch (entity.type) {
    case "note":
      return (
        <CanvasNoteItem
          {...commonProps}
          onSplit={(viewingPage) => {
            const data = entity.data as NoteData;
            onOpenModal("split", {
              id: entity.id,
              name: data.title || "Nota",
              total: (data.endPage || 1) - (data.startPage || 1) + 1,
              initialPage: viewingPage
                ? viewingPage - (data.startPage || 1) + 1
                : 1,
            });
          }}
        />
      );
    case "image":
      return <CanvasImageItem {...commonProps} rootPath={rootPath} />;
    case "pdf":
      return (
        <CanvasPdfItem
          {...commonProps}
          onSplit={() => {
            const data = entity.data as PdfData;
            onOpenModal("split", {
              id: entity.id,
              name: data.path.split(/[\\/]/).pop() || "PDF",
              total: data.endPage - data.startPage + 1,
              initialPage: 1,
            });
          }}
          rootPath={rootPath}
        />
      );
    case "text":
      return <CanvasTextItem {...commonProps} />;
    case "postit":
      return <CanvasPostItItem {...commonProps} />;
    case "page":
      return <CanvasPageItem {...commonProps} />;
    default:
      return null;
  }
};
