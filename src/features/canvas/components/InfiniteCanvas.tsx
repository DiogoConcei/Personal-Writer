import { useState, useRef, useEffect, useCallback } from "react";
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
  Type,
  Image as ImageIcon
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
import { useCanvasPostItStyle } from "../hooks/useCanvasPostItStyle";
import { useCanvasTextStyle } from "../hooks/useCanvasTextStyle";
import { useHistory } from "@/shared/hooks/useHistory";
import { NoteData, PdfData, SplitActionData, AnyCanvasEntity, MesaDrawing } from "@/shared/types";
import { doRectanglesOverlap } from "@/shared/utils/ui";

// Componentes
import { CanvasActionMenu } from "./CanvasActionMenu/CanvasActionMenu";
import { CanvasNoteItem } from "./CanvasNoteItem/CanvasNoteItem";
import { CanvasImageItem } from "./CanvasImageItem/CanvasImageItem";
import { CanvasPdfItem } from "./CanvasPdfItem/CanvasPdfItem";
import { CanvasTextItem } from "./CanvasTextItem/CanvasTextItem";
import { CanvasPostItItem } from "./CanvasPostItItem/CanvasPostItItem";
import { CanvasPageItem } from "./CanvasPageItem/CanvasPageItem";
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
  const [isCollageConfirmed, setIsCollageConfirmed] = useState(false);
  const [activeCollageGroupId, setActiveCollageGroupId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const { drawings, addDrawing, addPointToDrawing, removeDrawing, updateDrawing, setDrawings, strokeColor, strokeWidth } = useDrawingStore();

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
    isCollageActive,
    activateSelect,
    activatePan,
    activatePencil,
    activateEraser,
    activateScissors,
    activateText,
    activateCollage,
  } = useCanvasTools('select');

  // 4. Gestão de Dados e Entidades
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
  } = useCanvasEntities({ zoom, viewState, containerRef, rootPath, activeGroupId: activeCollageGroupId });

  // 5. Histórico (Undo/Redo)
  const { takeSnapshot, undo, redo } = useHistory<{ entities: AnyCanvasEntity[], drawings: MesaDrawing[] }>();

  const handleUpdateWithSnapshot = useCallback((id: string, updates: Partial<AnyCanvasEntity>) => {
    const draggingEntity = entities.find(e => e.id === id);
    
    // Mover o grupo INTEIRO apenas se NÃO estivermos em modo de edição de colagem
    // No modo colagem, queremos ajustes individuais para "colar" um item no outro
    if (!isCollageConfirmed && draggingEntity?.groupId && (updates.x !== undefined || updates.y !== undefined)) {
      setEntities(prev => {
        const currentEntity = prev.find(e => e.id === id);
        if (!currentEntity) return prev;

        // Calculamos o delta baseando-se no estado MAIS RECENTE (prev)
        const dx = updates.x !== undefined ? updates.x - currentEntity.x : 0;
        const dy = updates.y !== undefined ? updates.y - currentEntity.y : 0;
        
        // 2. Aplicamos a atualização completa na entidade alvo e apenas movemos as outras do grupo
        const nextEntities = prev.map(e => {
          if (e.id === id) {
            return { ...e, ...updates };
          } else if (e.groupId === draggingEntity.groupId) {
            return {
              ...e,
              x: e.x + dx,
              y: e.y + dy
            };
          }
          return e;
        });

        // 3. Movemos todos os desenhos do mesmo grupo (translação de pontos)
        if (dx !== 0 || dy !== 0) {
          drawings.forEach(d => {
            if (d.groupId === draggingEntity.groupId) {
              const newPoints = d.points.map(p => ({
                x: p.x + dx,
                y: p.y + dy
              }));
              updateDrawing(d.id, { points: newPoints });
            }
          });
        }

        return nextEntities;
      });
    } else {
      handleUpdateEntity(id, updates);
    }
  }, [entities, drawings, handleUpdateEntity, setEntities, updateDrawing, isCollageConfirmed]);

  const handleRemoveWithSnapshot = useCallback((id: string) => {
    takeSnapshot({ entities, drawings });
    handleRemoveEntity(id);
  }, [takeSnapshot, entities, drawings, handleRemoveEntity]);

  const handleAddPendingCollage = useCallback((sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => {
    takeSnapshot({ entities, drawings });
    return addPendingCollage(sourceEntity, boundingBox);
  }, [takeSnapshot, entities, drawings, addPendingCollage]);

  // Handler para finalização de movimento (Drop)
  const handleTransformEnd = useCallback((entityId: string) => {
    if (isCollageConfirmed) {
      // Lógica de "Colar em cima": se soltar um item sobre outro, ele entra no grupo
      const movedItem = entities.find(e => e.id === entityId);
      if (!movedItem) return;

      const itemRect = { 
        x: movedItem.x, 
        y: movedItem.y, 
        width: (movedItem as any).width || 100, 
        height: (movedItem as any).height || 100 
      };

      const overlappingItem = entities.find(other => {
        if (other.id === movedItem.id) return false;
        // Páginas não servem para "colar" outras coisas nelas como grupo de colagem
        if (other.type === 'page') return false; 
        
        const otherRect = { 
          x: other.x, 
          y: other.y, 
          width: (other as any).width || 100, 
          height: (other as any).height || 100 
        };
        return doRectanglesOverlap(itemRect, otherRect);
      });

      if (overlappingItem) {
        takeSnapshot({ entities, drawings });
        const targetGroupId = overlappingItem.groupId || activeCollageGroupId || `collage-${Math.random().toString(36).substring(2, 9)}`;
        
        if (!overlappingItem.groupId) {
          handleUpdateEntity(overlappingItem.id, { groupId: targetGroupId });
        }
        handleUpdateEntity(movedItem.id, { groupId: targetGroupId });
      } else if (movedItem.groupId) {
        // Se soltou fora de qualquer item, ele sai do grupo de colagem
        takeSnapshot({ entities, drawings });
        handleUpdateEntity(movedItem.id, { groupId: undefined });
      }
    }
  }, [entities, isCollageConfirmed, activeCollageGroupId, handleUpdateEntity, takeSnapshot, drawings]);


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

  // Hook de Desenho Unificado
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

  const { performSplit } = useCanvasSplit({ entities, setEntities });

  // 6. Customização Visual e Hotkeys
  const { selectedNoteEntity, updateSelectedNoteStyle, handleFontSizeChange } =
    useCanvasNoteStyle({
      selectedItemId,
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
    selectedItemId,
    entities,
    onUpdate: handleUpdateWithSnapshot,
  });

  const { 
    selectedTextEntity, 
    handleFontSizeChange: handleTextFontSizeChange, 
    handleFontFamilyChange: handleTextFontFamilyChange, 
    toggleBold: toggleTextBold 
  } = useCanvasTextStyle({
    selectedItemId,
    entities,
    onUpdate: handleUpdateWithSnapshot,
  });

  useCanvasHotkeys({
    selectedItemId,
    onRemove: handleRemoveWithSnapshot,
    onDeselect: () => {
      setSelectedItemId(null);
      setSelectedItemIds([]);
    },
    onUndo: handleUndo,
    onRedo: handleRedo
  });

  // Sincronizar painel lateral com ferramentas e seleção
  useEffect(() => {
    if (isPencilActive) {
      setSideMenuMode("drawing");
    } else if (isTextActive) {
      setSideMenuMode("text");
    } else if (isCollageActive) {
      setSideMenuMode("main");
    } else {
      const selectedEntity = entities.find((e) => e.id === selectedItemId);
      if (selectedEntity?.type === "note" || selectedEntity?.type === "page") {
        setSideMenuMode("notes");
      } else if (selectedEntity?.type === "postit") {
        setSideMenuMode("postits");
      } else {
        setSideMenuMode("main");
      }
    }
  }, [isPencilActive, isTextActive, isCollageActive, selectedItemId, entities, setSideMenuMode]);

  // Handlers
  const handleToggleSplitMode = (active: boolean) => {
    setIsSplitModeActive(active);
    if (active) {
      setSelectedItemId(null);
      setSelectedItemIds([]);
      if (isScissorsActive) activateSelect();
    }
  };

  const handleToggleScissors = () => {
    if (isScissorsActive) {
      activateSelect();
    } else {
      activateScissors();
      setSelectedItemId(null);
      setSelectedItemIds([]);
      setIsSplitModeActive(false);
    }
  };

  const handleConfirmSplit = (data: SplitActionData) => {
    takeSnapshot({ entities, drawings });
    performSplit(splittingItem, data);
    setIsSplitModeActive(false);
  };

  const handleSelectItem = (id: string) => {
    const entity = entities.find(e => e.id === id);
    if (isCollageActive && !isCollageConfirmed) {
      setSelectedItemIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(itemId => itemId !== id);
        }
        if (prev.length >= 10) return prev;
        return [...prev, id];
      });
      setSelectedItemId(id);
    } else {
      setSelectedItemIds([id]);
      setSelectedItemId(id);
    }
    
    // Só traz para frente automaticamente se NÃO for uma página
    if (entity?.type !== 'page') {
      bringToFront(id);
    }
  };

  const handleConfirmCollage = () => {
    if (selectedItemIds.length > 0) {
      takeSnapshot({ entities, drawings });
      
      // Filtrar apenas entidades e desenhos que se sobrepõem a pelo menos um outro item selecionado
      const itemsToGroup = selectedItemIds.filter(id => {
        const item = [...entities, ...drawings].find(e => e.id === id);
        if (!item) return false;

        const itemRect = { 
          x: item.x || 0, 
          y: item.y || 0, 
          width: (item as any).width || 100, 
          height: (item as any).height || 100 
        };

        return selectedItemIds.some(otherId => {
          if (id === otherId) return false;
          const otherItem = [...entities, ...drawings].find(e => e.id === otherId);
          if (!otherItem) return false;

          const otherRect = { 
            x: otherItem.x || 0, 
            y: otherItem.y || 0, 
            width: (otherItem as any).width || 100, 
            height: (otherItem as any).height || 100 
          };

          return doRectanglesOverlap(itemRect, otherRect);
        });
      });

      if (itemsToGroup.length < 2) {
        // Se nada se sobrepõe, não criamos grupo
        setIsCollageConfirmed(true);
        setSelectedItemIds([]);
        setSelectedItemId(null);
        activateSelect();
        return;
      }

      const existingGroupItem = [...entities, ...drawings].find(e => itemsToGroup.includes(e.id) && e.groupId);
      const groupId = existingGroupItem?.groupId || `collage-${Math.random().toString(36).substring(2, 9)}`;

      setActiveCollageGroupId(groupId);

      setEntities(prev => prev.map(e => 
        itemsToGroup.includes(e.id) ? { ...e, groupId } : e
      ));

      drawings.forEach(d => {
        if (itemsToGroup.includes(d.id)) {
          updateDrawing(d.id, { groupId });
        }
      });

      setIsCollageConfirmed(true);
      setSelectedItemIds([]);
      setSelectedItemId(null);
      activateSelect();
    }
  };

  const handleFinalizeCollage = () => {
    setIsCollageConfirmed(false);
    setActiveCollageGroupId(null);
    setSelectedItemIds([]);
    setSelectedItemId(null);
    activateSelect();
  };

  const handleCancelCollage = () => {
    setIsCollageConfirmed(false);
    setActiveCollageGroupId(null);
    setSelectedItemIds([]);
    setSelectedItemId(null);
    activateSelect();
  };

  // Rotação via ActionMenu
  const selectedEntity = entities.find((e) => e.id === selectedItemId);
  const { handleRotateStart } = useTransformable({
    x: selectedEntity?.x || 0,
    y: selectedEntity?.y || 0,
    onStart: () => takeSnapshot({ entities, drawings }),
    onUpdate: (updates) => {
      if (selectedItemId) {
        handleUpdateWithSnapshot(selectedItemId, updates);
      }
    },
  });

  /**
   * Helper para renderizar entidades de forma DRY.
   */
  const renderEntity = (entity: any) => {
    const isSelected = selectedItemIds.includes(entity.id);

    const commonProps = {
      entity,
      isSelected,
      isSepararActive: isSplitModeActive,
      isScissorsActive,
      onSelect: () => handleSelectItem(entity.id),
      onUpdate: handleUpdateWithSnapshot,
      onRemove: handleRemoveWithSnapshot,
      onStart: () => takeSnapshot({ entities, drawings }),
      onEnd: () => handleTransformEnd(entity.id),
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
      case "postit":
        return (
          <CanvasPostItItem
            {...commonProps}
          />
        );
      case "page":
        return (
          <CanvasPageItem
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  const canConfirmCollage = selectedItemIds.length >= 2 || selectedItemIds.some(id => {
    const entity = entities.find(e => e.id === id);
    const drawing = drawings.find(d => d.id === id);
    return !!(entity?.groupId || drawing?.groupId);
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

      {!isCollageConfirmed && (
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
      )}

      {isCollageConfirmed && (
        <div className={styles.collageEditingControls}>
          <div className={styles.collageToolsGroup}>
            <button 
              className={`${styles.toolButton} ${activeTool === 'pencil' ? styles.active : ''}`} 
              title="Desenhar (Lápis)"
              onClick={activatePencil}
            >
              <Pencil size={18} />
            </button>

            <button 
              className={`${styles.toolButton} ${activeTool === 'eraser' ? styles.active : ''}`} 
              title="Borracha"
              onClick={activateEraser}
            >
              <Eraser size={18} />
            </button>

            <button 
              className={`${styles.toolButton} ${activeTool === 'text' ? styles.active : ''}`} 
              title="Adicionar Texto"
              onClick={activateText}
            >
              <Type size={18} />
            </button>

            <button 
              className={styles.toolButton} 
              title="Galeria de Imagens"
              onClick={() => open('image')}
            >
              <ImageIcon size={18} />
            </button>
          </div>

          <div className={styles.collageActionsGroup}>
            <button 
              className={styles.confirmCollageButton}
              onClick={handleFinalizeCollage}
            >
              Finalizar Colagem
            </button>
            <button 
              className={styles.cancelCollageButton}
              onClick={handleCancelCollage}
            >
              Cancelar Colagem
            </button>
          </div>
        </div>
      )}

      <CanvasControls value={modalControl}>
        {!isScissorsActive && !isCollageConfirmed && (
          <CanvasControls.Sidebar
            isSepararActive={isSplitModeActive}
            setIsSepararActive={handleToggleSplitMode}
            selectedNoteEntity={selectedNoteEntity}
            handleFontSizeChange={handleFontSizeChange}
            updateSelectedNoteStyle={updateSelectedNoteStyle}
            selectedTextEntity={selectedTextEntity}
            handleTextFontSizeChange={handleTextFontSizeChange}
            handleTextFontFamilyChange={handleTextFontFamilyChange}
            toggleTextBold={toggleTextBold}
            onAddPostIt={() => {
              takeSnapshot({ entities, drawings });
              const id = addPostIt();
              if (id) handleSelectItem(id);
            }}
            selectedPostItEntity={selectedPostItEntity}
            handlePostItFontSizeChange={handlePostItFontSizeChange}
            updateSelectedPostItStyle={updateSelectedPostItStyle}
            togglePostItBold={togglePostItBold}
            handlePostItFontFamilyChange={handlePostItFontFamilyChange}
            onAddPage={() => {
              takeSnapshot({ entities, drawings });
              const id = addPage();
              if (id) handleSelectItem(id);
            }}
            isCollageActive={isCollageActive}
            activateCollage={activateCollage}
            selectedItemIds={selectedItemIds}
            canConfirmCollage={canConfirmCollage}
            onConfirmCollage={handleConfirmCollage}
          />
        )}

        <CanvasControls.Modals
          entities={entities}
          onNoteSelect={(path, name) => {
            takeSnapshot({ entities, drawings });
            handleSelectItem(addNote(path, name));
          }}
          onImageSelect={(path) => {
            takeSnapshot({ entities, drawings });
            addImage(path);
          }}
          onPdfSelect={(path) => {
            takeSnapshot({ entities, drawings });
            addPdf(path);
          }}
          onConfirmSplit={handleConfirmSplit}
          onUpdate={handleUpdateWithSnapshot}
          onAddPendingCollage={handleAddPendingCollage}
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
              takeSnapshot({ entities, drawings });
              const pos = screenToCanvas(e.clientX, e.clientY);
              const id = addText({ text: '' }, pos);
              if (id) setSelectedItemId(id as string);
            }
          } else {
            setSelectedItemId(null);
          }
        }}
        beforeViewport={
          <div
            className={styles.grid}
            style={{
              backgroundPosition: `${viewState.x}px ${viewState.y}px`,
              backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            }}
          />
        }
      >
        {getVisibleItems(entities).map((entity) => (
          <div key={entity.id}>
            {renderEntity(entity)}

            {selectedItemId === entity.id && (
              <CanvasActionMenu
                entity={entity}
                onRemove={handleRemoveWithSnapshot}
                onUpdate={handleUpdateWithSnapshot}
                onBringToFront={bringToFront}
                onSendToBack={sendToBack}
                handleRotateStart={handleRotateStart}
              />
            )}
          </div>
        ))}

        <CanvasDrawingLayer 
          drawings={drawings} 
          removeDrawing={removeDrawing} 
          isEraserActive={isEraserActive} 
          isCollageActive={isCollageActive}
          selectedItemIds={selectedItemIds}
          onSelect={handleSelectItem}
        />
      </CanvasBase>
    </div>
  );
}
