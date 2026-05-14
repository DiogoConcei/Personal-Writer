import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useMesaTrabalhoStore } from '../../store/moodBoardStore';
import { MesaItem } from './MesaItem';
import { MesaGrupoContainer } from './MesaGrupoContainer';
import { useNativeDragDrop } from '@/shared/hooks/useNativeDragDrop/useNativeDragDrop';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import ImageGallery from '@/features/SlashMenu/components/ImageGallery/ImageGallery';
import styles from './MesaTrabalho.module.scss';
import { Image as ImageIcon, Plus } from 'lucide-react';

import { CharacterDetailsModal } from './CharacterDetailsModal';
import { MesaLeftToolbar } from './MesaLeftToolbar';
import { MesaToolbar } from './MesaToolbar';
import { MesaConnectionsLayer } from './MesaConnectionsLayer';
import { CanvasDrawingLayer } from '@/shared/components/CanvasDrawingLayer/CanvasDrawingLayer';
import { DrawingStylePanel } from '@/shared/components/DrawingStylePanel/DrawingStylePanel';
import { useCanvasDrawing } from '@/shared/hooks/useCanvasDrawing';
import { useDrawingStore } from '@/shared/store/useDrawingStore';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

import { useCanvasEngine } from '@/shared/hooks/useCanvasEngine';
import { useCanvasTools } from '@/shared/hooks/useCanvasTools';
import { useMesaMarquee } from '../../hooks/useMesaMarquee';
import { CanvasBase } from '@/shared/components/CanvasBase/CanvasBase';

import { useCanvasInteraction } from '@/shared/hooks/useCanvasInteraction';

export default function MesaTrabalho() {
  const { rootPath } = useWorkspaceStore();
  const { 
    items, 
    groups, 
    boardName,
    boardMode,
    backgroundPattern,
    backgroundImage,
    backgroundRotation,
    backgroundZoom,
    activeDetailsIds,
    isLoading, 
    addItem, 
    updateItem,
    loadBoard, 
    saveBoard, 
    setBoardName,
    setBoardMode,
    setBackgroundPattern,
    toggleDetailsId,
    groupSelectedItems,
    clearSelection,
    setBackgroundImage,
    setBackgroundRotation,
    setBackgroundZoom,
    addConnection,
    toggleSelection,
    setSelectedItems,
    removeItem,
    selectedItems,
    drawings: boardDrawings,
    undo,
    redo,
    takeSnapshot
  } = useMesaTrabalhoStore();

  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 1. Ferramentas Unificadas (ADR-018)
  const { 
    isPencilActive, isEraserActive, isTextActive: isTextToolActive, isConnectActive: isConnecting, 
    isGroupActive: isGroupingMode, isPanActive: isPanModeActive, 
    activateSelect: activateSelectTool, activatePan: activatePanTool, 
    activatePencil: activatePencilTool, activateEraser: activateEraserTool, 
    activateText: activateTextTool, activateConnect: activateConnectTool, 
    activateGroup: activateGroupTool
  } = useCanvasTools('select');

  // 2. Motor Unificado (Substitui useMesaViewport)
  const engine = useCanvasEngine({ containerRef });
  const { 
    zoom, viewState, isPanning, isSpacePressed, zoomIn, zoomOut,
    handleMouseDown, screenToCanvas, resetView: handleResetView,
    getVisibleItems
  } = engine;

  // Interações Unificadas (ADR-021)
  const { addImage: addImageAtCenter, handleFileDrop } = useCanvasInteraction({
    engine,
    rootPath,
    onAdd: (data) => {
      addItem(data);
    }
  });

  const { selectionStart, selectionCurrent, startMarquee } = useMesaMarquee({
    items, groups, screenToCanvas, setSelectedItems
  });

  // Estados Locais
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'item' | 'background' | { type: 'attach', itemId: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(boardName);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);

  // Estado para arrastar o menu lateral
  const [sidebarPos, setSidebarPos] = useState<{ x: number, y: number } | null>(null);
  const sidebarDraggingRef = useRef<{ startX: number, startY: number, startLeft: number, startTop: number } | null>(null);

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    // Não arrastar se clicar em controles
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sidebarDraggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sidebarDraggingRef.current) return;
      const dx = moveEvent.clientX - sidebarDraggingRef.current.startX;
      const dy = moveEvent.clientY - sidebarDraggingRef.current.startY;
      setSidebarPos({
        x: sidebarDraggingRef.current.startLeft + dx,
        y: sidebarDraggingRef.current.startTop + dy
      });
    };

    const handleMouseUp = () => {
      sidebarDraggingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Hook de Desenho Unificado
  const { drawings: globalDrawings, setDrawings, addDrawing, addPointToDrawing, removeDrawing, strokeColor, strokeWidth } = useDrawingStore();

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

  // Sincronizar desenhos da board para a store global de desenho ao carregar
  useEffect(() => {
    if (boardDrawings && boardDrawings.length > 0) {
      setDrawings(boardDrawings);
    }
  }, [boardDrawings, setDrawings]);

  // Sincronizar de volta para a store do moodBoard para persistência
  useEffect(() => {
    useMesaTrabalhoStore.setState({ drawings: globalDrawings });
  }, [globalDrawings]);

  // Efeitos e Handlers
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

  useEffect(() => {
    if (rootPath && !isReady) {
      loadBoard(rootPath).then(() => setIsReady(true));
    }
  }, [rootPath, loadBoard, isReady]);

  useEffect(() => { setTempName(boardName); }, [boardName]);

  const independentItems = items.filter(i => !i.groupId && !i.ownerId);

  const handleGroupAction = () => {
    groupSelectedItems();
    activateSelectTool();
  };

  const handleToggleGroupingMode = () => {
    if (isGroupingMode) {
      activateSelectTool();
      clearSelection();
    } else {
      activateGroupTool();
      clearSelection();
    }
  };

  const handleToggleConnectionMode = () => {
    if (isConnecting) {
      activateSelectTool();
    } else {
      activateConnectTool();
    }
    setConnectionSourceId(null);
  };

  const handleItemClickForConnection = (itemId: string) => {
    if (!isConnecting) return;
    if (!connectionSourceId) {
      setConnectionSourceId(itemId);
    } else {
      if (connectionSourceId !== itemId) addConnection(connectionSourceId, itemId);
      setConnectionSourceId(null);
      activateSelectTool();
    }
  };

  const handleRotateBackground = () => setBackgroundRotation((backgroundRotation + 90) % 360);

  const handleZoomBackground = () => {
    let nextZoom = 1;
    if (backgroundZoom === 1) nextZoom = 0;
    else if (backgroundZoom === 0) nextZoom = 0.75;
    else if (backgroundZoom === 0.75) nextZoom = 0.5;
    setBackgroundZoom(nextZoom);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    if (tempName.trim() && tempName !== boardName) setBoardName(tempName);
  };

  // Salvamento Automático e Atalhos
  useEffect(() => {
    if (!rootPath) return;
    const interval = setInterval(() => saveBoard(rootPath), 1200000);
    return () => clearInterval(interval);
  }, [rootPath, saveBoard]);

  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      // Ignorar atalhos globais se estiver digitando
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (rootPath) saveBoard(rootPath);
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Remover itens selecionados
        if (selectedItems.length > 0) {
          e.preventDefault();
          takeSnapshot();
          selectedItems.forEach(id => removeItem(id));
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [rootPath, saveBoard, undo, redo, selectedItems, removeItem, clearSelection, takeSnapshot]);

  // Drag & Drop
  useNativeDragDrop({
    onDrop: async (paths, position) => {
      if (!rootPath) return;
      
      // Processa múltiplos arquivos usando a lógica unificada
      // Nota: O handleFileDrop já lida com a conversão de coordenadas e adição à store
      await handleFileDrop(paths, position);
    },
    filters: IMAGE_EXTENSIONS,
    disabled: !rootPath
  });

  return (
    <div className={styles.container}>
      <MesaLeftToolbar
        backgroundImage={backgroundImage}
        backgroundPattern={backgroundPattern}
        backgroundZoom={backgroundZoom}
        onOpenBackgroundGallery={() => setGalleryMode('background')}
        onRotateBackground={handleRotateBackground}
        onZoomBackground={handleZoomBackground}
        onRemoveBackground={() => { setBackgroundImage(null); setBackgroundRotation(0); setBackgroundZoom(1); }}
        onSetBackgroundPattern={setBackgroundPattern}
      />

      <MesaToolbar 
        boardName={boardName} boardMode={boardMode} isEditingName={isEditingName} 
        tempName={tempName} isPencilActive={isPencilActive} isEraserActive={isEraserActive} 
        isTextToolActive={isTextToolActive} isConnecting={isConnecting} 
        isGroupingMode={isGroupingMode} isPanModeActive={isPanModeActive} 
        isSettingsOpen={isSettingsOpen} onSetTempName={setTempName} 
        onSaveName={handleSaveName} onSetIsEditingName={setIsEditingName} 
        activateSelectTool={activateSelectTool} activatePanTool={activatePanTool} 
        zoomIn={zoomIn} zoomOut={zoomOut} handleResetView={handleResetView} 
        onOpenGallery={setGalleryMode} activatePencilTool={activatePencilTool} 
        activateEraserTool={activateEraserTool} activateTextTool={activateTextTool} 
        handleToggleConnectionMode={handleToggleConnectionMode} 
        handleToggleGroupingMode={handleToggleGroupingMode} 
        setActivePanel={setActivePanel} setIsSettingsOpen={setIsSettingsOpen} 
        setBoardMode={setBoardMode} onSaveBoard={() => rootPath && saveBoard(rootPath)} 
      />

      <div className={styles.mainLayout}>
        <aside 
          className={`${styles.sidebar} ${isPencilActive ? styles.active : ''}`}
          onMouseDown={handleSidebarMouseDown}
          style={{
            left: sidebarPos ? `${sidebarPos.x}px` : undefined,
            top: sidebarPos ? `${sidebarPos.y}px` : undefined,
            transform: sidebarPos ? 'none' : undefined,
          } as React.CSSProperties}
        >
          <DrawingStylePanel />
        </aside>

        <CanvasBase
          containerRef={containerRef}
          zoom={zoom}
          viewState={viewState}
          isPanning={isPanning}
          isSpacePressed={isSpacePressed}
          isPanModeActive={isPanModeActive}
          isPlanning={boardMode === 'planning'}
          backgroundPattern={backgroundPattern}
          onMouseDown={(e) => {
            if (handleMouseDown(e, isPanModeActive)) return;
            if (isPencilActive) { startDrawing(e); } 
            else if (isTextToolActive) {
              if ((e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-viewport')) && containerRef.current) {
                const { x, y } = screenToCanvas(e.clientX, e.clientY);
                addItem({ type: 'text', text: '', x, y, scale: 1, rotation: 0 });
              }
            } else if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-viewport')) {
              if (!e.shiftKey) clearSelection();
              startMarquee(...Object.values(screenToCanvas(e.clientX, e.clientY)) as [number, number]);
            }
          }}
          style={{
            rotate: backgroundImage ? `${backgroundRotation}deg` : undefined,
            cursor: isPencilActive ? 'crosshair' : isEraserActive ? 'cell' : isTextToolActive ? 'text' : isPanModeActive ? 'grab' : (selectionStart ? 'crosshair' : undefined)
          } as React.CSSProperties}
          viewportStyle={{
            backgroundImage: backgroundImage ? `url(${resolveAssetPath(backgroundImage, rootPath)})` : undefined,
            backgroundSize: backgroundImage ? (backgroundZoom === 1 ? 'cover' : backgroundZoom === 0 ? 'contain' : `${backgroundZoom * 100}%`) : undefined,
            backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          }}
        >
          <MesaConnectionsLayer />
          <CanvasDrawingLayer drawings={globalDrawings} removeDrawing={removeDrawing} isEraserActive={isEraserActive} />

          {items.length === 0 && !isLoading && !backgroundImage && (
            <div className={styles.canvasPlaceholder}>
              <div className={styles.placeholderIcon}><Plus size={48} /><ImageIcon size={32} className={styles.subIcon} /></div>
              <p>Sua mesa está vazia.</p>
              <span>Arraste arquivos de imagem do seu computador diretamente para este espaço.</span>
            </div>
          )}

          {groups.map(group => (
            <MesaGrupoContainer 
              key={group.id} group={group} zoom={zoom} items={items.filter(i => i.groupId === group.id)} 
              onItemClick={isConnecting ? handleItemClickForConnection : isGroupingMode ? (id) => toggleSelection(id, true) : undefined} 
              connectionSourceId={connectionSourceId} isGroupingMode={isGroupingMode} 
              onConfirmGroup={handleGroupAction} onCancelGroup={handleToggleGroupingMode} 
            />
          ))}

          {getVisibleItems(independentItems).map((item) => (
            <MesaItem
              key={item.id} item={item} zoom={zoom} 
              onClick={isConnecting ? () => handleItemClickForConnection(item.id) : isGroupingMode ? () => toggleSelection(item.id, true) : undefined} 
              onAddPhoto={() => setGalleryMode({ type: 'attach', itemId: item.id })} 
              isConnectingSource={connectionSourceId === item.id} isGroupingMode={isGroupingMode} 
              onConfirmGroup={handleGroupAction} onCancelGroup={handleToggleGroupingMode} 
            />
          ))}
          
          {isLoading && items.length === 0 && (
            <div className={styles.canvasLoading}><ImageIcon size={48} className={styles.spin} /><p>Organizando mesa...</p></div>
          )}

          {selectionStart && selectionCurrent && (
            <div className={styles.selectionBox} style={{ left: Math.min(selectionStart.x, selectionCurrent.x), top: Math.min(selectionStart.y, selectionCurrent.y), width: Math.abs(selectionStart.x - selectionCurrent.x), height: Math.abs(selectionStart.y - selectionCurrent.y) }} />
          )}
        </CanvasBase>
      </div>

      {galleryMode && (
        <ImageGallery
          onSelect={(src) => {
            const relativePath = src.replace(rootPath || '', '').replace(/^[\\/]/, './').replace(/\\/g, '/');
            if (galleryMode === 'item') {
              // Usa a lógica unificada para adicionar no centro
              addImageAtCenter(relativePath);
            } else if (galleryMode === 'background') { setBackgroundImage(relativePath); } 
            else if (typeof galleryMode === 'object' && galleryMode.type === 'attach') {
              const targetItem = items.find(i => i.id === galleryMode.itemId);
              if (targetItem) updateItem(targetItem.id, { extraPaths: [...(targetItem.extraPaths || []), relativePath] });
            }
          }}
          onClose={() => setGalleryMode(null)}
        />
      )}

      {activeDetailsIds.map(id => (
        <CharacterDetailsModal key={id} characterId={id} onClose={() => toggleDetailsId(id, true)} />
      ))}
    </div>
  );
}
