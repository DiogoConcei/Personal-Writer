import { useState, useRef, useEffect } from "react";
import styles from "./InfiniteCanvas.module.scss";
import { useUIStore } from "../../../store/uiStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import {
  ZoomIn,
  ZoomOut,
  Pencil,
  Eraser,
  Scissors,
  RotateCcw,
  MousePointer2,
  Hand,
  Type
} from "lucide-react";

// Hooks
import { useTransformable } from "@/shared/hooks/useTransformable/useTransformable";
import { useCanvasEngine } from "@/shared/hooks/useCanvasEngine";
import { useCanvasTools } from "@/shared/hooks/useCanvasTools";
import { useCanvasEntities } from "../hooks/useCanvasEntities";
import { useCanvasModals } from "../hooks/useCanvasModals";
import { useCanvasSplit } from "../hooks/useCanvasSplit";
import { useCanvasHotkeys } from "../hooks/useCanvasHotkeys";
import { useCanvasNoteStyle } from "../hooks/useCanvasNoteStyle";
import { NoteData, PdfData, SplitActionData } from "@/shared/types";

// Componentes
import { CanvasActionMenu } from "./CanvasActionMenu/CanvasActionMenu";
import { CanvasNoteItem } from "./CanvasNoteItem/CanvasNoteItem";
import { CanvasImageItem } from "./CanvasImageItem/CanvasImageItem";
import { CanvasPdfItem } from "./CanvasPdfItem/CanvasPdfItem";
import { CanvasTextItem } from "./CanvasTextItem/CanvasTextItem";
import { CanvasControls } from "./CanvasControls/CanvasControls";
import { CanvasBase } from "@/shared/components/CanvasBase/CanvasBase";
import { CanvasDrawingLayer } from "@/shared/components/CanvasDrawingLayer/CanvasDrawingLayer";
import { useCanvasDrawing } from "@/shared/hooks/useCanvasDrawing";
import { useDrawingStore } from "@/shared/store/useDrawingStore";

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);

  const [isSplitModeActive, setIsSplitModeActive] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { drawings, addDrawing, addPointToDrawing, removeDrawing, strokeColor, strokeWidth } = useDrawingStore();

  // 1. Orquestração de UI e Modais
  const modalControl = useCanvasModals();
  const { open, splittingItem, setSideMenuMode } = modalControl;

  // 2. Motor Unificado (Zoom/Pan/Viewport)
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

  // 3. Ferramentas Unificadas
  const {
    activeTool,
    isPencilActive,
    isEraserActive,
    isScissorsActive,
    isTextActive,
    isPanActive,
    activateSelect,
    activatePan,
    activatePencil,
    activateEraser,
    activateScissors,
    activateText,
  } = useCanvasTools('select');

  // Hook de Desenho Unificado
  const { startDrawing, draw, stopDrawing } = useCanvasDrawing({
    containerRef,
    isEnabled: isPencilActive,
    color: strokeColor,
    width: strokeWidth,
    zoom,
    viewState,
    onAddDrawing: addDrawing,
    onAddPoint: addPointToDrawing
  });

  // Efeitos para Desenho
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

  // 4. Gestão de Dados e Entidades
  const {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    addText,
    updateEntity: handleUpdateEntity,
    removeEntity: handleRemoveEntity,
    bringToFront,
  } = useCanvasEntities({ zoom, viewState, containerRef, rootPath });

  const { performSplit } = useCanvasSplit({ entities, setEntities });

  // 5. Customização Visual e Hotkeys
  const { selectedNoteEntity, updateSelectedNoteStyle, handleFontSizeChange } =
    useCanvasNoteStyle({
      selectedItemId,
      entities,
      onUpdate: handleUpdateEntity,
    });

  useCanvasHotkeys({
    selectedItemId,
    onRemove: handleRemoveEntity,
    onDeselect: () => setSelectedItemId(null),
  });

  // Sincronizar painel lateral com seleção
  useEffect(() => {
    const selectedEntity = entities.find((e) => e.id === selectedItemId);
    setSideMenuMode(selectedEntity?.type === "note" ? "notes" : "main");
  }, [selectedItemId, entities, setSideMenuMode]);

  // Handlers
  const handleToggleSplitMode = (active: boolean) => {
    setIsSplitModeActive(active);
    if (active) {
      setSelectedItemId(null);
      if (isScissorsActive) activateSelect();
    }
  };

  const handleToggleScissors = () => {
    if (isScissorsActive) {
      activateSelect();
    } else {
      activateScissors();
      setSelectedItemId(null);
      setIsSplitModeActive(false);
    }
  };

  const handleConfirmSplit = (data: SplitActionData) => {
    performSplit(splittingItem, data);
    setIsSplitModeActive(false);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    bringToFront(id);
  };

  // Rotação via ActionMenu
  const selectedEntity = entities.find((e) => e.id === selectedItemId);
  const { handleRotateStart } = useTransformable({
    x: selectedEntity?.x || 0,
    y: selectedEntity?.y || 0,
    onUpdate: (updates) =>
      selectedItemId && handleUpdateEntity(selectedItemId, updates),
  });

  /**
   * Helper para renderizar entidades de forma DRY.
   */
  const renderEntity = (entity: any) => {
    const isSelected = selectedItemId === entity.id;

    const commonProps = {
      entity,
      isSelected,
      isSepararActive: isSplitModeActive,
      isScissorsActive,
      onSelect: () => handleSelectItem(entity.id),
      onUpdate: handleUpdateEntity,
      onRemove: handleRemoveEntity,
      onFocus: () => open("focus", entity),
    };

    switch (entity.type) {
      case "note":
        return (
          <CanvasNoteItem
            {...commonProps}
            onSplit={(viewingPage) => {
              const data = entity.data as NoteData;
              open("split", {
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
        return (
          <CanvasImageItem {...commonProps} rootPath={rootPath} />
        );
      case "pdf":
        return (
          <CanvasPdfItem
            {...commonProps}
            onSplit={() => {
              const data = entity.data as PdfData;
              open("split", {
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
        return (
          <CanvasTextItem
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.container} ${isPanning ? styles.panning : ""}`}
      onClick={() => setSelectedItemId(null)}
    >
      <button
        className={styles.backButton}
        onClick={() => setActivePanel("dashboard")}
        title="Voltar ao Dashboard"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={styles.toolbar}>
        <button 
          className={`${styles.toolButton} ${activeTool === 'select' ? styles.active : ''}`} 
          title="Selecionar"
          onClick={activateSelect}
        >
          <MousePointer2 size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'pan' ? styles.active : ''}`} 
          title="Mover Tela (H)"
          onClick={activatePan}
        >
          <Hand size={18} />
        </button>

        <div className={styles.separator} />

        <button 
          className={`${styles.toolButton} ${activeTool === 'pencil' ? styles.active : ''}`} 
          title="Desenhar (Lápis)"
          onClick={activatePencil}
        >
          <Pencil size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'eraser' ? styles.active : ''}`} 
          title="Borracha (Excluir Desenho)"
          onClick={activateEraser}
        >
          <Eraser size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'scissors' ? styles.active : ''}`} 
          onClick={handleToggleScissors}
          title="Tesoura (Focar Entidade)"
        >
          <Scissors size={18} />
        </button>

        <button 
          className={`${styles.toolButton} ${activeTool === 'text' ? styles.active : ''}`} 
          title="Adicionar Texto"
          onClick={activateText}
        >
          <Type size={18} />
        </button>

        <div className={styles.separator} />

        <button
          className={styles.toolButton}
          onClick={zoomIn}
          title="Aumentar Zoom"
        >
          <ZoomIn size={18} />
        </button>
        
        <button
          className={styles.toolButton}
          onClick={zoomOut}
          title="Diminuir Zoom"
        >
          <ZoomOut size={18} />
        </button>

        <button
          className={styles.toolButton}
          onClick={resetView}
          title="Resetar Visualização"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <CanvasControls value={modalControl}>
        <CanvasControls.Sidebar
          isSepararActive={isSplitModeActive}
          setIsSepararActive={handleToggleSplitMode}
          selectedNoteEntity={selectedNoteEntity}
          handleFontSizeChange={handleFontSizeChange}
          updateSelectedNoteStyle={updateSelectedNoteStyle}
          isPencilActive={isPencilActive}
        />

        <CanvasControls.Modals
          onNoteSelect={(path, name) => handleSelectItem(addNote(path, name))}
          onImageSelect={addImage}
          onPdfSelect={addPdf}
          onConfirmSplit={handleConfirmSplit}
          rootPath={rootPath}
        />
      </CanvasControls>

      <CanvasBase
        containerRef={containerRef}
        zoom={zoom}
        viewState={viewState}
        isPanning={isPanning}
        isSpacePressed={isSpacePressed}
        isPanModeActive={isPanActive}
        backgroundPattern="none"
        onMouseDown={(e) => {
          if (handleMouseDown(e, isPanActive)) return;
          if (isPencilActive) {
            startDrawing(e);
          } else if (isTextActive) {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-viewport')) {
              const pos = screenToCanvas(e.clientX, e.clientY);
              addText({ text: '' }, pos);
            }
          } else {
            setSelectedItemId(null);
          }
        }}
        beforeViewport={
          <div
            className={styles.grid}
            style={{
              transform: `translate(${viewState.x % (40 * zoom)}px, ${viewState.y % (40 * zoom)}px) scale(${zoom})`,
              backgroundSize: `${40}px ${40}px`,
            }}
          />
        }
      >
        <CanvasDrawingLayer 
          drawings={drawings} 
          removeDrawing={removeDrawing} 
          isEraserActive={isEraserActive} 
        />
        {getVisibleItems(entities).map((entity) => (
          <div key={entity.id}>
            {renderEntity(entity)}

            {selectedItemId === entity.id && (
              <CanvasActionMenu
                entity={entity}
                onRemove={handleRemoveEntity}
                onUpdate={handleUpdateEntity}
                handleRotateStart={handleRotateStart}
              />
            )}
          </div>
        ))}
      </CanvasBase>
    </div>
  );
}
