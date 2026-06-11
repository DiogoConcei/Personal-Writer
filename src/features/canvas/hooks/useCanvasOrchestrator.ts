import { useRef, useCallback, useEffect, useState } from "react";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useDrawingStore } from "@/shared/store/useDrawingStore";

// Hooks
import { useCanvasEngine } from "@/shared/hooks/useCanvasEngine";
import { useCanvasTools } from "@/shared/hooks/useCanvasTools";
import { useCanvasEntities } from "./useCanvasEntities";
import { useCanvasModals } from "./useCanvasModals";
import { useCanvasSplit } from "./useCanvasSplit";
import { useCanvasHotkeys } from "./useCanvasHotkeys";
import { useCanvasNoteStyle } from "./useCanvasNoteStyle";
import { useCanvasPostItStyle } from "./useCanvasPostItStyle";
import { useCanvasTextStyle } from "./useCanvasTextStyle";
import { useCanvasGroupMove } from "./useCanvasGroupMove";
import { useCanvasCollage } from "./useCanvasCollage";
import { useCanvasUIHandlers } from "./useCanvasUIHandlers";
import { useCanvasMarquee } from "./useCanvasMarquee";
import { useHistory } from "@/shared/hooks/useHistory";
import { useCanvasDrawing } from "@/shared/hooks/useCanvasDrawing";
import { useTransformable } from "@/shared/hooks/useTransformable/useTransformable";
import { readFile, writeFile } from "@/tauri-bridge";
import { doRectanglesOverlap } from "@/shared/utils/ui";

// Types
import { AnyCanvasEntity, CanvasHistoryState, SplitActionData, NoteData, PostItData, ImageData, PdfData, SplittingItem, PageData } from "@/shared/types";

export function useCanvasOrchestrator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const [splittingItem, _setSplittingItem] = useState<SplittingItem | null>(null);

  const { 
    drawings, 
    addDrawing, 
    addPointToDrawing, 
    removeDrawing, 
    updateDrawing, 
    setDrawings, 
    strokeColor, 
    strokeWidth 
  } = useDrawingStore();

  const { 
    close: originalClose, 
    open: openCanvasModal,
    ...modalState 
  } = useCanvasModals();
  
  const handleOpenFocus = useCallback((entity: AnyCanvasEntity) => {
    if (entity.type === 'note') {
      const noteData = entity.data as NoteData;
      useWorkspaceStore.getState().setActiveFile(noteData.noteId);
    }
    openCanvasModal('focus', entity);
  }, [openCanvasModal]);

  const handleCloseFocus = useCallback(() => {
    originalClose();
    useWorkspaceStore.getState().setActiveFile(null);
  }, [originalClose]);

  const modalControl = {
    ...modalState,
    open: openCanvasModal,
    close: handleCloseFocus
  };

  const { setSideMenuMode } = modalControl;

  const engine = useCanvasEngine({
    containerRef,
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 4,
  });

  const {
    zoom,
    viewState,
    screenToCanvas,
    getVisibleItems,
  } = engine;

  const {
    activeTool,
    isPencilActive,
    isEraserActive,
    isScissorsActive,
    isTextActive,
    isPanActive,
    isCollageActive,
    isAttachActive,
    activateSelect,
    activatePan,
    activatePencil,
    activateEraser,
    activateScissors,
    activateText,
    activateCollage,
    activateAttach,
  } = useCanvasTools('select');

  // Centralização de estado da UI (Zero Duplicidade)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSplitModeActive, setIsSplitModeActive] = useState(false);
  const [isCollageConfirmed, setIsCollageConfirmed] = useState(false);
  const [activeCollageGroupId, setActiveCollageGroupId] = useState<string | null>(null);

  const { takeSnapshot, undo, redo } = useHistory<CanvasHistoryState>();

  const {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    addText,
    addPostIt,
    addPage,
    updateEntity: handleUpdateEntity,
    removeEntity: handleRemoveEntity,
    bringToFront,
    sendToBack,
    addPendingCollage,
  } = useCanvasEntities({ 
    zoom, 
    viewState, 
    containerRef, 
    rootPath, 
    activeGroupId: activeCollageGroupId 
  });

  const uiHandlers = useCanvasUIHandlers({
    entities,
    activeTool,
    isPencilActive,
    isTextActive,
    isCollageActive,
    isScissorsActive,
    isAttachActive,
    activateSelect,
    activateScissors,
    activateAttach,
    bringToFront,
    setSideMenuMode,
    // Passagem de estado centralizado
    selectedItemId,
    setSelectedItemId,
    selectedItemIds,
    setSelectedItemIds,
    isSplitModeActive,
    setIsSplitModeActive,
    isCollageConfirmed,
    setIsCollageConfirmed,
    activeCollageGroupId,
    setActiveCollageGroupId
  });

  const {
    handleConfirmCollage,
    handleFinalizeCollage,
    handleCancelCollage,
    handleAddPendingCollage
  } = useCanvasCollage({
    entities,
    drawings,
    selectedItemIds,
    setEntities,
    updateDrawing,
    addPendingCollage,
    activeCollageGroupId,
    setActiveCollageGroupId,
    setIsCollageConfirmed,
    setSelectedItemIds,
    setSelectedItemId,
    activateSelect,
    takeSnapshot
  });

  const takeSnapshotNoArgs = useCallback(() => {
    takeSnapshot({ entities, drawings });
  }, [takeSnapshot, entities, drawings]);

  const handleDropEntityOnNote = useCallback(async (noteEntityId: string, sourceData: any) => {
    if (sourceData.type !== 'postit' && sourceData.type !== 'image' && sourceData.type !== 'pdf' && sourceData.type !== 'page') return;

    const noteEntity = entities.find(e => e.id === noteEntityId);
    if (!noteEntity || noteEntity.type !== 'note') return;

    takeSnapshot({ entities, drawings });

    try {
      const noteData = noteEntity.data as NoteData;
      const currentContent = await readFile(noteData.noteId);
      
      let contentToAdd = '';
      if (sourceData.type === 'postit') {
        contentToAdd = `<div data-type="post-it" data-background-color="${sourceData.backgroundColor}" data-color="${sourceData.color}" style="background-color: ${sourceData.backgroundColor}; color: ${sourceData.color};">${sourceData.text || ''}</div>`;
      } else if (sourceData.type === 'page') {
        contentToAdd = sourceData.title || '';
      } else if (sourceData.type === 'image') {
        // Formato compatível com a extensão CustomImage do editor
        const width = sourceData.width ? `${sourceData.width}px` : '300px';
        contentToAdd = `<img src="${sourceData.path}" width="${width}" data-layout="inline" />`;
      } else if (sourceData.type === 'pdf') {
        // Padrão estabelecido: [PDF: Nome](caminho)
        const fileName = sourceData.path.split(/[\\\/]/).pop() || 'Documento PDF';
        contentToAdd = `[PDF: ${fileName}](${sourceData.path})`;
      }
      
      const newContent = currentContent + "\n\n" + contentToAdd;
      await writeFile(noteData.noteId, newContent);

      // Remover a entidade original do canvas
      handleRemoveEntity(sourceData.id);
      
      // Forçar atualização da UI do CanvasNoteItem
      useUIStore.getState().triggerFileSaveTick();
      
      const typeLabels: Record<string, string> = { postit: 'Post-it', image: 'Imagem', pdf: 'PDF', page: 'Página' };
      addNotification(`${typeLabels[sourceData.type]} mesclado à nota!`, "success");
    } catch (error) {
      console.error(`Erro ao mesclar ${sourceData.type}:`, error);
      addNotification(`Falha ao mesclar ${sourceData.type}.`, "error");
    }

    useUIStore.getState().resetDrag();
  }, [entities, drawings, takeSnapshot, handleRemoveEntity, addNotification]);

  const handleBatchAttach = useCallback(async () => {
    const selectedEntities = entities.filter(e => selectedItemIds.includes(e.id));
    const noteTarget = selectedEntities.find(e => e.type === 'note') || entities.find(e => e.id === selectedItemId && e.type === 'note');

    if (!noteTarget) {
      addNotification("Selecione pelo menos uma nota como destino do anexo.", "error");
      return;
    }

    const sources = selectedEntities.filter(e => e.id !== noteTarget.id && (e.type === 'postit' || e.type === 'image' || e.type === 'pdf' || e.type === 'page'));

    if (sources.length === 0) {
      addNotification("Nenhum item válido (Post-it, Imagem, PDF ou Página) selecionado para anexo.", "info");
      return;
    }

    takeSnapshot({ entities, drawings });

    try {
      const noteData = noteTarget.data as NoteData;
      let currentContent = await readFile(noteData.noteId);
      
      for (const source of sources) {
        let contentToAdd = '';
        if (source.type === 'postit') {
          const sData = source.data as PostItData;
          contentToAdd = `<div data-type="post-it" data-background-color="${source.style?.backgroundColor || '#fef3c7'}" data-color="${source.style?.color || '#92400e'}" style="background-color: ${source.style?.backgroundColor || '#fef3c7'}; color: ${source.style?.color || '#92400e'};">${sData.text || ''}</div>`;
        } else if (source.type === 'page') {
          const sData = source.data as PageData;
          contentToAdd = sData.title || '';
        } else if (source.type === 'image') {
          const sData = source.data as ImageData;
          const width = source.width ? `${source.width}px` : '300px';
          contentToAdd = `<img src="${sData.path}" width="${width}" data-layout="inline" />`;
        } else if (source.type === 'pdf') {
          const sData = source.data as PdfData;
          const fileName = sData.path.split(/[\\\/]/).pop() || 'Documento PDF';
          contentToAdd = `[PDF: ${fileName}](${sData.path})`;
        }
        
        currentContent += "\n\n" + contentToAdd;
        handleRemoveEntity(source.id);
      }

      await writeFile(noteData.noteId, currentContent);
      useUIStore.getState().triggerFileSaveTick();
      addNotification(`${sources.length} item(ns) anexado(s) à nota!`, "success");
      
      activateSelect();
      uiHandlers.setSelectedItemIds([]);
      uiHandlers.setSelectedItemId(noteTarget.id);
    } catch (error) {
      console.error("Erro no anexo em lote:", error);
      addNotification("Falha ao anexar itens.", "error");
    }
  }, [selectedItemIds, selectedItemId, entities, drawings, takeSnapshot, handleRemoveEntity, addNotification, activateSelect, uiHandlers.setSelectedItemIds, uiHandlers.setSelectedItemId]);

  const { handleUpdateWithGroup, handleTransformEnd } = useCanvasGroupMove({
    entities,
    drawings,
    setEntities,
    updateDrawing,
    handleUpdateEntity,
    isCollageConfirmed,
    activeCollageGroupId,
    takeSnapshot
  });

  const handleTransformEndWithMerge = useCallback((id: string) => {
    handleTransformEnd(id);

    const movedEntity = entities.find(e => e.id === id);
    if (!movedEntity || (movedEntity.type !== 'postit' && movedEntity.type !== 'image' && movedEntity.type !== 'pdf' && movedEntity.type !== 'page')) return;

    const itemRect = { 
      x: movedEntity.x, 
      y: movedEntity.y, 
      width: movedEntity.width || 100, 
      height: (movedEntity as any).height || 100 
    };

    const targetNote = entities.find(other => {
      if (other.id === movedEntity.id || other.type !== 'note') return false;
      const otherRect = { 
        x: other.x, 
        y: other.y, 
        width: other.width || 200, 
        height: (other as any).height || 400 
      };
      return doRectanglesOverlap(itemRect, otherRect);
    });

    if (targetNote) {
      let sourceData: any;
      
      if (movedEntity.type === 'postit') {
        sourceData = { 
          type: 'postit', 
          id: movedEntity.id, 
          text: (movedEntity.data as PostItData).text,
          backgroundColor: (movedEntity.style?.backgroundColor as string) || '#fef3c7',
          color: (movedEntity.style?.color as string) || '#92400e'
        };
      } else if (movedEntity.type === 'page') {
        sourceData = {
          type: 'page',
          id: movedEntity.id,
          title: (movedEntity.data as PageData).title
        };
      } else if (movedEntity.type === 'image') {
        sourceData = {
          type: 'image',
          id: movedEntity.id,
          path: (movedEntity.data as ImageData).path,
          width: movedEntity.width
        };
      } else if (movedEntity.type === 'pdf') {
        sourceData = {
          type: 'pdf',
          id: movedEntity.id,
          path: (movedEntity.data as PdfData).path
        };
      }
      
      if (sourceData) {
        handleDropEntityOnNote(targetNote.id, sourceData);
      }
    }
  }, [entities, handleTransformEnd, handleDropEntityOnNote]);

  const handleUpdateWithSnapshot = useCallback((id: string, updates: Partial<AnyCanvasEntity>) => {
    handleUpdateWithGroup(id, updates);
  }, [handleUpdateWithGroup]);

  const handleRemoveWithSnapshot = useCallback((id: string) => {
    takeSnapshot({ entities, drawings });
    handleRemoveEntity(id);
  }, [takeSnapshot, entities, drawings, handleRemoveEntity]);

  const handleUndo = useCallback(() => {
    const previous = undo({ entities, drawings });
    if (previous) {
      setEntities(previous.entities);
      setDrawings(previous.drawings);
    }
  }, [undo, entities, drawings, setEntities, setDrawings]);

  const handleRedo = useCallback(() => {
    const next = redo({ entities, drawings });
    if (next) {
      setEntities(next.entities);
      setDrawings(next.drawings);
    }
  }, [redo, entities, drawings, setEntities, setDrawings]);

  const { startDrawing, draw, stopDrawing } = useCanvasDrawing({
    containerRef,
    isEnabled: isPencilActive,
    color: strokeColor,
    width: strokeWidth,
    zoom,
    viewState,
    onAddDrawing: (drawing) => {
      takeSnapshot({ entities, drawings });
      addDrawing(drawing);
    },
    onAddPoint: addPointToDrawing
  });

  useEffect(() => {
    if (isPencilActive) {
      window.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDrawing);
      return () => {
        window.removeEventListener('mousemove', draw);
        window.removeEventListener('mouseup', stopDrawing);
      };
    }
  }, [isPencilActive, draw, stopDrawing]);

  const { performSplit } = useCanvasSplit({ entities, setEntities });

  const { marquee, startMarquee, updateMarquee, endMarquee } = useCanvasMarquee({
    entities,
    drawings,
    onSelectItems: uiHandlers.setSelectedItemIds,
    screenToCanvas,
    isEnabled: activeTool === 'select'
  });

  useEffect(() => {
    if (marquee.isVisible) {
      window.addEventListener('mousemove', updateMarquee);
      window.addEventListener('mouseup', endMarquee);
      return () => {
        window.removeEventListener('mousemove', updateMarquee);
        window.removeEventListener('mouseup', endMarquee);
      };
    }
  }, [marquee.isVisible, updateMarquee, endMarquee]);

  const { 
    selectedNoteEntity, 
    updateSelectedNoteStyle, 
    handleFontSizeChange,
    handleFontFamilyChange: handleNoteFontFamilyChange,
    toggleBold: toggleNoteBold
  } = useCanvasNoteStyle({
    selectedItemId: uiHandlers.selectedItemId,
    entities,
    onUpdate: handleUpdateWithSnapshot,
  });

  const {
    selectedPostItEntity,
    updateSelectedPostItStyle,
    handleFontSizeChange: handlePostItFontSizeChange,
    handleFontFamilyChange: handlePostItFontFamilyChange,
    toggleBold: togglePostItBold
  } = useCanvasPostItStyle({
    selectedItemId: uiHandlers.selectedItemId,
    entities,
    onUpdate: handleUpdateWithSnapshot,
  });

  const { 
    selectedTextEntity, 
    handleFontSizeChange: handleTextFontSizeChange, 
    handleFontFamilyChange: handleTextFontFamilyChange, 
    toggleBold: toggleTextBold 
  } = useCanvasTextStyle({
    selectedItemId: uiHandlers.selectedItemId,
    entities,
    onUpdate: handleUpdateWithSnapshot,
  });

  useCanvasHotkeys({
    selectedItemId: uiHandlers.selectedItemId,
    selectedItemIds: uiHandlers.selectedItemIds,
    onRemove: handleRemoveWithSnapshot,
    onDeselect: () => {
      uiHandlers.setSelectedItemId(null);
      uiHandlers.setSelectedItemIds([]);
    },
    onUndo: handleUndo,
    onRedo: handleRedo
  });

  const handleConfirmSplit = (data: SplitActionData) => {
    takeSnapshot({ entities, drawings });
    performSplit(splittingItem, data);
    uiHandlers.setIsSplitModeActive(false);
  };

  const selectedEntity = entities.find((e) => e.id === uiHandlers.selectedItemId);
  const { handleRotateStart } = useTransformable({
    x: selectedEntity?.x || 0,
    y: selectedEntity?.y || 0,
    onStart: () => takeSnapshot({ entities, drawings }),
    onUpdate: (updates) => {
      if (uiHandlers.selectedItemId) {
        handleUpdateWithSnapshot(uiHandlers.selectedItemId, updates);
      }
    },
  });

  const canConfirmCollage = uiHandlers.selectedItemIds.length >= 2 || uiHandlers.selectedItemIds.some(id => {
    const entity = entities.find(e => e.id === id);
    const drawing = drawings.find(d => d.id === id);
    return !!(entity?.groupId || drawing?.groupId);
  });

  return {
    containerRef,
    rootPath,
    setActivePanel,
    drawings,
    removeDrawing,
    modalControl,
    engine,
    tools: {
      activeTool,
      isPencilActive,
      isEraserActive,
      isScissorsActive,
      isTextActive,
      isPanActive,
      isCollageActive,
      isAttachActive,
      activateSelect,
      activatePan,
      activatePencil,
      activateEraser,
      activateScissors,
      activateText,
      activateCollage,
      activateAttach,
    },
    ui: uiHandlers,
    entities: {
      entities,
      setEntities,
      addNote,
      addImage,
      addPdf,
      addText,
      addPostIt,
      addPage,
      visibleEntities: getVisibleItems(entities),
      bringToFront,
      sendToBack,
    },
    collage: {
      handleConfirmCollage,
      handleFinalizeCollage,
      handleCancelCollage,
      handleAddPendingCollage,
      canConfirmCollage
    },
    styles: {
      selectedNoteEntity,
      updateSelectedNoteStyle,
      handleFontSizeChange,
      handleNoteFontFamilyChange,
      toggleNoteBold,
      selectedPostItEntity,
      updateSelectedPostItStyle,
      handlePostItFontSizeChange,
      handlePostItFontFamilyChange,
      togglePostItBold,
      selectedTextEntity,
      handleTextFontSizeChange,
      handleTextFontFamilyChange,
      toggleTextBold
    },
    history: {
      takeSnapshot: takeSnapshotNoArgs,
      undo: handleUndo,
      redo: handleRedo
    },
    drawing: {
      startDrawing,
      strokeColor,
      strokeWidth
    },
    handlers: {
      handleUpdateWithSnapshot,
      handleRemoveWithSnapshot,
      handleTransformEnd: handleTransformEndWithMerge,
      handleConfirmSplit,
      handleRotateStart,
      handleOpenFocus,
      handleCloseFocus,
      screenToCanvas,
      startMarquee,
      handleDropEntityOnNote,
      handleBatchAttach
    },
    marquee
  };
}
