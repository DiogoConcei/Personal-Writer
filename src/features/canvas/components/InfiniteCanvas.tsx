import { useState, useRef, useEffect } from "react";
import styles from "./InfiniteCanvas.module.scss";
import { useUIStore } from "../../../store/uiStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import { PdfGallery } from "../../references/components/PdfGallery/PdfGallery";
import {
  ZoomIn,
  ZoomOut,
  Pencil,
  Eraser,
  Scissors,
  RotateCcw,
} from "lucide-react";
import { useTransformable } from "@/shared/hooks/useTransformable/useTransformable";
import { useZoom } from "@/shared/hooks/useZoom/useZoom";
import { useCanvasEntities } from "../hooks/useCanvasEntities";
import { SplitModal } from "./SplitModal/SplitModal";
import { AnyCanvasEntity, PdfData } from "@/shared/types";

// Componentes Extraídos
import { NoteSelectionModal } from "./NoteSelectionModal/NoteSelectionModal";
import { CanvasActionMenu } from "./CanvasActionMenu/CanvasActionMenu";
import { CanvasNoteItem } from "./CanvasNoteItem/CanvasNoteItem";
import { CanvasImageItem } from "./CanvasImageItem/CanvasImageItem";
import { CanvasPdfItem } from "./CanvasPdfItem/CanvasPdfItem";
import { CanvasSidebar } from "./CanvasSidebar/CanvasSidebar";

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);

  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isPdfGalleryOpen, setIsPdfGalleryOpen] = useState(false);
  const [isNoteGalleryOpen, setIsNoteGalleryOpen] = useState(false);
  const [isSepararActive, setIsSepararActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [sideMenuMode, setSideMenuMode] = useState<"main" | "notes">("main");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splittingItem, setSplittingItem] = useState<{
    id: string;
    name: string;
    total: number;
  } | null>(null);

  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom({
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 4,
  });

  const [viewState, setViewState] = useState({ x: 0, y: 0 });

  // Hook centralizado de entidades
  const {
    entities,
    setEntities,
    addNote,
    addImage,
    addPdf,
    updateEntity: handleUpdateEntity,
    removeEntity: handleRemoveEntity,
  } = useCanvasEntities({
    zoom,
    viewState,
    containerRef,
    rootPath,
  });

  // Sincronizar painel lateral com seleção
  useEffect(() => {
    const selectedEntity = entities.find((e) => e.id === selectedItemId);
    if (selectedEntity?.type === "note") {
      setSideMenuMode("notes");
    } else {
      setSideMenuMode("main");
    }
  }, [selectedItemId, entities]);

  const handleReset = () => {
    resetZoom();
    setViewState({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== containerRef.current?.firstChild) return;

    setIsPanning(true);
    const startX = e.clientX - viewState.x;
    const startY = e.clientY - viewState.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setViewState({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const onMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleNoteSelect = (path: string, name: string) => {
    const newId = addNote(path, name);
    setSelectedItemId(newId);
    setIsNoteGalleryOpen(false);
  };

  const handleImageSelect = (path: string) => {
    addImage(path);
    setIsImageGalleryOpen(false);
  };

  const handlePdfSelect = (path: string) => {
    addPdf(path);
    setIsPdfGalleryOpen(false);
  };

  // Funções de manipulação de estilo para a nota selecionada
  const updateSelectedNoteStyle = (
    styleUpdates: Record<string, string | number>,
  ) => {
    if (!selectedItemId) return;
    const entity = entities.find((e) => e.id === selectedItemId);
    if (entity?.type === "note") {
      handleUpdateEntity(selectedItemId, {
        style: { ...entity.style, ...styleUpdates },
      });
    }
  };

  const handleFontSizeChange = (increment: number) => {
    const entity = entities.find((e) => e.id === selectedItemId);
    if (!entity || entity.type !== "note") return;
    const currentSize = parseInt(
      (entity.style?.fontSize as string) || "14",
      10,
    );
    const newSize = Math.max(8, Math.min(72, currentSize + increment));
    updateSelectedNoteStyle({ fontSize: `${newSize}px` });
  };

  const selectedNoteEntity = entities.find(
    (e) => e.id === selectedItemId && e.type === "note",
  );

  const handleConfirmSplit = (data: any) => {
    if (!splittingItem) return;
    const original = entities.find((e) => e.id === splittingItem.id);
    if (!original || original.type !== "pdf") return;

    const pdfData = original.data as PdfData;
    let pagesToExtract: number[] = [];

    if (data.mode === "amount") {
      const start = data.startPage || pdfData.startPage;
      for (let i = 0; i < data.amount; i++) {
        const page = start + i;
        if (page <= pdfData.endPage) pagesToExtract.push(page);
      }
    } else if (data.mode === "single") {
      pagesToExtract.push(data.singlePage);
    } else if (data.mode === "range") {
      for (let i = data.startPage; i <= data.endPage; i++) {
        if (i >= pdfData.startPage && i <= pdfData.endPage)
          pagesToExtract.push(i);
      }
    }

    if (pagesToExtract.length === 0) return;

    const newItems: AnyCanvasEntity[] = pagesToExtract.map(
      (pageNum, index) => ({
        id: `pdf-page-${Math.random().toString(36).substring(2, 9)}`,
        type: "pdf",
        x: original.x + (index + 1) * 40,
        y: original.y + (index + 1) * 40,
        width: original.width,
        height: original.height,
        rotation: 0,
        zIndex: entities.length + index + 1,
        data: {
          path: pdfData.path,
          startPage: pageNum,
          endPage: pageNum,
          totalPages: pdfData.totalPages,
        } as PdfData,
      }),
    );

    setEntities((prev) => {
      const filtered = prev.filter((e) => e.id !== original.id);
      const maxExtracted = Math.max(...pagesToExtract);

      if (maxExtracted < pdfData.endPage) {
        filtered.push({
          ...original,
          id: `pdf-remainder-${Math.random().toString(36).substring(2, 9)}`,
          x: original.x + (pagesToExtract.length + 1) * 40,
          y: original.y + (pagesToExtract.length + 1) * 40,
          data: {
            ...pdfData,
            startPage: maxExtracted + 1,
          },
        });
      }

      return [...filtered, ...newItems];
    });

    setIsSplitModalOpen(false);
    setIsSepararActive(false);
  };

  const visibleEntities = entities.filter((entity) => {
    if (!containerRef.current) return true;

    const viewportWidth = containerRef.current.clientWidth / zoom;
    const viewportHeight = containerRef.current.clientHeight / zoom;
    const minX = -viewState.x / zoom;
    const minY = -viewState.y / zoom;
    const maxX = minX + viewportWidth;
    const maxY = minY + viewportHeight;

    const buffer = 500;

    return (
      entity.x + (entity.width || 300) > minX - buffer &&
      entity.x < maxX + buffer &&
      entity.y + (entity.height || 300) > minY - buffer &&
      entity.y < maxY + buffer
    );
  });

  // Ganchos de rotação para o menu
  const selectedEntity = entities.find((e) => e.id === selectedItemId);
  const { handleRotateStart } = useTransformable({
    x: selectedEntity?.x || 0,
    y: selectedEntity?.y || 0,
    onUpdate: (updates) =>
      selectedItemId && handleUpdateEntity(selectedItemId, updates),
  });

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
        <button className={styles.toolButton} title="Tesoura">
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

      <CanvasSidebar
        sideMenuMode={sideMenuMode}
        setSideMenuMode={setSideMenuMode}
        isSepararActive={isSepararActive}
        setIsSepararActive={setIsSepararActive}
        setIsNoteGalleryOpen={setIsNoteGalleryOpen}
        setIsPdfGalleryOpen={setIsPdfGalleryOpen}
        setIsImageGalleryOpen={setIsImageGalleryOpen}
        selectedNoteEntity={selectedNoteEntity}
        handleFontSizeChange={handleFontSizeChange}
        updateSelectedNoteStyle={updateSelectedNoteStyle}
      />

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
          {visibleEntities.map((entity) => {
            const isSelected = selectedItemId === entity.id;

            return (
              <div key={entity.id}>
                {entity.type === "note" && (
                  <CanvasNoteItem
                    entity={entity}
                    isSelected={isSelected}
                    onSelect={() => setSelectedItemId(entity.id)}
                    onUpdate={handleUpdateEntity}
                    onRemove={handleRemoveEntity}
                  />
                )}
                {entity.type === "image" && (
                  <CanvasImageItem
                    entity={entity}
                    isSelected={isSelected}
                    onSelect={() => setSelectedItemId(entity.id)}
                    onUpdate={handleUpdateEntity}
                    onRemove={handleRemoveEntity}
                    rootPath={rootPath}
                  />
                )}
                {entity.type === "pdf" && (
                  <CanvasPdfItem
                    entity={entity}
                    isSelected={isSelected}
                    isSepararActive={isSepararActive}
                    onSelect={() => setSelectedItemId(entity.id)}
                    onUpdate={handleUpdateEntity}
                    onRemove={handleRemoveEntity}
                    onSplit={() => {
                      const data = entity.data as PdfData;
                      setSplittingItem({
                        id: entity.id,
                        name: data.path.split(/[\\/]/).pop() || "PDF",
                        total: data.endPage - data.startPage + 1,
                      });
                      setIsSplitModalOpen(true);
                    }}
                    rootPath={rootPath}
                  />
                )}

                {isSelected && (
                  <CanvasActionMenu
                    entity={entity}
                    onRemove={handleRemoveEntity}
                    onUpdate={handleUpdateEntity}
                    handleRotateStart={handleRotateStart}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <NoteSelectionModal
        isOpen={isNoteGalleryOpen}
        onClose={() => setIsNoteGalleryOpen(false)}
        onSelect={handleNoteSelect}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        onConfirm={handleConfirmSplit}
        totalItems={splittingItem?.total || 0}
        itemName={splittingItem?.name || ""}
      />

      {isImageGalleryOpen && (
        <ImageGallery
          disableOrganization
          largeModal
          onSelect={handleImageSelect}
          onClose={() => setIsImageGalleryOpen(false)}
        />
      )}

      {isPdfGalleryOpen && (
        <PdfGallery
          onSelect={handlePdfSelect}
          onClose={() => setIsPdfGalleryOpen(false)}
        />
      )}
    </div>
  );
}
