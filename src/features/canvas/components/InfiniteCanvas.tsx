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
} from "lucide-react";

// Hooks
import { useTransformable } from "@/shared/hooks/useTransformable/useTransformable";
import { useZoom } from "@/shared/hooks/useZoom/useZoom";
import { useCanvasEntities } from "../hooks/useCanvasEntities";
import { useCanvasModals } from "../hooks/useCanvasModals";
import { useCanvasSplit } from "../hooks/useCanvasSplit";
import { useCanvasViewport } from "../hooks/useCanvasViewport";
import { useCanvasHotkeys } from "../hooks/useCanvasHotkeys";
import { useCanvasNoteStyle } from "../hooks/useCanvasNoteStyle";
import { NoteData, PdfData, SplitActionData } from "@/shared/types";

// Componentes
import { CanvasActionMenu } from "./CanvasActionMenu/CanvasActionMenu";
import { CanvasNoteItem } from "./CanvasNoteItem/CanvasNoteItem";
import { CanvasImageItem } from "./CanvasImageItem/CanvasImageItem";
import { CanvasPdfItem } from "./CanvasPdfItem/CanvasPdfItem";
import { CanvasControls } from "./CanvasControls/CanvasControls";

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);

  const [isSplitModeActive, setIsSplitModeActive] = useState(false);
  const [isScissorsActive, setIsScissorsActive] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 1. Orquestração de UI e Modais
  const modalControl = useCanvasModals();
  const { open, splittingItem, setSideMenuMode } = modalControl;

  // 2. Navegação Espacial (Zoom/Pan/Viewport)
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom({
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 4,
  });

  const {
    viewState,
    isPanning,
    handleCanvasMouseDown,
    handleReset,
    getVisibleEntities,
  } = useCanvasViewport({ zoom, resetZoom, containerRef });

  // 3. Gestão de Dados e Entidades
  const {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    updateEntity: handleUpdateEntity,
    removeEntity: handleRemoveEntity,
    bringToFront,
  } = useCanvasEntities({ zoom, viewState, containerRef, rootPath });

  const { performSplit } = useCanvasSplit({ entities, setEntities });

  // 4. Customização Visual e Hotkeys
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
      setIsScissorsActive(false);
    }
  };

  const handleToggleScissors = (active: boolean) => {
    setIsScissorsActive(active);
    if (active) {
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

  const visibleEntities = getVisibleEntities(entities);

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
        <div className={styles.separator} />
        <button className={styles.toolButton} title="Lápis">
          <Pencil size={18} />
        </button>
        <button className={styles.toolButton} title="Borracha">
          <Eraser size={18} />
        </button>
        <button 
          className={`${styles.toolButton} ${isScissorsActive ? styles.active : ''}`} 
          onClick={() => handleToggleScissors(!isScissorsActive)}
          title="Tesoura (Focar Entidade)"
        >
          <Scissors size={18} />
        </button>
        <div className={styles.separator} />
        <button
          className={styles.toolButton}
          onClick={handleReset}
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
        />

        <CanvasControls.Modals
          onNoteSelect={(path, name) => handleSelectItem(addNote(path, name))}
          onImageSelect={addImage}
          onPdfSelect={addPdf}
          onConfirmSplit={handleConfirmSplit}
          rootPath={rootPath}
        />
      </CanvasControls>

      <div
        className={styles.canvas}
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
      >
        <div
          className={styles.grid}
          style={{
            transform: `translate(${viewState.x % (40 * zoom)}px, ${viewState.y % (40 * zoom)}px) scale(${zoom})`,
            backgroundSize: `${40}px ${40}px`,
          }}
        />

        <div
          className={styles.viewport}
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {visibleEntities.map((entity) => (
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
        </div>
      </div>
    </div>
  );
}
