import { useRef, useCallback, useEffect } from "react";
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
import { useHistory } from "@/shared/hooks/useHistory";
import { useCanvasDrawing } from "@/shared/hooks/useCanvasDrawing";
import { useTransformable } from "@/shared/hooks/useTransformable/useTransformable";

// Types
import { AnyCanvasEntity, CanvasHistoryState, SplitActionData } from "@/shared/types";

export function useCanvasOrchestrator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);

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

  const modalControl = useCanvasModals();
  const { open, splittingItem, setSideMenuMode } = modalControl;

  const engine = useCanvasEngine({
    containerRef,
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 4,
  });

  const {
    zoom,
    viewState,
    isPanning,
    isSpacePressed,
    zoomIn,
    zoomOut,
    resetView,
    handleMouseDown,
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
    activateSelect,
    activatePan,
    activatePencil,
    activateEraser,
    activateScissors,
    activateText,
    activateCollage,
  } = useCanvasTools('select');

  const { takeSnapshot, undo, redo } = useHistory<CanvasHistoryState>();

  const ui = useCanvasUIHandlers({
    entities: [], // Placeholder
    activeTool,
    isPencilActive,
    isTextActive,
    isCollageActive,
    isScissorsActive,
    activateSelect,
    activateScissors,
    bringToFront: () => {}, // Placeholder
    setSideMenuMode
  });

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
  } = useCanvasEntities({ zoom, viewState, containerRef, rootPath, activeGroupId: ui.activeCollageGroupId });

  const { handleUpdateWithGroup, handleTransformEnd } = useCanvasGroupMove({
    entities,
    drawings,
    setEntities,
    updateDrawing,
    handleUpdateEntity,
    isCollageConfirmed: ui.isCollageConfirmed,
    activeCollageGroupId: ui.activeCollageGroupId,
    takeSnapshot
  });

  const {
    handleConfirmCollage,
    handleFinalizeCollage,
    handleCancelCollage,
    handleAddPendingCollage
  } = useCanvasCollage({
    entities,
    drawings,
    selectedItemIds: ui.selectedItemIds,
    setEntities,
    updateDrawing,
    addPendingCollage,
    activeCollageGroupId: ui.activeCollageGroupId,
    setActiveCollageGroupId: ui.setActiveCollageGroupId,
    setIsCollageConfirmed: ui.setIsCollageConfirmed,
    setSelectedItemIds: ui.setSelectedItemIds,
    setSelectedItemId: ui.setSelectedItemId,
    activateSelect,
    takeSnapshot
  });

  // Re-injetar funções no UI Handler
  const uiHandlers = useCanvasUIHandlers({
    entities,
    activeTool,
    isPencilActive,
    isTextActive,
    isCollageActive,
    isScissorsActive,
    activateSelect,
    activateScissors,
    bringToFront,
    setSideMenuMode
  });

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

  const { selectedNoteEntity, updateSelectedNoteStyle, handleFontSizeChange } =
    useCanvasNoteStyle({
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

  const takeSnapshotNoArgs = useCallback(() => {
    takeSnapshot({ entities, drawings });
  }, [takeSnapshot, entities, drawings]);

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
      activateSelect,
      activatePan,
      activatePencil,
      activateEraser,
      activateScissors,
      activateText,
      activateCollage,
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
      handleTransformEnd,
      handleConfirmSplit,
      handleRotateStart,
      screenToCanvas
    }
  };
}
